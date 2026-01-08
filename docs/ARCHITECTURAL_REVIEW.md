# Architectural and Code Quality Review: Stars Mobiler

## 1. Code Quality Analysis

### 1.1 "God Classes" and SRP Violations

*   **`GameStateService` (Facade / God Service)**
    *   **Observation**: This service imports almost every other service and orchestrates the entire game state. While it acts as a central store (good for Signal architecture), it contains significant business logic in `newGame()` (lines 49-242), including manual player creation, planet setup, and initial fleet generation.
    *   **Violation**: Single Responsibility Principle (SRP). It mixes state management with game initialization logic.
    *   **Impact**: Hard to test `newGame` logic in isolation; the file will grow indefinitely as more initialization steps are added.

*   **`ColonyService` (Mixed Concerns)**
    *   **Observation**: Handles build queue processing but also manages fleet creation, naming logic, and starbase recycling (lines 53-95, 210-310).
    *   **Violation**: SRP. `ColonyService` should focus on planetary development. Fleet management belongs in `FleetService` or `ShipyardService`.
    *   **Impact**: High coupling between Colony and Fleet domains. Logic for "finding a fleet to join" is buried in `ColonyService`.

*   **`PlanetDetailComponent` (UI God Component)**
    *   **Observation**: Contains massive computed signal `shipOptions` (lines 366-460) that calculates ship stats, costs, and affordability.
    *   **Violation**: Separation of Concerns. UI components should not perform heavy business logic or data transformation.
    *   **Impact**: This logic is not reusable in other screens (e.g., `ShipDesignOverview` or `Shipyard`).

*   **`GalaxyMapComponent` (Complex UI)**
    *   **Observation**: Handles low-level SVG interactions, touch gestures, context menus, and game state derivation.
    *   **Status**: Borderline. It delegates well to `GalaxyMapStateService`, but the template is very large and complex.

### 1.2 Inconsistent Implementations & Duplication

*   **Build Costs (Critical Duplication)**
    *   **Issue**: Building costs are defined in at least three places:
        1.  `src/app/data/costs.data.ts` (The correct source, but unused).
        2.  `src/app/screens/planet-detail/planet-detail.component.ts` (Hardcoded in `queue()` method).
        3.  `src/app/services/colony.service.ts` (Hardcoded in `processGovernors` and implied in `processBuildQueues`).
    *   **Risk**: Changing a cost requires editing multiple files. Inconsistency is almost guaranteed.

*   **Magic Strings & Values**
    *   **Issue**: `GameStateService` uses hardcoded strings like "Human", "AI", "Space Station".
    *   **Issue**: `ColonyService` has magic numbers for colonization (giving colonists for free, line 308).

### 1.3 Deprecated/Poor Practices

*   **State Mutation in Services**:
    *   `ColonyService` mutates the `game` object deeply (e.g., `planet.resources -= ...`) and then returns a shallow copy of the root.
    *   **Recommendation**: While acceptable for performance in deep trees, it requires strict discipline to ensure the top-level reference is updated to trigger Signals. A more robust immutable pattern (e.g., Immer or helper utilities) is safer.

*   **Infinite Colonists Bug**:
    *   In `ColonyService`, when a colony ship is built, colonists are added to the cargo (`fleet.cargo.colonists += colCap`) without being deducted from the planet's population. This creates free population.

*   **Type Safety (`any` usage)**:
    *   **Observation**: Frequent use of `as any` to bypass strict union checks, particularly with `Fleet.location`.
    *   **Example**: `(f.location as any).planetId` in `galaxy-map.component.ts`.
    *   **Recommendation**: Use type guards (e.g., `isOrbitLocation(loc)`) instead of casting to `any`.

*   **Routing Subscriptions**:
    *   **Observation**: Components subscribe to `route.paramMap` or `queryParams` in `constructor`/`ngOnInit`.
    *   **Recommendation**: Use Angular's `withComponentInputBinding` and input signals, or `toSignal(route.params)` for a more reactive approach.

## 2. Architectural Assessment

### 2.1 Component/Service Boundaries
*   **Strengths**: The project has a clear separation of `data`, `models`, `services`, and `screens`. The "signals-first" approach is consistently applied with `OnPush` change detection.
*   **Weaknesses**: The `ColonyService` <-> `FleetService` boundary is blurred. The `GameStateService` acts as a bottleneck.

### 2.2 Reuse Patterns
*   **Missed Opportunity**: Ship stat compilation and cost calculation logic in `PlanetDetailComponent` is highly reusable but currently locked in the component. It should be in `ShipyardService`.
*   **Good Practice**: `GalaxyMap` uses specific services (`GalaxyMapStateService`) to manage its complex local state, keeping the component cleaner.

### 2.3 Architectural Guardrails
*   **Adherence**: The project strictly follows the "Zoneless" approach with Signals. No `Zone.js` violations found.
*   **Data Flow**: Unidirectional data flow (Service -> Signal -> Component) is generally respected, except for the logic leaks mentioned above.

