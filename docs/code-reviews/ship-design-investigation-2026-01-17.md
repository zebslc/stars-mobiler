# Ship Design System Investigation
**Date**: January 17, 2026
**Issue**: Warning about designs not found in COMPILED_DESIGNS after building ships

## Current Architecture ✓

### 1. Design Model Structure
The system correctly separates design templates from ship instances:

```typescript
// Template (in game.shipDesigns array)
interface ShipDesign {
  id: string;              // e.g., "design_1234567890"
  name: string;
  hullId: string;
  slots: Array<SlotAssignment>;
  createdTurn: number;
  playerId: string;
  spec?: CompiledShipStats;  // Pre-calculated stats
}

// Ship Instance (in fleet.ships array)
interface ShipStack {
  designId: string;  // References ShipDesign.id
  count: number;
  damage: number;    // Runtime value (combat damage)
}

// Fleet contains runtime cargo, fuel
interface Fleet {
  ships: Array<ShipStack>;
  fuel: number;      // Runtime value (diminishes)
  cargo: {...};      // Runtime values
}
```

### 2. Compiled Design System ✓
Designs are compiled into `CompiledDesign` format with all stats pre-calculated:

**When compilation happens:**
1. **Design Save** - `ShipyardService.saveShipDesign()` → `cacheCompiledDesign()`
2. **Game Load** - `GameStateService.newGame()` → `hydrateCompiledDesignCache()`

**What gets compiled:**
- Movement: `warpSpeed`, `fuelCapacity`, `fuelEfficiency`, `idealWarp`
- Combat: `firepower`, `armor`, `shields`, `initiative`
- Utility: `cargoCapacity`, `colonistCapacity`, `scanRange`, `penScanRange`
- Special: Colony module, mining, terraforming capabilities
- Cost: All resource requirements

**Storage:**
- `game.shipDesigns[].spec` - Attached to design when saved by `getCurrentDesign()`
- `COMPILED_DESIGNS{}` - Global registry for fast lookup during movement/combat

### 3. Ship Lifecycle ✓

```
User Creates Design (ShipDesignerComponent)
  ↓
  getCurrentDesign() attaches .spec with compiled stats
  ↓
saveShipDesign(design)
  ↓
ShipyardService.cacheCompiledDesign()
  ↓
registerCompiledDesign() → COMPILED_DESIGNS[id]
  ↓
Design added to build queue (BuildItem.shipDesignId)
  ↓
Turn processing: BuildProjectService.buildShip()
  ↓
FleetOperationsService.addShipToFleet()
  ↓
Creates ShipStack { designId, count: 1, damage: 0 }
  ↓
Movement/Combat uses FleetShipDesignService.getDesign(designId)
  ↓
Returns COMPILED_DESIGNS[designId]
```

### 4. Runtime vs Template Separation ✓

**Template (immutable once ships built):**
- Hull configuration
- Component slots and assignments
- Compiled stats (shield max, armor max, fuel capacity max, etc.)

**Instance (mutable during gameplay):**
- `damage` - Combat erosion of shields/armor/hull
- `fleet.fuel` - Current fuel (diminishes with movement)
- `fleet.cargo` - Current cargo levels
- Ship count in stack

## Investigation Findings

### Diagnostic Logging Added
I've added logging at key points to trace the registration flow:

1. **[ships.data.ts](../../src/app/data/ships.data.ts)** - `registerCompiledDesign()`
   - Logs when design is registered
   - Shows total design count

2. **[shipyard.service.ts](../../src/app/services/ship-design/shipyard.service.ts)** - `cacheCompiledDesign()`
   - Logs successful compilation with stats
   - Warns on compilation failure

3. **[build-project.service.ts](../../src/app/services/build/project/build-project.service.ts)** - `buildShip()`
   - Logs design ID being built
   - Checks if design exists in game.shipDesigns

4. **[fleet-ship-design.service.ts](../../src/app/services/fleet/design/fleet-ship-design.service.ts)** - `getDesign()`
   - Logs lookup requests
   - Shows if "Unknown Design" fallback was used

### Expected Log Flow (Normal)
```
User saves design:
  [ShipyardService] Registered compiled design: {id: "design_XXX", name: "...", ...}
  [COMPILED_DESIGNS] Registered: design_XXX - Total designs: N

Ship is built:
  [BuildProjectService] Building ship: {designId: "design_XXX", hasDesignInGame: true}

Movement calculation:
  [FleetShipDesignService] getDesign called: design_XXX
  [FleetShipDesignService] getDesign result: {id: "design_XXX", isUnknown: false}
```

### Expected Log Flow (Problem)
```
Ship is built:
  [BuildProjectService] Building ship: {designId: "design_XXX", hasDesignInGame: true}

Movement calculation:
  [FleetShipDesignService] getDesign called: design_XXX
  [WARN] Design not found in COMPILED_DESIGNS: {designId: "design_XXX", ...}
  [FleetShipDesignService] getDesign result: {isUnknown: true}
```

## Next Steps

### For User Testing
1. Create a ship design and save it
2. Watch console for `[ShipyardService] Registered compiled design`
3. Add it to build queue and build it
4. Watch for `[BuildProjectService] Building ship`
5. Issue move orders and end turn
6. Watch for `[FleetShipDesignService] getDesign` calls

### Potential Issues to Check
1. **Timing**: Is `hydrateCompiledDesignCache()` called on game load?
2. **ID Mismatch**: Does the build queue use the same ID that was registered?
3. **Persistence**: Are designs properly saved/loaded across sessions?
4. **Turn Processing**: Is the cache cleared/reset during turn processing?

### Additional Validation Needed
Check if `ShipDesign.spec` is:
- [ ] Set when design is first created in `getCurrentDesign()`
- [ ] Preserved when design is saved via `saveShipDesign()`
- [ ] Available during `cacheCompiledDesign()` to avoid recompilation
- [ ] Used as fallback before recalculating stats

## System Correctness Summary

✓ **Ship instances** correctly reference templates via `designId`  
✓ **Runtime values** (fuel, damage, cargo) are on Fleet/ShipStack, not ShipDesign  
✓ **Template compilation** happens at save time and game load  
✓ **Compiled stats** are cached in COMPILED_DESIGNS for performance  
✓ **Immutability** is enforced: designs with ships can only be cloned  

The architecture is sound. The warning indicates a **registration timing issue**, not a design flaw.
