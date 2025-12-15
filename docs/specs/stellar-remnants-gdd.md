# Stellar Remnants: Complete Game Design Document
## A Mobile-First 4X Strategy Game Inspired by Stars!

---

# PART 1: VISION & SCOPE

## 1.1 Core Vision

**One-line pitch:** A deep but accessible 4X strategy game where your species' biology shapes your destiny, resources run dry, and every ship you design tells a story.

**Target session:** 5-15 minutes per turn, games lasting 20-50 turns (1-2 weeks of casual play or a few hours focused).

**Platform:** Mobile-first PWA (works offline, installable), playable in browser.

**Player count:** Single-player vs AI (multiplayer is a future consideration, not MVP).

## 1.2 Core Pillars

1. **Meaningful Scarcity** - Minerals deplete. You cannot turtle. Expansion is survival.
2. **Biology Matters** - Your species' environmental needs shape which planets are gold mines vs death traps.
3. **Design Expression** - Your ship designs reflect your strategy. Tech investment pays compound returns.
4. **Streamlined Depth** - Complex systems, simple interactions. No spreadsheet management.

## 1.3 MVP Scope

The minimum playable game includes:

| Feature | In MVP | Post-MVP |
|---------|--------|----------|
| Galaxy generation | ✅ | |
| Planet habitability (2-axis) | ✅ | |
| Species selection (4 preset) | ✅ | Custom species |
| Basic economy (mines/factories) | ✅ | |
| Ship designer | ✅ | |
| Fleet movement & fuel | ✅ | |
| Colonization | ✅ | |
| Combat (auto-resolve) | ✅ | Battle replay |
| Single AI opponent | ✅ | Multiple AI |
| Win condition (domination) | ✅ | Economic/Survival |
| Terraforming | | ✅ |
| Stargates | | ✅ |
| Tech tree (full) | | ✅ |
| Save/Load | ✅ | Cloud sync |

---

# PART 2: GALAXY & PLANETS

## 2.1 Galaxy Generation

### Size Options
| Size | Stars | Recommended For |
|------|-------|-----------------|
| Small | 16 | Quick games (15-20 turns) |
| Medium | 24 | Standard games (25-35 turns) |
| Large | 36 | Epic games (40-50 turns) |

### Generation Algorithm

```typescript
interface Star {
  id: string;
  name: string;
  position: { x: number; y: number };  // 0-1000 coordinate space
  planets: Planet[];
}

function generateGalaxy(starCount: number, seed: number): Star[] {
  const rng = seededRandom(seed);
  const stars: Star[] = [];
  
  // Use Poisson disc sampling for natural-looking distribution
  // Minimum distance between stars based on count
  const minDistance = 1000 / Math.sqrt(starCount) * 0.8;
  
  // Generate star positions
  const positions = poissonDiscSample(starCount, minDistance, rng);
  
  // Create stars with 1-4 planets each
  for (const pos of positions) {
    const planetCount = weightedRandom([1, 2, 3, 4], [0.2, 0.4, 0.3, 0.1], rng);
    const planets = generatePlanets(planetCount, rng);
    
    stars.push({
      id: generateId(),
      name: generateStarName(rng),
      position: pos,
      planets
    });
  }
  
  return stars;
}
```

### Starting Positions
- Player and AI start at opposite ends of galaxy
- Each starts with one habitable homeworld (100% habitability for their species)
- 2-3 nearby stars within easy colonization range

## 2.2 Planet Model

```typescript
interface Planet {
  id: string;
  name: string;
  starId: string;
  
  // Environment (determines habitability)
  temperature: number;    // -100 (frozen) to +100 (molten)
  atmosphere: number;     // 0 (vacuum) to 100 (crushing)
  
  // Resources
  mineralConcentrations: {
    iron: number;         // 0-100, percentage
    boranium: number;
    germanium: number;
  };
  surfaceMinerals: {
    iron: number;         // Available to use
    boranium: number;
    germanium: number;
  };
  
  // Development (only if owned)
  ownerId: string | null;
  population: number;     // In thousands
  maxPopulation: number;  // Based on habitability
  mines: number;
  factories: number;
  defenses: number;
  
  // Terraforming
  terraformOffset: {
    temperature: number;
    atmosphere: number;
  };
}
```

## 2.3 Habitability System (2-Axis)

### The Habitability Plane

