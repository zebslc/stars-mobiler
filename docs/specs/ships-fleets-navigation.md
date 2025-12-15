# Ships, Fleets & Navigation System
## Complete Specification for Stellar Remnants

---

# 1. CORE CONCEPTS

## 1.1 Design Philosophy

Ships are the player's primary tool for interacting with the galaxy. The system should feel:

- **Intentional** — Every ship you build has a purpose
- **Consequential** — Fuel and range create meaningful logistics
- **Streamlined** — Complex under the hood, simple to command

## 1.2 Key Simplification

**One planet per star system.** When you tap a star, you're selecting both the star AND its planet. This eliminates an entire layer of navigation and makes mobile interaction clean.

```
OLD: Galaxy → Star → Planet (3 levels)
NEW: Galaxy → Star/Planet (2 levels)
```

A "star" in game terms IS the colonizable location. We may still call it a "planet" in the UI, but mechanically it's one entity.

---

# 2. SHIP DESIGN FUNDAMENTALS

## 2.1 The Design → Ship → Fleet Hierarchy

```
ShipDesign (blueprint)
    ↓ instantiate
Ship (individual vessel)
    ↓ group
Fleet (operational unit)
```

- **ShipDesign**: A saved blueprint. "Destroyer Mark III" — defines hull, components, stats
- **Ship**: An actual built vessel. Has damage, exists at a location
- **Fleet**: One or more ships moving and acting together

## 2.2 Ship Design Structure

```typescript
interface ShipDesign {
  id: string;
  name: string;
  hullId: string;
  slots: SlotAssignment[];
  
  // Cached compiled stats (recalculated when tech changes)
  compiled: CompiledDesignStats;
}

interface CompiledDesignStats {
  // Cost to build
  resourceCost: number;
  mineralCost: { iron: number; boranium: number; germanium: number };
  
  // Movement
  warpSpeed: number;           // Maximum warp (1-10)
  fuelCapacity: number;        // Total fuel storage (mg)
  fuelEfficiency: number;      // Consumption rate (0 = ramscoop)
  idealSpeed: number;          // Most efficient travel speed
  
  // Combat
  firepower: number;
  armor: number;
  shields: number;
  initiative: number;
  accuracy: number;
  
  // Utility
  cargoCapacity: number;       // kT of cargo space
  colonistCapacity: number;    // Population transport capacity
  scanRange: number;           // Detection range (ly)
  
  // Special capabilities
  canColonize: boolean;        // Has colony module
  canTerraform: boolean;       // Has terraforming module
  
  // Calculated
  mass: number;                // Total mass (affects fuel use)
  range: RangeStats;           // See below
}

interface RangeStats {
  atIdealSpeed: number;        // Light-years at most efficient speed
  atMaxSpeed: number;          // Light-years at maximum warp
  infinite: boolean;           // True if ramscoop (efficiency = 0)
}
```

## 2.3 Hull Categories for Fleet Roles

| Category | Hulls | Primary Role |
|----------|-------|--------------|
| **Combat** | Scout, Frigate, Destroyer, Cruiser, Battleship | Fighting |
| **Transport** | Freighter, Super Freighter | Cargo hauling |
| **Colonizer** | Colony Ship | Establishing new worlds |
| **Support** | Fuel Tanker | Fleet logistics |
| **Utility** | Miner, Terraform Ship | Special operations |

---

# 3. ENGINE & FUEL SYSTEM

## 3.1 Engine Component Stats

Every engine has these properties:

```typescript
interface EngineStats {
  warpSpeed: number;       // Maximum warp factor (1-10)
  fuelEfficiency: number;  // Fuel consumption multiplier (0-200)
  // 0 = ramscoop (free travel at this engine's max speed)
  // 100 = standard
  // 50 = fuel efficient
  // 150 = fuel hungry
  
  idealWarp: number;       // Speed where this engine is most efficient
  battleSpeed: number;     // Initiative bonus in combat
}
```

## 3.2 Engine Progression

| Engine | Tech | Warp | Efficiency | Ideal | Notes |
|--------|------|------|------------|-------|-------|
| Settler's Delight | Prop 1 | 6 | 0 | 6 | Ramscoop! Free travel ≤W6 |
| Quick Jump 5 | Prop 2 | 7 | 130 | 5 | Cheap, inefficient |
| Long Hump 6 | Prop 3 | 6 | 90 | 6 | Balanced early engine |
| Fuel Mizer | Prop 5 | 8 | 55 | 6 | Best efficiency |
| Daddy Long Legs | Prop 7 | 9 | 80 | 7 | Good all-rounder |
| Trans-Galactic | Prop 10 | 10 | 100 | 9 | Fast but thirsty |
| Trans-Star 10 | Prop 16 | 10 | 50 | 9 | Top tier |
| Interspace-10 | Prop 20 | 10 | 25 | 10 | Ultimate engine |

## 3.3 Fuel Consumption Formula

Fuel use depends on:
- Ship mass (heavier = more fuel)
- Travel speed (faster = exponentially more fuel)
- Engine efficiency (lower = better)
- Distance traveled

