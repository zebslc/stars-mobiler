import { Injectable } from '@angular/core';
import type { ApplicationInsightsConfig, LogDestination, LogEntry } from '../../models/logging.model';
import { LogLevel } from '../../models/logging.model';
import { ApplicationInsightsDestination } from '../../services/destinations/application-insights.destination';

const DEFAULT_CONFIG: ApplicationInsightsConfig = {
  enabled: false,
  instrumentationKey: undefined,
  endpoint: undefined,
  batchSize: 5,
  flushInterval: 2000,
  maxRetries: 0,
  retryDelay: 0,
  logLevel: LogLevel.WARN,
};

/**
 * Lightweight Application Insights destination used by unit tests to avoid
 * network traffic and noisy console warnings. Captures entries in-memory
 * whenever the destination is flagged as enabled.
 */
@Injectable()
export class ApplicationInsightsDestinationStub implements LogDestination {
  readonly name = 'applicationInsights';

  private config: ApplicationInsightsConfig = { ...DEFAULT_CONFIG };
  private readonly bufferedEntries: Array<LogEntry> = [];

  get isEnabled(): boolean {
    return this.config.enabled && !!this.config.instrumentationKey;
  }

  /**
   * Returns the entries recorded by the stub since the last call to clear().
   */
  get entries(): ReadonlyArray<LogEntry> {
    return this.bufferedEntries;
  }

  configure(config: ApplicationInsightsConfig): void {
    this.config = { ...this.config, ...config };
    if (!this.isEnabled) {
      this.clear();
    }
  }

  async log(entry: LogEntry): Promise<void> {
    const minimumLevel = this.config.logLevel ?? LogLevel.DEBUG;
    if (!this.isEnabled || entry.level < minimumLevel) {
      return;
    }

    this.bufferedEntries.push(entry);

    try {
      const endpoint =
        this.config.endpoint ?? 'https://example.com/application-insights-stub';
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instrumentationKey: this.config.instrumentationKey,
          entries: [...this.bufferedEntries],
        }),
      });
    } catch (error) {
      // Swallow network failures so tests can assert graceful handling
    } finally {
      this.clear();
    }
  }

  clear(): void {
    this.bufferedEntries.length = 0;
  }
}

/**
 * Convenience provider for wiring the stub into Angular test modules.
 */
export function provideApplicationInsightsDestinationStub() {
  return {
    provide: ApplicationInsightsDestination,
    useClass: ApplicationInsightsDestinationStub,
  } as const;
}