Instead of 3 axes (Gravity/Temperature/Radiation), we use 2:
- **Temperature**: Cold (-100) to Hot (+100)
- **Atmosphere**: Thin (0) to Dense (100)

This creates a 2D plane that's easy to visualize on mobile.

### Species Habitat Definition

```typescript
interface SpeciesHabitat {
  idealTemperature: number;   // Center point
  idealAtmosphere: number;
  toleranceRadius: number;    // How far from ideal is survivable
}

// Example: Humans
const humanHabitat: SpeciesHabitat = {
  idealTemperature: 20,    // Temperate
  idealAtmosphere: 50,     // Earth-like
  toleranceRadius: 40      // Can survive reasonable variation
};

// Example: Lithoids (rock creatures)
const lithoidHabitat: SpeciesHabitat = {
  idealTemperature: 60,    // Hot
  idealAtmosphere: 80,     // Dense
  toleranceRadius: 30      // Narrower tolerance
};
```

### Habitability Calculation

```typescript
function calculateHabitability(planet: Planet, species: SpeciesHabitat): number {
  const tempDiff = Math.abs(planet.temperature - species.idealTemperature);
  const atmoDiff = Math.abs(planet.atmosphere - species.idealAtmosphere);
  
  // Euclidean distance in the hab plane
  const distance = Math.sqrt(tempDiff * tempDiff + atmoDiff * atmoDiff);
  
  if (distance >= species.toleranceRadius) {
    // Outside tolerance = uninhabitable
    // But return negative to show "how far" for terraforming planning
    return Math.round(-((distance - species.toleranceRadius) / species.toleranceRadius) * 100);
  }
  
  // Inside tolerance = percentage habitability
  return Math.round((1 - distance / species.toleranceRadius) * 100);
}
```

### Habitability Effects

| Habitability | Max Population | Growth Rate | Notes |
|--------------|---------------|-------------|-------|
| 100% | 1,000,000 | 10%/turn | Ideal world |
| 75% | 750,000 | 7.5%/turn | Good colony |
| 50% | 500,000 | 5%/turn | Marginal |
| 25% | 250,000 | 2.5%/turn | Harsh |
| 0% | 100,000 | 1%/turn | Barely survivable |
| Negative | 0 | N/A | Cannot colonize |

### Mobile UI: Habitability View

```
┌─────────────────────────────────────┐
│  PLANET: Kepler-442b                │
├─────────────────────────────────────┤
│                                     │
│    🌡️ Temperature: +35 (Warm)       │
│    💨 Atmosphere: 62 (Dense)        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      YOUR COMFORT ZONE      │   │
│  │    ┌───────────────┐        │   │
│  │    │    ○ Ideal    │   ●    │   │
│  │    │               │ Planet │   │
│  │    └───────────────┘        │   │
│  │   Cold ◄────────────► Hot   │   │
│  └─────────────────────────────┘   │
│                                     │
│  HABITABILITY: 68% 🟢              │
│  Max Population: 680,000            │
│                                     │
│  ⚡ With terraforming: 89%         │
│     (need: -10 temp, -8 atmo)      │
│                                     │
└─────────────────────────────────────┘
```

---

# PART 3: ECONOMY

## 3.1 The Resource Loop

```
POPULATION → operates → FACTORIES → produce → RESOURCES
     ↑                                            ↓
     └──────── GROWTH ←──── FOOD (automatic) ─────┘
     
POPULATION → operates → MINES → extract → MINERALS
                                              ↓
                        MINERALS + RESOURCES → BUILD THINGS
```

## 3.2 Production Mechanics

### Population
- Grows logistically: `growth = pop × rate × (1 - pop/maxPop)`
- Maximum growth at 50% capacity (farming population)
- Can be transported between planets

### Factories
- Each factory produces 1 Resource per turn
- Maximum factories = population / 10 (need workers)
- Cost: 10 Resources + 4 Germanium each

### Mines
- Each mine extracts minerals based on concentration
- Extraction = `mines × concentration / 100`
- Concentration depletes: `newConc = conc - (extraction × 0.01)`
- Cost: 5 Resources each (no mineral cost)

### Production Formula