```typescript
function calculateFuelCost(
  mass: number,           // Ship mass in kT
  distance: number,       // Light-years to travel
  warpSpeed: number,      // Warp factor used
  efficiency: number,     // Engine efficiency rating
  idealWarp: number       // Engine's optimal speed
): number {
  // Ramscoop engines (efficiency 0) use no fuel at or below their max speed
  if (efficiency === 0) return 0;
  
  // Base consumption scales with mass
  const baseCost = mass * distance / 100;
  
  // Speed penalty: fuel use increases exponentially above ideal
  const speedRatio = warpSpeed / idealWarp;
  const speedMultiplier = speedRatio <= 1 
    ? 1 
    : Math.pow(speedRatio, 2.5);  // Quadratic+ penalty for overspeed
  
  // Apply efficiency
  const efficiencyMultiplier = efficiency / 100;
  
  return Math.ceil(baseCost * speedMultiplier * efficiencyMultiplier);
}
```

### Example Calculations

**Scout (20 kT) with Fuel Mizer, traveling 50 ly:**

| Speed | Fuel Cost | Notes |
|-------|-----------|-------|
| Warp 6 (ideal) | 6 mg | Most efficient |
| Warp 7 | 8 mg | Slight penalty |
| Warp 8 (max) | 12 mg | 2× cost for 33% faster |

**Battleship (400 kT) with Trans-Galactic, traveling 50 ly:**

| Speed | Fuel Cost | Notes |
|-------|-----------|-------|
| Warp 9 (ideal) | 200 mg | Heavy but efficient |
| Warp 10 (max) | 275 mg | Speed costs |

## 3.4 Fleet Fuel Dynamics

When ships form a fleet:

```typescript
interface FleetFuelState {
  totalCapacity: number;   // Sum of all ship fuel tanks
  currentFuel: number;     // Shared fuel pool
  
  // The fleet travels at the speed/efficiency of its SLOWEST ship
  fleetWarpSpeed: number;  
  fleetEfficiency: number;
  fleetMass: number;       // Sum of all ship masses + cargo
}
```

**Key rule:** A fleet shares fuel. Fast ships can "donate" their fuel capacity to support heavy ships.

### The Tanker Strategy

A Fuel Tanker (huge fuel capacity, small mass) extends fleet range:

```
Without Tanker: 3 Destroyers
- Combined fuel: 525 mg
- Combined mass: 240 kT
- Range at W8: 180 ly

With Tanker: 3 Destroyers + 1 Tanker
- Combined fuel: 1,025 mg (+500 from tanker)
- Combined mass: 290 kT (+50 from tanker)
- Range at W8: 290 ly (61% increase!)
```

## 3.5 Range Display

Ships and fleets show range as concentric circles on the map:

```typescript
interface RangeDisplay {
  // Round trip range (can get there AND back)
  roundTrip: number;
  roundTripColor: 'green';
  
  // One way range (can get there, might be stranded)
  oneWay: number;
  oneWayColor: 'yellow';
  
  // Current fuel shows exact remaining
  currentFuel: number;
  maxFuel: number;
}
```

**UI: When selecting a destination:**
- Green ring: "You can go there and return"
- Yellow ring: "You can reach it but may need refueling"
- Red (beyond yellow): "Out of range"

---

# 4. CARGO SYSTEM

## 4.1 Cargo Capacity

Ships can carry:
- **Minerals** (Iron, Boranium, Germanium) — 1 kT per unit
- **Colonists** — 1 kT per 1,000 population
- **Fuel** (for other ships) — Stored in fuel tanks, not cargo

```typescript
interface CargoHold {
  capacity: number;  // kT available
  
  contents: {
    iron: number;
    boranium: number;
    germanium: number;
    colonists: number;  // In thousands (so 25 = 25,000 people)
  };
  
  used: number;      // Computed: sum of contents
  free: number;      // Computed: capacity - used
}
```

## 4.2 Cargo Sources

| Hull | Base Cargo | Notes |
|------|------------|-------|
| Scout | 0 | No cargo space |
| Frigate | 0 | Combat focused |
| Destroyer | 0 | Combat focused |
| Cruiser | 0 | Combat focused |
| Battleship | 0 | Combat focused |
| Freighter | 200 kT | Primary cargo ship |
| Super Freighter | 500 kT | Heavy hauler |
| Colony Ship | 25 kT | For colony supplies |
| Tanker | 0 | Fuel only, no cargo |

**Cargo Pods** (General slot component): +100 kT each
- Can add cargo to any ship with General slots
- A Destroyer with 1 Cargo Pod can carry 100 kT

## 4.3 Loading & Unloading

Cargo transfers happen when a fleet is in orbit:

```typescript
interface CargoTransferOrder {
  type: 'load' | 'unload';
  planetId: string;
  manifest: {
    iron?: number | 'all' | 'fill';
    boranium?: number | 'all' | 'fill';
    germanium?: number | 'all' | 'fill';
    colonists?: number | 'all' | 'fill';
  };
}

// 'all' = transfer everything available
// 'fill' = fill remaining cargo space
// number = transfer specific amount
```

