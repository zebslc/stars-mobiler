import * as fc from 'fast-check';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeveloperPanelComponent } from './developer-panel.component';
import { LoggingService } from '../services/logging.service';
import { SettingsService } from '../services/settings.service';
import { LogLevel, LogEntry, LogContext } from '../models/logging.model';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';

describe('DeveloperPanelComponent', () => {
  let component: DeveloperPanelComponent;
  let fixture: ComponentFixture<DeveloperPanelComponent>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSettingsService: any;
  let developerEventsSubject: Subject<LogEntry>;
  let developerModeSignal: any;

  beforeEach(async () => {
    developerEventsSubject = new Subject<LogEntry>();
    developerModeSignal = signal(true);
    
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['log']);
    Object.defineProperty(mockLoggingService, 'developerEvents$', {
      value: developerEventsSubject.asObservable()
    });

    mockSettingsService = {
      developerMode: developerModeSignal
    };

    await TestBed.configureTestingModule({
      imports: [DeveloperPanelComponent],
      providers: [
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeveloperPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Property 9: Developer Panel Error Display', () => {
    /**
     * Feature: logging-service, Property 9: Developer Panel Error Display
     * Validates: Requirements 4.4
     *
     * For any error entry when developer mode is active, the developer panel should display 
     * the error with timestamp, level, message, and metadata
     */
    it('should display error entries with all required information', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          fc.string({ minLength: 1 }),
          fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
          (level: LogLevel, message: string, metadata: Record<string, any> | undefined) => {
            // Create a log entry
            const logEntry: LogEntry = {
              id: `test-${Date.now()}`,
              timestamp: new Date(),
              level,
              message,
              metadata,
              context: {
                browser: {
                  userAgent: 'test-agent',
                  viewport: { width: 1920, height: 1080 },
                  url: 'https://test.com',
                  timestamp: Date.now(),
                }
              }
            };

            // Emit the log entry
            developerEventsSubject.next(logEntry);
            fixture.detectChanges();

            // Verify the entry appears in the component's log entries
            const logEntries = component.logEntries();
            expect(logEntries.length).toBeGreaterThan(0);
            
            const displayedEntry = logEntries[logEntries.length - 1];
            expect(displayedEntry.message).toBe(message);
            expect(displayedEntry.level).toBe(level);
            expect(displayedEntry.timestamp).toEqual(logEntry.timestamp);
            
            if (metadata) {
              expect(displayedEntry.metadata).toEqual(metadata);
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should format timestamps correctly for display', () => {
      fc.assert(
        fc.property(
          fc.date(),
          fc.string({ minLength: 1 }),
          (timestamp: Date, message: string) => {
            const logEntry: LogEntry = {
              id: `test-${Date.now()}`,
              timestamp,
              level: LogLevel.ERROR,
              message,
              context: {
                browser: {
                  userAgent: 'test-agent',
                  viewport: { width: 1920, height: 1080 },
                  url: 'https://test.com',
                  timestamp: Date.now(),
                }
              }
            };

            // Test the formatTimestamp method
            const formattedTime = component.formatTimestamp(timestamp);
            
            // Verify the format is correct (HH:MM:SS.mmm)
            expect(formattedTime).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
            
            // Verify it's a valid time representation
            expect(formattedTime.length).toBe(12); // HH:MM:SS.mmm format
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly identify log level CSS classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
          (level: LogLevel) => {
            const cssClass = component.getLogLevelClass(level);
            
            // Verify correct CSS class mapping
            switch (level) {
              case LogLevel.DEBUG:
                expect(cssClass).toBe('debug');
                break;
              case LogLevel.INFO:
                expect(cssClass).toBe('info');
                break;
              case LogLevel.WARN:
                expect(cssClass).toBe('warn');
                break;
              case LogLevel.ERROR:
                expect(cssClass).toBe('error');
                break;
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Component Rendering', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should be visible when developer mode is enabled', () => {
      // Set developer mode to true
      developerModeSignal.set(true);
      fixture.detectChanges();

      expect(component.isVisible()).toBe(true);
    });

    it('should not be visible when developer mode is disabled', () => {
      // Set developer mode to false
      developerModeSignal.set(false);
      fixture.detectChanges();

      expect(component.isVisible()).toBe(false);
    });

    it('should start collapsed by default', () => {
      expect(component.isExpanded()).toBe(false);
    });

    it('should toggle expanded state when toggle button is clicked', () => {
      const initialState = component.isExpanded();
      component.togglePanel();
      expect(component.isExpanded()).toBe(!initialState);
    });

    it('should clear log entries when clear button is clicked', () => {
      // Add some log entries first
      const logEntry: LogEntry = {
        id: 'test-1',
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'Test error',
        context: {
          browser: {
            userAgent: 'test-agent',
            viewport: { width: 1920, height: 1080 },
            url: 'https://test.com',
            timestamp: Date.now(),
          }
        }
      };

      developerEventsSubject.next(logEntry);
      fixture.detectChanges();

      expect(component.logEntries().length).toBe(1);

      // Clear the logs
      component.clearLogs();
      expect(component.logEntries().length).toBe(0);
    });

    it('should display empty state when no log entries exist', () => {
      expect(component.logEntries().length).toBe(0);
      
      // The component should handle empty state gracefully
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle real-time updates from logging service', () => {
      const logEntry1: LogEntry = {
        id: 'test-1',
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message: 'First error',
        context: {
          browser: {
            userAgent: 'test-agent',
            viewport: { width: 1920, height: 1080 },
            url: 'https://test.com',
            timestamp: Date.now(),
          }
        }
      };

      const logEntry2: LogEntry = {
        id: 'test-2',
        timestamp: new Date(),
        level: LogLevel.WARN,
        message: 'Second warning',
        context: {
          browser: {
            userAgent: 'test-agent',
            viewport: { width: 1920, height: 1080 },
            url: 'https://test.com',
            timestamp: Date.now(),
          }
        }
      };

      // Emit first entry
      developerEventsSubject.next(logEntry1);
      fixture.detectChanges();
      expect(component.logEntries().length).toBe(1);
      expect(component.logEntries()[0].message).toBe('First error');

      // Emit second entry
      developerEventsSubject.next(logEntry2);
      fixture.detectChanges();
      expect(component.logEntries().length).toBe(2);
      expect(component.logEntries()[1].message).toBe('Second warning');
    });

    it('should limit log entries to prevent memory issues', () => {
      // Add more than 100 entries to test the limit
      for (let i = 0; i < 105; i++) {
        const logEntry: LogEntry = {
          id: `test-${i}`,
          timestamp: new Date(),
          level: LogLevel.INFO,
          message: `Message ${i}`,
          context: {
            browser: {
              userAgent: 'test-agent',
              viewport: { width: 1920, height: 1080 },
              url: 'https://test.com',
              timestamp: Date.now(),
            }
          }
        };
        developerEventsSubject.next(logEntry);
      }

      fixture.detectChanges();

      // Should be limited to 100 entries
      expect(component.logEntries().length).toBe(100);
      
      // Should keep the most recent entries
      const entries = component.logEntries();
      expect(entries[0].message).toBe('Message 5'); // First kept entry
      expect(entries[99].message).toBe('Message 104'); // Last entry
    });
  });
});