import { Hull, HullSlot, SlotType } from '../data/hulls.data';
import { Component, COMPONENTS } from '../data/components.data';
import { MiniaturizedComponent } from '../utils/miniaturization.util';

/**
 * Ship Design Models
 *
 * Represents a custom ship design with a hull and installed components
 * Based on Stars! modular ship design system
 */

export interface SlotAssignment {
  slotId: string; // References HullSlot.id
  componentId: string | null; // null if empty slot
}

export interface ShipDesign {
  id: string;
  name: string;
  hullId: string;
  slots: SlotAssignment[];
  createdTurn: number;
  playerId: string;
}

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
    if (!assignment.componentId) continue;

    const miniComponent = miniComponentMap.get(assignment.componentId);
    const baseComponent: Component = COMPONENTS[assignment.componentId];

    if (!miniComponent || !baseComponent) {
      errors.push(`Component ${assignment.componentId} not found`);
      continue;
    }

    // Add miniaturized mass and cost
    totalMass += miniComponent.mass;
    if (miniComponent.cost.ironium) cost.ironium += miniComponent.cost.ironium;
    if (miniComponent.cost.boranium) cost.boranium += miniComponent.cost.boranium;
    if (miniComponent.cost.germanium) cost.germanium += miniComponent.cost.germanium;

    // Apply component effects based on type (using base stats)
    switch (baseComponent.type) {
      case 'engine':
        hasEngine = true;
        if (baseComponent.warpSpeed && baseComponent.warpSpeed > warpSpeed) {
          warpSpeed = baseComponent.warpSpeed;
          fuelEfficiency = baseComponent.fuelEfficiency || 0;
          idealWarp = baseComponent.idealWarp || baseComponent.warpSpeed;
        }
        break;

      case 'weapon':
        firepower += baseComponent.damage || 0;
        if (baseComponent.accuracy) {
          accuracy = Math.max(accuracy, baseComponent.accuracy);
        }
        if (baseComponent.initiative) {
          initiative = Math.max(initiative, baseComponent.initiative);
        }
        break;

      case 'shield':
        shields += baseComponent.shieldStrength || 0;
        break;

      case 'scanner':
        scanRange = Math.max(scanRange, baseComponent.scanRange || 0);
        if (baseComponent.canDetectCloaked) {
          canDetectCloaked = true;
        }
        break;

      case 'cargo':
        cargoCapacity += baseComponent.cargoCapacity || 0;
        break;
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
  switch (component.type) {
    case 'engine':
      return 'engine';
    case 'weapon':
      return 'weapon';
    case 'shield':
      return 'shield';
    case 'scanner':
      return 'electronics';
    case 'armor':
      return 'general';
    case 'cargo':
      return 'cargo';
    case 'electronics':
      return 'electronics';
    default:
      return 'general';
  }
}

/**
 * Create an empty ship design from a hull
 */
export function createEmptyDesign(
  hull: Hull,
  playerId: string,
  turn: number
): ShipDesign {
  const slots: SlotAssignment[] = hull.slots.map((slot) => ({
    slotId: slot.id,
    componentId: null,
  }));

  return {
    id: `design_${Date.now()}`,
    name: `New ${hull.name}`,
    hullId: hull.id,
    slots,
    createdTurn: turn,
    playerId,
  };
}