```typescript
function calculateProduction(planet: Planet): ProductionResult {
  // Population operates factories
  const operableFactories = Math.min(planet.factories, planet.population / 10);
  const resources = operableFactories;  // 1 resource per factory
  
  // Population operates mines
  const operableMines = Math.min(planet.mines, planet.population / 10);
  
  // Extraction per mineral type
  const extraction = {
    iron: operableMines * planet.mineralConcentrations.iron / 100,
    boranium: operableMines * planet.mineralConcentrations.boranium / 100,
    germanium: operableMines * planet.mineralConcentrations.germanium / 100,
  };
  
  return { resources, extraction };
}
```

## 3.3 The Germanium Bottleneck

Germanium is special:
- Required for factories (4 Ge each)
- Required for electronics, advanced tech
- Often the scarcest mineral

This creates the core tension: you need factories to produce, but factories need Germanium, which needs mines, which need population, which needs factories...

## 3.4 Stockpiles & Transfer Range

### Decision: Hybrid Stockpile System

**Global stockpile** for simplicity, but with **transfer range** for strategic depth.

```typescript
interface PlayerEconomy {
  // Global stockpile
  resources: number;
  minerals: {
    iron: number;
    boranium: number;
    germanium: number;
  };
  
  // Logistics
  transferRange: number;  // Light-years from any owned planet
  freighterCapacity: number;  // Total throughput per turn
}
```

**Transfer Range Rules:**
- Planets within transfer range of each other share stockpiles freely
- Planets outside transfer range are "isolated" - can only use local minerals
- Building Freighters increases throughput (how much can move per turn)
- Stargates (post-MVP) extend transfer range to infinite for connected planets

### UI Indication

On the galaxy map:
- Planets in your network: normal color
- Isolated planets: pulsing outline, warning icon
- Transfer range shown as translucent circle from your territory

## 3.5 Build Queues

Each planet has a build queue. Available projects:

| Project | Cost | Mineral Cost | Effect |
|---------|------|--------------|--------|
| Mine | 5 | - | +1 mine |
| Factory | 10 | 4 Ge | +1 factory |
| Defense | 15 | 2 Fe, 2 Bo | +1 defense |
| Terraform | 25 | 5 Ge | +1 toward ideal |
| Ship (varies) | (design cost) | (design minerals) | Build ship |

### Auto-Build Governors

To reduce micromanagement:

```typescript
type GovernorType = 
  | 'balanced'      // Mines until 50%, then factories, then defenses
  | 'mining'        // Prioritize mines
  | 'industrial'    // Prioritize factories  
  | 'military'      // Build defenses, then ships
  | 'shipyard'      // Only build ships (specify design)
  | 'manual';       // No auto-build

interface PlanetGovernor {
  type: GovernorType;
  shipDesignId?: string;  // For shipyard governor
  buildLimit?: number;    // Stop auto-building at this many ships
}
```

---

# PART 4: SHIPS & FLEETS

## 4.1 Ship Design (Already Defined)

See ship designer documentation. Key points:
- Hulls have typed slots
- Components have tech requirements
- Below tech = cost/mass penalty
- Above tech = miniaturization

## 4.2 Fleets

Ships are grouped into fleets for movement.

```typescript
interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  
  // Position
  location: 
    | { type: 'orbit'; planetId: string }
    | { type: 'space'; x: number; y: number };
  
  // Composition
  ships: ShipStack[];
  
  // Status
  fuel: number;
  cargo: {
    minerals: { iron: number; boranium: number; germanium: number };
    colonists: number;
  };
  
  // Orders
  orders: FleetOrder[];
}

interface ShipStack {
  designId: string;
  count: number;
  damage: number;  // Accumulated damage across stack
}

type FleetOrder = 
  | { type: 'move'; destination: { x: number; y: number } }
  | { type: 'colonize'; planetId: string }
  | { type: 'attack'; targetFleetId: string }
  | { type: 'load'; planetId: string; cargo: CargoManifest }
  | { type: 'unload'; planetId: string; cargo: CargoManifest }
  | { type: 'patrol'; waypoints: Array<{ x: number; y: number }> };
```

## 4.3 Movement & Fuel

### Speed and Fuel Consumption

