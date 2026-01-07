# Stellar Remnants — UI Screens (Phase 5)

## Problem Statement
Deliver cohesive screen flow and UI components for Galaxy Map, Planet Detail, Fleet Detail, Ship Designer, and Turn Summary aligned to mobile-first constraints.

## Scope
- In scope: Screen layouts, core components, navigation flow, turn summary presentation, basic theming.
- Out of scope: Advanced animations or battle replay.

## Requirements
- Functional:
  - Galaxy Map: star markers (ownership, colonizable, enemy), resource bar, End Turn button; overlays for transfer range, fleet routes, range circles.
  - Planet Detail: habitability, population, production, minerals/concentration, build queue management, governor selector.
  - Fleet Detail: composition, stats, fuel/range, orders list and edit.
  - Ship Designer: integrates existing prototype; can add designs to player’s list.
  - Turn Summary: economy, research, ships, combat, alerts sections.
- Nonfunctional:
  - Responsive layout; fast tap targets; avoid dense tables; prefer cards and bars.
  - Signal-driven view updates; OnPush everywhere.

## Acceptance Criteria
- Given a new game, when navigating between screens, then all screens render and display correct computed values without manual refresh.
- Given End Turn, when processing completes, then Turn Summary shows accurate economy/research/combat/alerts and continues back to map.
- Given a planet with governor active, when viewing Planet Detail, then the queue reflects auto-scheduled items.

## UX Outline
- Screen Flow matches the GDD diagram; tabs for Tech/Economy/Military actions; modal for Battle Forecast; consistent back navigation.

## Data Contracts
- Screen inputs derive from GameState selectors in the signals-based GameStateService.

## Open Questions
- Minimal color palette and icon set; accessibility tweaks for color-blindness.

