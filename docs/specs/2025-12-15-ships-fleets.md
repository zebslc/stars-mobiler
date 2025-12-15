# Stellar Remnants — Ships & Fleets (Phase 3)

## Problem Statement
Enable fleet modeling, movement, fuel consumption, fleet UI, and colonization flow grounded in the ship designer outputs.

## Scope
- In scope: Fleet model (stacks, cargo, orders), movement rules, fuel computation, range circles UI, colonization rules.
- Out of scope: Combat resolution and AI; stargates/post-MVP logistics.

## Requirements
- Functional:
  - Fleet speed = slowest ship; totalMass includes cargo; totalFuel sums capacity; efficiency chosen from best valid design.
  - Fuel cost per light-year: `fuelCost = mass * efficiency / 1000 * (warp/5)^2`, Ramscoop `efficiency=0` is free.
  - Range visualization: green (round-trip), yellow (one-way), red (out of range).
  - Colonization requires Colony Module, positive habitability, consumes colony ship, sets initial population 25,000.
  - Orders: move, colonize, attack (stub), load/unload, patrol.
- Nonfunctional:
  - Movement processed after mining in turn order; UI updates via signals; avoid blocking calculations.

## Acceptance Criteria
- Given a fleet mixed of ship stacks, when calculating movement, then speed, mass, fuel, efficiency follow the spec.
- Given selected fleet, when on the map, then range circles render and change with fuel updates.
- Given destination within one-way range but not round-trip, when issuing move, then UI warns and allows if confirmed.
- Given a colonize order and a valid planet, when turn processes, then the colony ship disappears and a new colony with 25,000 population is created.

## UX Outline
- Fleet Detail: composition list, stats (strength stub), fuel bar, orders list and editor.
- Map: route rendering for active move orders, range circles overlay.

## Data Contracts
- Fleet, ShipStack, FleetOrder types; compiled design map for movement calculations.
- Colonization effects on GameState: planet ownerId, population, logs.

## Open Questions
- Fuel efficiency normalization and UI-friendly tuning.
- Patrol behavior specifics (waypoints and timing).