**Transfer is instant** when in orbit. No separate "loading time."

## 4.4 Cargo Weight & Movement

Cargo adds to ship mass, affecting fuel consumption:

```typescript
function calculateFleetMass(fleet: Fleet): number {
  let mass = 0;
  
  for (const ship of fleet.ships) {
    mass += ship.design.compiled.mass;
  }
  
  // Add cargo weight
  const cargo = fleet.cargo;
  mass += cargo.iron;
  mass += cargo.boranium;
  mass += cargo.germanium;
  mass += cargo.colonists;  // 1 kT per 1000 colonists
  
  return mass;
}
```

**Strategic implication:** A full freighter is slower/uses more fuel than an empty one.

---

# 5. COLONIZATION

## 5.1 Colony Module

The Colony Module is a special component that:
- Only fits in Colony slot (only Colony Ship hull has this)
- Carries initial colonists and supplies
- Is consumed when colonizing

```typescript
const COLONY_MODULE: ComponentDefinition = {
  id: 'colony-module',
  name: 'Colonization Module',
  slotType: 'colony',
  baseCost: 20,
  baseMass: 50,
  minerals: { iron: 15, boranium: 5, germanium: 10 },
  tech: { field: 'construction', level: 1 },
  stats: {
    colonistCapacity: 25000,  // 25,000 initial colonists
  }
};
```

## 5.2 Colony Ship Design

The standard Colony Ship hull:

```typescript
const COLONY_SHIP_HULL: HullDefinition = {
  id: 'colony-ship',
  name: 'Colony Ship',
  category: 'colonizer',
  baseCost: 25,
  baseArmor: 30,
  baseFuel: 150,
  baseCargo: 25,  // Small cargo for starting supplies
  slots: [
    { index: 0, type: 'engine', label: 'Engine' },
    { index: 1, type: 'general', label: 'General' },
    { index: 2, type: 'colony', label: 'Colony Module' },
  ],
  tech: null,  // Available from start
};
```

**Typical Colony Ship builds:**

| Build | Engine | General | Range | Notes |
|-------|--------|---------|-------|-------|
| Cheap | Settler's Delight | Fuel Tank | ∞ (slow) | W6 max, but free |
| Balanced | Fuel Mizer | Fuel Tank | ~200 ly | Good range |
| Fast | Trans-Galactic | Fuel Tank | ~120 ly | Quick colonization |
| Scout-Colonizer | Fuel Mizer | Scanner | ~150 ly | Can explore then colonize |

## 5.3 Colonization Requirements

To colonize a star:

1. **Unowned** — Cannot colonize enemy or your own planets
2. **Habitable** — Habitability > 0% for your species
3. **Colony Ship** — Fleet must contain a ship with Colony Module
4. **In Orbit** — Fleet must be at the star (not in transit)

## 5.4 Colonization Process

```typescript
interface ColonizeOrder {
  type: 'colonize';
  starId: string;
}

function executeColonization(
  fleet: Fleet, 
  star: Star, 
  player: Player
): ColonizationResult {
  // Find colony ship in fleet
  const colonyShip = fleet.ships.find(s => s.design.compiled.canColonize);
  if (!colonyShip) {
    return { success: false, error: 'No colony ship in fleet' };
  }
  
  // Check habitability
  const habitability = calculateHabitability(star, player.species);
  if (habitability <= 0) {
    return { success: false, error: 'Planet is uninhabitable' };
  }
  
  // Execute colonization
  star.ownerId = player.id;
  star.population = 25000;  // From colony module
  star.mines = 0;
  star.factories = 0;
  
  // Transfer any cargo from colony ship as starting stockpile
  star.stockpile = {
    iron: colonyShip.cargo.iron + fleet.cargo.iron,
    boranium: colonyShip.cargo.boranium + fleet.cargo.boranium,
    germanium: colonyShip.cargo.germanium + fleet.cargo.germanium,
  };
  
  // Remove colony ship from fleet (consumed)
  fleet.ships = fleet.ships.filter(s => s !== colonyShip);
  
  // If fleet is now empty, remove fleet
  if (fleet.ships.length === 0) {
    removeFleet(fleet);
  }
  
  return { 
    success: true, 
    newColony: star,
    remainingFleet: fleet.ships.length > 0 ? fleet : null
  };
}
```

## 5.5 Colonization UI Flow

```
┌─────────────────────────────────────┐
│ TAP UNOWNED STAR                    │
├─────────────────────────────────────┤
│                                     │
│  ★ KEPLER-442                       │
│                                     │
│  Habitability: 72% 🟢              │
│  Minerals: Fe 45% | Bo 62% | Ge 28%│
│                                     │
│  Status: Uncolonized               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Your fleet "Pioneer 1" is here    │
│  🚀 Colony Ship                     │
│  🔍 Scout                           │
│                                     │
│  [ COLONIZE THIS WORLD ]           │
│                                     │
└─────────────────────────────────────┘
```

After tapping COLONIZE:

