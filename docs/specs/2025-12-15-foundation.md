# Stellar Remnants — Foundation (Phase 1)

## Problem Statement
Create the minimal playable foundation: deterministic galaxy, planet model with habitability, initial game state, and a basic map UI suitable for mobile-first Angular.

## Scope
- In scope: Galaxy generation (Small/Medium/Large), planet habitability (temperature/atmosphere), species selection (4 presets), initial game state, display-only galaxy map.
- Out of scope: Economy processing, fleets, combat, AI, build queues (covered in later specs).

## Requirements
- Functional:
  - Generate galaxy with Poisson-disc-like distribution in 1000×1000 space, with 1–4 planets per star.
  - Start positions: player and one AI at opposite ends; each has a 100% habitable homeworld and 2–3 nearby stars.
  - Habitability calculation per species on 2-axis plane (temperature, atmosphere) with tolerance radius; negative values mean uninhabitable.
  - Species presets: Terrans, Crystallids, Pyreans, Voidborn with defined habitat/traits.
  - Basic map UI shows stars, ownership, colonizable indicator, and an End Turn button (disabled in Phase 1).
- Nonfunctional:
  - Deterministic generation with a seed; reproducible via settings.
  - Signals-first state representation; no RxJS for core state.

## Acceptance Criteria
- Given a seed and size, when starting a new game, then the map renders with the correct number of stars and 1–4 planets per star.
- Given the player’s species, when viewing any planet, then habitability displays as a percentage or negative value consistent with the formula.
- Given a new game start, when inspecting starting positions, then player and AI homeworlds are 100% habitability and positioned at opposite ends with 2–3 colonizable nearby stars.
- Given the map screen, when tapping End Turn, then nothing processes in Phase 1 and the UI remains stable.

## UX Outline
- Screens:
  - Galaxy Map (primary): shows star field, ownership markers, colonizable indicator, simple resource bar placeholder, and End Turn button.
  - New Game: seed and size selection, species selection (4 presets).
- Navigation:
  - Menu → New Game → Galaxy Map.

## Data Contracts
- GameSettings: `galaxySize`, `aiCount=1`, `aiDifficulty`, `seed`.
- GameState: id, seed, turn, settings, stars[], humanPlayer, aiPlayers[1], fleets[] (empty), logs[] (empty).
- Star: id, name, position{x,y}, planets[].
- Planet: environment, resources, development fields with initial null owner.
- Species: id, name, habitat (idealTemperature, idealAtmosphere, toleranceRadius), traits.

## Open Questions
- Planet naming style and localization needs.
- Map coordinate scaling for different device DPIs.

