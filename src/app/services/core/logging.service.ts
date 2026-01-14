import { Injectable, signal, computed, inject } from '@angular/core';
import {
  LogEntry,
  LogLevel,
  LoggingConfiguration,
  DEFAULT_LOGGING_CONFIG,
  LogEntryWithoutId,
  LogContext,
  BrowserContext,
  GameContext,
  AngularContext,
} from '../../models/logging.model';
import { LogDestinationManager } from './log-destination-manager.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly destinationManager = inject(LogDestinationManager);
  private readonly settingsService = inject(SettingsService);

  // Configuration signal for reactive updates
  private readonly _configuration = signal<LoggingConfiguration>(DEFAULT_LOGGING_CONFIG);
  readonly configuration = this._configuration.asReadonly();

  // Current log level computed from configuration
  readonly currentLogLevel = computed(() => this._configuration().level);

  // Developer mode events signal for real-time display
  private readonly _developerEvents = signal<LogEntry | null>(null);
  readonly developerEvents = this._developerEvents.asReadonly();

  // Internal state for tracking
  private readonly _isInitialized = signal<boolean>(false);
  readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    this._isInitialized.set(true);
    // Configure the destination manager with initial configuration
    this.destinationManager.configure(DEFAULT_LOGGING_CONFIG);
  }

  /**
   * Update the logging configuration
   */
  updateConfiguration(config: Partial<LoggingConfiguration>): void {
    const currentConfig = this._configuration();
    const newConfig = { ...currentConfig, ...config };
    this._configuration.set(newConfig);

    // Update destination manager configuration
    this.destinationManager.configure(newConfig);
  }

  /**
   * Set the global log level
   */
  setLogLevel(level: LogLevel): void {
    this.updateConfiguration({ level });
  }

  /**
   * Main logging method - accepts structured log data
   * Automatically includes timestamp, unique ID, and enriched context
   */
  async log(entry: LogEntryWithoutId): Promise<void> {
    // Check if log level meets minimum threshold
    if (entry.level < this.currentLogLevel()) {
      return;
    }

    // Create complete log entry with auto-generated metadata
    const completeEntry: LogEntry = {
      ...entry,
      id: this.generateLogId(),
      timestamp: new Date(),
      context: this.enrichContext(entry.context),
    };

    // Route to destinations using destination manager
    await this.routeToDestinations(completeEntry);

    // Emit to developer panel if enabled (will be implemented in later tasks)
    this.emitToDeveloperPanel(completeEntry);
  }

  /**
   * Convenience methods for different log levels
   */
  async debug(
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.log({
      level: LogLevel.DEBUG,
      message,
      metadata,
      context: this.createBaseContext(context),
    });
  }

  async info(
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.log({
      level: LogLevel.INFO,
      message,
      metadata,
      context: this.createBaseContext(context),
    });
  }

  async warn(
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.log({
      level: LogLevel.WARN,
      message,
      metadata,
      context: this.createBaseContext(context),
    });
  }

  async error(
    message: string,
    metadata?: Record<string, any>,
    context?: Partial<LogContext>,
  ): Promise<void> {
    await this.log({
      level: LogLevel.ERROR,
      message,
      metadata,
      context: this.createBaseContext(context),
    });
  }

  /**
   * Generate unique ID for log entries
   * Uses timestamp + random string for uniqueness
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `log_${timestamp}_${randomPart}`;
  }

  /**
   * Create base context with browser information and source context
   */
  private createBaseContext(partialContext?: Partial<LogContext>): LogContext {
    const browserContext: BrowserContext = {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      timestamp: Date.now(),
      performance: this.getPerformanceData(),
    };

    return {
      browser: browserContext,
      game: partialContext?.game,
      angular: partialContext?.angular,
      custom: partialContext?.custom,
    };
  }

  /**
   * Enrich context with additional metadata and source context capture
   */
  private enrichContext(context: LogContext): LogContext {
    // Capture source context from call stack if available
    const sourceContext = this.captureSourceContext();

    return {
      ...context,
      browser: {
        ...context.browser,
        timestamp: Date.now(),
        performance: this.getPerformanceData(),
      },
      custom: {
        ...context.custom,
        sourceContext,
      },
    };
  }

  /**
   * Get performance data if available
   */
  private getPerformanceData() {
    if (typeof performance !== 'undefined') {
      const memory = (performance as any).memory;
      return {
        memory: memory
          ? {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
            }
          : undefined,
        timing: performance.timing
          ? {
              navigationStart: performance.timing.navigationStart,
              loadEventEnd: performance.timing.loadEventEnd,
            }
          : undefined,
      };
    }
    return undefined;
  }

  /**
   * Capture source context from call stack for debugging
   */
  private captureSourceContext(): { stack?: string; caller?: string } {
    try {
      const error = new Error();
      const stack = error.stack;

      if (stack) {
        const stackLines = stack.split('\n');
        // Skip the first few lines (Error constructor, this method, log method)
        const relevantLine = stackLines.find(
          (line, index) =>
            index > 3 && !line.includes('LoggingService') && !line.includes('node_modules'),
        );

        return {
          stack: stack,
          caller: relevantLine?.trim(),
        };
      }
    } catch (error) {
      // Silently fail if stack capture is not available
    }

    return {};
  }

  /**
   * Route log entry to configured destinations using the destination manager
   */
  private async routeToDestinations(entry: LogEntry): Promise<void> {
    try {
      await this.destinationManager.routeLogEntry(entry);
    } catch (error) {
      // Log routing failures to console as fallback
      console.error('LoggingService: Failed to route log entry to destinations:', error);
      console.log(`[FALLBACK] [${LogLevel[entry.level]}] ${entry.message}`, entry);
    }
  }

  /**
   * Emit to developer panel if developer mode is enabled
   */
  private emitToDeveloperPanel(entry: LogEntry): void {
    // Only emit events when developer mode is enabled
    if (this.settingsService.developerMode()) {
      this._developerEvents.set(entry);
    }
  }
}