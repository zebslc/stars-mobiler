import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../services/core/logging.service';
import { SettingsService } from '../services/core/settings.service';
import { LogEntry, LogLevel } from '../models/logging.model';

@Component({
  standalone: true,
  selector: 'app-developer-panel',
  template: `
    <div class="developer-panel" [class.visible]="isVisible()">
      <div class="panel-header">
        <h3>Developer Panel</h3>
        <button 
          class="close-btn" 
          (click)="togglePanel()"
          aria-label="Toggle developer panel"
        >
          {{ isExpanded() ? '−' : '+' }}
        </button>
      </div>
      
      @if (isExpanded()) {
        <div class="panel-content">
          <div class="controls">
            <button 
              class="clear-btn" 
              (click)="clearLogs()"
              [disabled]="logEntries().length === 0"
            >
              Clear Logs
            </button>
            <span class="log-count">{{ logEntries().length }} entries</span>
          </div>
          
          <div class="log-container" #logContainer>
            @if (logEntries().length === 0) {
              <div class="empty-state">
                <p>No log entries yet. Errors and debug information will appear here when developer mode is enabled.</p>
              </div>
            } @else {
              @for (entry of logEntries(); track entry.id) {
                <div class="log-entry" [class]="getLogLevelClass(entry.level)">
                  <div class="log-header">
                    <span class="timestamp">{{ formatTimestamp(entry.timestamp) }}</span>
                    <span class="level">{{ getLevelName(entry.level) }}</span>
                  </div>
                  <div class="log-message">{{ entry.message }}</div>
                  @if (entry.metadata && hasMetadata(entry.metadata)) {
                    <div class="log-metadata">
                      <details>
                        <summary>Metadata</summary>
                        <pre>{{ formatMetadata(entry.metadata) }}</pre>
                      </details>
                    </div>
                  }
                  @if (entry.context.custom?.sourceContext?.caller) {
                    <div class="log-source">
                      <small>{{ entry.context.custom?.sourceContext?.caller }}</small>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .developer-panel {
      position: fixed;
      bottom: 0;
      right: 20px;
      width: 400px;
      max-width: 90vw;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px 8px 0 0;
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
    }

    .developer-panel.visible {
      transform: translateY(0);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .panel-content {
      max-height: 400px;
      display: flex;
      flex-direction: column;
    }

    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .clear-btn {
      background: rgba(255, 0, 0, 0.2);
      border: 1px solid rgba(255, 0, 0, 0.4);
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
    }

    .clear-btn:hover:not(:disabled) {
      background: rgba(255, 0, 0, 0.3);
    }

    .clear-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .log-count {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
    }

    .log-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      max-height: 320px;
    }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.6);
    }

    .empty-state p {
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
    }

    .log-entry {
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 4px;
      border-left: 3px solid;
    }

    .log-entry.debug {
      background: rgba(128, 128, 128, 0.1);
      border-left-color: #808080;
    }

    .log-entry.info {
      background: rgba(0, 123, 255, 0.1);
      border-left-color: #007bff;
    }

    .log-entry.warn {
      background: rgba(255, 193, 7, 0.1);
      border-left-color: #ffc107;
    }

    .log-entry.error {
      background: rgba(220, 53, 69, 0.1);
      border-left-color: #dc3545;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .timestamp {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.6);
    }

    .level {
      font-size: 10px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.2);
    }

    .log-message {
      font-weight: 500;
      line-height: 1.3;
      margin-bottom: 4px;
    }

    .log-metadata details {
      margin-top: 4px;
    }

    .log-metadata summary {
      cursor: pointer;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 4px;
    }

    .log-metadata pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: 2px;
      font-size: 10px;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .log-source {
      margin-top: 4px;
    }

    .log-source small {
      color: rgba(255, 255, 255, 0.5);
      font-size: 9px;
    }

    /* Scrollbar styling */
    .log-container::-webkit-scrollbar {
      width: 6px;
    }

    .log-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    .log-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .log-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperPanelComponent {
  private readonly loggingService = inject(LoggingService);
  private readonly settingsService = inject(SettingsService);

  // Component state
  private readonly _logEntries = signal<LogEntry[]>([]);
  private readonly _isExpanded = signal<boolean>(false);

  // Computed properties
  readonly logEntries = this._logEntries.asReadonly();
  readonly isExpanded = this._isExpanded.asReadonly();
  
  // Check if panel should be visible (developer mode enabled)
  readonly isVisible = computed(() => this.settingsService.developerMode());

  constructor() {
    // Watch for new log entries from the logging service
    effect(() => {
      const latestEntry = this.loggingService.developerEvents();
      if (latestEntry && this.settingsService.developerMode()) {
        this.addLogEntry(latestEntry);
      }
    });
  }

  /**
   * Toggle panel expanded/collapsed state
   */
  togglePanel(): void {
    this._isExpanded.update(expanded => !expanded);
  }

  /**
   * Clear all log entries
   */
  clearLogs(): void {
    this._logEntries.set([]);
  }

  /**
   * Add a new log entry to the panel
   */
  private addLogEntry(entry: LogEntry): void {
    this._logEntries.update(entries => {
      const newEntries = [...entries, entry];
      // Keep only the last 100 entries to prevent memory issues
      return newEntries.slice(-100);
    });
  }

  /**
   * Get CSS class for log level
   */
  getLogLevelClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'debug';
      case LogLevel.INFO:
        return 'info';
      case LogLevel.WARN:
        return 'warn';
      case LogLevel.ERROR:
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Get human-readable log level name
   */
  getLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  /**
   * Check if metadata object has any properties
   */
  hasMetadata(metadata: Record<string, any>): boolean {
    return Object.keys(metadata).length > 0;
  }

  /**
   * Format metadata for display
   */
  formatMetadata(metadata: Record<string, any>): string {
    try {
      return JSON.stringify(metadata, null, 2);
    } catch (error) {
      return String(metadata);
    }
  }
}