## 3. Improvement Recommendations

### 3.1 High Priority Refactoring

1.  **Centralize Build Costs** (COMPLETED):
    *   **Action**: Update `ColonyService` and `PlanetDetailComponent` to import and use `BUILD_COSTS` from `src/app/data/costs.data.ts`.
    *   **Effort**: Low.
    *   **Impact**: High (Maintainability, Correctness).
    *   **Status**: Completed. Build costs are now centralized in `costs.data.ts` and used in `PlanetDetailComponent` and `ColonyService`.

2.  **Refactor `newGame` Logic** (COMPLETED):
    *   **Action**: Move the game initialization logic from `GameStateService.newGame` to `GalaxyGeneratorService` or a new `GameInitializerService`.
    *   **Effort**: Medium.
    *   **Impact**: Medium (Testability, SRP).
    *   **Status**: Completed. Created `GameInitializerService` which now handles all game setup logic.

3.  **Extract Ship Logic** (COMPLETED):
    *   **Action**: Move `shipOptions` computation from `PlanetDetailComponent` to `ShipyardService`. Create a method `getAvailableShipOptions(planet: Planet, player: Player): ShipOption[]`.
    *   **Effort**: Medium.
    *   **Impact**: High (Reuse).
    *   **Status**: Completed. Logic moved to `ShipyardService.getAvailableShipOptions`.

### 3.2 Fix Bugs & Logic

1.  **Fix Infinite Colonists** (COMPLETED):
    *   **Action**: In `ColonyService`, deduct colonists from `planet.population` when adding them to a new ship. Ensure population doesn't go below 0.
    *   **Status**: Completed. Fixed in `FleetService.addShipToFleet` (deduction) and `TurnService` (decay caps).

2.  **Decouple Colony/Fleet** (COMPLETED):
    *   **Action**: Move `findOrCreateFleet` logic out of `ColonyService`. `ColonyService` should request a fleet from `FleetService`.
    *   **Status**: Completed. Implemented `FleetService.addShipToFleet` and updated `ColonyService` to use it.

### 3.3 Standardization

1.  **Strict Typing for IDs**:
    *   Use specific types (branded types) for `PlanetId`, `FleetId`, `StarId` instead of generic `string` to prevent passing the wrong ID type.

2.  **Automated Guards**:
    *   Add lint rules to forbid magic numbers.
    *   Add a test to verify `BUILD_COSTS` matches the logic in services.

## 4. Proposed Roadmap

1.  **Phase 1: Stabilization (Immediate)**
    *   Centralize `BUILD_COSTS`.
    *   Fix Infinite Colonists bug.
    *   Extract `shipOptions` logic.

2.  **Phase 2: Architectural Cleanup**
    *   Refactor `GameStateService.newGame`.
    *   Decouple `ColonyService` from Fleet logic.

3.  **Phase 3: Hardening**
    *   Implement branded types for IDs.
    *   Add unit tests for `ColonyService` and `ShipyardService`.

## 5. Code Examples

### 5.1 Issue: Duplicated & Hardcoded Costs

**Current (Problematic):**
```typescript
// src/app/screens/planet-detail/planet-detail.component.ts
queue(project: string) {
  let item = project === 'mine'
      ? { project, cost: { resources: 5 } } // Hardcoded
      : project === 'factory'
        ? { project, cost: { resources: 10, germanium: 4 } } // Hardcoded
        // ...
}
```

**Recommended Solution:**
```typescript
// src/app/screens/planet-detail/planet-detail.component.ts
import { BUILD_COSTS } from '../../data/costs.data';

queue(project: string) {
  const cost = BUILD_COSTS[project];
  let item = { project, cost };
  // ...
}
```

### 5.2 Issue: Logic Leak (Ship Options in Component)

**Current (Problematic):**
```typescript
// src/app/screens/planet-detail/planet-detail.component.ts
shipOptions = computed(() => {
  // 100 lines of business logic calculating stats, costs, and filtering
  // ...
});
```

**Recommended Solution:**
```typescript
// src/app/services/shipyard.service.ts
getAvailableShipOptions(planet: Planet, player: Player, designs: ShipDesign[]): ShipOption[] {
  // Logic moved here
}

// src/app/screens/planet-detail/planet-detail.component.ts
shipOptions = computed(() => {
  return this.shipyard.getAvailableShipOptions(this.planet(), this.gs.player(), this.gs.game().shipDesigns);
});
```

### 5.3 Issue: Unsafe Type Casting

**Current (Problematic):**
```typescript
// src/app/screens/galaxy-map/galaxy-map.component.ts
const planetId = (f.location as any).planetId; // Unsafe!
```

**Recommended Solution:**
```typescript
// src/app/models/game.model.ts
export function isOrbitLocation(loc: Location): loc is { type: 'orbit', planetId: string } {
  return loc.type === 'orbit';
}

// Usage
if (isOrbitLocation(f.location)) {
  const planetId = f.location.planetId; // Safe access
}
```
