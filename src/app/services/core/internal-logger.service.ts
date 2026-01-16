import { Injectable, inject } from '@angular/core';
import { ConsoleDestination } from '../destinations/console.destination';
import type { LogEntry, LogContext } from '../../models/logging.model';
import { LogLevel } from '../../models/logging.model';

type LogMetadata = Record<string, unknown> | undefined;

@Injectable({ providedIn: 'root' })
export class InternalLoggerService {
  private readonly consoleDestination = inject(ConsoleDestination);

  async info(message: string, metadata?: LogMetadata, source?: string): Promise<void> {
    await this.consoleDestination.log(createInternalLogEntry(LogLevel.INFO, message, metadata, source));
  }

  async warn(message: string, metadata?: LogMetadata, source?: string): Promise<void> {
    await this.consoleDestination.log(createInternalLogEntry(LogLevel.WARN, message, metadata, source));
  }

  async error(message: string, metadata?: LogMetadata, source?: string): Promise<void> {
    await this.consoleDestination.log(createInternalLogEntry(LogLevel.ERROR, message, metadata, source));
  }
}

const fallbackConsoleDestination = new ConsoleDestination();

export function logInternalInfo(message: string, metadata?: LogMetadata, source?: string): void {
  void fallbackConsoleDestination.log(createInternalLogEntry(LogLevel.INFO, message, metadata, source));
}

export function logInternalWarn(message: string, metadata?: LogMetadata, source?: string): void {
  void fallbackConsoleDestination.log(createInternalLogEntry(LogLevel.WARN, message, metadata, source));
}

export function logInternalError(message: string, metadata?: LogMetadata, source?: string): void {
  void fallbackConsoleDestination.log(createInternalLogEntry(LogLevel.ERROR, message, metadata, source));
}

export function normalizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  if (typeof error === 'object' && error !== null) {
    return { ...(error as Record<string, unknown>) };
  }
  return { value: error };
}

function createInternalLogEntry(
  level: LogLevel,
  message: string,
  metadata: LogMetadata,
  source?: string
): LogEntry {
  return {
    id: `internal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    level,
    message,
    metadata,
    source: source ?? 'InternalLogger',
    context: createMinimalContext(source),
  };
}

function createMinimalContext(source?: string): LogContext {
  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';
  return {
    browser: {
      userAgent: hasNavigator ? navigator.userAgent : 'unknown',
      viewport: {
        width: hasWindow ? window.innerWidth : 0,
        height: hasWindow ? window.innerHeight : 0,
      },
      url: hasWindow ? window.location.href : 'internal',
      timestamp: Date.now(),
    },
    custom: { source: source ?? 'InternalLogger' },
  };
}
