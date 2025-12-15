# 0001 — Zoneless Change Detection

## Context
ZoneJS introduces overhead and complexity. Angular 21 supports zoneless change detection with signals.

## Decision
Adopt `provideZonelessChangeDetection()` and remove `zone.js`. Use OnPush everywhere and signals-first state.

## Alternatives
- Keep ZoneJS: simpler in some cases, but heavier and less explicit
- Partial adoption: increases inconsistency and cognitive load

## Consequences
- Fewer implicit updates; explicit notification via signals/markForCheck
- Better performance and predictability
- Requires discipline and guardrails documented in `docs/guardrails.md`

