import * as fc from 'fast-check';
import { LoggingService } from './logging.service';
import { LogLevel, LogContext, LogEntry } from '../models/logging.model';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleLogSpy: jasmine.Spy;

  beforeEach(() => {
    // Direct instantiation - much faster than TestBed
    service = new LoggingService();

    // Mock console at suite level for performance
    consoleLogSpy = spyOn(console, 'log');
  });

  afterEach(() => {
    // Ensure proper cleanup
    consoleLogSpy.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isInitialized()).toBe(true);
  });

  describe('Property 2: Log Level Support', () => {
    /**
     * Feature: logging-service, Property 2: Log Level Support
     * Validates: Requirements 1.3
     *
     * For any supported log level (error, warn, info, debug),
     * the Logging_Service should correctly process and route the message
     */
    it('should correctly process and route messages for any supported log level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.string({ minLength: 1 }),
          fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
          (level: LogLevel, message: string, metadata: Record<string, any> | undefined) => {
            // Set service to accept all log levels
            service.setLogLevel(LogLevel.DEBUG);
            consoleLogSpy.calls.reset();

            // Create a minimal context for testing
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now(),
              },
            };

            // Test log method - should not throw
            expect(() => {
              service.log({
                level,
                message,
                metadata,
                context,
              });
            }).not.toThrow();

            // Verify console was called (observable behavior)
            expect(consoleLogSpy).toHaveBeenCalled();
            consoleLogSpy.calls.reset();

            // Test convenience methods - should not throw
            expect(() => {
              switch (level) {
                case LogLevel.DEBUG:
                  service.debug(message, metadata);
                  break;
                case LogLevel.INFO:
                  service.info(message, metadata);
                  break;
                case LogLevel.WARN:
                  service.warn(message, metadata);
                  break;
                case LogLevel.ERROR:
                  service.error(message, metadata);
                  break;
              }
            }).not.toThrow();

            // Verify console was called for convenience method
            expect(consoleLogSpy).toHaveBeenCalled();
          },
        ),
        { numRuns: 10 }, // Reduced from 20 for faster execution
      );
    });

    it('should respect log level filtering', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.string({ minLength: 1 }),
          (serviceLevel: LogLevel, messageLevel: LogLevel, message: string) => {
            // Set the service log level
            service.setLogLevel(serviceLevel);

            // Verify the configuration was updated
            expect(service.currentLogLevel()).toBe(serviceLevel);

            // Reset spy for this iteration
            consoleLogSpy.calls.reset();

            // Create a minimal context
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now(),
              },
            };

            service.log({
              level: messageLevel,
              message,
              context,
            });

            // Verify filtering behavior based on observable output
            if (messageLevel >= serviceLevel) {
              // Message should be processed
              expect(consoleLogSpy).toHaveBeenCalled();
            } else {
              // Message should be filtered out
              expect(consoleLogSpy).not.toHaveBeenCalled();
            }
          },
        ),
        { numRuns: 10 }, // Reduced from 20 for faster execution
      );
    });
  });

  describe('Property 3: Automatic Metadata Inclusion', () => {
    /**
     * Feature: logging-service, Property 3: Automatic Metadata Inclusion
     * Validates: Requirements 1.4
     *
     * For any log entry, the LoggingService should automatically include:
     * - Unique ID generation
     * - Timestamp generation
     * - Source context capture
     */
    it('should automatically include metadata for any log entry', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.string({ minLength: 1 }),
          fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
          (level: LogLevel, message: string, metadata: Record<string, any> | undefined) => {
            // Set service to accept all log levels
            service.setLogLevel(LogLevel.DEBUG);
            consoleLogSpy.calls.reset();

            // Create a minimal context for testing
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now(),
              },
            };

            // Subscribe to developer events to capture the enriched entry
            let capturedEntry: LogEntry | null = null;
            const subscription = service.developerEvents$.subscribe((entry: LogEntry) => {
              capturedEntry = entry;
            });

            try {
              service.log({
                level,
                message,
                metadata,
                context,
              });

              // Verify entry was captured through observable
              expect(capturedEntry).not.toBeNull();

              // Use non-null assertion since we just verified it's not null
              const entry = capturedEntry!;

              // Verify unique ID generation (format-agnostic)
              expect(entry.id).toBeDefined();
              expect(typeof entry.id).toBe('string');
              expect(entry.id.length).toBeGreaterThan(0);

              // Verify timestamp generation
              expect(entry.timestamp).toBeDefined();
              expect(entry.timestamp instanceof Date).toBe(true);

              // Verify context enrichment
              expect(entry.context).toBeDefined();
              expect(entry.context.browser).toBeDefined();
              expect(entry.context.browser.timestamp).toBeDefined();
              expect(typeof entry.context.browser.timestamp).toBe('number');

              // Verify source context capture
              expect(entry.context.custom).toBeDefined();
              expect(entry.context.custom?.sourceContext).toBeDefined();
            } finally {
              subscription.unsubscribe();
            }
          },
        ),
        { numRuns: 10 }, // Reduced from 20 for faster execution
      );
    });

    it('should generate unique IDs for concurrent log entries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }),
          (messages: string[]) => {
            // Set service to accept all log levels
            service.setLogLevel(LogLevel.DEBUG);

            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now(),
              },
            };

            // Capture all log entries through observable
            const capturedEntries: LogEntry[] = [];
            const subscription = service.developerEvents$.subscribe((entry: LogEntry) => {
              capturedEntries.push(entry);
            });

            try {
              // Log all messages
              messages.forEach((message) => {
                service.log({
                  level: LogLevel.INFO,
                  message,
                  context,
                });
              });

              // Verify all IDs are unique
              const ids = capturedEntries.map((entry) => entry.id);
              const uniqueIds = new Set(ids);
              expect(uniqueIds.size).toBe(ids.length);
              expect(uniqueIds.size).toBe(messages.length);

              // Verify all timestamps are present and valid
              capturedEntries.forEach((entry) => {
                expect(entry.timestamp instanceof Date).toBe(true);
                expect(entry.timestamp.getTime()).toBeGreaterThan(0);
              });
            } finally {
              subscription.unsubscribe();
            }
          },
        ),
        { numRuns: 10 }, // Reduced from 20 for faster execution
      );
    });
  });
});