# Testing Guidelines

## Overview

This document defines testing standards and best practices for the Stars Mobile project. Following these guidelines ensures tests are fast, reliable, maintainable, and provide genuine value.

## Core Principles

1. **Fast Execution** - Tests should run in milliseconds, not seconds
2. **No Brittleness** - Tests should not break when refactoring internal implementation
3. **Test Behavior, Not Implementation** - Focus on observable outcomes, not internal details
4. **Proper Isolation** - Tests should be independent and properly cleaned up
5. **Minimal Setup Overhead** - Use the lightest-weight setup that works

## Service Testing

### Direct Instantiation Over TestBed

**Rule**: Use direct instantiation for services with `providedIn: 'root'` and no dependencies.

**Bad** (Slow, unnecessary overhead):
```typescript
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [LoggingService]
  });
  service = TestBed.inject(LoggingService);
});
```

**Good** (Fast, direct):
```typescript
beforeEach(() => {
  service = new LoggingService();
});
```

**When to use TestBed**:
- Service has constructor dependencies that need mocking
- Service uses Angular injection tokens
- Testing Angular-specific behavior (routes, guards, interceptors)

### Mocking Dependencies

Use Jasmine spies for dependencies:

```typescript
beforeEach(() => {
  mockEconomyService = jasmine.createSpyObj('EconomyService', ['spend', 'calculate']);
  mockEconomyService.spend.and.returnValue(true);

  service = new ColonyService(mockEconomyService);
});
```

### Never Use provideZonelessChangeDetection in Tests

**Rule**: NEVER include `provideZonelessChangeDetection()` in test setup.

Tests run outside Angular's change detection system. This provider adds overhead with zero benefit.

**Bad**:
```typescript
TestBed.configureTestingModule({
  providers: [
    provideZonelessChangeDetection(), // ❌ Unnecessary
    MyService
  ]
});
```

**Good**:
```typescript
// Just instantiate directly
service = new MyService();
```

## Console and Global Mocking

### Suite-Level Mocking

**Rule**: Mock console and global objects at the suite level in `beforeEach`, not inside test iterations.

**Bad** (Slow, creates closures in every iteration):
```typescript
it('should log messages', () => {
  fc.assert(
    fc.property(fc.string(), (message) => {
      const originalLog = console.log;
      let callCount = 0;
      console.log = () => callCount++;

      service.log(message);

      console.log = originalLog;
      expect(callCount).toBeGreaterThan(0);
    })
  );
});
```

**Good** (Fast, single spy instance):
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

## Test Observable Behavior, Not Internals

### Avoid Private Method Spying

**Rule**: Never spy on private methods. Test public API and observable outputs.

**Bad** (Brittle, breaks on refactoring):
```typescript
const originalRouteToDestinations = (service as any).routeToDestinations;
(service as any).routeToDestinations = (entry: LogEntry) => {
  capturedEntry = entry;
  originalRouteToDestinations.call(service, entry);
};
```

**Good** (Robust, tests actual behavior):
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

### Test Public Contracts

Focus on:
- Public method inputs and outputs
- Observable emissions
- Side effects (console output, HTTP calls)
- State changes visible through public API

Avoid:
- Private method behavior
- Internal data structure details
- Implementation-specific logic paths

## Avoid Fragile Assertions

### No Implementation-Coupled Assertions

**Bad** (Breaks when ID format changes):
```typescript
expect(entry.id).toMatch(/^log_\d+_[a-z0-9]+$/);
```

**Good** (Tests requirements only):
```typescript
expect(entry.id).toBeDefined();
expect(typeof entry.id).toBe('string');
expect(entry.id.length).toBeGreaterThan(0);
```

### No Time-Based Assertions

**Bad** (Fails on slow CI/CD):
```typescript
expect(entry.timestamp.getTime()).toBeGreaterThan(Date.now() - 10000);
```

**Good** (Tests validity only):
```typescript
expect(entry.timestamp instanceof Date).toBe(true);
expect(entry.timestamp.getTime()).toBeGreaterThan(0);
```

### No Fragile Stack Trace Assertions

**Bad** (Varies by environment):
```typescript
expect(entry.context.sourceContext.stack).toContain('ship-designer.component.ts:42');
```

**Good** (Tests presence only):
```typescript
expect(entry.context.sourceContext).toBeDefined();
```

## Property-Based Testing

### Optimize Test Runs

**Rule**: Use the minimum `numRuns` that provides adequate coverage.

- **Simple logic**: 10 runs
- **Complex logic with edge cases**: 20 runs
- **Mission-critical algorithms**: 50+ runs

