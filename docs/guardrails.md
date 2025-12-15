# Engineering Guardrails

## Principles
- DRY and YAGNI; avoid speculative abstractions
- No god classes/components; keep modules small and cohesive
- Signals-first; avoid RxJS in app code except interop with libraries
- Zoneless + OnPush everywhere; notify Angular via signals/markForCheck/listeners

## Architecture
- Standalone components, lazy `loadComponent` routes
- Folders:
  - `app/core`: cross-cutting (state stores, guards, config)
  - `app/shared`: reusable UI and utilities
  - `app/features`: feature/page components

## State
- Use `signal`, `computed`, `effect`; isolate logic in stores under `core/state`
- Components read signals in templates; actions live in stores/services

## Change Detection
- `provideZonelessChangeDetection()` in `main.ts`
- All components `ChangeDetectionStrategy.OnPush`
- Replace NgZone observables with `afterNextRender`/`afterEveryRender` when needed

## Testing
- Configure TestBed with `provideZonelessChangeDetection()`
- Prefer interaction-driven tests; avoid `fixture.detectChanges()` unless necessary

## Routing & Guards
- Functional guards; pure and fast
- Lazy load features; keep route files minimal

## Performance
- Avoid global listeners; prefer component-bound listeners
- Keep templates simple; move nontrivial logic to stores

## Error Handling
- Use simple boundary components per feature to present errors
- Do not throw from render paths; signal state and render accordingly

## Code Style
- ESLint + Prettier enforced
- Strong typing; no `any`

