---
inclusion: always
---

# Testing Standards for Stellar Remnants

## Quick Reference for Agents

This document provides essential testing guidelines for AI agents working on the Stellar Remnants project. For complete details, see `docs/testing-guidelines.md`.

## Service Testing - Fast & Simple

### ✅ DO: Direct Instantiation
```typescript
beforeEach(() => {
  service = new LoggingService(); // Fast, direct
});
```

### ❌ DON'T: Unnecessary TestBed
```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [LoggingService] // Slow, unnecessary overhead
  });
  service = TestBed.inject(LoggingService);
});
```

### ✅ DO: Mock Dependencies with Jasmine
```typescript
beforeEach(() => {
  mockEconomyService = jasmine.createSpyObj('EconomyService', ['spend', 'calculate']);
  mockEconomyService.spend.and.returnValue(true);
  service = new ColonyService(mockEconomyService);
});
```

## Critical Rule: NEVER Use provideZonelessChangeDetection in Tests

```typescript
// ❌ NEVER DO THIS
TestBed.configureTestingModule({
  providers: [
    provideZonelessChangeDetection(), // Adds overhead with zero benefit
    MyService
  ]
});

// ✅ DO THIS INSTEAD
service = new MyService(); // Direct instantiation
```

## Property-Based Testing with fast-check

### ✅ DO: Suite-Level Mocking
```typescript
let consoleLogSpy: jasmine.Spy;

beforeEach(() => {
  consoleLogSpy = spyOn(console, 'log');
});

afterEach(() => {
  consoleLogSpy.calls.reset();
});

it('should log messages', () => {
  fc.assert(
    fc.property(fc.string(), (message) => {
      consoleLogSpy.calls.reset();
      service.log(message);
      expect(consoleLogSpy).toHaveBeenCalled();
    })
  );
});
```

### ❌ DON'T: Mock Inside Property Test Loops
```typescript
it('should log messages', () => {
  fc.assert(
    fc.property(fc.string(), (message) => {
      const originalLog = console.log; // Slow, creates closures
      let callCount = 0;
      console.log = () => callCount++;
      
      service.log(message);
      
      console.log = originalLog;
      expect(callCount).toBeGreaterThan(0);
    })
  );
});
```

## Test Behavior, Not Implementation

### ✅ DO: Test Observable Behavior
```typescript
let capturedEntry: LogEntry | null = null;
const subscription = service.developerEvents$.subscribe((entry: LogEntry) => {
  capturedEntry = entry;
});

try {
  service.log(testData);
  expect(capturedEntry).not.toBeNull();
} finally {
  subscription.unsubscribe();
}
```

### ❌ DON'T: Spy on Private Methods
```typescript
const originalRouteToDestinations = (service as any).routeToDestinations;
(service as any).routeToDestinations = (entry: LogEntry) => {
  capturedEntry = entry; // Brittle, breaks on refactoring
  originalRouteToDestinations.call(service, entry);
};
```

## Property-Based Test Configuration

### Optimal numRuns Values
- **Simple logic**: 10 runs
- **Complex logic with edge cases**: 20 runs  
- **Mission-critical algorithms**: 50+ runs

### Always Type Callback Parameters
```typescript
// ✅ DO: Explicit typing
fc.property(fc.string(), (message: string) => {
  // TypeScript knows message is string
});

// ❌ DON'T: Let TypeScript infer
fc.property(fc.string(), (message) => {
  // TypeScript may infer 'never' or 'unknown'
});
```

## Avoid Fragile Assertions

### ❌ DON'T: Test Implementation Details
```typescript
expect(entry.id).toMatch(/^log_\d+_[a-z0-9]+$/); // Breaks when ID format changes
expect(Date.now() - startTime).toBeLessThan(100); // Fails on slow CI/CD
expect(entry.context.sourceContext.stack).toContain('component.ts:42'); // Varies by environment
```

### ✅ DO: Test Requirements Only
```typescript
expect(entry.id).toBeDefined();
expect(typeof entry.id).toBe('string');
expect(entry.id.length).toBeGreaterThan(0);
expect(entry.timestamp instanceof Date).toBe(true);
expect(entry.context.sourceContext).toBeDefined();
```

## Cleanup and Performance

### Always Clean Up
```typescript
let consoleLogSpy: jasmine.Spy;

beforeEach(() => {
  consoleLogSpy = spyOn(console, 'log');
});

afterEach(() => {
  consoleLogSpy.calls.reset(); // Prevent test pollution
});
```

### Unsubscribe from Observables
```typescript
const subscription = service.events$.subscribe(handler);

try {
  // Test logic
} finally {
  subscription.unsubscribe(); // Prevent memory leaks
}
```

## Performance Targets

Your tests should meet these benchmarks:
- **Individual unit test**: < 50ms
- **Property-based test (10 runs)**: < 200ms
- **Service test suite**: < 1 second
- **Component test suite**: < 3 seconds

If tests are slower, check for:
- Unnecessary TestBed usage
- Missing spy cleanup
- Too many property test iterations
- Heavy setup/teardown logic

## Property-Based Test Tags

Use this exact format for property test comments:
```typescript
/**
 * Feature: logging-service, Property 1: Structured Log Data Acceptance
 * Validates: Requirements 1.2
 * 
 * For any valid log message with level, timestamp, and metadata, 
 * the Logging_Service should accept and process the log entry without errors
 */
```

## When to Use TestBed

Only use TestBed when you need:
- Service with constructor dependencies that need mocking
- Service using Angular injection tokens  
- Testing Angular-specific behavior (routes, guards, interceptors)
- Component testing (components require Angular's rendering system)

## Quick Checklist

Before committing tests, verify:
- [ ] No TestBed for services with no dependencies
- [ ] No `provideZonelessChangeDetection()` anywhere
- [ ] Console/globals mocked at suite level
- [ ] No private method spying
- [ ] No regex assertions on IDs or internal formats
- [ ] No time-based assertions
- [ ] All observables unsubscribed
- [ ] All spies cleaned up in `afterEach`
- [ ] Property tests use appropriate `numRuns`
- [ ] Type annotations on all subscription callbacks
- [ ] Tests run in < 50ms each

## Example Files

Reference these for proper patterns:
- `src/app/services/logging.service.spec.ts` - Fast service testing
- `src/app/models/logging.model.spec.ts` - Property-based testing
- `src/app/services/destinations/destinations.spec.ts` - Multi-destination testing