```typescript
function calculateMovement(fleet: Fleet, designs: Map<string, CompiledDesign>) {
  // Fleet speed = slowest ship
  let maxWarp = Infinity;
  let totalMass = 0;
  let totalFuel = 0;
  let bestEfficiency = Infinity;
  
  for (const stack of fleet.ships) {
    const design = designs.get(stack.designId)!;
    maxWarp = Math.min(maxWarp, design.warpSpeed);
    totalMass += design.totalMass * stack.count;
    totalFuel += design.fuelCapacity * stack.count;
    if (design.fuelEfficiency < bestEfficiency && design.fuelEfficiency > 0) {
      bestEfficiency = design.fuelEfficiency;
    }
  }
  
  // Add cargo to mass
  totalMass += fleet.cargo.colonists / 100;  // 100 colonists = 1 kT
  totalMass += fleet.cargo.minerals.iron + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
  
  return { maxWarp, totalMass, totalFuel, bestEfficiency };
}

function fuelCostPerLightYear(mass: number, warp: number, efficiency: number): number {
  if (efficiency === 0) return 0;  // Ramscoop
  // Fuel cost increases with mass and speed
  return mass * efficiency / 1000 * Math.pow(warp / 5, 2);
}
```

### Range Circles

On the map, when a fleet is selected, show:
- Green circle: Round-trip range at current fuel
- Yellow circle: One-way range at current fuel
- Red zone: Beyond range

## 4.4 Colonization

To colonize a planet:
1. Fleet must include a ship with Colony Module
2. Planet must have positive habitability for your species
3. Fleet moves to planet, executes "Colonize" order
4. Colony ship is consumed, planet gains initial population (25,000)

---

# PART 5: COMBAT

## 5.1 Combat Philosophy

Combat is **auto-resolved** with **pre-battle prediction**. The player's decision is "should I fight?" not "micromanage the battle."

## 5.2 Strength Calculation

```typescript
function calculateFleetStrength(fleet: Fleet, designs: Map<string, CompiledDesign>): number {
  let total = 0;
  
  for (const stack of fleet.ships) {
    const design = designs.get(stack.designId)!;
    
    const firepower = design.firepower;
    const durability = design.armor + design.shields * 1.5;
    const accuracy = design.accuracy / 100;
    const initiative = design.initiative;
    
    const perShip = (firepower * accuracy * 0.5) + (durability * 0.35) + (initiative * 0.1);
    
    // Diminishing returns for stacks (overkill waste)
    const stackStrength = perShip * Math.pow(stack.count, 0.85);
    total += stackStrength;
  }
  
  return total;
}
```

## 5.3 Battle Zones

| Strength Ratio | Zone | Outcome |
|----------------|------|---------|
| ≥ 2.5 | Overwhelming | Deterministic win, minimal losses |
| 2.0 - 2.5 | Decisive | Deterministic win, light losses |
| 1.0 - 2.0 | Contested (Favored) | RNG, likely win |
| 0.5 - 1.0 | Contested (Underdog) | RNG, likely lose |
| 0.33 - 0.5 | Decisive Loss | Deterministic loss |
| < 0.33 | Overwhelming Loss | Deterministic annihilation |

## 5.4 Contested Battle Resolution

```typescript
function resolveContestedBattle(
  attacker: Fleet, 
  defender: Fleet,
  rng: SeededRandom
): BattleResult {
  const aState = createBattleState(attacker);
  const dState = createBattleState(defender);
  
  const rounds: BattleRound[] = [];
  
  for (let round = 0; round < 10 && aState.alive && dState.alive; round++) {
    const roundResult = resolveCombatRound(aState, dState, rng);
    rounds.push(roundResult);
    
    // Check for retreat (defender can retreat after round 3 if losing badly)
    if (round >= 3 && shouldRetreat(dState, aState)) {
      return { victor: 'attacker', type: 'retreat', rounds };
    }
  }
  
  return {
    victor: aState.strength > dState.strength ? 'attacker' : 'defender',
    type: aState.alive && dState.alive ? 'stalemate' : 'decisive',
    rounds
  };
}
```

## 5.5 Pre-Combat UI

```
┌─────────────────────────────────────┐
│        ⚔️ BATTLE FORECAST           │
├─────────────────────────────────────┤
│                                     │
│  YOUR FLEET         ENEMY FLEET     │
│  ══════════         ═══════════     │
│  3× Destroyer       2× Cruiser      │
│  1× Cruiser         5× Frigate      │
│                                     │
│  Strength: 1,840    Strength: 2,150 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      PREDICTION: CONTESTED          │
│   [░░░░░░░░░░████████] 0.86:1       │
│                                     │
│   ⚠️ Slightly unfavorable           │
│                                     │
│   If you win:   Lose 1-2 Destroyers │
│   If you lose:  Fleet destroyed     │
│                                     │
├─────────────────────────────────────┤
│    [RETREAT]         [ENGAGE]       │
└─────────────────────────────────────┘
```

