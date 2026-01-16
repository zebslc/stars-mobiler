import { Injectable } from '@angular/core';
import type {
  LogDestination,
  LogEntry,
  ConsoleDestinationConfig
} from '../../models/logging.model';
import {
  LogLevel
} from '../../models/logging.model';

/**
 * Console destination for logging service
 * Provides formatted console output with color coding for different log levels
 */
@Injectable({
  providedIn: 'root'
})
export class ConsoleDestination implements LogDestination {
  readonly name = 'console';
  private _isEnabled = true;
  private _config: ConsoleDestinationConfig = {
    enabled: true,
    colorCoding: true,
    includeTimestamp: true,
    includeMetadata: false,
    logLevel: LogLevel.DEBUG
  };

  get isEnabled(): boolean {
    return this._isEnabled && this._config.enabled;
  }

  /**
   * Configure the console destination
   */
  configure(config: ConsoleDestinationConfig): void {
    this._config = { ...this._config, ...config };
    this._isEnabled = config.enabled;
  }

  /**
   * Log entry to console with formatting and color coding
   */
  async log(entry: LogEntry): Promise<void> {
    // Check if this entry meets the minimum log level for this destination
    if (entry.level < this._config.logLevel) {
      return;
    }

    try {
      const formattedMessage = this.formatMessage(entry);
      const consoleMethod = this.getConsoleMethod(entry.level);
      
      if (this._config.colorCoding && this.supportsColorCoding()) {
        this.logWithColors(consoleMethod, entry, formattedMessage);
      } else {
        this.logPlain(consoleMethod, entry, formattedMessage);
      }
    } catch (error) {
      // Fallback to basic console.log if formatting fails
      console.log(`[LOGGING ERROR] Failed to format log entry: ${entry.message}`, error);
    }
  }

  /**
   * Format the log message with timestamp and metadata
   */
  private formatMessage(entry: LogEntry): string {
    let message = '';

    // Add timestamp if enabled
    if (this._config.includeTimestamp) {
      const timestamp = entry.timestamp.toISOString();
      message += `[${timestamp}] `;
    }

    // Add log level
    message += `[${LogLevel[entry.level]}] `;

    // Add source if available
    if (entry.source) {
      message += `[${entry.source}] `;
    }

    // Add main message
    message += entry.message;

    return message;
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' | 'debug' {
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
        return 'log';
    }
  }

  /**
   * Check if browser supports color coding in console
   */
  private supportsColorCoding(): boolean {
    return typeof window !== 'undefined' && 
           typeof console !== 'undefined' && 
           typeof console.log === 'function';
  }

  /**
   * Log with color coding using CSS styles
   */
  private logWithColors(
    consoleMethod: 'log' | 'info' | 'warn' | 'error' | 'debug',
    entry: LogEntry,
    formattedMessage: string
  ): void {
    const style = this.getColorStyle(entry.level);
    const args: Array<any> = [`%c${formattedMessage}`, style];

    // Add metadata if enabled
    if (this._config.includeMetadata && entry.metadata) {
      args.push('\nMetadata:', entry.metadata);
    }

    // Add context for debugging
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.DEBUG) {
      args.push('\nContext:', entry.context);
    }

    console[consoleMethod](...args);
  }

  /**
   * Log without color coding
   */
  private logPlain(
    consoleMethod: 'log' | 'info' | 'warn' | 'error' | 'debug',
    entry: LogEntry,
    formattedMessage: string
  ): void {
    const args: Array<any> = [formattedMessage];

    // Add metadata if enabled
    if (this._config.includeMetadata && entry.metadata) {
      args.push('\nMetadata:', entry.metadata);
    }

    // Add context for debugging
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.DEBUG) {
      args.push('\nContext:', entry.context);
    }

    console[consoleMethod](...args);
  }

  /**
   * Get CSS style for color coding based on log level
   */
  private getColorStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6B7280; font-weight: normal;'; // Gray
      case LogLevel.INFO:
        return 'color: #3B82F6; font-weight: normal;'; // Blue
      case LogLevel.WARN:
        return 'color: #F59E0B; font-weight: bold;'; // Orange
      case LogLevel.ERROR:
        return 'color: #EF4444; font-weight: bold; background-color: #FEF2F2; padding: 2px 4px;'; // Red with background
      default:
        return 'color: inherit; font-weight: normal;';
    }
  }
}