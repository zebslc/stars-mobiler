import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import * as fc from 'fast-check';
import { LoggingService } from './logging.service';
import { LogLevel, LogContext, LogEntry } from '../models/logging.model';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LoggingService
      ]
    });
    service = TestBed.inject(LoggingService);
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
          // Generate valid log levels
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.string({ minLength: 1 }),
          fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
          (level: LogLevel, message: string, metadata: Record<string, any> | undefined) => {
            // Set service to accept all log levels
            service.setLogLevel(LogLevel.DEBUG);
            
            // Create a minimal context for testing
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now()
              }
            };

            // Track if the log method completes without error
            let logProcessed = false;
            let errorThrown = false;

            try {
              service.log({
                level,
                message,
                metadata,
                context
              });
              logProcessed = true;
            } catch (error) {
              errorThrown = true;
            }

            // Verify the log was processed successfully
            expect(logProcessed).toBe(true);
            expect(errorThrown).toBe(false);

            // Test convenience methods for each level
            try {
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
              logProcessed = true;
            } catch (error) {
              errorThrown = true;
            }

            // Verify convenience methods work
            expect(logProcessed).toBe(true);
            expect(errorThrown).toBe(false);
          }
        ),
        { numRuns: 100 }
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

            // Create a minimal context
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now()
              }
            };

            // Track console output to verify filtering
            const originalConsoleLog = console.log;
            let consoleCallCount = 0;
            console.log = () => { consoleCallCount++; };

            try {
              service.log({
                level: messageLevel,
                message,
                context
              });

              // Verify filtering behavior
              if (messageLevel >= serviceLevel) {
                // Message should be processed (console.log called)
                expect(consoleCallCount).toBeGreaterThan(0);
              } else {
                // Message should be filtered out (console.log not called)
                expect(consoleCallCount).toBe(0);
              }
            } finally {
              console.log = originalConsoleLog;
            }
          }
        ),
        { numRuns: 100 }
      );
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
            
            // Create a minimal context for testing
            const context: LogContext = {
              browser: {
                userAgent: 'test-agent',
                viewport: { width: 1920, height: 1080 },
                url: 'https://test.com',
                timestamp: Date.now()
              }
            };

            // Capture the log entry by intercepting the routing method
            let capturedEntry: LogEntry | null = null;
            const originalRouteToDestinations = (service as any).routeToDestinations;
            (service as any).routeToDestinations = (entry: LogEntry) => {
              capturedEntry = entry;
              // Call original method to maintain behavior
              originalRouteToDestinations.call(service, entry);
            };

            try {
              service.log({
                level,
                message,
                metadata,
                context
              });

              // Verify automatic metadata inclusion
              expect(capturedEntry).not.toBeNull();
              if (capturedEntry) {
                // Verify unique ID generation
                expect(capturedEntry.id).toBeDefined();
                expect(typeof capturedEntry.id).toBe('string');
                expect(capturedEntry.id.length).toBeGreaterThan(0);
                expect(capturedEntry.id).toMatch(/^log_\d+_[a-z0-9]+$/);

                // Verify timestamp generation
                expect(capturedEntry.timestamp).toBeDefined();
                expect(capturedEntry.timestamp instanceof Date).toBe(true);
                expect(capturedEntry.timestamp.getTime()).toBeGreaterThan(0);

                // Verify context enrichment
                expect(capturedEntry.context).toBeDefined();
                expect(capturedEntry.context.browser).toBeDefined();
                expect(capturedEntry.context.browser.timestamp).toBeDefined();
                expect(typeof capturedEntry.context.browser.timestamp).toBe('number');

                // Verify source context capture
                expect(capturedEntry.context.custom).toBeDefined();
                expect(capturedEntry.context.custom?.sourceContext).toBeDefined();
              }
            } finally {
              // Restore original method
              (service as any).routeToDestinations = originalRouteToDestinations;
            }
          }
        ),
        { numRuns: 100 }
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
                timestamp: Date.now()
              }
            };

            // Capture all log entries
            const capturedEntries: LogEntry[] = [];
            const originalRouteToDestinations = (service as any).routeToDestinations;
            (service as any).routeToDestinations = (entry: LogEntry) => {
              capturedEntries.push(entry);
              originalRouteToDestinations.call(service, entry);
            };

            try {
              // Log all messages
              messages.forEach(message => {
                service.log({
                  level: LogLevel.INFO,
                  message,
                  context
                });
              });

              // Verify all IDs are unique
              const ids = capturedEntries.map(entry => entry.id);
              const uniqueIds = new Set(ids);
              expect(uniqueIds.size).toBe(ids.length);

              // Verify all timestamps are present and reasonable
              capturedEntries.forEach(entry => {
                expect(entry.timestamp instanceof Date).toBe(true);
                expect(entry.timestamp.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
              });
            } finally {
              // Restore original method
              (service as any).routeToDestinations = originalRouteToDestinations;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});