## 5.6 Planetary Bombardment

Fleets can bombard enemy planets to:
- Kill population
- Destroy installations
- Cannot capture (need to invade with population)

Bombardment strength = fleet firepower / 10
Defenses reduce bombardment: effective = bombardment / (1 + defenses/50)

---

# PART 6: TECHNOLOGY

## 6.1 Tech Fields (MVP: Simplified)

For MVP, collapse to 4 fields instead of 6:

| Field | Unlocks |
|-------|---------|
| **Construction** | Hulls, Armor, Factories |
| **Energy** | Shields, Beams, Terraforming |
| **Propulsion** | Engines, Fuel efficiency |
| **Electronics** | Scanners, Targeting, Components |

## 6.2 Research Mechanics

```typescript
interface ResearchState {
  levels: {
    construction: number;
    energy: number;
    propulsion: number;
    electronics: number;
  };
  currentField: TechField;
  accumulatedPoints: number;
}

function costForNextLevel(currentLevel: number): number {
  // Exponential scaling
  return Math.floor(50 * Math.pow(1.5, currentLevel));
}

function calculateResearchPerTurn(player: Player): number {
  // Resources can be allocated to research
  // For MVP: 10% of total production goes to research automatically
  return Math.floor(player.totalProduction * 0.1);
}
```

## 6.3 Tech Unlocks

| Level | Construction | Energy | Propulsion | Electronics |
|-------|-------------|--------|------------|-------------|
| 1 | Scout, Frigate | Laser, Cowhide | Settler's Delight | Bat Scanner |
| 3 | Tritanium Armor | | Quick Jump | Basic Computer |
| 5 | Destroyer, Tanker | Wolverine | Fuel Mizer | Rhino Scanner |
| 7 | Cruiser | X-Ray Laser | | |
| 10 | | Disruptor, Gorilla | Trans-Galactic | Elephant Scanner |
| 12 | Battleship | | | Advanced Computer |
| 14 | Neutronium | Heavy Blaster | | |
| 16 | | Phasor | Trans-Star | |
| 18 | Dreadnought | Langston Shell | | Battle Nexus |

---

# PART 7: AI OPPONENT

## 7.1 AI Design Principles

1. **Plays by the same rules** - no cheating, no free resources
2. **Has personality** - different AI types play differently
3. **Makes mistakes at low difficulty** - suboptimal decisions, slow reactions
4. **Scales up cleanly** - harder AI plays closer to optimal

## 7.2 AI Personalities (MVP: 2)

### The Expansionist
- Prioritizes colonization
- Builds lots of scouts and colony ships
- Spreads thin but claims territory fast
- Weakness: military strength

### The Militarist
- Prioritizes military production
- Builds combat ships early
- Aggressive, attacks when advantaged
- Weakness: slower economic growth

## 7.3 AI Decision Loop

```typescript
interface AIBrain {
  personality: 'expansionist' | 'militarist';
  difficulty: 'easy' | 'medium' | 'hard';
  
  // State tracking
  threatMap: Map<string, number>;  // StarId -> perceived threat
  expansionTargets: string[];      // Planets to colonize
  militaryTargets: string[];       // Enemy assets to attack
}

function aiTakeTurn(player: AIPlayer, gameState: GameState): AIOrders {
  const brain = player.brain;
  
  // 1. Update perception
  updateThreatMap(brain, gameState);
  updateExpansionTargets(brain, gameState);
  
  // 2. Economic decisions
  const buildOrders = decideBuilds(brain, player, gameState);
  
  // 3. Military decisions
  const fleetOrders = decideFleetMovement(brain, player, gameState);
  
  // 4. Research decisions (simple: round-robin or focus on weakness)
  const researchFocus = decideResearch(brain, player);
  
  return { buildOrders, fleetOrders, researchFocus };
}
```

## 7.4 AI Difficulty Scaling

| Aspect | Easy | Medium | Hard |
|--------|------|--------|------|
| Reaction time | 3 turn delay | 1 turn delay | Immediate |
| Expansion efficiency | 60% | 80% | 95% |
| Combat decisions | Often suboptimal | Usually good | Near-optimal |
| Ship designs | Basic templates | Adapted templates | Optimized |
| Threat response | Slow | Normal | Fast |

