import { Hull, HullSlot, SlotType } from '../data/hulls.data';
import { Component, COMPONENTS } from '../data/components.data';
import { MiniaturizedComponent } from '../utils/miniaturization.util';
import { SlotAssignment, ComponentAssignment, CompiledShipStats } from '../models/game.model';

/**
 * Ship Design Models
 *
 * Represents a custom ship design with a hull and installed components
 * Based on Stars! modular ship design system
 */

/**
 * Compile ship stats from hull and installed components
 * Uses miniaturized components for mass/cost, but base components for capabilities
 */
export function compileShipStats(
  hull: Hull,
  assignments: SlotAssignment[],
  miniaturizedComponents: MiniaturizedComponent[],
): CompiledShipStats {
  const errors: string[] = [];

  // Start with hull base stats
  let totalMass = hull.mass;
  let warpSpeed = 0;
  let fuelEfficiency: number | undefined = undefined;
  let idealWarp = 0;
  let isRamscoop = false;
  let firepower = 0;
  let shields = 0;
  let accuracy = 0;
  let initiative = hull.Stats.Initiative || 0; // Start with hull base initiative
  let cargoCapacity = hull.cargoCapacity || 0;
  let fuelCapacity = hull.fuelCapacity || 0;
  let colonistCapacity = 0;
  let scanRange = 0;
  let canDetectCloaked = false;
  let hasEngine = false;
  let hasColonyModule = false;
  let miningRate = 0;
  let terraformRate = 0;
  let bombing = { kill: 0, destroy: 0 };
  let massDriver = { speed: 0, catch: 0 };

  const cost = {
    resources: hull.baseCost.resources,
    ironium: hull.baseCost.ironium,
    boranium: hull.baseCost.boranium,
    germanium: hull.baseCost.germanium,
  };

  const components: Array<{ id: string; name: string; quantity: number }> = [];

  // Build component lookups
  const miniComponentMap = new Map<string, MiniaturizedComponent>();
  miniaturizedComponents.forEach((comp) => miniComponentMap.set(comp.id, comp));

  // Process each slot assignment
  for (const assignment of assignments) {
    if (!assignment.components || assignment.components.length === 0) continue;

    for (const compAssignment of assignment.components) {
      const miniComponent = miniComponentMap.get(compAssignment.componentId);
      const baseComponent: Component = COMPONENTS[compAssignment.componentId];

      if (!miniComponent || !baseComponent) {
        errors.push(`Component ${compAssignment.componentId} not found`);
        continue;
      }

      const count = compAssignment.count;

      // Track component quantity for summary
      const existingComp = components.find((c) => c.id === compAssignment.componentId);
      if (existingComp) {
        existingComp.quantity += count;
      } else {
        components.push({
          id: compAssignment.componentId,
          name: baseComponent.name,
          quantity: count,
        });
      }

      // Add miniaturized mass and cost (multiplied by count)
      totalMass += miniComponent.mass * count;
      if (miniComponent.cost.ironium) cost.ironium += miniComponent.cost.ironium * count;
      if (miniComponent.cost.boranium) cost.boranium += miniComponent.cost.boranium * count;
      if (miniComponent.cost.germanium) cost.germanium += miniComponent.cost.germanium * count;

      // Apply component effects based on type (using base stats, multiplied by count)
      if (baseComponent.stats) {
        if (baseComponent.stats.mining) {
          miningRate += baseComponent.stats.mining * count;
        }
        if (baseComponent.stats.terraform) {
          terraformRate += baseComponent.stats.terraform * count;
        }

        // Bombing
        if (baseComponent.type.toLowerCase() === 'bomb') {
          if (baseComponent.stats.kill) {
            bombing.kill += baseComponent.stats.kill * count;
          }
          if (baseComponent.stats.struct) {
            bombing.destroy += baseComponent.stats.struct * count;
          }
        }

        // Mass Driver
        if (baseComponent.type.toLowerCase() === 'massdriver') {
          if (baseComponent.stats.driverSpeed) {
            massDriver.speed = Math.max(massDriver.speed, baseComponent.stats.driverSpeed);
          }
          if (baseComponent.stats.driverCatch) {
            massDriver.catch += baseComponent.stats.driverCatch * count;
          }
        }
      }

      // Colonist Capacity
      if (baseComponent.colonistCapacity) {
        colonistCapacity += baseComponent.colonistCapacity * count;
        hasColonyModule = true;
      }

      switch (baseComponent.type.toLowerCase()) {
        case 'engine':
          hasEngine = true;
          // For engines, only the best one matters (not cumulative)
          if (baseComponent.warpSpeed && baseComponent.warpSpeed > warpSpeed) {
            warpSpeed = baseComponent.warpSpeed;
            fuelEfficiency = baseComponent.fuelEfficiency;
            idealWarp = baseComponent.idealWarp || baseComponent.warpSpeed;
            // Only engines ending in "Scoop" are ramscoops (flagged in data)
            isRamscoop = !!baseComponent.isRamscoop;
          }
          break;

        case 'weapon':
          firepower += (baseComponent.damage || 0) * count;
          // Note: Weapon accuracy is intrinsic to the weapon and doesn't add to ship accuracy rating
          // Ship accuracy rating comes from battle computers
          if (baseComponent.initiative) {
            initiative += baseComponent.initiative * count; // Initiative is additive
          }
          break;

        case 'shield':
          shields += (baseComponent.shieldStrength || 0) * count;
          break;

        case 'computer':
        case 'electronics':
        case 'elect':
          // Battle computers add to ship accuracy
          if (baseComponent.accuracy) {
            accuracy += baseComponent.accuracy * count;
          }
          // Jammers and other electrical components could be handled here
          break;

        case 'mechanical':
        case 'mech':
          // Handle mechanical components like maneuvering jets
          if (baseComponent.initiative) {
            initiative += baseComponent.initiative * count; // Initiative is additive
          }
          if (baseComponent.cargoCapacity) {
            cargoCapacity += baseComponent.cargoCapacity * count;
          }
          if (baseComponent.fuelCapacity) {
            fuelCapacity += baseComponent.fuelCapacity * count;
          }
          break;

        case 'scanner':
          // For scanners, only the best one matters
          scanRange = Math.max(scanRange, baseComponent.scanRange || 0);
          if (baseComponent.canDetectCloaked) {
            canDetectCloaked = true;
          }
          break;

        case 'cargo':
          cargoCapacity += (baseComponent.cargoCapacity || 0) * count;
          break;
      }
    }
  }

  // Validation
  const isStarbase = warpSpeed === 0;
  if (!isStarbase && !hasEngine) {
    errors.push('Ship requires at least one engine');
  }

  const isValid = errors.length === 0;

  return {
    warpSpeed,
    fuelCapacity,
    fuelEfficiency,
    idealWarp,
    isRamscoop,
    firepower,
    armor: hull.armor,
    shields,
    accuracy,
    initiative,
    cargoCapacity,
    colonistCapacity,
    scanRange,
    canDetectCloaked,
    miningRate,
    terraformRate,
    bombing,
    massDriver,
    mass: Math.round(totalMass * 10) / 10,
    cost,
    hasEngine,
    hasColonyModule,
    isStarbase,
    isValid,
    validationErrors: errors,
    components,
  };
}