**Example**:
```typescript
fc.assert(
  fc.property(
    fc.constantFrom(LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR),
    fc.string({ minLength: 1 }),
    (level, message) => {
      // Test logic
    }
  ),
  { numRuns: 10 } // Reduced from 20 for faster execution
);
```

### Type Annotations in Callbacks

**Rule**: Always explicitly type property test callback parameters to avoid TypeScript inference issues.

**Bad**:
```typescript
const subscription = service.events$.subscribe((entry) => {
  capturedEntry = entry; // TypeScript may infer 'never'
});
```

**Good**:
```typescript
const subscription = service.events$.subscribe((entry: LogEntry) => {
  capturedEntry = entry; // Explicit type
});
```

## Component Testing

### Use TestBed for Components

Components require Angular's rendering system, so TestBed is necessary:

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent] // Standalone component
  }).compileComponents();

  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

### Minimize detectChanges Calls

Call `fixture.detectChanges()` only when needed:
- After setup in `beforeEach`
- After modifying inputs
- When testing change detection explicitly

Avoid calling it unnecessarily inside test iterations.

## Cleanup and Isolation

### Always Clean Up

**Rule**: Use `afterEach` to clean up shared state.

```typescript
let consoleLogSpy: jasmine.Spy;

beforeEach(() => {
  consoleLogSpy = spyOn(console, 'log');
});

afterEach(() => {
  consoleLogSpy.calls.reset();
});
```

### Unsubscribe from Observables

**Rule**: Always unsubscribe in `finally` blocks to prevent memory leaks.

```typescript
const subscription = service.events$.subscribe(handler);

try {
  // Test logic
} finally {
  subscription.unsubscribe();
}
```

## Test Organization

### Describe Blocks

Use nested `describe` blocks to organize tests by feature:

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => { });
    it('should handle edge case', () => { });
    it('should throw on invalid input', () => { });
  });

  describe('Property N: Feature Name', () => {
    // Property-based tests
  });
});
```

### Test Naming

Use descriptive test names that explain the scenario:

**Bad**:
```typescript
it('works', () => { });
it('test 1', () => { });
```

**Good**:
```typescript
it('should filter messages below configured log level', () => { });
it('should generate unique IDs for concurrent entries', () => { });
it('should throw error when creating fleet exceeds 512 limit', () => { });
```

## TypeScript Configuration

### Jasmine Type Definitions

**Rule**: Never manually declare Jasmine globals.

If you see TypeScript errors for `describe`, `it`, `expect`, etc., fix your TypeScript configuration instead:

**Bad**:
```typescript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
```

**Good**:
```json
// tsconfig.spec.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jasmine", "node"]
  }
}
```

## Common Anti-Patterns to Avoid

### ❌ TestBed for Simple Services
```typescript
// Don't do this for services with no dependencies
TestBed.configureTestingModule({ providers: [SimpleService] });
service = TestBed.inject(SimpleService);
```

### ❌ Spying on Private Methods
```typescript
// Don't spy on internals
(service as any).privateMethod = jasmine.createSpy();
```

### ❌ Testing Implementation Details
```typescript
// Don't test HOW, test WHAT
expect(service['internalCache'].size).toBe(5);
```

### ❌ Time-Based Assertions
```typescript
// Don't depend on timing
expect(Date.now() - startTime).toBeLessThan(100);
```

### ❌ Regex Coupling to Format
```typescript
// Don't couple to implementation format
expect(id).toMatch(/^specific-format-\d+$/);
```

### ❌ Manual Console Mocking in Loops
```typescript
// Don't recreate mocks in iterations
fc.property(() => {
  const original = console.log;
  console.log = () => {};
  // ...
  console.log = original;
});
```

## Performance Benchmarks

Target execution times:
- **Service test suite**: < 1 second
- **Component test suite**: < 3 seconds
- **Individual unit test**: < 50ms
- **Property-based test (10 runs)**: < 200ms

If tests exceed these targets, review for:
- Unnecessary TestBed usage
- Missing spy cleanup
- Excessive `detectChanges()` calls
- Too many property test iterations
- Heavy setup/teardown logic

## Test Quality Checklist

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
- [ ] No manual Jasmine type declarations

## Examples

See these test files for reference implementations:
- `src/app/services/logging.service.spec.ts` - Fast service testing with observables
- `src/app/models/logging.model.spec.ts` - Property-based testing

## Questions?

When in doubt:
1. Test behavior, not implementation
2. Use the simplest setup that works
3. Optimize for speed and maintainability
4. Make tests readable and clear about intent