---

# PART 8: TURN STRUCTURE

## 8.1 Turn Order

Each turn processes in this exact order:

```typescript
async function processTurn(game: GameState): Promise<GameState> {
  // 1. Research completes
  processResearch(game);
  
  // 2. Production completes (ships built, installations built)
  processProduction(game);
  
  // 3. Population grows
  processPopulationGrowth(game);
  
  // 4. Mining occurs (minerals extracted, concentrations deplete)
  processMining(game);
  
  // 5. Fleets move
  processMovement(game);
  
  // 6. Combat resolves (all battles at same locations)
  processCombat(game);
  
  // 7. Colonization occurs
  processColonization(game);
  
  // 8. Check victory conditions
  checkVictory(game);
  
  // 9. AI takes its turn (queues orders for next processing)
  processAI(game);
  
  game.turn++;
  return game;
}
```

## 8.2 Player Actions (Between Turns)

- Set build queues on planets
- Set governor types
- Design new ships
- Issue fleet orders (move, colonize, attack)
- Adjust research focus
- Review intel/reports

---

# PART 9: VICTORY & DEFEAT

## 9.1 Victory Conditions (MVP)

**Domination Victory:** Control 70% of colonizable planets for 3 consecutive turns.

## 9.2 Defeat Conditions

- Lose your homeworld AND all other planets
- Own zero planets for 3 consecutive turns

## 9.3 Post-MVP Victory Conditions

- **Economic Victory:** Reach 50,000 total production capacity
- **Survival Victory:** Survive 100 turns (escalating AI aggression)
- **Technology Victory:** Research all fields to level 20

---

# PART 10: USER INTERFACE

## 10.1 Screen Flow

```
┌──────────────────────────────────────────────────────┐
│                    GAME SCREENS                       │
└──────────────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
       ┌─────────┐  ┌──────────┐  ┌───────────┐
       │  MENU   │  │  GALAXY  │  │  TURN     │
       │ SCREEN  │  │   MAP    │  │ SUMMARY   │
       └────┬────┘  └────┬─────┘  └───────────┘
            │            │
            │     ┌──────┴──────┐
            │     ▼             ▼
            │ ┌─────────┐  ┌─────────┐
            │ │ PLANET  │  │ FLEET   │
            │ │ DETAIL  │  │ DETAIL  │
            │ └─────────┘  └─────────┘
            │
            ▼
       ┌─────────┐
       │  SHIP   │
       │DESIGNER │
       └─────────┘
```

## 10.2 Galaxy Map (Primary Screen)

```
┌─────────────────────────────────────┐
│ Turn 15        ⚙️  Resources: 1,247 │
├─────────────────────────────────────┤
│                                     │
│    ●━━━━━●         ○               │
│      Home  ╲      ╱                 │
│             ╲    ╱                  │
│              ●──●──◐                │
│             ╱        ╲              │
│    ○───────●          ●            │
│           ╱ ╲        ╱             │
│          ○   ○──────●              │
│                      ╲             │
│                       ◉ Enemy      │
│                                     │
├─────────────────────────────────────┤
│ [🔬 Tech] [📊 Economy] [⚔️ Military]│
├─────────────────────────────────────┤
│          [ END TURN ▶ ]            │
└─────────────────────────────────────┘

Legend:
● = Your planet (filled)
○ = Uncolonized (empty)
◐ = Colonizable for you
◉ = Enemy planet
━ = Your fleet route
```

## 10.3 Planet Detail

```
┌─────────────────────────────────────┐
│ ← KEPLER-442b               🏠 Yours│
├─────────────────────────────────────┤
│ Habitability: 72% 🟢               │
│                                     │
│ POPULATION                          │
│ [████████░░] 425,000 / 720,000     │
│ Growth: +8,500 next turn            │
│                                     │
│ PRODUCTION                          │
│ ⚙️ Factories: 42 → 42 Resources    │
│ ⛏️ Mines: 38                        │
│                                     │
│ MINERALS            CONCENTRATION   │
│ Fe: 1,247  [████░░░░░░]  38%       │
│ Bo: 892    [██████░░░░]  62%       │
│ Ge: 156    [██░░░░░░░░]  21%       │
│                                     │
├─────────────────────────────────────┤
│ BUILD QUEUE                         │
│ 1. 🏭 Factory (3 turns)            │
│ 2. 🏭 Factory                       │
│ 3. 🚀 Destroyer "Wolf"             │
│ [+ Add to Queue]                    │
├─────────────────────────────────────┤
│ Governor: [Balanced ▼]              │
└─────────────────────────────────────┘
```

