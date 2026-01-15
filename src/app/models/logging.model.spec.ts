import * as fc from 'fast-check';
import {
  LogLevel,
  LogEntry,
  LogContext,
  BrowserContext,
  GameContext,
  AngularContext,
  isValidLogEntry,
  isLogLevel,
  DEFAULT_LOGGING_CONFIG
} from './logging.model';

describe('LoggingModel', () => {
  describe('Property 1: Structured Log Data Acceptance', () => {
    /**
     * Feature: logging-service, Property 1: Structured Log Data Acceptance
     * Validates: Requirements 1.2
     * 
     * For any valid log message with level, timestamp, and metadata, 
     * the Logging_Service should accept and process the log entry without errors
     */
    it('should accept any valid structured log data', () => {
      fc.assert(
        fc.property(
          // Generate valid log entries
          fc.record({
            id: fc.string({ minLength: 1 }),
            timestamp: fc.date(),
            level: fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
            message: fc.string({ minLength: 1 }),
            metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            context: fc.record({
              browser: fc.record({
                userAgent: fc.string(),
                viewport: fc.record({
                  width: fc.integer({ min: 1 }),
                  height: fc.integer({ min: 1 }),
                }),
                url: fc.webUrl(),
                timestamp: fc.integer({ min: 0 }),
                performance: fc.option(
                  fc.record({
                    memory: fc.option(
                      fc.record({
                        usedJSHeapSize: fc.integer({ min: 0 }),
                        totalJSHeapSize: fc.integer({ min: 0 }),
                        jsHeapSizeLimit: fc.integer({ min: 0 }),
                      }),
                      { nil: undefined },
                    ),
                    timing: fc.option(
                      fc.record({
                        navigationStart: fc.integer({ min: 0 }),
                        loadEventEnd: fc.integer({ min: 0 }),
                      }),
                      { nil: undefined },
                    ),
                  }),
                  { nil: undefined },
                ),
              }),
              game: fc.option(
                fc.record({
                  gameId: fc.option(fc.string(), { nil: undefined }),
                  turn: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
                  playerId: fc.option(fc.string(), { nil: undefined }),
                  currentScreen: fc.option(fc.string(), { nil: undefined }),
                  selectedStar: fc.option(fc.string(), { nil: undefined }),
                  selectedFleet: fc.option(fc.string(), { nil: undefined }),
                  gameState: fc.option(fc.constantFrom('playing', 'paused', 'loading', 'error'), {
                    nil: undefined,
                  }),
                }),
                { nil: undefined },
              ),
              angular: fc.option(
                fc.record({
                  component: fc.option(fc.string(), { nil: undefined }),
                  route: fc.option(fc.string(), { nil: undefined }),
                  routeParams: fc.option(fc.dictionary(fc.string(), fc.anything()), {
                    nil: undefined,
                  }),
                  changeDetectionCycle: fc.option(fc.integer({ min: 0 }), { nil: undefined }),
                  errorBoundary: fc.option(fc.string(), { nil: undefined }),
                }),
                { nil: undefined },
              ),
              custom: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
            }),
            source: fc.option(fc.string(), { nil: undefined }),
          }),
          (logEntry: LogEntry) => {
            // Test that the log entry is valid according to our validation function
            expect(isValidLogEntry(logEntry)).toBe(true);

            // Test that all required fields are present and of correct type
            expect(typeof logEntry.id).toBe('string');
            expect(logEntry.id.length).toBeGreaterThan(0);
            expect(logEntry.timestamp).toBeInstanceOf(Date);
            expect(isLogLevel(logEntry.level)).toBe(true);
            expect(typeof logEntry.message).toBe('string');
            expect(logEntry.message.length).toBeGreaterThan(0);
            expect(typeof logEntry.context).toBe('object');
            expect(logEntry.context).not.toBeNull();

            // Test that browser context is always present and valid
            expect(typeof logEntry.context.browser).toBe('object');
            expect(logEntry.context.browser).not.toBeNull();
            expect(typeof logEntry.context.browser.userAgent).toBe('string');
            expect(typeof logEntry.context.browser.viewport.width).toBe('number');
            expect(typeof logEntry.context.browser.viewport.height).toBe('number');
            expect(logEntry.context.browser.viewport.width).toBeGreaterThan(0);
            expect(logEntry.context.browser.viewport.height).toBeGreaterThan(0);

            // Test that optional fields are handled correctly
            if (logEntry.metadata !== undefined) {
              expect(typeof logEntry.metadata).toBe('object');
            }

            if (logEntry.source !== undefined) {
              expect(typeof logEntry.source).toBe('string');
            }

            // Test that game context, if present, has valid structure
            if (logEntry.context.game !== undefined) {
              expect(typeof logEntry.context.game).toBe('object');
              if (logEntry.context.game.turn !== undefined) {
                expect(logEntry.context.game.turn).toBeGreaterThanOrEqual(0);
              }
            }

            // Test that angular context, if present, has valid structure
            if (logEntry.context.angular !== undefined) {
              expect(typeof logEntry.context.angular).toBe('object');
              if (logEntry.context.angular.changeDetectionCycle !== undefined) {
                expect(logEntry.context.angular.changeDetectionCycle).toBeGreaterThanOrEqual(0);
              }
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify valid log levels', () => {
      expect(isLogLevel(LogLevel.DEBUG)).toBe(true);
      expect(isLogLevel(LogLevel.INFO)).toBe(true);
      expect(isLogLevel(LogLevel.WARN)).toBe(true);
      expect(isLogLevel(LogLevel.ERROR)).toBe(true);
      expect(isLogLevel(0)).toBe(true);
      expect(isLogLevel(1)).toBe(true);
      expect(isLogLevel(2)).toBe(true);
      expect(isLogLevel(3)).toBe(true);
      expect(isLogLevel(-1)).toBe(false);
      expect(isLogLevel(4)).toBe(false);
      expect(isLogLevel('debug')).toBe(false);
      expect(isLogLevel(null)).toBe(false);
      expect(isLogLevel(undefined)).toBe(false);
    });

    it('should correctly validate log entries', () => {
      const validEntry: LogEntry = {
        id: 'test-id',
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
        context: {
          browser: {
            userAgent: 'test-agent',
            viewport: { width: 1920, height: 1080 },
            url: 'https://example.com',
            timestamp: Date.now()
          }
        }
      };

      expect(isValidLogEntry(validEntry)).toBe(true);

      // Test invalid entries
      expect(isValidLogEntry(null)).toBe(false);
      expect(isValidLogEntry(undefined)).toBe(false);
      expect(isValidLogEntry({})).toBe(false);
      expect(isValidLogEntry({ ...validEntry, id: null })).toBe(false);
      expect(isValidLogEntry({ ...validEntry, timestamp: 'invalid' })).toBe(false);
      expect(isValidLogEntry({ ...validEntry, level: 'invalid' })).toBe(false);
      expect(isValidLogEntry({ ...validEntry, message: null })).toBe(false);
      expect(isValidLogEntry({ ...validEntry, context: null })).toBe(false);
    });
  });

  describe('Default Configuration', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_LOGGING_CONFIG).toBeDefined();
      expect(isLogLevel(DEFAULT_LOGGING_CONFIG.level)).toBe(true);
      expect(typeof DEFAULT_LOGGING_CONFIG.destinations).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.destinations.console).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.destinations.applicationInsights).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.destinations.developerPanel).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.rateLimiting).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.batching).toBe('object');
      expect(typeof DEFAULT_LOGGING_CONFIG.contextProviders).toBe('object');
    });
  });
});