```
┌─────────────────────────────────────┐
│ 🎉 COLONY ESTABLISHED!              │
├─────────────────────────────────────┤
│                                     │
│  Welcome to KEPLER-442              │
│                                     │
│  Initial Population: 25,000         │
│  Habitability: 72%                  │
│  Max Population: 720,000            │
│                                     │
│  Starting Resources:                │
│  • 15 Iron (from cargo)            │
│  • 8 Boranium                       │
│  • 5 Germanium                      │
│                                     │
│  Colony Ship consumed.              │
│  Scout "Pioneer 1" remains in orbit.│
│                                     │
│           [ CONTINUE ]              │
└─────────────────────────────────────┘
```

---

# 6. FLEET MANAGEMENT

## 6.1 Fleet Data Model

```typescript
interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  
  // Location
  position: FleetPosition;
  
  // Composition
  ships: ShipInstance[];
  
  // Shared resources
  fuel: number;
  cargo: CargoHold;
  
  // Orders
  orders: FleetOrder[];
  
  // Automation
  automation: FleetAutomation | null;
  
  // Computed (cached)
  computed: FleetComputedStats;
}

type FleetPosition = 
  | { type: 'orbit'; starId: string }
  | { type: 'transit'; from: string; to: string; progress: number };

interface ShipInstance {
  id: string;
  designId: string;
  design: ShipDesign;  // Reference
  damage: number;      // 0 = undamaged, accumulates in combat
  name?: string;       // Optional individual ship name
}

interface FleetComputedStats {
  totalMass: number;
  totalFuel: number;
  maxFuel: number;
  warpSpeed: number;
  fuelEfficiency: number;
  cargoCapacity: number;
  
  // Combat
  strength: number;
  firepower: number;
  totalArmor: number;
  totalShields: number;
  
  // Utility
  scanRange: number;
  canColonize: boolean;
}
```

## 6.2 Fleet Formation (Grouping Ships)

Ships automatically form a fleet when:
- Built at a planet (new single-ship fleet)
- Arriving at same location as friendly fleet (option to merge)

**Manual Merge:**

```typescript
function mergeFleets(fleet1: Fleet, fleet2: Fleet): Fleet {
  // Must be at same location
  if (!sameLocation(fleet1.position, fleet2.position)) {
    throw new Error('Fleets must be at same location to merge');
  }
  
  // Combine ships
  const mergedShips = [...fleet1.ships, ...fleet2.ships];
  
  // Combine resources
  const mergedFuel = fleet1.fuel + fleet2.fuel;
  const mergedCargo = combineCargoHolds(fleet1.cargo, fleet2.cargo);
  
  // Create merged fleet
  return {
    id: generateId(),
    name: fleet1.name,  // Keep first fleet's name
    ownerId: fleet1.ownerId,
    position: fleet1.position,
    ships: mergedShips,
    fuel: mergedFuel,
    cargo: mergedCargo,
    orders: [],  // Clear orders on merge
    automation: null,
    computed: recompute(mergedShips, mergedFuel, mergedCargo),
  };
}
```

## 6.3 Fleet Splitting

Players can split ships off into a new fleet:

```typescript
interface SplitOrder {
  sourceFleetId: string;
  shipsToSplit: string[];  // Ship instance IDs
  fuelToTransfer: number;
  cargoToTransfer: Partial<CargoHold>;
  newFleetName: string;
}

function splitFleet(order: SplitOrder): { original: Fleet; newFleet: Fleet } {
  const source = getFleet(order.sourceFleetId);
  
  // Validate all ships exist in source
  const shipsToMove = source.ships.filter(s => order.shipsToSplit.includes(s.id));
  const shipsToKeep = source.ships.filter(s => !order.shipsToSplit.includes(s.id));
  
  if (shipsToKeep.length === 0) {
    throw new Error('Cannot split all ships - use rename instead');
  }
  
  // Create new fleet
  const newFleet: Fleet = {
    id: generateId(),
    name: order.newFleetName,
    ownerId: source.ownerId,
    position: source.position,  // Same location
    ships: shipsToMove,
    fuel: order.fuelToTransfer,
    cargo: order.cargoToTransfer,
    orders: [],
    automation: null,
    computed: recompute(shipsToMove, order.fuelToTransfer, order.cargoToTransfer),
  };
  
  // Update original
  source.ships = shipsToKeep;
  source.fuel -= order.fuelToTransfer;
  source.cargo = subtractCargo(source.cargo, order.cargoToTransfer);
  source.computed = recompute(shipsToKeep, source.fuel, source.cargo);
  
  return { original: source, newFleet };
}
```

## 6.4 Fleet Selection UI

**Tap on a star with your fleet(s):**

```
┌─────────────────────────────────────┐
│ ★ SOL (Your Homeworld)              │
├─────────────────────────────────────┤
│                                     │
│ FLEETS IN ORBIT                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🚀 Strike Force Alpha           │ │
│ │    3× Destroyer, 1× Cruiser     │ │
│ │    Strength: 2,450              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📦 Trade Fleet 1                │ │
│ │    2× Freighter                 │ │
│ │    Cargo: 180/400 kT            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏠 Pioneer 3                    │ │
│ │    1× Colony Ship               │ │
│ │    Ready to colonize            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ SELECT ALL ]  [ NEW FLEET ]      │
└─────────────────────────────────────┘
```

