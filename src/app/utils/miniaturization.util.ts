import { Component } from '../data/components.data';
import { PlayerTech } from '../models/game.model';

/**
 * Miniaturization System
 *
 * In Stars!, as players advance in technology, components become smaller and cheaper.
 * Formula: Effective_Value = Base_Value × (1 - (Player_Level - Required_Level) × 0.04)
 * Cap: Values cannot drop below 20% of base (max 80% reduction)
 *
 * Based on Stars! Modernization Specification section 6.2
 */

export interface MiniaturizedComponent {
  id: string;
  name: string;
  mass: number;
  baseMass: number;
  cost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
  baseCost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
  miniaturizationLevel: number;
}

/**
 * Calculate miniaturization factor based on tech level difference
 * @param playerLevel Current player tech level in the component's field
 * @param requiredLevel Tech level required to build the component
 * @returns Miniaturization factor (0.2 to 1.0)
 */
export function calculateMiniaturizationFactor(
  playerLevel: number,
  requiredLevel: number
): number {
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
 * Apply miniaturization to a component based on player tech levels
 * @param component The base component
 * @param techLevels Player's current tech levels
 * @returns Miniaturized component with reduced mass and cost
 */
export function miniaturizeComponent(
  component: Component,
  techLevels: PlayerTech
): MiniaturizedComponent {
  // Map old tech field names to new ones
  const fieldMap: Record<string, keyof PlayerTech> = {
    'energy': 'Energy',
    'weapons': 'Kinetics',
    'propulsion': 'Propulsion',
    'construction': 'Construction',
    'electronics': 'Energy', // Electronics tech is now part of Energy
    'biotechnology': 'Construction' // Biotechnology removed, map to Construction as fallback
  };

  // Get player's tech level in the component's required field
  const mappedField = fieldMap[component.techRequired.field] || 'Construction';
  const playerLevel = techLevels[mappedField];
  const requiredLevel = component.techRequired.level;

  // Calculate miniaturization factor
  const factor = calculateMiniaturizationFactor(playerLevel, requiredLevel);
  const miniaturizationLevel = playerLevel - requiredLevel;

  // Apply factor to mass
  const miniaturizedMass = Math.round(component.mass * factor * 10) / 10; // Round to 1 decimal

  // Apply factor to costs
  const miniaturizedCost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
  } = {};

  if (component.cost.iron) {
    miniaturizedCost.ironium = Math.ceil(component.cost.iron * factor);
  }
  if (component.cost.bor) {
    miniaturizedCost.boranium = Math.ceil(component.cost.bor * factor);
  }
  if (component.cost.germ) {
    miniaturizedCost.germanium = Math.ceil(component.cost.germ * factor);
  }

  return {
    id: component.id,
    name: component.name,
    mass: miniaturizedMass,
    baseMass: component.mass,
    cost: miniaturizedCost,
    baseCost: component.baseCost || { ironium: component.cost.iron || 0, boranium: component.cost.bor || 0, germanium: component.cost.germ || 0 },
    miniaturizationLevel: Math.max(0, miniaturizationLevel),
  };
}

/**
 * Get miniaturization description for UI display
 * @param baseMass Original component mass
 * @param miniaturizedMass Miniaturized component mass
 * @returns Human-readable description
 */
export function getMiniaturizationDescription(
  baseMass: number,
  miniaturizedMass: number
): string {
  if (baseMass === miniaturizedMass) {
    return 'No miniaturization';
  }

  const reduction = ((baseMass - miniaturizedMass) / baseMass) * 100;
  return `${reduction.toFixed(0)}% smaller`;
}

/**
 * Calculate total mass savings from miniaturization
 * @param components Array of miniaturized components
 * @returns Total mass saved
 */
export function calculateTotalMassSavings(
  components: MiniaturizedComponent[]
): number {
  return components.reduce((total, comp) => {
    return total + (comp.baseMass - comp.mass);
  }, 0);
}
