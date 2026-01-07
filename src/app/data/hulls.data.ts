// Legacy hulls.data.ts - Compatibility layer for the new tech atlas structure
import { HullTemplate, SlotDefinition } from './tech-atlas.types';
import { ALL_HULLS } from './tech-atlas.data';

// Export slot type enum for backwards compatibility
export enum SlotType {
  Cargo = 'Cargo',
  Engine = 'Engine',
  Shield = 'Shield',
  Armor = 'Armor',
  Scanner = 'Scanner',
  Computer = 'Computer',
  Elect = 'Elect',
  Mech = 'Mech',
  Weapon = 'Weapon',
  Bomb = 'Bomb',
  General = 'General',
  Orbital = 'Orbital',
  Mining = 'Mining',
  Mine = 'Mine',
  Dock = 'Dock',
}

export interface HullSlot {
  id: string;
  allowedTypes: SlotType[];
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
}

// Extended Hull interface that includes both old and new properties
export interface Hull extends HullTemplate {
  // Legacy properties expected by existing code
  id: string;
  name: string;
  mass: number;
  cargoCapacity: number;
  fuelCapacity: number;
  armor: number;
  baseCost: {
    ironium: number;
    boranium: number;
    germanium: number;
    resources: number;
  };
  slots: HullSlot[];
  visualGrid?: string;
  techRequired?: {
    construction: number;
  };
}

// Convert HullTemplate to Hull format
const convertHullTemplate = (template: HullTemplate): Hull => {
  const hull: Hull = {
    ...template,
    id: template.id || template.Name.toLowerCase().replace(/\s+/g, '_'),
    name: template.Name,
    mass: template.Stats.Mass,
    cargoCapacity: template.Stats.Cargo || 0,
    fuelCapacity: template.Stats['Max Fuel'] || 0,
    armor: template.Stats.Armor || 0,
    baseCost: {
      ironium: template.Cost.Ironium,
      boranium: template.Cost.Boranium,
      germanium: template.Cost.Germanium,
      resources: template.Cost.Resources || 0,
    },
    slots: template.Slots.map(
      (slot: SlotDefinition, index: number): HullSlot => ({
        id: slot.Code || `slot_${index}`,
        allowedTypes: slot.Allowed.map((type) => {
          // Map string types to SlotType enum
          switch (type.toLowerCase()) {
            case 'engine':
              return SlotType.Engine;
            case 'cargo':
              return SlotType.Cargo;
            case 'shield':
              return SlotType.Shield;
            case 'armor':
              return SlotType.Armor;
            case 'scanner':
              return SlotType.Scanner;
            case 'elect':
              return SlotType.Elect;
            case 'mech':
              return SlotType.Mech;
            case 'weapon':
              return SlotType.Weapon;
            case 'bomb':
              return SlotType.Bomb;
            case 'orbital':
              return SlotType.Orbital;
            case 'mining':
              return SlotType.Mining;
            case 'mine':
              return SlotType.Mine;
            case 'dock':
              return SlotType.Dock;
            default:
              return SlotType.General;
          }
        }),
        max: slot.Max,
        required: slot.Required,
        editable: slot.Editable,
        size: typeof slot.Size === 'number' ? slot.Size : undefined,
      }),
    ),
    visualGrid: template.Structure?.join('\n'),
    techRequired: {
      construction: template.techReq?.Construction || 0,
    },
  };

  return hull;
};

// Export all hulls converted to the expected format
export const HULLS: Hull[] = ALL_HULLS.map(convertHullTemplate);

// Utility function to get hull by ID
export function getHull(hullId: string): Hull | undefined {
  return HULLS.find(hull => hull.id === hullId || hull.Name === hullId);
}