**Tap on a fleet to open Fleet Detail:**

```
┌─────────────────────────────────────┐
│ ← STRIKE FORCE ALPHA                │
├─────────────────────────────────────┤
│                                     │
│ SHIPS                    [SPLIT]    │
│ ┌─────────────────────────────────┐ │
│ │ ☑ 🚀 Destroyer "Wolf Mk2" ×3   │ │
│ │ ☑ 🛡️ Cruiser "Hammer Mk1" ×1   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ STATS                               │
│ Strength    2,450                   │
│ Speed       Warp 8                  │
│ Fuel        [████████░░] 680/850   │
│ Range       215 ly (round trip)     │
│                                     │
│ CARGO       [░░░░░░░░░░] 0/0 kT    │
│                                     │
│ LOCATION    Orbiting Sol            │
│                                     │
├─────────────────────────────────────┤
│ ORDERS                              │
│ (No orders - awaiting command)      │
│                                     │
│ [🎯 SET DESTINATION]                │
│ [⚙️ AUTOMATION]                     │
│ [🔀 MERGE WITH...]                  │
└─────────────────────────────────────┘
```

---

# 7. NAVIGATION & WAYPOINTS

## 7.1 Movement Model

Movement happens in the **End Turn** phase:
1. All fleets with orders move simultaneously
2. Movement consumes fuel
3. Fleets arrive at destinations or reach waypoints
4. Combat triggers if enemy fleets meet

## 7.2 Simple Destination

The most common order: "Go to this star."

```typescript
interface MoveOrder {
  type: 'move';
  destinationStarId: string;
  warpSpeed: number;  // Player can choose speed (affects fuel use)
}
```

**Travel time** = distance / (warp speed × 10) turns

Example: 80 ly at Warp 8 = 80 / 80 = 1 turn

If distance requires multiple turns:
- Fleet position is "in transit"
- Shows on map as moving along path
- Cannot be interacted with until arrival (or waypoint)

## 7.3 Waypoints

Waypoints allow multi-stop routes and conditional orders.

```typescript
interface Waypoint {
  starId: string;
  
  // Optional actions at this waypoint
  action?: WaypointAction;
  
  // Optional condition to continue
  condition?: WaypointCondition;
}

type WaypointAction =
  | { type: 'none' }                                    // Just pass through
  | { type: 'refuel' }                                  // Top up fuel
  | { type: 'loadCargo'; manifest: CargoManifest }     // Pick up cargo
  | { type: 'unloadCargo'; manifest: CargoManifest }   // Drop off cargo
  | { type: 'colonize' }                               // Colonize if possible
  | { type: 'patrol'; duration: number }               // Wait N turns
  | { type: 'transferShips'; ships: string[]; toFleet: string }; // Split off

type WaypointCondition =
  | { type: 'always' }                                  // Always continue
  | { type: 'ifFuelAbove'; percent: number }           // Continue if fuel > X%
  | { type: 'ifCargoFull' }                            // Continue when cargo full
  | { type: 'ifCargoEmpty' }                           // Continue when cargo empty
  | { type: 'ifEnemyPresent' }                         // Continue if enemy at waypoint
  | { type: 'ifNoEnemy' };                             // Continue if no enemy
```

### Waypoint Example: Trade Route

```
Waypoint 1: Alpha Centauri
  Action: loadCargo { iron: 'fill' }
  Condition: ifCargoFull

Waypoint 2: Sol  
  Action: unloadCargo { iron: 'all' }
  Condition: ifCargoEmpty

Waypoint 3: Alpha Centauri (loops back)
  Action: none
  Condition: always
```

This creates a perpetual iron trade route.

## 7.4 Route Planning UI

```
┌─────────────────────────────────────┐
│ ROUTE PLANNER: Trade Fleet 1        │
├─────────────────────────────────────┤
│                                     │
│ WAYPOINTS                           │
│                                     │
│ 1. ★ Alpha Centauri (current)       │
│    📦 Load: Iron (fill)             │
│    → Continue when cargo full       │
│                                     │
│ 2. ★ Sol                            │
│    📦 Unload: Iron (all)            │
│    → Continue when cargo empty      │
│                                     │
│ 3. 🔄 Loop to waypoint 1            │
│                                     │
│ ROUTE STATS                         │
│ Total distance: 8.6 ly round trip   │
│ Fuel per circuit: 12 mg             │
│ Time per circuit: 2 turns           │
│                                     │
│ [+ ADD WAYPOINT]                    │
│ [🗑️ CLEAR ROUTE]                    │
│ [▶ START ROUTE]                    │
└─────────────────────────────────────┘
```

## 7.5 Pathfinding

For now: **Direct point-to-point movement.**

Stars are not connected by "lanes" — fleets travel in straight lines.

