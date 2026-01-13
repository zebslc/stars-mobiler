# Stars Mobile Game

A space strategy game built with Angular and Ionic.

## Engineering Standards

Follow the engineering guardrails defined in @docs/guardrails.md

Key principles:
- Signals-first architecture with zoneless change detection
- OnPush change detection strategy everywhere
- Standalone components with lazy loading
- DRY and YAGNI - avoid speculative abstractions
- Strong typing - no `any`

## Project Documentation

- **Specifications**: @docs/specs/ - Feature and project specifications (source of truth)
- **Architecture Decision Records**: @docs/adr/ - Key architectural decisions and trade-offs
- **Guardrails**: @docs/guardrails.md - Formal engineering conventions
- **Testing Guidelines**: @docs/testing-guidelines.md - Comprehensive testing standards and best practices

## Architecture Overview

- `app/core`: Cross-cutting concerns (state stores, guards, config)
- `app/shared`: Reusable UI components and utilities
- `app/features`: Feature/page components

## State Management

- Use signals (`signal`, `computed`, `effect`) for all state
- Isolate logic in stores under `core/state`
- Components read signals in templates
- Actions and business logic live in stores/services

## Development Commands

```bash
# Development server
npm start

# Build
npm run build

# Tests
npm test

# Linting
npm run lint
```
