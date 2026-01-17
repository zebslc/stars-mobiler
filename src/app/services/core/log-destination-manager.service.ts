import { Injectable, signal, computed, inject } from '@angular/core';
import type {
  LogDestination,
  LogEntry,
  LoggingConfiguration,
  LogDestinationName
} from '../../models/logging.model';
import { ConsoleDestination } from '../destinations/console.destination';
import { ApplicationInsightsDestination } from '../destinations/application-insights.destination';
import { DeveloperPanelDestination } from '../destinations/developer-panel.destination';
import { InternalLoggerService, normalizeError } from './internal-logger.service';

/**
 * LogDestinationManager handles registration, configuration, and routing of log entries
 * to multiple destinations with failure isolation and configuration-based enabling/disabling
 */
@Injectable({
  providedIn: 'root'
})
export class LogDestinationManager {
  private readonly consoleDestination = inject(ConsoleDestination);
  private readonly applicationInsightsDestination = inject(ApplicationInsightsDestination);
  private readonly developerPanelDestination = inject(DeveloperPanelDestination);
  private readonly internalLogger = inject(InternalLoggerService);

  // Registry of all available destinations
  private readonly _destinations = new Map<LogDestinationName, LogDestination>([
    ['console', this.consoleDestination],
    ['applicationInsights', this.applicationInsightsDestination],
    ['developerPanel', this.developerPanelDestination]
  ]);

  // Configuration signal for reactive updates
  private readonly _configuration = signal<LoggingConfiguration | null>(null);
  readonly configuration = computed(() => this._configuration());

  // Computed signal for enabled destinations
  readonly enabledDestinations = computed(() => {
    const config = this._configuration();
    if (!config) {
      return [];
    }

    const enabled: Array<LogDestination> = [];
    
    // Check each destination's configuration
    if (config.destinations.console.enabled) {
      enabled.push(this._destinations.get('console')!);
    }
    
    if (config.destinations.applicationInsights.enabled) {
      enabled.push(this._destinations.get('applicationInsights')!);
    }
    
    if (config.destinations.developerPanel.enabled) {
      enabled.push(this._destinations.get('developerPanel')!);
    }

    return enabled;
  });

  // Statistics for monitoring destination health
  private readonly _stats = signal({
    totalMessages: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    destinationFailures: new Map<string, number>()
  });
  readonly stats = computed(() => this._stats());

  /**
   * Configure all destinations based on logging configuration
   */
  configure(config: LoggingConfiguration): void {
    this._configuration.set(config);

    // Configure each destination with its specific configuration
    try {
      this.consoleDestination.configure(config.destinations.console);
    } catch (error) {
      this.recordDestinationFailure('console', error);
    }

    try {
      this.applicationInsightsDestination.configure(config.destinations.applicationInsights);
    } catch (error) {
      this.recordDestinationFailure('applicationInsights', error);
    }

    try {
      this.developerPanelDestination.configure(config.destinations.developerPanel);
    } catch (error) {
      this.recordDestinationFailure('developerPanel', error);
    }
  }