Future enhancement: Hyperspace lanes that are faster but constrained.

---

# 8. FLEET AUTOMATION

## 8.1 Automation Types

```typescript
type FleetAutomation =
  | TradeRouteAutomation
  | PatrolAutomation
  | FerryAutomation
  | ColonizeAutomation;

interface TradeRouteAutomation {
  type: 'tradeRoute';
  route: Waypoint[];  // Looping waypoint list
  active: boolean;
}

interface PatrolAutomation {
  type: 'patrol';
  patrolStars: string[];  // Stars to cycle between
  engageEnemies: boolean; // Attack if encountered?
}

interface FerryAutomation {
  type: 'ferry';
  source: string;      // Star to pick up from
  destination: string; // Star to deliver to
  cargo: 'minerals' | 'colonists' | 'both';
}

interface ColonizeAutomation {
  type: 'autoColonize';
  targetStars: string[];  // Priority list of stars to colonize
  returnForNewShip: string; // Where to pick up new colony ship
}
```

## 8.2 Trade Route Automation

Most common automation. Fleet cycles between stars moving cargo.

**Setup UI:**

```
┌─────────────────────────────────────┐
│ SETUP TRADE ROUTE                   │
├─────────────────────────────────────┤
│                                     │
│ PICKUP LOCATION                     │
│ [★ Alpha Centauri    ▼]            │
│                                     │
│ CARGO TO LOAD                       │
│ ☑ Iron      [Fill ▼]               │
│ ☐ Boranium  [None ▼]               │
│ ☐ Germanium [None ▼]               │
│                                     │
│ ─────────────────────────────────   │
│                                     │
│ DROPOFF LOCATION                    │
│ [★ Sol              ▼]             │
│                                     │
│ CARGO TO UNLOAD                     │
│ ☑ Iron      [All ▼]                │
│                                     │
│ ROUTE PREVIEW                       │
│ A. Centauri → Sol → A. Centauri    │
│ 8.6 ly · 2 turns · 12 mg fuel      │
│                                     │
│ [CANCEL]        [START ROUTE]       │
└─────────────────────────────────────┘
```

## 8.3 Auto-Resupply

Fleets can be set to automatically refuel at friendly stars:

```typescript
interface FleetSettings {
  autoRefuel: boolean;           // Top up when at owned star
  refuelThreshold: number;       // Refuel when below X%
  autoRepair: boolean;           // Repair at starbases
}
```

When `autoRefuel` is true and fleet arrives at an owned star with fuel below threshold, it automatically refuels from the global stockpile (if resources available).

## 8.4 Automation Priority & Interrupts

Automation can be interrupted by:
- Enemy fleet appears at current location → Combat
- Destination becomes enemy-owned → Route paused
- Player issues manual order → Automation suspended

```typescript
function processFleetAutomation(fleet: Fleet, game: GameState): FleetOrder[] {
  if (!fleet.automation || !fleet.automation.active) {
    return [];
  }
  
  // Check for interrupts
  if (hasEnemyAtLocation(fleet.position, game)) {
    fleet.automation.active = false;  // Pause automation
    return [];  // Player must handle manually
  }
  
  // Generate next orders based on automation type
  switch (fleet.automation.type) {
    case 'tradeRoute':
      return processTradeRoute(fleet, fleet.automation, game);
    case 'patrol':
      return processPatrol(fleet, fleet.automation, game);
    // etc.
  }
}
```

---

# 9. REFUELING & LOGISTICS

## 9.1 Where Fleets Can Refuel

1. **Any owned star** — Costs resources from global stockpile
2. **Tanker ships in fleet** — No cost, just redistribution
3. **Starbases** (future) — Free refueling in range

## 9.2 Refuel Cost

Fuel is an abstract resource. Refueling costs Resources:

```typescript
const FUEL_COST_PER_100MG = 1;  // 1 resource per 100 mg fuel

function refuelCost(amountToRefuel: number): number {
  return Math.ceil(amountToRefuel / 100);
}
```

## 9.3 Emergency Stranding

If a fleet runs out of fuel mid-transit:

```typescript
interface StrandedFleet extends Fleet {
  stranded: true;
  strandedAt: { x: number; y: number };  // Deep space coordinates
  turnsStranded: number;
}
```

**Recovery options:**
1. Send a tanker fleet to rescue
2. Abandon ships (scuttle for 25% mineral recovery)
3. Wait for enemy to find you...

**UI Warning:**
```
⚠️ WARNING: Insufficient Fuel

This move will strand your fleet 12 ly
from the nearest star.

Fuel needed: 85 mg
Fuel available: 60 mg
Shortfall: 25 mg

[CANCEL] [PROCEED ANYWAY]
```

---

# 10. INITIAL SHIP DESIGNS

## 10.1 Starting Designs

Every player starts with these pre-made designs:

### Scout
```
Hull: Scout
Engine: Settler's Delight
General: Bat Scanner
Scanner: (empty)

Stats:
- Cost: 17 resources, 7 Fe, 2 Bo, 4 Ge
- Warp 6, infinite range (ramscoop)
- Scan range: 50 ly
- No cargo
```

