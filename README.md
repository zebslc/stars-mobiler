# Stars Mobiler — Angular 21 Zoneless Scaffold

## Goals
- Zoneless change detection with `provideZonelessChangeDetection`
- Signals-first state management, no RxJS in app code
- DRY, YAGNI, no god classes/components
- Standalone components and route-level code splitting

## Structure
- `src/app/core`: cross-cutting concerns (state, guards, config)
- `src/app/shared`: reusable UI and utilities
- `src/app/features`: feature- or page-level components

## Conventions
- Prefer `signal`, `computed`, `effect` over RxJS
- All components use `ChangeDetectionStrategy.OnPush`
- Keep components small; extract logic into stores/services
- Avoid unnecessary abstractions until needed

## Run
- `npm install`
- `npm start`

## Documentation
- Specs: `docs/specs/` (use `_template.md`)
- Guardrails: `docs/guardrails.md`
- ADRs: `docs/adr/`
- Contributing: `CONTRIBUTING.md`
- Architecture: `ARCHITECTURE.md`