## 10.4 Fleet Detail

```
┌─────────────────────────────────────┐
│ ← STRIKE FORCE ALPHA                │
├─────────────────────────────────────┤
│ Location: In transit to Kepler-186 │
│ ETA: 2 turns                        │
│                                     │
│ SHIPS                               │
│ 🚀 Destroyer "Wolf" ×3             │
│ 🛡️ Cruiser "Hammer" ×1              │
│                                     │
│ STATS                               │
│ Strength: 2,450                     │
│ Speed: Warp 8                       │
│ Fuel: [████████░░] 340/425         │
│ Range: 180 ly remaining             │
│                                     │
├─────────────────────────────────────┤
│ ORDERS                              │
│ → Move to Kepler-186                │
│ → [Attack enemy fleet]              │
│                                     │
│ [✏️ Change Orders]                  │
└─────────────────────────────────────┘
```

## 10.5 Turn Summary

After END TURN, show:

```
┌─────────────────────────────────────┐
│         TURN 15 → 16 SUMMARY        │
├─────────────────────────────────────┤
│                                     │
│ 📈 ECONOMY                          │
│ • Production: 847 (+23)             │
│ • Minerals extracted: 156 Fe, 89 Bo│
│                                     │
│ 🔬 RESEARCH                         │
│ • Energy: Level 5 → 6!              │
│   Unlocked: Disruptor               │
│                                     │
│ 🚀 SHIPS                            │
│ • Kepler-442b: Destroyer completed  │
│                                     │
│ ⚔️ COMBAT                           │
│ • Battle at Proxima: VICTORY        │
│   Lost: 1 Frigate                   │
│   Destroyed: 2 enemy Scouts         │
│                                     │
│ ⚠️ ALERTS                           │
│ • Enemy fleet detected near Sol     │
│ • Germanium low on 3 planets        │
│                                     │
│           [ CONTINUE ]              │
└─────────────────────────────────────┘
```

---

# PART 11: DATA MODEL SUMMARY

## 11.1 Complete Game State

```typescript
interface GameState {
  // Meta
  id: string;
  seed: number;
  turn: number;
  settings: GameSettings;
  
  // Map
  stars: Star[];
  
  // Players
  humanPlayer: Player;
  aiPlayers: AIPlayer[];
  
  // Entities
  fleets: Fleet[];
  
  // History
  turnLogs: TurnLog[];
  combatLogs: CombatLog[];
}

interface GameSettings {
  galaxySize: 'small' | 'medium' | 'large';
  aiCount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
}

interface Player {
  id: string;
  name: string;
  species: Species;
  techLevels: TechLevels;
  researchFocus: TechField;
  researchProgress: number;
  
  // Economy (global)
  resources: number;
  minerals: { iron: number; boranium: number; germanium: number };
  
  // Assets
  ownedPlanetIds: string[];
  shipDesigns: ShipDesign[];
  
  // Stats
  totalProduction: number;
  totalPopulation: number;
}

interface Species {
  id: string;
  name: string;
  description: string;
  portrait: string;
  habitat: {
    idealTemperature: number;
    idealAtmosphere: number;
    toleranceRadius: number;
  };
  traits: SpeciesTrait[];
}

type SpeciesTrait = 
  | { type: 'growth'; modifier: number }      // +/- population growth
  | { type: 'mining'; modifier: number }      // +/- mining efficiency
  | { type: 'research'; modifier: number }    // +/- research speed
  | { type: 'shipCost'; modifier: number };   // +/- ship construction cost
```

---

# PART 12: BUILD SEQUENCE

## Phase 1: Foundation (Week 1)
1. ✅ Ship designer (DONE - from prototype)
2. Data models and game state
3. Galaxy generation
4. Planet model with habitability
5. Basic map UI (display only)

## Phase 2: Economy (Week 2)
6. Planet detail screen
7. Build queues
8. Production processing
9. Mining and depletion
10. Population growth
11. Turn processing (basic)

## Phase 3: Ships & Movement (Week 3)
12. Fleet model
13. Fleet movement
14. Fuel consumption
15. Fleet UI
16. Colonization

