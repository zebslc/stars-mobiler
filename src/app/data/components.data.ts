// Legacy components.data.ts - Compatibility layer for the new tech atlas structure
import { ComponentStats, TechRequirement, ComponentCost } from './tech-atlas.types';
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

// Convert ComponentStats to Component format
const convertComponentStats = (stats: ComponentStats): Component => {
  const component: Component = {
    ...stats,
    // Map stats properties to legacy property names
    warpSpeed: stats.stats.warp,
    fuelEfficiency: stats.stats.fuelEff,
    idealWarp: stats.stats.warp, // Use warp as idealWarp if not specified
    damage: stats.stats.power || stats.stats.kill, // Use power or kill for damage
    accuracy: stats.stats.accuracy,
    initiative: stats.stats.initiative,
    shieldStrength: stats.stats.shield,
    scanRange: stats.stats.scan,
    canDetectCloaked: stats.stats.scan ? stats.stats.scan > 100 : false, // Assume advanced scanners can detect cloaked
    cargoCapacity: stats.stats.cap, // Use cap for cargo capacity
    colonistCapacity: stats.stats.cap ? stats.stats.cap * 1000 : undefined, // Convert kT to colonists
    techRequired: {
      field: Object.keys(stats.tech)[0] || 'Construction',
      level: Object.values(stats.tech)[0] || 0
    },
    baseCost: {
      ironium: stats.cost.iron,
      boranium: stats.cost.bor,
      germanium: stats.cost.germ,
    }
  };
  
  return component;
};

// Flatten all components into a single array and create a lookup object
const allComponentsList = ALL_COMPONENTS.flatMap(category => category.items);
const convertedComponents = allComponentsList.map(convertComponentStats);

// Export all components as COMPONENTS constant (as an object for easy lookup)
export const COMPONENTS: { [key: string]: Component } = {};
convertedComponents.forEach(component => {
  COMPONENTS[component.id] = component;
});

// Also export as array for compatibility
export const ALL_COMPONENTS_ARRAY: Component[] = convertedComponents;

// Utility function to get component by ID
export function getComponent(componentId: string): Component | undefined {
  return COMPONENTS[componentId];
}