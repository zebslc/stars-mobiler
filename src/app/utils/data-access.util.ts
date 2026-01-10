// Data access utilities for the new tech-atlas system
import { ComponentStats, HullTemplate } from '../data/tech-atlas.types';
import { ALL_COMPONENTS, ALL_HULLS } from '../data/tech-atlas.data';

/**
 * Get a component by ID from the tech atlas
 */
export function getComponent(componentId: string): ComponentStats | undefined {
  for (const category of ALL_COMPONENTS) {
    const component = category.items.find(item => item.id === componentId);
    if (component) {
      return component;
    }
  }
  return undefined;
}

/**
 * Get all components as a flat array
 */
export function getAllComponents(): ComponentStats[] {
  return ALL_COMPONENTS.flatMap(category => category.items);
}

/**
 * Get all components as a lookup object for O(1) access
 */
export function getComponentsLookup(): Record<string, ComponentStats> {
  const lookup: Record<string, ComponentStats> = {};
  for (const category of ALL_COMPONENTS) {
    for (const component of category.items) {
      lookup[component.id] = component;
    }
  }
  return lookup;
}

/**
 * Get a hull by ID from the tech atlas
 */
export function getHull(hullId: string): HullTemplate | undefined {
  return ALL_HULLS.find(hull => 
    hull.id === hullId || 
    hull.Name === hullId ||
    hull.Name.toLowerCase().replace(/\s+/g, '_') === hullId
  );
}

/**
 * Get all hulls
 */
export function getAllHulls(): HullTemplate[] {
  return ALL_HULLS;
}

/**
 * Get the required tech level for a component
 */
export function getRequiredTechLevel(component: ComponentStats): number {
  const techLevels = Object.values(component.tech);
  return Math.max(...techLevels, 0);
}

/**
 * Get the primary tech field for a component
 */
export function getPrimaryTechField(component: ComponentStats): string {
  const techEntries = Object.entries(component.tech);
  if (techEntries.length === 0) return 'Construction';
  
  // Return the field with the highest requirement
  return techEntries.reduce((max, [field, level]) => 
    level > (component.tech[max as keyof typeof component.tech] || 0) ? field : max,
    techEntries[0][0]
  );
}