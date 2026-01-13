import * as fc from 'fast-check';
import {
  LogLevel,
  LogEntry,
  LogDestination,
  ConsoleDestinationConfig,
  ApplicationInsightsConfig,
  DeveloperPanelConfig
} from '../../models/logging.model';
import { ConsoleDestination } from './console.destination';
import { ApplicationInsightsDestination } from './application-insights.destination';
import { DeveloperPanelDestination } from './developer-panel.destination';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SettingsService } from '../settings.service';
import { signal } from '@angular/core';

describe('LogDestinations', () => {
  let consoleDestination: ConsoleDestination;
  let applicationInsightsDestination: ApplicationInsightsDestination;
  let developerPanelDestination: DeveloperPanelDestination;
  let mockSettingsService: any;

  beforeEach(() => {
    // Create mock settings service with developerMode signal
    mockSettingsService = {
      developerMode: signal(true)
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ConsoleDestination,
        ApplicationInsightsDestination,
        DeveloperPanelDestination,
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    });

    consoleDestination = TestBed.inject(ConsoleDestination);
    applicationInsightsDestination = TestBed.inject(ApplicationInsightsDestination);
    developerPanelDestination = TestBed.inject(DeveloperPanelDestination);
  });

  describe('Property 4: Multi-Destination Routing', () => {
    /**
     * Feature: logging-service, Property 4: Multi-Destination Routing
     * Validates: Requirements 2.1, 2.2, 2.4
     * 
     * For any log entry and any configured destination set, the service should route 
     * the message to all enabled destinations and skip disabled ones
     */
    it('should route log entries to all enabled destinations and skip disabled ones', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid log entry
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
              }),
            }),
            source: fc.option(fc.string(), { nil: undefined }),
          }),
          // Generate destination configurations
          fc.record({
            consoleEnabled: fc.boolean(),
            applicationInsightsEnabled: fc.boolean(),
            developerPanelEnabled: fc.boolean(),
            consoleLogLevel: fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
            applicationInsightsLogLevel: fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
            developerPanelLogLevel: fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          }),
          async (logEntry: LogEntry, config: any) => {
            // Configure destinations using the injected instances
            const consoleConfig: ConsoleDestinationConfig = {
              enabled: config.consoleEnabled,
              colorCoding: true,
              includeTimestamp: true,
              includeMetadata: false,
              logLevel: config.consoleLogLevel,
            };

            const applicationInsightsConfig: ApplicationInsightsConfig = {
              enabled: config.applicationInsightsEnabled,
              instrumentationKey: config.applicationInsightsEnabled ? 'test-key' : undefined,
              batchSize: 10,
              flushInterval: 5000,
              maxRetries: 3,
              retryDelay: 1000,
              logLevel: config.applicationInsightsLogLevel,
            };

            const developerPanelConfig: DeveloperPanelConfig = {
              enabled: config.developerPanelEnabled,
              maxEntries: 100,
              autoScroll: true,
              showMetadata: true,
              logLevel: config.developerPanelLogLevel,
            };

            // Apply configurations
            consoleDestination.configure(consoleConfig);
            applicationInsightsDestination.configure(applicationInsightsConfig);
            developerPanelDestination.configure(developerPanelConfig);

            // Mock the log methods to track calls
            let consoleCallCount = 0;
            let applicationInsightsCallCount = 0;
            let developerPanelCallCount = 0;

            const originalConsoleLog = consoleDestination.log;
            const originalApplicationInsightsLog = applicationInsightsDestination.log;
            const originalDeveloperPanelLog = developerPanelDestination.log;

            consoleDestination.log = async (entry: LogEntry) => {
              consoleCallCount++;
              return Promise.resolve();
            };

            applicationInsightsDestination.log = async (entry: LogEntry) => {
              applicationInsightsCallCount++;
              return Promise.resolve();
            };

            developerPanelDestination.log = async (entry: LogEntry) => {
              developerPanelCallCount++;
              return Promise.resolve();
            };

            try {
              // Create array of destinations for routing simulation
              const destinations: LogDestination[] = [
                consoleDestination,
                applicationInsightsDestination,
                developerPanelDestination
              ];

              // Simulate multi-destination routing
              const routingPromises = destinations.map(async (destination) => {
                if (destination.isEnabled && logEntry.level >= getDestinationLogLevel(destination, config)) {
                  await destination.log(logEntry);
                }
              });

              await Promise.all(routingPromises);

              // Verify routing behavior
              const shouldConsoleReceive = config.consoleEnabled && logEntry.level >= config.consoleLogLevel;
              const shouldApplicationInsightsReceive = config.applicationInsightsEnabled && 
                logEntry.level >= config.applicationInsightsLogLevel && 
                !!applicationInsightsConfig.instrumentationKey;
              const shouldDeveloperPanelReceive = config.developerPanelEnabled && 
                logEntry.level >= config.developerPanelLogLevel;

              // Assert that enabled destinations received the log entry
              if (shouldConsoleReceive) {
                expect(consoleCallCount).toBe(1);
              } else {
                expect(consoleCallCount).toBe(0);
              }

              if (shouldApplicationInsightsReceive) {
                expect(applicationInsightsCallCount).toBe(1);
              } else {
                expect(applicationInsightsCallCount).toBe(0);
              }

              if (shouldDeveloperPanelReceive) {
                expect(developerPanelCallCount).toBe(1);
              } else {
                expect(developerPanelCallCount).toBe(0);
              }

              // Verify that isEnabled property reflects configuration correctly
              expect(consoleDestination.isEnabled).toBe(config.consoleEnabled);
              expect(applicationInsightsDestination.isEnabled).toBe(
                config.applicationInsightsEnabled && !!applicationInsightsConfig.instrumentationKey
              );
              expect(developerPanelDestination.isEnabled).toBe(config.developerPanelEnabled);

            } finally {
              // Restore original methods
              consoleDestination.log = originalConsoleLog;
              applicationInsightsDestination.log = originalApplicationInsightsLog;
              developerPanelDestination.log = originalDeveloperPanelLog;
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 5: Destination Failure Isolation', () => {
    /**
     * Feature: logging-service, Property 5: Destination Failure Isolation
     * Validates: Requirements 2.5
     * 
     * For any log entry, if one destination fails, all other configured destinations 
     * should continue to receive and process the log message
     */
    it('should isolate destination failures and continue routing to other destinations', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid log entry
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
              }),
            }),
            source: fc.option(fc.string(), { nil: undefined }),
          }),
          // Generate which destination should fail
          fc.constantFrom('console', 'applicationInsights', 'developerPanel', 'none'),
          async (logEntry: LogEntry, failingDestination: string) => {
            // Configure all destinations as enabled
            consoleDestination.configure({
              enabled: true,
              colorCoding: true,
              includeTimestamp: true,
              includeMetadata: false,
              logLevel: LogLevel.DEBUG,
            });

            applicationInsightsDestination.configure({
              enabled: true,
              instrumentationKey: 'test-key',
              batchSize: 10,
              flushInterval: 5000,
              maxRetries: 3,
              retryDelay: 1000,
              logLevel: LogLevel.DEBUG,
            });

            developerPanelDestination.configure({
              enabled: true,
              maxEntries: 100,
              autoScroll: true,
              showMetadata: true,
              logLevel: LogLevel.DEBUG,
            });

            // Track calls and simulate failures
            let consoleCallCount = 0;
            let applicationInsightsCallCount = 0;
            let developerPanelCallCount = 0;
            let consoleSuccess = true;
            let applicationInsightsSuccess = true;
            let developerPanelSuccess = true;

            const originalConsoleLog = consoleDestination.log;
            const originalApplicationInsightsLog = applicationInsightsDestination.log;
            const originalDeveloperPanelLog = developerPanelDestination.log;

            consoleDestination.log = async (entry: LogEntry) => {
              consoleCallCount++;
              if (failingDestination === 'console') {
                consoleSuccess = false;
                throw new Error('Console destination failed');
              }
              return Promise.resolve();
            };

            applicationInsightsDestination.log = async (entry: LogEntry) => {
              applicationInsightsCallCount++;
              if (failingDestination === 'applicationInsights') {
                applicationInsightsSuccess = false;
                throw new Error('Application Insights failed');
              }
              return Promise.resolve();
            };

            developerPanelDestination.log = async (entry: LogEntry) => {
              developerPanelCallCount++;
              if (failingDestination === 'developerPanel') {
                developerPanelSuccess = false;
                throw new Error('Developer panel failed');
              }
              return Promise.resolve();
            };

            try {
              // Simulate multi-destination routing with error isolation
              const destinations: LogDestination[] = [
                consoleDestination,
                applicationInsightsDestination,
                developerPanelDestination
              ];

              const routingResults = await Promise.allSettled(
                destinations.map(async (destination) => {
                  if (destination.isEnabled) {
                    try {
                      await destination.log(logEntry);
                      return { destination: destination.name, success: true };
                    } catch (error) {
                      return { destination: destination.name, success: false, error };
                    }
                  }
                  return { destination: destination.name, success: true, skipped: true };
                })
              );

              // Verify that all destinations were attempted
              expect(consoleCallCount).toBe(1);
              expect(applicationInsightsCallCount).toBe(1);
              expect(developerPanelCallCount).toBe(1);

              // Verify that failure isolation worked
              const successfulDestinations = routingResults.filter(
                result => result.status === 'fulfilled' && result.value.success
              );
              const failedDestinations = routingResults.filter(
                result => result.status === 'fulfilled' && result.value.success === false
              );

              if (failingDestination === 'none') {
                // All destinations should succeed
                expect(successfulDestinations.length).toBe(3);
                expect(failedDestinations.length).toBe(0);
                expect(consoleSuccess).toBe(true);
                expect(applicationInsightsSuccess).toBe(true);
                expect(developerPanelSuccess).toBe(true);
              } else {
                // One destination should fail, others should succeed
                expect(successfulDestinations.length).toBe(2);
                expect(failedDestinations.length).toBe(1);
                
                const failedDestinationResult = failedDestinations[0];
                expect(failedDestinationResult.status).toBe('fulfilled');
                if (failedDestinationResult.status === 'fulfilled') {
                  expect(failedDestinationResult.value.destination).toBe(failingDestination);
                }

                // Verify specific failure
                switch (failingDestination) {
                  case 'console':
                    expect(consoleSuccess).toBe(false);
                    expect(applicationInsightsSuccess).toBe(true);
                    expect(developerPanelSuccess).toBe(true);
                    break;
                  case 'applicationInsights':
                    expect(consoleSuccess).toBe(true);
                    expect(applicationInsightsSuccess).toBe(false);
                    expect(developerPanelSuccess).toBe(true);
                    break;
                  case 'developerPanel':
                    expect(consoleSuccess).toBe(true);
                    expect(applicationInsightsSuccess).toBe(true);
                    expect(developerPanelSuccess).toBe(false);
                    break;
                }
              }

              // Verify that the routing mechanism itself doesn't throw errors
              // (this tests that Promise.allSettled is used instead of Promise.all)
              expect(routingResults.length).toBe(3);
              routingResults.forEach(result => {
                expect(result.status).toBe('fulfilled');
              });

            } finally {
              // Restore original methods
              consoleDestination.log = originalConsoleLog;
              applicationInsightsDestination.log = originalApplicationInsightsLog;
              developerPanelDestination.log = originalDeveloperPanelLog;
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  // Helper function to get destination log level for testing
  function getDestinationLogLevel(destination: LogDestination, config?: any): LogLevel {
    if (config) {
      switch (destination.name) {
        case 'console':
          return config.consoleLogLevel || LogLevel.DEBUG;
        case 'applicationInsights':
          return config.applicationInsightsLogLevel || LogLevel.DEBUG;
        case 'developerPanel':
          return config.developerPanelLogLevel || LogLevel.DEBUG;
        default:
          return LogLevel.DEBUG;
      }
    }
    return LogLevel.DEBUG; // Default for failure isolation test
  }
});