## Phase 4: Combat & AI (Week 4)
17. Combat resolution
18. Combat UI (prediction + results)
19. Basic AI (expansion)
20. Basic AI (military)

## Phase 5: Polish (Week 5)
21. Turn summary screen
22. Victory/defeat conditions
23. Save/load game
24. Balance tuning
25. Bug fixes and polish

---

# PART 13: TECHNICAL ARCHITECTURE

## 13.1 Project Structure

```
src/
├── app/
│   ├── models/
│   │   ├── game.model.ts
│   │   ├── planet.model.ts
│   │   ├── fleet.model.ts
│   │   ├── ship.model.ts
│   │   ├── combat.model.ts
│   │   └── index.ts
│   ├── data/
│   │   ├── species.data.ts
│   │   ├── hulls.data.ts
│   │   ├── components.data.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── game-state.service.ts
│   │   ├── galaxy-generator.service.ts
│   │   ├── economy.service.ts
│   │   ├── combat.service.ts
│   │   ├── ai.service.ts
│   │   ├── ship-compiler.service.ts
│   │   ├── persistence.service.ts
│   │   └── index.ts
│   ├── screens/
│   │   ├── main-menu/
│   │   ├── new-game/
│   │   ├── galaxy-map/
│   │   ├── planet-detail/
│   │   ├── fleet-detail/
│   │   ├── ship-designer/
│   │   ├── turn-summary/
│   │   └── index.ts
│   ├── components/
│   │   ├── star-map/
│   │   ├── planet-card/
│   │   ├── fleet-card/
│   │   ├── resource-bar/
│   │   ├── build-queue/
│   │   └── index.ts
│   └── app.component.ts
├── styles.scss
└── main.ts
```

## 13.2 State Management

Use Angular signals throughout:

```typescript
// services/game-state.service.ts
@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Core state
  private _game = signal<GameState | null>(null);
  
  // Public selectors
  readonly game = this._game.asReadonly();
  readonly turn = computed(() => this._game()?.turn ?? 0);
  readonly player = computed(() => this._game()?.humanPlayer);
  readonly planets = computed(() => this._game()?.stars.flatMap(s => s.planets) ?? []);
  readonly fleets = computed(() => this._game()?.fleets ?? []);
  
  // Derived
  readonly ownedPlanets = computed(() => 
    this.planets().filter(p => p.ownerId === this.player()?.id)
  );
  
  // Actions
  newGame(settings: GameSettings): void { ... }
  endTurn(): void { ... }
  issueFleetOrder(fleetId: string, order: FleetOrder): void { ... }
  setBuildQueue(planetId: string, queue: BuildItem[]): void { ... }
}
```

## 13.3 Persistence

```typescript
// services/persistence.service.ts
@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly SAVE_KEY = 'stellar-remnants-save';
  
  save(game: GameState): void {
    const json = JSON.stringify(game);
    localStorage.setItem(this.SAVE_KEY, json);
  }
  
  load(): GameState | null {
    const json = localStorage.getItem(this.SAVE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  }
  
  hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }
  
  deleteSave(): void {
    localStorage.removeItem(this.SAVE_KEY);
  }
}
```

---

# APPENDIX A: SPECIES (MVP Set)

## Terrans (Humans)
- **Habitat:** Temp 20, Atmo 50, Tolerance 40
- **Traits:** None (baseline)
- **Playstyle:** Flexible, good at everything

## Crystallids
- **Habitat:** Temp -40, Atmo 20, Tolerance 35
- **Traits:** +20% mining, -10% growth
- **Playstyle:** Economic powerhouse, slower expansion

## Pyreans
- **Habitat:** Temp 70, Atmo 70, Tolerance 30
- **Traits:** +15% research, -10% mining
- **Playstyle:** Tech rush, fewer suitable planets

## Voidborn
- **Habitat:** Temp 0, Atmo 10, Tolerance 50
- **Traits:** -20% ship cost, -15% production
- **Playstyle:** Military focused, wide habitat range

---

# APPENDIX B: BALANCE TARGETS

| Metric | Target |
|--------|--------|
| Average game length | 30-40 turns |
| Turns to first combat | 8-12 |
| Turns to first colonization | 3-5 |
| Planets controlled at victory | 12-18 |
| Ship designs used per game | 4-8 |
| Research levels at endgame | 12-16 |
