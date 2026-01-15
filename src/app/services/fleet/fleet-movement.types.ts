import { MovementValidationResult } from '../../models/service-interfaces.model';

export interface MovementStats {
  maxWarp: number;
  idealWarp: number;
  totalMass: number;
  totalFuel: number;
  worstEfficiency: number;
}

export interface MovementRequirement {
  distance: number;
  fuelRequired: number;
  fuelPerLy: number;
}

export interface MovementValidationAnalysis {
  result: MovementValidationResult;
  requirement: MovementRequirement;
  distance: number;
}