### Armed Scout
```
Hull: Scout
Engine: Settler's Delight
General: Maneuver Jet
Scanner: Bat Scanner

Stats:
- Cost: 22 resources
- Warp 6, infinite range
- Initiative 15 (fast in combat)
- Minimal combat capability
```

### Colony Ship
```
Hull: Colony Ship
Engine: Fuel Mizer
General: Fuel Tank
Colony: Colony Module

Stats:
- Cost: 53 resources, 25 Fe, 5 Bo, 20 Ge
- Warp 8, ~180 ly range
- Carries 25,000 colonists
- 25 kT cargo for starting supplies
```

### Basic Freighter
```
Hull: Freighter
Engine: Fuel Mizer
General 1: Cargo Pod
General 2: Cargo Pod

Stats:
- Cost: 41 resources
- Warp 8, ~150 ly range
- 400 kT cargo capacity
- No weapons
```

### Starter Frigate
```
Hull: Frigate
Engine: Quick Jump 5
Weapon 1: Laser
Weapon 2: Laser
General: Fuel Tank
Defense: Tritanium Armor

Stats:
- Cost: 51 resources
- Warp 7, ~120 ly range
- Firepower: 20
- Armor: 90 (40 base + 50 from armor)
```

## 10.2 Starting Fleet

New game begins with:
- 1× Scout (exploring)
- 1× Colony Ship (ready to expand)
- 1× Frigate (defense)

Located at homeworld.

---

# 11. COMPONENT REFERENCE: ENGINES

Complete engine list for reference:

| ID | Name | Tech | Cost | Mass | Warp | Eff | Ideal | Notes |
|----|------|------|------|------|------|-----|-------|-------|
| engine-settlers | Settler's Delight | P1 | 5 | 10 | 6 | 0 | 6 | Ramscoop |
| engine-quickjump | Quick Jump 5 | P2 | 8 | 12 | 7 | 130 | 5 | Cheap |
| engine-longhump | Long Hump 6 | P3 | 12 | 14 | 6 | 90 | 6 | Balanced |
| engine-fuelmizer | Fuel Mizer | P5 | 20 | 18 | 8 | 55 | 6 | Efficient |
| engine-daddylonglegs | Daddy Long Legs | P7 | 30 | 22 | 9 | 80 | 7 | All-rounder |
| engine-transgalactic | Trans-Galactic | P10 | 45 | 25 | 10 | 100 | 9 | Military |
| engine-transstar | Trans-Star 10 | P16 | 80 | 30 | 10 | 50 | 9 | Premium |
| engine-interspace | Interspace-10 | P20 | 120 | 28 | 10 | 25 | 10 | Ultimate |

**Special: Ramscoop**

The Settler's Delight has efficiency 0, meaning zero fuel consumption. The tradeoff:
- Maximum Warp 6 (slowest)
- Cannot go faster even with other engines

A fleet with ANY ramscoop-only ship is limited to Warp 6.

---

# 12. COMPONENT REFERENCE: CARGO & FUEL

| ID | Name | Slot | Cost | Mass | Effect |
|----|------|------|------|------|--------|
| general-fueltank | Fuel Tank | General | 5 | 8 | +150 mg fuel |
| general-largefueltank | Large Fuel Tank | General | 12 | 18 | +400 mg fuel |
| general-cargopod | Cargo Pod | General | 8 | 10 | +100 kT cargo |
| general-largecargopod | Large Cargo Pod | General | 20 | 22 | +250 kT cargo |
| colony-module | Colony Module | Colony | 20 | 50 | +25k colonists |

---

# 13. UI SUMMARY: SHIP & FLEET SCREENS

## 13.1 Screen Hierarchy

```
Galaxy Map
├── Tap Star → Star Detail
│   ├── Fleets list → Tap fleet → Fleet Detail
│   │   ├── Ship list → Tap ship → Ship Stats
│   │   ├── [Set Destination] → Destination Picker
│   │   ├── [Split Fleet] → Split UI
│   │   └── [Automation] → Automation Setup
│   └── [Build Ship] → Ship Designer
└── Tap Fleet in transit → Fleet Detail
```

## 13.2 Key Interactions

| Action | Gesture | Result |
|--------|---------|--------|
| Select fleet | Tap fleet icon | Opens fleet detail |
| Move fleet | Tap destination button → tap star | Sets move order |
| Quick move | Long-press fleet → drag to star | Sets move order |
| Merge fleets | Drag fleet onto another fleet | Merge dialog |
| Split fleet | Fleet detail → Split button | Split UI |
| View range | Select fleet | Range circles appear |

## 13.3 Range Circle Colors

| Circle | Meaning |
|--------|---------|
| 🟢 Green (solid) | Round-trip range |
| 🟡 Yellow (dashed) | One-way range |
| Beyond yellow | Out of range |
| 🔵 Blue (dotted) | If refueled at destination |

---

# 14. TURN PROCESSING: FLEET PHASE

