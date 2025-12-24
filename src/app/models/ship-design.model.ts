import { Hull, HullSlot, SlotType } from '../data/hulls.data';
import { Component, COMPONENTS } from '../data/components.data';
import { MiniaturizedComponent } from '../utils/miniaturization.util';
import { SlotAssignment, ComponentAssignment } from '../models/game.model';

/**
 * Ship Design Models
 *
 * Represents a custom ship design with a hull and installed components
 * Based on Stars! modular ship design system
 */

export interface CompiledShipStats {
  // Movement
  warpSpeed: number;
  fuelCapacity: number;
  fuelEfficiency: number; // 0 = ramscoop
  idealWarp: number;

  // Combat
  firepower: number;
  armor: number;
  shields: number;
  accuracy: number;
  initiative: number;

  // Utility
  cargoCapacity: number;
  colonistCapacity: number;
  scanRange: number;
  canDetectCloaked: boolean;

  // Mass and cost
  mass: number;
  cost: {
    ironium: number;
    boranium: number;
    germanium: number;
  };

  // Flags
  hasEngine: boolean;
  hasColonyModule: boolean;
  isStarbase: boolean; // warpSpeed === 0

  // Validation
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Compile ship stats from hull and installed components
 * Uses miniaturized components for mass/cost, but base components for capabilities
 */
export function compileShipStats(
  hull: Hull,
  assignments: SlotAssignment[],
  miniaturizedComponents: MiniaturizedComponent[]
): CompiledShipStats {
  const errors: string[] = [];

  // Start with hull base stats
  let totalMass = hull.mass;
  let warpSpeed = 0;
  let fuelEfficiency = 0;
  let idealWarp = 0;
  let firepower = 0;
  let shields = 0;
  let accuracy = 0;
  let initiative = 0;
  let cargoCapacity = hull.cargoCapacity || 0;
  let colonistCapacity = 0;
  let scanRange = 0;
  let canDetectCloaked = false;
  let hasEngine = false;
  let hasColonyModule = false;

  const cost = {
    ironium: hull.baseCost.ironium,
    boranium: hull.baseCost.boranium,
    germanium: hull.baseCost.germanium,
  };

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

      // Add miniaturized mass and cost (multiplied by count)
      totalMass += miniComponent.mass * count;
      if (miniComponent.cost.ironium) cost.ironium += miniComponent.cost.ironium * count;
      if (miniComponent.cost.boranium) cost.boranium += miniComponent.cost.boranium * count;
      if (miniComponent.cost.germanium) cost.germanium += miniComponent.cost.germanium * count;

      // Apply component effects based on type (using base stats, multiplied by count)
      switch (baseComponent.type.toLowerCase()) {
        case 'engine':
          hasEngine = true;
          // For engines, only the best one matters (not cumulative)
          if (baseComponent.warpSpeed && baseComponent.warpSpeed > warpSpeed) {
            warpSpeed = baseComponent.warpSpeed;
            fuelEfficiency = baseComponent.fuelEfficiency || 0;
            idealWarp = baseComponent.idealWarp || baseComponent.warpSpeed;
          }
          break;

        case 'weapon':
          firepower += (baseComponent.damage || 0) * count;
          if (baseComponent.accuracy) {
            accuracy = Math.max(accuracy, baseComponent.accuracy);
          }
          if (baseComponent.initiative) {
            initiative = Math.max(initiative, baseComponent.initiative);
          }
          break;

        case 'shield':
          shields += (baseComponent.shieldStrength || 0) * count;
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
    fuelCapacity: hull.fuelCapacity,
    fuelEfficiency,
    idealWarp,
    firepower,
    armor: hull.armor,
    shields,
    accuracy,
    initiative,
    cargoCapacity,
    colonistCapacity,
    scanRange,
    canDetectCloaked,
    mass: Math.round(totalMass * 10) / 10,
    cost,
    hasEngine,
    hasColonyModule,
    isStarbase,
    isValid,
    validationErrors: errors,
  };
}

/**
 * Check if a component can be installed in a specific slot
 */
export function canInstallComponent(
  component: Component,
  slot: HullSlot
): boolean {
  // Map component types to slot types
  const componentSlotType = getSlotTypeForComponent(component);

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
