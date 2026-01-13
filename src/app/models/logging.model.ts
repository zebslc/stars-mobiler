export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  context: LogContext;
  source?: string;
}

export interface LogContext {
  browser: BrowserContext;
  game?: GameContext;
  angular?: AngularContext;
  custom?: Record<string, any>;
}

export interface BrowserContext {
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  url: string;
  timestamp: number;
  performance?: {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    timing?: {
      navigationStart: number;
      loadEventEnd: number;
    };
  };
}

export interface GameContext {
  gameId?: string;
  turn?: number;
  playerId?: string;
  currentScreen?: string;
  selectedPlanet?: string;
  selectedFleet?: string;
  gameState?: 'playing' | 'paused' | 'loading' | 'error';
}

export interface AngularContext {
  component?: string;
  route?: string;
  routeParams?: Record<string, any>;
  changeDetectionCycle?: number;
  errorBoundary?: string;
}

export interface LogDestination {
  name: string;
  isEnabled: boolean;
  log(entry: LogEntry): Promise<void>;
  configure(config: any): void;
}

// Configuration interfaces for destinations
export interface ConsoleDestinationConfig {
  enabled: boolean;
  colorCoding: boolean;
  includeTimestamp: boolean;
  includeMetadata: boolean;
  logLevel: LogLevel;
}

export interface ApplicationInsightsConfig {
  enabled: boolean;
  instrumentationKey?: string;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
  logLevel: LogLevel;
}

export interface DeveloperPanelConfig {
  enabled: boolean;
  maxEntries: number;
  autoScroll: boolean;
  showMetadata: boolean;
  logLevel: LogLevel;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxMessagesPerSecond: number;
  burstLimit: number;
  windowSizeMs: number;
}

export interface BatchingConfig {
  enabled: boolean;
  batchSize: number;
  flushIntervalMs: number;
  maxBatchAge: number;
}

export interface LoggingConfiguration {
  level: LogLevel;
  destinations: {
    console: ConsoleDestinationConfig;
    applicationInsights: ApplicationInsightsConfig;
    developerPanel: DeveloperPanelConfig;
  };
  rateLimiting: RateLimitConfig;
  batching: BatchingConfig;
  contextProviders: {
    browser: boolean;
    game: boolean;
    angular: boolean;
  };
}

// Utility types
export type LogLevelString = keyof typeof LogLevel;

export type LogEntryWithoutId = Omit<LogEntry, 'id' | 'timestamp'>;

export type LogDestinationName = 'console' | 'applicationInsights' | 'developerPanel';

export type LogContextProvider = 'browser' | 'game' | 'angular';

// Type guards
export function isLogLevel(value: any): value is LogLevel {
  return typeof value === 'number' && value >= 0 && value <= 3;
}

export function isValidLogEntry(entry: any): entry is LogEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.id === 'string' &&
    entry.timestamp instanceof Date &&
    isLogLevel(entry.level) &&
    typeof entry.message === 'string' &&
    typeof entry.context === 'object' &&
    entry.context !== null
  );
}

// Constants
export const DEFAULT_LOGGING_CONFIG: LoggingConfiguration = {
  level: LogLevel.INFO,
  destinations: {
    console: {
      enabled: true,
      colorCoding: true,
      includeTimestamp: true,
      includeMetadata: false,
      logLevel: LogLevel.DEBUG,
    },
    applicationInsights: {
      enabled: false,
      batchSize: 10,
      flushInterval: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      logLevel: LogLevel.WARN,
    },
    developerPanel: {
      enabled: false,
      maxEntries: 100,
      autoScroll: true,
      showMetadata: true,
      logLevel: LogLevel.DEBUG,
    },
  },
  rateLimiting: {
    enabled: true,
    maxMessagesPerSecond: 10,
    burstLimit: 50,
    windowSizeMs: 1000,
  },
  batching: {
    enabled: true,
    batchSize: 5,
    flushIntervalMs: 2000,
    maxBatchAge: 10000,
  },
  contextProviders: {
    browser: true,
    game: true,
    angular: true,
  },
};