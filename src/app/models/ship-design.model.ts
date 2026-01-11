import { HullTemplate, ComponentStats, SlotType, SlotDefinition, getSlotTypeForComponentType } from '../data/tech-atlas.types';
import { getMiniaturizedMass, getMiniaturizedCost } from '../utils/miniaturization.util';
import { SlotAssignment, CompiledShipStats, PlayerTech } from '../models/game.model';
import { validateShipDesign } from '../services/validation.service';
import { getComponentsLookup } from '../utils/data-access.util';

/**
 * Ship Design Models
 *
 * Represents a custom ship design with a hull and installed components
 * Based on Stars! modular ship design system
 */

// Helper interface for slot compatibility checking
interface HullSlot {
  id: string;
  allowedTypes: SlotType[];
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
}

// Convert SlotDefinition to HullSlot for compatibility
function convertSlotDefinition(slot: SlotDefinition, index: number): HullSlot {
  return {
    id: slot.Code || `slot_${index}`,
    allowedTypes: slot.Allowed.map(type => getSlotTypeForComponentType(type)) as SlotType[],
    max: slot.Max,
    required: slot.Required,
    editable: slot.Editable,
    size: typeof slot.Size === 'number' ? slot.Size : undefined,
  };
}

/**
 * Compile ship stats from hull and installed components
 * Uses miniaturized components for mass/cost, but base components for capabilities
 */
