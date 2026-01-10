# Engineering Guardrails

## Principles
- DRY and YAGNI; avoid speculative abstractions
- No god classes/components; keep modules small and cohesive
- Signals-first; avoid RxJS in app code except interop with libraries
- Zoneless + OnPush everywhere; notify Angular via signals/markForCheck/listeners

## Architecture
- Standalone components, lazy `loadComponent` routes
- Folders:
  - `app/core`: cross-cutting (state stores, guards, config, commands)
  - `app/shared`: reusable UI and utilities
  - `app/features`: feature/page components

## State Management
- Use `signal`, `computed`, `effect`; isolate logic in stores under `core/state`
- Components read signals in templates; actions live in stores/services
- **Command Pattern**: Use for complex state operations that involve multiple services
  - Commands encapsulate single operations with clear input/output
  - CommandExecutorService manages state transitions
  - CommandFactoryService handles dependency injection
  - Prefer commands for operations that may need undo/redo, logging, or validation

## Command Pattern Guidelines
- **When to use commands:**
  - Operations involving multiple services or complex state changes
  - Actions that may need auditing, undo/redo, or queuing
  - Complex business operations with clear boundaries
- **When NOT to use commands:**
  - Simple read operations or computed values
  - Single-service operations with no side effects
  - UI state changes (use signals directly)
- **Command structure:**
  - Implement `GameCommand` or `GameCommandWithResult<T>`
  - Keep commands focused on single responsibility
  - Use CommandFactoryService for creating command instances
  - Commands should be pure functions of game state

## Change Detection
- `provideZonelessChangeDetection()` in `main.ts`
- All components `ChangeDetectionStrategy.OnPush`
- Replace NgZone observables with `afterNextRender`/`afterEveryRender` when needed

## Testing
- Configure TestBed with `provideZonelessChangeDetection()`
- Prefer interaction-driven tests; avoid `fixture.detectChanges()` unless necessary
- **Command testing**: Test commands in isolation with mock services
- Test command execution through CommandExecutorService for integration tests

## Routing & Guards
- Functional guards; pure and fast
- Lazy load features; keep route files minimal

## Performance
- Avoid global listeners; prefer component-bound listeners
- Keep templates simple; move nontrivial logic to stores
- Commands should be lightweight objects; avoid heavy computation in constructors

## Error Handling
- Use simple boundary components per feature to present errors
- Do not throw from render paths; signal state and render accordingly
- Commands should handle errors gracefully and return valid game state

## Code Style
- ESLint + Prettier enforced
- Strong typing; no `any`
- Commands should not be marked `@Injectable` (they're data objects, not services)

