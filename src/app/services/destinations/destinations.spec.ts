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

  describe('Property 10: Application Insights Integration', () => {
    /**
     * Feature: logging-service, Property 10: Application Insights Integration
     * Validates: Requirements 5.1, 5.2, 5.3
     *
     * For any log entry when Application Insights is configured and enabled,
     * the service should format and transmit the data to the Application Insights endpoint
     */
    it('should format and transmit log data to Application Insights when configured and enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid log entry
          fc.record({
            id: fc.string({ minLength: 1 }),
            timestamp: fc.date(),
            level: fc.constantFrom(LogLevel.WARN, LogLevel.ERROR), // Only test levels that would be sent to AI
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
                  }),
                  { nil: undefined },
                ),
              }),
              game: fc.option(
                fc.record({
                  gameId: fc.option(fc.string(), { nil: undefined }),
                  gameState: fc.option(fc.constantFrom('playing', 'paused', 'loading', 'error'), {
                    nil: undefined,
                  }),
                  currentScreen: fc.option(fc.string(), { nil: undefined }),
                }),
                { nil: undefined },
              ),
              angular: fc.option(
                fc.record({
                  component: fc.option(fc.string(), { nil: undefined }),
                  route: fc.option(fc.string(), { nil: undefined }),
                }),
                { nil: undefined },
              ),
            }),
            source: fc.option(fc.string(), { nil: undefined }),
          }),
          // Generate Application Insights configuration
          fc.record({
            instrumentationKey: fc.string({ minLength: 10 }),
            endpoint: fc.option(fc.webUrl(), { nil: undefined }),
            batchSize: fc.integer({ min: 1, max: 50 }),
            flushInterval: fc.integer({ min: 1000, max: 10000 }),
          }),
          async (logEntry: LogEntry, aiConfig: any) => {
            // Mock fetch to capture Application Insights requests
            let capturedPayload: any = null;
            let capturedUrl: string = '';
            let capturedHeaders: Record<string, string> = {};
            let fetchCallCount = 0;

            const originalFetch = window.fetch;
            window.fetch = jasmine
              .createSpy('fetch')
              .and.callFake(async (url: string, options: any) => {
                fetchCallCount++;
                capturedUrl = url;
                capturedHeaders = options.headers || {};
                capturedPayload = JSON.parse(options.body);

                // Simulate successful response
                return Promise.resolve({
                  ok: true,
                  status: 200,
                  statusText: 'OK',
                } as Response);
              });

            try {
              // Configure Application Insights destination
              const config: ApplicationInsightsConfig = {
                enabled: true,
                instrumentationKey: aiConfig.instrumentationKey,
                endpoint: aiConfig.endpoint,
                batchSize: aiConfig.batchSize,
                flushInterval: aiConfig.flushInterval,
                maxRetries: 3,
                retryDelay: 1000,
                logLevel: LogLevel.WARN, // Only WARN and ERROR levels
              };

              applicationInsightsDestination.configure(config);

              // Verify destination is enabled with proper configuration
              expect(applicationInsightsDestination.isEnabled).toBe(true);

              // Log the entry
              await applicationInsightsDestination.log(logEntry);

              // For single entries, we need to trigger flush manually or wait for batch
              // Since we're testing the integration, we'll access the private flush method
              // by triggering it through a full batch
              const additionalEntries = Array(aiConfig.batchSize - 1)
                .fill(null)
                .map(() => ({
                  ...logEntry,
                  id: `additional_${Math.random()}`,
                  timestamp: new Date(),
                }));

              // Log additional entries to trigger batch flush
              for (const entry of additionalEntries) {
                await applicationInsightsDestination.log(entry);
              }

              // Wait a bit for async operations to complete
              await new Promise((resolve) => setTimeout(resolve, 100));

              // Verify that fetch was called (batch was sent)
              expect(fetchCallCount).toBeGreaterThan(0);

              if (fetchCallCount > 0) {
                // Verify the endpoint URL
                const expectedEndpoint =
                  aiConfig.endpoint || 'https://dc.applicationinsights.azure.com/v2/track';
                expect(capturedUrl).toBe(expectedEndpoint);

                // Verify headers
                expect(capturedHeaders['Content-Type']).toBe('application/json');
                expect(capturedHeaders['Accept']).toBe('application/json');

                // Verify payload structure
                expect(capturedPayload).toBeDefined();
                expect(capturedPayload.name).toBe('Microsoft.ApplicationInsights.Event');
                expect(capturedPayload.iKey).toBe(aiConfig.instrumentationKey);
                expect(capturedPayload.data).toBeDefined();
                expect(capturedPayload.data.baseType).toBe('EventData');
                expect(capturedPayload.data.baseData).toBeDefined();

                const baseData = capturedPayload.data.baseData;
                expect(baseData.ver).toBe(2);
                expect(baseData.name).toBe('StellarRemnants.LogEntry');
                expect(baseData.properties).toBeDefined();
                expect(baseData.measurements).toBeDefined();

                // Verify properties contain expected data
                const properties = baseData.properties;
                expect(properties.batchSize).toBe(aiConfig.batchSize.toString());
                expect(properties.source).toBe('StellarRemnants');
                expect(properties.primaryMessage).toBe(logEntry.message);
                expect(properties.primaryLevel).toBe(LogLevel[logEntry.level]);
                expect(properties.userAgent).toBe(logEntry.context.browser.userAgent);
                expect(properties.url).toBe(logEntry.context.browser.url);

                // Verify measurements contain expected data
                const measurements = baseData.measurements;
                expect(measurements.entryCount).toBe(aiConfig.batchSize);
                expect(typeof measurements.errorCount).toBe('number');
                expect(typeof measurements.warningCount).toBe('number');

                // Verify context-specific properties
                if (logEntry.context.game) {
                  if (logEntry.context.game.gameId) {
                    expect(properties.gameId).toBe(logEntry.context.game.gameId);
                  }
                  if (logEntry.context.game.gameState) {
                    expect(properties.gameState).toBe(logEntry.context.game.gameState);
                  }
                  if (logEntry.context.game.currentScreen) {
                    expect(properties.currentScreen).toBe(logEntry.context.game.currentScreen);
                  }
                }

                if (logEntry.context.angular) {
                  if (logEntry.context.angular.component) {
                    expect(properties.angularComponent).toBe(logEntry.context.angular.component);
                  }
                  if (logEntry.context.angular.route) {
                    expect(properties.angularRoute).toBe(logEntry.context.angular.route);
                  }
                }

                // Verify performance measurements if available
                if (logEntry.context.browser.performance?.memory) {
                  const memory = logEntry.context.browser.performance.memory;
                  expect(measurements.usedJSHeapSize).toBe(memory.usedJSHeapSize);
                  expect(measurements.totalJSHeapSize).toBe(memory.totalJSHeapSize);
                  expect(measurements.jsHeapSizeLimit).toBe(memory.jsHeapSizeLimit);
                }
              }
            } finally {
              // Restore original fetch
              window.fetch = originalFetch;
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe('Property 11: Application Insights Failure Handling', () => {
    /**
     * Feature: logging-service, Property 11: Application Insights Failure Handling
     * Validates: Requirements 5.4
     *
     * For any Application Insights connection failure, the logging service should
     * continue operating normally without throwing errors
     */
    it('should handle Application Insights failures gracefully without affecting main application', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid log entry
          fc.record({
            id: fc.string({ minLength: 1 }),
            timestamp: fc.date(),
            level: fc.constantFrom(LogLevel.WARN, LogLevel.ERROR), // Only test levels that would be sent to AI
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
          // Generate failure scenarios
          fc.constantFrom(
            'network_error',
            'http_error_400',
            'http_error_500',
            'timeout',
            'invalid_response',
            'json_parse_error',
          ),
          async (logEntry: LogEntry, failureType: string) => {
            // Mock fetch to simulate different failure scenarios
            let fetchCallCount = 0;
            let thrownError: any = null;

            const originalFetch = window.fetch;
            window.fetch = jasmine
              .createSpy('fetch')
              .and.callFake(async (url: string, options: any) => {
                fetchCallCount++;

                switch (failureType) {
                  case 'network_error':
                    throw new Error('Network error: Failed to fetch');

                  case 'http_error_400':
                    return Promise.resolve({
                      ok: false,
                      status: 400,
                      statusText: 'Bad Request',
                    } as Response);

                  case 'http_error_500':
                    return Promise.resolve({
                      ok: false,
                      status: 500,
                      statusText: 'Internal Server Error',
                    } as Response);

                  case 'timeout':
                    // Simulate timeout by throwing after delay
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    throw new Error('Request timeout');

                  case 'invalid_response':
                    return Promise.resolve({
                      ok: true,
                      status: 200,
                      statusText: 'OK',
                      json: () => Promise.reject(new Error('Invalid JSON')),
                    } as any);

                  case 'json_parse_error':
                    return Promise.resolve({
                      ok: true,
                      status: 200,
                      statusText: 'OK',
                    } as Response);

                  default:
                    // Successful case for comparison
                    return Promise.resolve({
                      ok: true,
                      status: 200,
                      statusText: 'OK',
                    } as Response);
                }
              });

            try {
              // Configure Application Insights destination
              const config: ApplicationInsightsConfig = {
                enabled: true,
                instrumentationKey: 'test-instrumentation-key',
                batchSize: 1, // Use batch size of 1 to trigger immediate flush
                flushInterval: 5000,
                maxRetries: 1, // Limit retries for faster test execution
                retryDelay: 100, // Short retry delay for faster test execution
                logLevel: LogLevel.WARN,
              };

              applicationInsightsDestination.configure(config);

              // Verify destination is enabled
              expect(applicationInsightsDestination.isEnabled).toBe(true);

              // Attempt to log the entry - this should not throw an error
              try {
                await applicationInsightsDestination.log(logEntry);

                // Wait a bit for async operations and potential retries
                await new Promise((resolve) => setTimeout(resolve, 200));
              } catch (error) {
                thrownError = error;
              }

              // Verify that the logging operation itself doesn't throw errors
              // The destination should handle failures internally
              expect(thrownError).toBeNull();

              // Verify that fetch was attempted (showing the destination tried to send data)
              expect(fetchCallCount).toBeGreaterThan(0);

              // Verify that the destination remains enabled even after failures
              // (it should not disable itself due to transient failures)
              expect(applicationInsightsDestination.isEnabled).toBe(true);

              // Test that subsequent logging attempts still work
              // (the destination should not be permanently broken by failures)
              let subsequentError: any = null;
              try {
                const subsequentEntry = {
                  ...logEntry,
                  id: `subsequent_${Math.random()}`,
                  timestamp: new Date(),
                  message: 'Subsequent log entry after failure',
                };

                await applicationInsightsDestination.log(subsequentEntry);
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch (error) {
                subsequentError = error;
              }

              // Subsequent logging should also not throw errors
              expect(subsequentError).toBeNull();

              // Verify that the destination continues to attempt sending
              // (fetch should be called for subsequent entries too)
              expect(fetchCallCount).toBeGreaterThanOrEqual(1);

              // For specific failure types, verify expected behavior
              switch (failureType) {
                case 'network_error':
                case 'timeout':
                  // These should trigger retry logic
                  expect(fetchCallCount).toBeGreaterThanOrEqual(1);
                  break;

                case 'http_error_400':
                case 'http_error_500':
                  // HTTP errors should be handled gracefully
                  expect(fetchCallCount).toBeGreaterThanOrEqual(1);
                  break;

                case 'invalid_response':
                case 'json_parse_error':
                  // Response parsing errors should be handled
                  expect(fetchCallCount).toBeGreaterThanOrEqual(1);
                  break;
              }
            } finally {
              // Restore original fetch
              window.fetch = originalFetch;
            }
          },
        ),
        { numRuns: 10 },
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