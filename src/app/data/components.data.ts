// Legacy components.data.ts - Compatibility layer for the new tech atlas structure
import { ComponentStats, ComponentTrait } from './tech-atlas.types';
import { ALL_COMPONENTS } from './tech-atlas.data';

// Extended Component interface that includes both old and new properties
export interface Component extends ComponentStats {
  // Legacy properties expected by existing code
  warpSpeed?: number;
  fuelEfficiency?: number;
  idealWarp?: number;
  damage?: number;
  accuracy?: number;
  initiative?: number;
  shieldStrength?: number;
  scanRange?: number;
  canDetectCloaked?: boolean;
  cargoCapacity?: number;
  fuelCapacity?: number;
  colonistCapacity?: number;
  techRequired: {
    field: string;
    level: number;
  };
  baseCost?: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
}

const deriveTraits = (stats: ComponentStats): ComponentTrait[] | undefined => {
  const traits: ComponentTrait[] = [];

  const addTrait = (trait: ComponentTrait) => {
    traits.push(trait);
  };

  switch (stats.type) {
    case 'Engine': {
      const warpSpeed = stats.stats.maxWarp;
      const fuelEfficiency = stats.stats.fuelEff;
      if (warpSpeed || fuelEfficiency) {
        addTrait({
          type: 'propulsion',
          isMajor: true,
          properties: {
            warpSpeed: warpSpeed ?? 0,
            fuelEfficiency: fuelEfficiency ?? 0,
            idealWarp: stats.stats.maxWarp ?? 0,
            isRamscoop: !!stats.isRamscoop,
          },
        });
      }
      break;
    }
    case 'Weapon': {
      addTrait({
        type: 'damage_dealer',
        isMajor: true,
        properties: {
          damage: stats.stats.power ?? 0,
          range: stats.stats.range ?? 0,
          accuracy: stats.stats.accuracy ?? 0,
          initiative: stats.stats.initiative ?? 0,
        },
      });
      break;
    }
    case 'Bomb': {
      addTrait({
        type: 'bomb',
        isMajor: true,
        properties: {
          kill: stats.stats.kill ?? 0,
          destroy: stats.stats.struct ?? 0,
        },
      });
      break;
    }
    case 'Cargo': {
      if (typeof stats.stats.cap === 'number') {
        addTrait({
          type: 'storage',
          isMajor: true,
          properties: { cargoCapacity: stats.stats.cap },
        });
      }
      break;
    }
    case 'Scanner': {
      if (typeof stats.stats.scan === 'number' || typeof stats.stats.pen === 'number') {
        addTrait({
          type: 'sensor',
          isMajor: true,
          properties: {
            scanRange: stats.stats.scan ?? 0,
            penScanRange: stats.stats.pen ?? 0,
            canDetectCloaked: (stats.stats.detection ?? 0) > 0,
          },
        });
      }
      break;
    }
    case 'Cloak': {
      const cloakStrength = stats.stats.cloak ?? stats.stats.cloaking;
      if (typeof cloakStrength === 'number') {
        addTrait({
          type: 'cloak',
          isMajor: true,
          properties: { cloak: cloakStrength },
        });
      }
      break;
    }
    case 'Mining': {
      if (typeof stats.stats.mining === 'number') {
        addTrait({
          type: 'mining',
          isMajor: true,
          properties: { miningRate: stats.stats.mining },
        });
      }
      break;
    }
    case 'Terraforming': {
      if (typeof stats.stats.terraform === 'number') {
        addTrait({
          type: 'terraform',
          isMajor: true,
          properties: { terraformRate: stats.stats.terraform },
        });
      }
      break;
    }
  }

  return traits.length ? traits : undefined;
};

// Convert ComponentStats to Component format
const convertComponentStats = (stats: ComponentStats, categoryId?: string): Component => {
  const component: Component = {
    ...stats,
    categoryId: stats.categoryId ?? categoryId,
    traits: stats.traits ?? deriveTraits(stats),
    metadata: stats.metadata ?? { icon: stats.img, description: stats.description },
    // Map stats properties to legacy property names
    warpSpeed: stats.stats.maxWarp,
    fuelEfficiency: stats.stats.fuelEff,
    idealWarp: stats.stats.maxWarp, // Use maxWarp as idealWarp if not specified
    damage: stats.stats.power || stats.stats.kill, // Use power or kill for damage
    accuracy: stats.stats.accuracy,
    initiative: stats.stats.initiative,
    shieldStrength: stats.stats.shield,
    scanRange: stats.stats.scan,
    canDetectCloaked: stats.stats.scan ? stats.stats.scan > 100 : false, // Assume advanced scanners can detect cloaked
    cargoCapacity: stats.type === 'Cargo' ? stats.stats.cap : undefined, // Only Cargo components add cargo capacity
    fuelCapacity:
      stats.id.includes('fuel_tank') || stats.name.includes('Fuel') ? stats.stats.cap : undefined, // Fuel tanks add fuel capacity
    colonistCapacity: stats.stats.cap ? stats.stats.cap * 1000 : undefined, // Convert kT to colonists
    techRequired: {
      field: Object.keys(stats.tech)[0] || 'Construction',
      level: Object.values(stats.tech)[0] || 0,
    },
    baseCost: {
      ironium: stats.cost.ironium,
      boranium: stats.cost.boranium,
      germanium: stats.cost.germanium,
    },
  };

  return component;
};

// Flatten all components into a single array and create a lookup object
const allComponentsList = ALL_COMPONENTS.flatMap((category) =>
  category.items.map((item) => ({ item, categoryId: category.id })),
);
const convertedComponents = allComponentsList.map(({ item, categoryId }) =>
  convertComponentStats(item, categoryId),
);

// Export all components as COMPONENTS constant (as an object for easy lookup)
export const COMPONENTS: { [key: string]: Component } = {};
convertedComponents.forEach((component) => {
  COMPONENTS[component.id] = component;
});

// Also export as array for compatibility
export const ALL_COMPONENTS_ARRAY: Component[] = convertedComponents;

// Utility function to get component by ID
export function getComponent(componentId: string): Component | undefined {
  return COMPONENTS[componentId];
}
