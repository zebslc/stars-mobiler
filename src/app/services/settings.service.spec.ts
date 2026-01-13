import * as fc from 'fast-check';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    // Direct instantiation - much faster than TestBed
    service = new SettingsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Property 7: Developer Mode Signal Behavior', () => {
    /**
     * Feature: logging-service, Property 7: Developer Mode Signal Behavior
     * Validates: Requirements 3.1
     *
     * For any boolean value, the Settings_Service developer mode signal 
     * should accept the value and maintain it correctly
     */
    it('should accept and maintain any boolean value for developer mode', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (enabled: boolean) => {
            // Reset to initial state for each test run
            service.toggleDeveloperMode(false);
            expect(service.developerMode()).toBe(false);

            // Toggle developer mode
            service.toggleDeveloperMode(enabled);

            // Verify the signal reflects the new value
            expect(service.developerMode()).toBe(enabled);

            // Test that the signal is reactive (can be read multiple times)
            expect(service.developerMode()).toBe(enabled);
            expect(service.developerMode()).toBe(enabled);
          },
        ),
        { numRuns: 10 }
      );
    });

    it('should handle multiple toggles correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (toggleSequence: boolean[]) => {
            // Reset to known state for each test run
            service.toggleDeveloperMode(false);
            expect(service.developerMode()).toBe(false);

            // Apply each toggle in sequence
            let expectedValue = false;
            toggleSequence.forEach((value) => {
              service.toggleDeveloperMode(value);
              expectedValue = value;
              
              // Verify signal reflects current value
              expect(service.developerMode()).toBe(expectedValue);
            });

            // Final verification
            expect(service.developerMode()).toBe(expectedValue);
          },
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 8: Settings Persistence', () => {
    /**
     * Feature: logging-service, Property 8: Settings Persistence
     * Validates: Requirements 3.3
     *
     * For any developer mode toggle operation, the Settings_Service 
     * should update its internal state to reflect the new value
     */
    it('should update internal state for any toggle operation', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (newValue: boolean) => {
            // Capture initial state
            const initialValue = service.developerMode();

            // Perform toggle operation
            service.toggleDeveloperMode(newValue);

            // Verify internal state was updated
            expect(service.developerMode()).toBe(newValue);
            
            // Verify state change occurred (if values are different)
            if (initialValue !== newValue) {
              expect(service.developerMode()).not.toBe(initialValue);
            }

            // Verify state persistence (signal maintains value)
            const persistedValue = service.developerMode();
            expect(persistedValue).toBe(newValue);
            
            // Multiple reads should return same value
            expect(service.developerMode()).toBe(persistedValue);
          },
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain state consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }),
          (operations: boolean[]) => {
            // Track expected state through operations
            let expectedState = false; // Initial state

            operations.forEach((value, index) => {
              // Perform operation
              service.toggleDeveloperMode(value);
              expectedState = value;

              // Verify state consistency
              expect(service.developerMode()).toBe(expectedState);

              // Verify state is maintained between operations
              if (index < operations.length - 1) {
                // Read state multiple times to ensure consistency
                const state1 = service.developerMode();
                const state2 = service.developerMode();
                expect(state1).toBe(state2);
                expect(state1).toBe(expectedState);
              }
            });

            // Final state verification
            expect(service.developerMode()).toBe(expectedState);
          },
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Integration with existing settings patterns', () => {
    it('should follow the same pattern as other boolean settings', () => {
      // Verify developer mode follows same pattern as other boolean signals
      expect(typeof service.developerMode).toBe('function');
      expect(typeof service.toggleDeveloperMode).toBe('function');
      
      // Test that it behaves like other boolean settings
      const initialValue = service.developerMode();
      expect(typeof initialValue).toBe('boolean');
      
      // Test toggle behavior matches other settings
      service.toggleDeveloperMode(true);
      expect(service.developerMode()).toBe(true);
      
      service.toggleDeveloperMode(false);
      expect(service.developerMode()).toBe(false);
    });

    it('should not interfere with other settings', () => {
      // Capture initial states of other settings
      const initialMapControls = service.showMapControls();
      const initialScannerRanges = service.showScannerRanges();
      
      // Toggle developer mode
      service.toggleDeveloperMode(true);
      
      // Verify other settings are unchanged
      expect(service.showMapControls()).toBe(initialMapControls);
      expect(service.showScannerRanges()).toBe(initialScannerRanges);
      
      // Toggle developer mode back
      service.toggleDeveloperMode(false);
      
      // Verify other settings are still unchanged
      expect(service.showMapControls()).toBe(initialMapControls);
      expect(service.showScannerRanges()).toBe(initialScannerRanges);
    });
  });
});