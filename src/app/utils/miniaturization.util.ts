import type { ComponentStats } from '../data/tech-atlas.types';
import type { PlayerTech } from '../models/game.model';

/**
 * Represents a component with miniaturized properties
 */
export interface MiniaturizedComponent extends ComponentStats {
  miniaturizedMass: number;
  miniaturizedCost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
    resources?: number;
  };
  miniaturizationLevel: number;
  miniaturizationDescription: string;
}

/**
 * Miniaturization System
 *
 * In Stars!, as players advance in technology, components become smaller and cheaper.
 * Formula: Effective_Value = Base_Value × (1 - (Player_Level - Required_Level) × 0.04)
 * Cap: Values cannot drop below 20% of base (max 80% reduction)
 *
 * Based on Stars! Modernization Specification section 6.2
 */

/**
 * Calculate miniaturization factor based on tech level difference
 * @param playerLevel Current player tech level in the component's field
 * @param requiredLevel Tech level required to build the component
 * @returns Miniaturization factor (0.2 to 1.0)
 */
export function calculateMiniaturizationFactor(playerLevel: number, requiredLevel: number): number {
  const levelDifference = playerLevel - requiredLevel;

  // No miniaturization if player level doesn't exceed requirement
  if (levelDifference <= 0) {
    return 1.0;
  }

  // Apply 4% reduction per level above requirement
  const reduction = levelDifference * 0.04;
  const factor = 1.0 - reduction;

  // Cap at 20% minimum (80% reduction max)
  return Math.max(0.2, factor);
}

/**
 * Get miniaturized mass for a component
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @returns Miniaturized mass value
 */
export function getMiniaturizedMass(
  component: ComponentStats, 
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
): number {
  const playerLevel = techLevels[primaryField as keyof PlayerTech] || 0;
  const factor = calculateMiniaturizationFactor(playerLevel, requiredLevel);
  
  return Math.round(component.mass * factor * 10) / 10; // Round to 1 decimal
}

/**
 * Get miniaturized cost for a component
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @returns Miniaturized cost object
 */
export function getMiniaturizedCost(
  component: ComponentStats, 
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
): { ironium?: number; boranium?: number; germanium?: number; resources?: number } {
  const playerLevel = techLevels[primaryField as keyof PlayerTech] || 0;
  const factor = calculateMiniaturizationFactor(playerLevel, requiredLevel);

  const miniaturizedCost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
    resources?: number;
  } = {};

  if (component.cost.ironium) {
    miniaturizedCost.ironium = Math.ceil(component.cost.ironium * factor);
  }
  if (component.cost.boranium) {
    miniaturizedCost.boranium = Math.ceil(component.cost.boranium * factor);
  }
  if (component.cost.germanium) {
    miniaturizedCost.germanium = Math.ceil(component.cost.germanium * factor);
  }
  if (component.cost.resources) {
    miniaturizedCost.resources = Math.ceil(component.cost.resources * factor);
  }

  return miniaturizedCost;
}

/**
 * Get miniaturization level (tech levels above requirement)
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @returns Number of tech levels above requirement
 */
export function getMiniaturizationLevel(
  component: ComponentStats, 
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
): number {
  const playerLevel = techLevels[primaryField as keyof PlayerTech] || 0;
  
  return Math.max(0, playerLevel - requiredLevel);
}

/**
 * Get miniaturization description for UI display
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @returns Human-readable description
 */
export function getMiniaturizationDescription(
  component: ComponentStats,
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
): string {
  const baseMass = component.mass;
  const miniaturizedMass = getMiniaturizedMass(component, techLevels, primaryField, requiredLevel);
  
  if (baseMass === miniaturizedMass) {
    return 'No miniaturization';
  }

  const reduction = ((baseMass - miniaturizedMass) / baseMass) * 100;
  return `${reduction.toFixed(0)}% smaller`;
}

/**
 * Calculate mass savings from miniaturization for a single component
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @param count Number of components
 * @returns Mass saved
 */
export function calculateComponentMassSavings(
  component: ComponentStats,
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
  count: number = 1
): number {
  const baseMass = component.mass * count;
  const miniaturizedMass = getMiniaturizedMass(component, techLevels, primaryField, requiredLevel) * count;
  return baseMass - miniaturizedMass;
}

/**
 * Create a miniaturized version of a component
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @param primaryField The primary tech field for this component
 * @param requiredLevel The required tech level to build this component
 * @returns Miniaturized component with all calculated properties
 */
export function miniaturizeComponent(
  component: ComponentStats,
  techLevels: PlayerTech,
  primaryField: string,
  requiredLevel: number,
): MiniaturizedComponent {
  return {
    ...component,
    miniaturizedMass: getMiniaturizedMass(component, techLevels, primaryField, requiredLevel),
    miniaturizedCost: getMiniaturizedCost(component, techLevels, primaryField, requiredLevel),
    miniaturizationLevel: getMiniaturizationLevel(component, techLevels, primaryField, requiredLevel),
    miniaturizationDescription: getMiniaturizationDescription(component, techLevels, primaryField, requiredLevel)
  };
}
