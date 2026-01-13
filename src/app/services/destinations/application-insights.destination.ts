import { Injectable, signal } from '@angular/core';
import {
  LogDestination,
  LogEntry,
  LogLevel,
  ApplicationInsightsConfig
} from '../../models/logging.model';

/**
 * Application Insights destination for logging service
 * Provides integration with Azure Application Insights with batching and retry logic
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationInsightsDestination implements LogDestination {
  readonly name = 'applicationInsights';
  private _isEnabled = false;
  private _config: ApplicationInsightsConfig = {
    enabled: false,
    batchSize: 10,
    flushInterval: 5000,
    maxRetries: 3,
    retryDelay: 1000,
    logLevel: LogLevel.WARN
  };

  // Batching state
  private _batchQueue: LogEntry[] = [];
  private _flushTimer: number | null = null;
  private _isFlushInProgress = signal(false);

  // Retry state
  private _retryQueue: { entry: LogEntry; attempts: number }[] = [];
  private _retryTimer: number | null = null;

  get isEnabled(): boolean {
    return this._isEnabled && this._config.enabled && !!this._config.instrumentationKey;
  }

  /**
   * Configure the Application Insights destination
   */
  configure(config: ApplicationInsightsConfig): void {
    this._config = { ...this._config, ...config };
    this._isEnabled = config.enabled;

    // Restart flush timer with new interval if configuration changed
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }

    if (this.isEnabled) {
      this.startFlushTimer();
    }
  }

  /**
   * Log entry to Application Insights with batching
   */
  async log(entry: LogEntry): Promise<void> {
    // Check if this entry meets the minimum log level for this destination
    if (entry.level < this._config.logLevel) {
      return;
    }

    if (!this.isEnabled) {
      return;
    }

    try {
      // Add to batch queue
      this._batchQueue.push(entry);

      // Flush immediately if batch is full
      if (this._batchQueue.length >= this._config.batchSize) {
        await this.flushBatch();
      }
    } catch (error) {
      // Silently handle errors to prevent affecting main application
      console.warn('ApplicationInsightsDestination: Failed to queue log entry', error);
    }
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this._flushTimer) {
      return;
    }

    this._flushTimer = window.setInterval(() => {
      if (this._batchQueue.length > 0) {
        this.flushBatch().catch(error => {
          console.warn('ApplicationInsightsDestination: Scheduled flush failed', error);
        });
      }
    }, this._config.flushInterval);
  }

  /**
   * Flush the current batch to Application Insights
   */
  private async flushBatch(): Promise<void> {
    if (this._isFlushInProgress() || this._batchQueue.length === 0) {
      return;
    }

    this._isFlushInProgress.set(true);
    const batch = [...this._batchQueue];
    this._batchQueue = [];

    try {
      await this.sendBatchToApplicationInsights(batch);
    } catch (error) {
      // Add failed entries to retry queue
      batch.forEach(entry => {
        this._retryQueue.push({ entry, attempts: 0 });
      });
      this.scheduleRetry();
    } finally {
      this._isFlushInProgress.set(false);
    }
  }

  /**
   * Send batch of log entries to Application Insights
   */
  private async sendBatchToApplicationInsights(entries: LogEntry[]): Promise<void> {
    if (!this._config.instrumentationKey) {
      throw new Error('Application Insights instrumentation key not configured');
    }

    const endpoint = this._config.endpoint || 
      `https://dc.applicationinsights.azure.com/v2/track`;

    const payload = {
      name: 'Microsoft.ApplicationInsights.Event',
      time: new Date().toISOString(),
      iKey: this._config.instrumentationKey,
      data: {
        baseType: 'EventData',
        baseData: {
          ver: 2,
          name: 'StellarRemnants.LogEntry',
          properties: this.createPropertiesFromEntries(entries),
          measurements: this.createMeasurementsFromEntries(entries)
        }
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Application Insights request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Create properties object from log entries for Application Insights
   */
  private createPropertiesFromEntries(entries: LogEntry[]): Record<string, string> {
    const properties: Record<string, string> = {
      batchSize: entries.length.toString(),
      source: 'StellarRemnants',
      version: '1.0.0'
    };

    // Add aggregated information about the batch
    const levels = entries.map(e => LogLevel[e.level]);
    const uniqueLevels = [...new Set(levels)];
    properties.logLevels = uniqueLevels.join(',');

    // Add first entry details as primary
    if (entries.length > 0) {
      const firstEntry = entries[0];
      properties.primaryMessage = firstEntry.message;
      properties.primaryLevel = LogLevel[firstEntry.level];
      properties.primarySource = firstEntry.source || 'unknown';
      
      // Add context information
      if (firstEntry.context.game) {
        properties.gameId = firstEntry.context.game.gameId || 'unknown';
        properties.gameState = firstEntry.context.game.gameState || 'unknown';
        properties.currentScreen = firstEntry.context.game.currentScreen || 'unknown';
      }

      if (firstEntry.context.angular) {
        properties.angularComponent = firstEntry.context.angular.component || 'unknown';
        properties.angularRoute = firstEntry.context.angular.route || 'unknown';
      }

      // Add browser context
      properties.userAgent = firstEntry.context.browser.userAgent;
      properties.url = firstEntry.context.browser.url;
      properties.viewport = `${firstEntry.context.browser.viewport.width}x${firstEntry.context.browser.viewport.height}`;
    }

    return properties;
  }

  /**
   * Create measurements object from log entries for Application Insights
   */
  private createMeasurementsFromEntries(entries: LogEntry[]): Record<string, number> {
    const measurements: Record<string, number> = {
      entryCount: entries.length,
      errorCount: entries.filter(e => e.level === LogLevel.ERROR).length,
      warningCount: entries.filter(e => e.level === LogLevel.WARN).length,
      infoCount: entries.filter(e => e.level === LogLevel.INFO).length,
      debugCount: entries.filter(e => e.level === LogLevel.DEBUG).length
    };

    // Add performance measurements if available
    if (entries.length > 0 && entries[0].context.browser.performance?.memory) {
      const memory = entries[0].context.browser.performance.memory;
      measurements.usedJSHeapSize = memory.usedJSHeapSize;
      measurements.totalJSHeapSize = memory.totalJSHeapSize;
      measurements.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }

    return measurements;
  }

  /**
   * Schedule retry for failed entries
   */
  private scheduleRetry(): void {
    if (this._retryTimer || this._retryQueue.length === 0) {
      return;
    }

    this._retryTimer = window.setTimeout(() => {
      this.processRetryQueue().finally(() => {
        this._retryTimer = null;
      });
    }, this._config.retryDelay);
  }

  /**
   * Process the retry queue
   */
  private async processRetryQueue(): Promise<void> {
    const itemsToRetry = this._retryQueue.filter(item => item.attempts < this._config.maxRetries);
    const itemsToDiscard = this._retryQueue.filter(item => item.attempts >= this._config.maxRetries);

    // Clear the retry queue
    this._retryQueue = [];

    // Log discarded items for debugging
    if (itemsToDiscard.length > 0) {
      console.warn(`ApplicationInsightsDestination: Discarding ${itemsToDiscard.length} entries after max retries`);
    }

    // Retry items that haven't exceeded max attempts
    for (const item of itemsToRetry) {
      item.attempts++;
      try {
        await this.sendBatchToApplicationInsights([item.entry]);
      } catch (error) {
        // Add back to retry queue
        this._retryQueue.push(item);
      }
    }

    // Schedule another retry if there are still items in the queue
    if (this._retryQueue.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Cleanup method to clear timers and flush remaining entries
   */
  destroy(): void {
    if (this._flushTimer) {
      clearInterval(this._flushTimer);
      this._flushTimer = null;
    }

    if (this._retryTimer) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }

    // Attempt to flush remaining entries
    if (this._batchQueue.length > 0) {
      this.flushBatch().catch(error => {
        console.warn('ApplicationInsightsDestination: Final flush failed', error);
      });
    }
  }
}