  /**
   * Route a log entry to all enabled destinations with failure isolation
   */
  async routeLogEntry(entry: LogEntry): Promise<void> {
    const enabledDests = this.enabledDestinations();
    
    if (enabledDests.length === 0) {
      // No destinations enabled, increment stats but don't fail
      this.updateStats(0, 0);
      return;
    }

    this.updateStats(1, 0); // Increment total messages

    // Route to all enabled destinations in parallel with failure isolation
    const routingPromises = enabledDests.map(destination => 
      this.routeToDestination(destination, entry)
    );

    // Wait for all routing attempts to complete
    const results = await Promise.allSettled(routingPromises);

    // Count successful and failed deliveries
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        const destination = enabledDests[index];
        this.recordDestinationFailure(destination.name, result.reason);
      }
    });

    // Update delivery statistics
    this.updateStats(0, successCount, failureCount);
  }

  /**
   * Route to a single destination with error handling
   */
  private async routeToDestination(destination: LogDestination, entry: LogEntry): Promise<void> {
    try {
      // Check if destination is still enabled (may have been disabled due to failures)
      if (!destination.isEnabled) {
        throw new Error(`Destination ${destination.name} is disabled`);
      }

      await destination.log(entry);
    } catch (error) {
      await this.internalLogger.warn(
        'LogDestinationManager failed to route entry',
        {
          destination: destination.name,
          error: normalizeError(error),
        },
        'LogDestinationManager'
      );
      throw error; // Re-throw for Promise.allSettled to catch
    }
  }

  /**
   * Get a specific destination by name
   */
  getDestination(name: LogDestinationName): LogDestination | undefined {
    return this._destinations.get(name);
  }

  /**
   * Get all registered destinations
   */
  getAllDestinations(): Array<LogDestination> {
    return Array.from(this._destinations.values());
  }

  /**
   * Get names of all enabled destinations
   */
  getEnabledDestinationNames(): Array<LogDestinationName> {
    return this.enabledDestinations().map(dest => dest.name as LogDestinationName);
  }

  /**
   * Check if a specific destination is enabled
   */
  isDestinationEnabled(name: LogDestinationName): boolean {
    const config = this._configuration();
    if (!config) {
      return false;
    }

    switch (name) {
      case 'console':
        return config.destinations.console.enabled;
      case 'applicationInsights':
        return config.destinations.applicationInsights.enabled;
      case 'developerPanel':
        return config.destinations.developerPanel.enabled;
      default:
        return false;
    }
  }

  /**
   * Enable or disable a specific destination
   */
  setDestinationEnabled(name: LogDestinationName, enabled: boolean): void {
    const config = this._configuration();
    if (!config) {
      return;
    }

    const newConfig = { ...config };
    
    switch (name) {
      case 'console':
        newConfig.destinations.console = { ...config.destinations.console, enabled };
        break;
      case 'applicationInsights':
        newConfig.destinations.applicationInsights = { ...config.destinations.applicationInsights, enabled };
        break;
      case 'developerPanel':
        newConfig.destinations.developerPanel = { ...config.destinations.developerPanel, enabled };
        break;
    }

    this.configure(newConfig);
  }

  /**
   * Get destination health status
   */
  getDestinationHealth(): Array<{ name: string; enabled: boolean; failures: number }> {
    const stats = this._stats();
    const config = this._configuration();
    
    if (!config) {
      return [];
    }

    return [
      {
        name: 'console',
        enabled: config.destinations.console.enabled,
        failures: stats.destinationFailures.get('console') || 0
      },
      {
        name: 'applicationInsights',
        enabled: config.destinations.applicationInsights.enabled,
        failures: stats.destinationFailures.get('applicationInsights') || 0
      },
      {
        name: 'developerPanel',
        enabled: config.destinations.developerPanel.enabled,
        failures: stats.destinationFailures.get('developerPanel') || 0
      }
    ];
  }

  /**
   * Reset failure statistics for all destinations
   */
  resetFailureStats(): void {
    const currentStats = this._stats();
    this._stats.set({
      ...currentStats,
      failedDeliveries: 0,
      destinationFailures: new Map()
    });
  }

  /**
   * Reset failure statistics for a specific destination
   */
  resetDestinationFailures(name: string): void {
    const currentStats = this._stats();
    const newFailures = new Map(currentStats.destinationFailures);
    newFailures.delete(name);
    
    this._stats.set({
      ...currentStats,
      destinationFailures: newFailures
    });
  }

  /**
   * Record a failure for a specific destination
   */
  private recordDestinationFailure(destinationName: string, error: any): void {
    const currentStats = this._stats();
    const newFailures = new Map(currentStats.destinationFailures);
    const currentFailureCount = newFailures.get(destinationName) || 0;
    newFailures.set(destinationName, currentFailureCount + 1);

    this._stats.set({
      ...currentStats,
      destinationFailures: newFailures
    });

    // Log the failure for debugging
    void this.internalLogger.warn(
      'LogDestinationManager recorded destination failure',
      {
        destination: destinationName,
        failureCount: currentFailureCount + 1,
        error: normalizeError(error),
      },
      'LogDestinationManager'
    );
  }

  /**
   * Update routing statistics
   */
  private updateStats(totalMessages: number, successfulDeliveries: number, failedDeliveries: number = 0): void {
    const currentStats = this._stats();
    this._stats.set({
      ...currentStats,
      totalMessages: currentStats.totalMessages + totalMessages,
      successfulDeliveries: currentStats.successfulDeliveries + successfulDeliveries,
      failedDeliveries: currentStats.failedDeliveries + failedDeliveries
    });
  }

  /**
   * Get routing success rate as a percentage
   */
  getSuccessRate(): number {
    const stats = this._stats();
    const totalAttempts = stats.successfulDeliveries + stats.failedDeliveries;
    
    if (totalAttempts === 0) {
      return 100; // No attempts yet, consider it 100%
    }

    return (stats.successfulDeliveries / totalAttempts) * 100;
  }

  /**
   * Check if the manager is healthy (success rate above threshold)
   */
  isHealthy(minimumSuccessRate: number = 90): boolean {
    return this.getSuccessRate() >= minimumSuccessRate;
  }

  /**
   * Get a summary of manager status for debugging
   */
  getStatusSummary(): {
    totalMessages: number;
    successRate: number;
    enabledDestinations: Array<string>;
    destinationHealth: Array<{ name: string; enabled: boolean; failures: number }>;
  } {
    const stats = this._stats();
    
    return {
      totalMessages: stats.totalMessages,
      successRate: this.getSuccessRate(),
      enabledDestinations: this.getEnabledDestinationNames(),
      destinationHealth: this.getDestinationHealth()
    };
  }
}