/**
 * Check if a component can be installed in a specific slot
 */
export function canInstallComponent(component: Component, slot: HullSlot): boolean {
  // Map component types to slot types
  const componentSlotType = getSlotTypeForComponent(component);

  console.log(
    `Checking install: ${component.name} (${componentSlotType}) into ${slot.id} (Allowed: ${slot.allowedTypes})`,
  );

  // Check if slot allows this component type
  return slot.allowedTypes.includes(componentSlotType);
}

/**
 * Get the slot type that corresponds to a component type
 */
function getSlotTypeForComponent(component: Component): SlotType {
  switch (component.type.toLowerCase()) {
    case 'engine':
      return SlotType.Engine;
    case 'weapon':
      return SlotType.Weapon;
    case 'shield':
      return SlotType.Shield;
    case 'scanner':
      return SlotType.Scanner;
    case 'armor':
      return SlotType.Armor;
    case 'cargo':
      return SlotType.Cargo;
    case 'electronics':
    case 'computer':
    case 'elect':
      return SlotType.Elect;
    case 'mechanical':
    case 'mech':
      return SlotType.Mech;
    case 'mining':
      return SlotType.Mech; // Mining components go in mechanical slots
    case 'bomb':
      return SlotType.Bomb;
    case 'orbital':
      return SlotType.Orbital;
    case 'mine':
      return SlotType.Mine;
    case 'dock':
      return SlotType.Dock;
    default:
      return SlotType.General;
  }
}

/**
 * Create an empty ship design from a hull
 */
export function createEmptyDesign(
  hull: Hull,
  playerId: string,
  turn: number
): import('../models/game.model').ShipDesign {
  const slots: SlotAssignment[] = hull.slots.map((slot: HullSlot) => ({
    slotId: slot.id,
    components: [],
  }));

  return {
    id: `design_${Date.now()}`,
    name: `New ${hull.Name}`,
    hullId: hull.id || hull.Name.toLowerCase().replace(/\s+/g, '_'),
    slots,
    createdTurn: turn,
    playerId,
  };
}
