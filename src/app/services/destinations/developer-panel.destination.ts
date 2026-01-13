import { Injectable, signal, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import {
  LogDestination,
  LogEntry,
  LogLevel,
  DeveloperPanelConfig
} from '../../models/logging.model';
import { SettingsService } from '../core/settings.service';

/**
 * Developer panel destination for logging service
 * Provides real-time event stream for developer mode display
 */
@Injectable({
  providedIn: 'root'
})
export class DeveloperPanelDestination implements LogDestination {
  readonly name = 'developerPanel';
  private readonly settingsService = inject(SettingsService);
  
  private _isEnabled = false;
  private _config: DeveloperPanelConfig = {
    enabled: false,
    maxEntries: 100,
    autoScroll: true,
    showMetadata: true,
    logLevel: LogLevel.DEBUG
  };

  // Real-time event stream for developer panel
  private readonly _eventStream = new Subject<LogEntry>();
  readonly events$: Observable<LogEntry> = this._eventStream.asObservable();

  // In-memory storage for developer panel display
  private readonly _entries = signal<LogEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  // Statistics for developer panel
  private readonly _stats = signal({
    totalEntries: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    debugCount: 0,
    lastEntryTime: null as Date | null
  });
  readonly stats = this._stats.asReadonly();

  get isEnabled(): boolean {
    // For now, assume developer mode is enabled if the destination is configured as enabled
    // This will be updated in task 6 when developer mode is implemented in SettingsService
    return this._isEnabled && this._config.enabled;
  }

  /**
   * Configure the developer panel destination
   */
  configure(config: DeveloperPanelConfig): void {
    this._config = { ...this._config, ...config };
    this._isEnabled = config.enabled;

    // Trim entries if max entries limit was reduced
    this.trimEntries();
  }

  /**
   * Log entry to developer panel with real-time emission
   */
  async log(entry: LogEntry): Promise<void> {
    // Check if this entry meets the minimum log level for this destination
    if (entry.level < this._config.logLevel) {
      return;
    }

    // Only process if developer mode is enabled
    if (!this.isEnabled) {
      return;
    }

    try {
      // Add to in-memory storage
      this.addEntry(entry);

      // Emit to real-time stream
      this._eventStream.next(entry);

      // Update statistics
      this.updateStats(entry);
    } catch (error) {
      // Silently handle errors to prevent affecting main application
      console.warn('DeveloperPanelDestination: Failed to process log entry', error);
    }
  }

  /**
   * Add entry to in-memory storage with size management
   */
  private addEntry(entry: LogEntry): void {
    const currentEntries = this._entries();
    const newEntries = [...currentEntries, entry];

    // Trim to max entries if necessary
    if (newEntries.length > this._config.maxEntries) {
      const trimCount = newEntries.length - this._config.maxEntries;
      newEntries.splice(0, trimCount);
    }

    this._entries.set(newEntries);
  }

  /**
   * Trim entries to respect max entries limit
   */
  private trimEntries(): void {
    const currentEntries = this._entries();
    if (currentEntries.length > this._config.maxEntries) {
      const trimCount = currentEntries.length - this._config.maxEntries;
      const trimmedEntries = currentEntries.slice(trimCount);
      this._entries.set(trimmedEntries);
    }
  }

  /**
   * Update statistics based on new entry
   */
  private updateStats(entry: LogEntry): void {
    const currentStats = this._stats();
    const newStats = {
      totalEntries: currentStats.totalEntries + 1,
      errorCount: currentStats.errorCount + (entry.level === LogLevel.ERROR ? 1 : 0),
      warningCount: currentStats.warningCount + (entry.level === LogLevel.WARN ? 1 : 0),
      infoCount: currentStats.infoCount + (entry.level === LogLevel.INFO ? 1 : 0),
      debugCount: currentStats.debugCount + (entry.level === LogLevel.DEBUG ? 1 : 0),
      lastEntryTime: entry.timestamp
    };

    this._stats.set(newStats);
  }

  /**
   * Clear all entries and reset statistics
   */
  clearEntries(): void {
    this._entries.set([]);
    this._stats.set({
      totalEntries: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      debugCount: 0,
      lastEntryTime: null
    });
  }

  /**
   * Get entries filtered by log level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this._entries().filter(entry => entry.level === level);
  }

  /**
   * Get entries filtered by time range
   */
  getEntriesByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
    return this._entries().filter(entry => 
      entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Get entries filtered by source
   */
  getEntriesBySource(source: string): LogEntry[] {
    return this._entries().filter(entry => entry.source === source);
  }

  /**
   * Search entries by message content
   */
  searchEntries(searchTerm: string): LogEntry[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return this._entries().filter(entry => 
      entry.message.toLowerCase().includes(lowerSearchTerm) ||
      (entry.source && entry.source.toLowerCase().includes(lowerSearchTerm)) ||
      (entry.metadata && JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm))
    );
  }

  /**
   * Export entries as JSON for debugging
   */
  exportEntries(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats: this._stats(),
      entries: this._entries().map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString() // Convert Date to string for JSON
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Get configuration for developer panel UI
   */
  getConfig(): DeveloperPanelConfig {
    return { ...this._config };
  }

  /**
   * Update specific configuration options
   */
  updateConfig(updates: Partial<DeveloperPanelConfig>): void {
    this.configure({ ...this._config, ...updates });
  }

  /**
   * Check if auto-scroll is enabled
   */
  shouldAutoScroll(): boolean {
    return this._config.autoScroll;
  }

  /**
   * Check if metadata should be shown
   */
  shouldShowMetadata(): boolean {
    return this._config.showMetadata;
  }

  /**
   * Get the maximum number of entries to keep
   */
  getMaxEntries(): number {
    return this._config.maxEntries;
  }

  /**
   * Cleanup method to complete the event stream
   */
  destroy(): void {
    this._eventStream.complete();
    this.clearEntries();
  }
}