## 14.1 Fleet Processing Order

```typescript
function processFleets(game: GameState): void {
  // 1. Process automation (generates orders)
  for (const fleet of game.fleets) {
    if (fleet.automation?.active) {
      const orders = processFleetAutomation(fleet, game);
      fleet.orders.push(...orders);
    }
  }
  
  // 2. Execute cargo transfers (at current location)
  for (const fleet of game.fleets) {
    processCargoOrders(fleet, game);
  }
  
  // 3. Execute colonization (at current location)
  for (const fleet of game.fleets) {
    processColonizeOrders(fleet, game);
  }
  
  // 4. Move all fleets simultaneously
  const movements = calculateAllMovements(game.fleets);
  applyMovements(movements);
  
  // 5. Handle arrivals (refuel if auto-refuel enabled)
  for (const fleet of game.fleets) {
    if (fleet.position.type === 'orbit' && fleet.settings.autoRefuel) {
      autoRefuel(fleet, game);
    }
  }
  
  // 6. Detect encounters (fleets at same location)
  const encounters = detectEncounters(game.fleets);
  
  // 7. Resolve combat (separate phase)
  // ... handled by combat system
}
```

## 14.2 Simultaneous Movement

All fleets move at the same time. This means:
- You can't react to enemy movement this turn
- Fleets might "pass" each other
- Combat only happens when fleets END at same location

```typescript
function calculateAllMovements(fleets: Fleet[]): Movement[] {
  return fleets
    .filter(f => hasMovementOrder(f))
    .map(f => ({
      fleetId: f.id,
      from: f.position,
      to: calculateDestination(f),
      fuelUsed: calculateFuelCost(f),
    }));
}

function applyMovements(movements: Movement[]): void {
  for (const move of movements) {
    const fleet = getFleet(move.fleetId);
    fleet.position = move.to;
    fleet.fuel -= move.fuelUsed;
    fleet.orders = fleet.orders.slice(1);  // Remove completed order
  }
}
```

---

# 15. FUTURE ENHANCEMENTS (Post-MVP)

## 15.1 Stargates

Instant travel between connected gates:
- Build at two stars
- Fleets can jump instantly (no fuel cost)
- Strategic chokepoints

## 15.2 Hyperspace Lanes

Faster travel along predetermined routes:
- Movement along lanes = 2× speed
- Off-lane movement = normal
- Creates strategic geography

## 15.3 Fleet Formations

Combat bonuses for organized fleets:
- Screen: Frigates protect capital ships
- Wedge: Initiative bonus
- Sphere: Defensive bonus

## 15.4 Supply Lines

Advanced logistics:
- Fleets have "supply" that depletes over time away from owned stars
- Low supply = combat penalty
- Encourages careful advancement

---

# APPENDIX A: FORMULAS QUICK REFERENCE

```typescript
// Fuel cost per light-year
fuelCost = (mass × distance / 100) × (warpSpeed / idealWarp)^2.5 × (efficiency / 100)

// Travel time
turns = distance / (warpSpeed × 10)

// Fleet speed
fleetWarp = min(ship.warpSpeed for all ships in fleet)

// Fleet mass
fleetMass = sum(ship.mass) + cargoWeight

// Range (round trip)
roundTripRange = (fuel / 2) / fuelCostPerLY

// Range (one way)
oneWayRange = fuel / fuelCostPerLY
```

---

# APPENDIX B: EXAMPLE SCENARIOS

## Scenario 1: Early Colonization

**Situation:** Turn 5, you have a Colony Ship at Sol, Kepler-442 is 40 ly away with 68% habitability.

**Fleet:** Colony Ship (Fuel Mizer, Fuel Tank, Colony Module)
- Warp 8, Fuel: 300 mg, Mass: 78 kT
- Range: ~180 ly round trip

**Action:** Set destination to Kepler-442
**Result:** 
- Travel time: 40 / 80 = 0.5 turns (arrives this turn)
- Fuel used: ~24 mg
- On arrival: Colonize order executes, colony established

## Scenario 2: Trade Route

**Situation:** Sol produces 50 Iron/turn, Beta Centauri needs Iron for factories.

**Setup:**
1. Build 2× Freighters (400 kT cargo each)
2. Create fleet "Iron Haulers"
3. Set up trade route automation:
   - Sol: Load Iron (fill)
   - Beta Centauri: Unload Iron (all)
   - Loop

**Result:**
- Each trip: 800 kT Iron moved
- Trip time: 2 turns round trip
- Sustained rate: 400 kT Iron/turn to Beta Centauri

## Scenario 3: Strike Force

**Situation:** Enemy fleet detected at Proxima (12 ly from Sol).

**Fleet:** 3× Destroyer, 1× Cruiser
- Combined strength: 2,450
- Warp 8, Fuel: 680 mg

**Action:**
1. Check fuel: 680 mg, need ~30 mg round trip ✓
2. Check range: 12 ly well within range ✓
3. Issue move order to Proxima
4. Combat will resolve on arrival

**Risk assessment:** If enemy is stronger, can retreat at Warp 8.