export function compileShipStats(
  hull: HullTemplate,
  assignments: SlotAssignment[],
  techLevels: PlayerTech,
): CompiledShipStats {
  const errors: string[] = [];
  const COMPONENTS = getComponentsLookup();

  // Start with hull base stats
  let totalMass = hull.Stats.Mass;
  let warpSpeed = 0;
  let fuelEfficiency: number | undefined = undefined;
  let idealWarp = 0;
  let isRamscoop = false;
  let firepower = 0;
  let shields = 0;
  let armor = hull.Stats.Armor || 0; // Start with hull base armor
  let accuracy = 0;
  let initiative = hull.Stats.Initiative || 0; // Start with hull base initiative
  let cargoCapacity = hull.Stats.Cargo || 0;
  let fuelCapacity = hull.Stats['Max Fuel'] || 0;
  let colonistCapacity = 0;
  let scanRange = 0;
  let penScanRange = 0;
  let canDetectCloaked = false;
  let hasEngine = false;
  let hasColonyModule = false;
  let miningRate = 0;
  let terraformRate = 0;
  let bombing = { kill: 0, destroy: 0 };
  let massDriver = { speed: 0, catch: 0 };
  let maxWeaponRange = 0;

  const cost = {
    resources: hull.Cost.Resources,
    ironium: hull.Cost.Ironium,
    boranium: hull.Cost.Boranium,
    germanium: hull.Cost.Germanium,
  };

  const components: Array<{ id: string; name: string; quantity: number }> = [];

  // Process each slot assignment
  for (const assignment of assignments) {
    if (!assignment.components || assignment.components.length === 0) continue;

    for (const compAssignment of assignment.components) {
      const baseComponent: ComponentStats = COMPONENTS[compAssignment.componentId];

      if (!baseComponent) {
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
      const miniaturizedMass = getMiniaturizedMass(baseComponent, techLevels);
      const miniaturizedCost = getMiniaturizedCost(baseComponent, techLevels);
      
      totalMass += miniaturizedMass * count;
      if (miniaturizedCost.ironium) cost.ironium += miniaturizedCost.ironium * count;
      if (miniaturizedCost.boranium) cost.boranium += miniaturizedCost.boranium * count;
      if (miniaturizedCost.germanium) cost.germanium += miniaturizedCost.germanium * count;
      if (miniaturizedCost.resources) cost.resources += miniaturizedCost.resources * count;

      // Apply component effects based on type (using base stats, multiplied by count)
      if (baseComponent.stats) {
        if (baseComponent.stats.armor) {
          armor += baseComponent.stats.armor * count;
        }

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

      // Colonist Capacity - check for settler trait
      const settlerTrait = baseComponent.traits?.find(t => t.type === 'settler');
      if (settlerTrait && settlerTrait.properties.colonistCapacity) {
        colonistCapacity += (settlerTrait.properties.colonistCapacity as number) * count;
        hasColonyModule = true;
      }

      switch (baseComponent.type.toLowerCase()) {
        case 'engine':
          hasEngine = true;
          // For engines, only the best one matters (not cumulative)
          if (baseComponent.stats.maxWarp && baseComponent.stats.maxWarp > warpSpeed) {
            warpSpeed = baseComponent.stats.maxWarp;
            fuelEfficiency = baseComponent.stats.fuelEff;
            idealWarp = baseComponent.stats.maxWarp;
            isRamscoop = !!baseComponent.isRamscoop;
          }
          break;

        case 'weapon':
          firepower += (baseComponent.stats.power || 0) * count;
          if (baseComponent.stats?.range) {
            maxWeaponRange = Math.max(maxWeaponRange, baseComponent.stats.range);
          }
          // Note: Weapon accuracy is intrinsic to the weapon and doesn't add to ship accuracy rating
          // Ship accuracy rating comes from battle computers
          if (baseComponent.stats.initiative) {
            initiative += baseComponent.stats.initiative * count; // Initiative is additive
          }
          break;

        case 'shield':
          shields += (baseComponent.stats.shield || 0) * count;
          break;

        case 'computer':
        case 'electronics':
        case 'electrical':
          // Battle computers add to ship accuracy
          if (baseComponent.stats.accuracy) {
            accuracy += baseComponent.stats.accuracy * count;
          }
          // Jammers and other electrical components could be handled here
          break;

        case 'mechanical':
          // Handle mechanical components like maneuvering jets
          if (baseComponent.stats.initiative) {
            initiative += baseComponent.stats.initiative * count; // Initiative is additive
          }
          if (baseComponent.stats.cap) {
            cargoCapacity += baseComponent.stats.cap * count;
          }
          break;

        case 'scanner':
          // For scanners, only the best one matters
          scanRange = Math.max(scanRange, baseComponent.stats.scan || 0);
          if (baseComponent.stats?.pen) {
            penScanRange = Math.max(penScanRange, baseComponent.stats.pen);
          }
          if (baseComponent.stats.detection && baseComponent.stats.detection > 0) {
            canDetectCloaked = true;
          }
          break;

        case 'cargo':
          cargoCapacity += (baseComponent.stats.cap || 0) * count;
          break;
      }
    }
  }

  // Validation
  const isStarbase = !!hull.isStarbase;
  errors.push(...validateShipDesign(hull, assignments, getComponentsLookup()));

  const isValid = errors.length === 0;

  return {
    warpSpeed,
    fuelCapacity,
    fuelEfficiency,
    idealWarp,
    isRamscoop,
    firepower,
    maxWeaponRange,
    armor,
    shields,
    accuracy,
    initiative,
    cargoCapacity,
    colonistCapacity,
    scanRange,
    penScanRange,
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
export function canInstallComponent(component: ComponentStats, slot: HullSlot): boolean {
  // Map component types to slot types
  const componentSlotType = getSlotTypeForComponent(component);

  // Check if slot allows this component type
  return slot.allowedTypes.includes(componentSlotType);
}

/**
 * Get the slot type that corresponds to a component type
 * Uses the data-driven registry instead of hardcoded switch statement
 */
function getSlotTypeForComponent(component: ComponentStats): SlotType {
  return getSlotTypeForComponentType(component.type);
}

/**
 * Create an empty ship design from a hull
 */
export function createEmptyDesign(
  hull: HullTemplate,
  playerId: string,
  turn: number
): import('../models/game.model').ShipDesign {
  const slots: SlotAssignment[] = hull.Slots.map((slot: SlotDefinition, index: number) => ({
    slotId: slot.Code || `slot_${index}`,
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