# Architecture Overview

## Frontend
- Angular 21, standalone components, lazy `loadComponent`
- Zoneless change detection with signals-first state
- Folders: `app/core`, `app/shared`, `app/features`

## State
- Stores in `core/state` using `signal`, `computed`, `effect`
- Components read signals; actions live in stores

## Routing
- `app.routes.ts` defines lazy routes; functional guards in `core/guards`

