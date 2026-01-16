import { Injectable } from '@angular/core';
import type { Fleet } from '../../../models/game.model';
import {
  DEFAULT_EFFICIENCY,
  DEFAULT_MASS,
  DEFAULT_WARP,
  MIN_TOTAL_MASS,
  MIN_WARP_SPEED,
  COLONIST_MASS_DIVISOR,
} from './fleet-movement.constants';
import { FleetShipDesignService } from '../design/fleet-ship-design.service';
import type { MovementStats } from './fleet-movement.types';

interface MovementAccumulator {
  maxWarp: number;
  idealWarp: number;
  totalMass: number;
  totalFuel: number;
  worstEfficiency: number;
}

@Injectable({ providedIn: 'root' })
export class FleetMovementStatsService {
  constructor(private shipDesigns: FleetShipDesignService) {}

  calculateMovementStats(fleet: Fleet): MovementStats {
    if (fleet.ships.length === 0) {
      return this.buildStatsForEmptyFleet(fleet);
    }

    const accumulator = fleet.ships.reduce<MovementAccumulator>(
      (stats, stack) => this.accumulateMovementStats(stats, stack.designId, stack.count),
      this.initializeMovementAccumulator(),
    );

    const cargoMass = this.calculateCargoMass(fleet);
    return {
      maxWarp: Math.max(MIN_WARP_SPEED, accumulator.maxWarp),
      idealWarp: Math.max(MIN_WARP_SPEED, accumulator.idealWarp),
      totalMass: Math.max(MIN_TOTAL_MASS, accumulator.totalMass + cargoMass),
      totalFuel: accumulator.totalFuel,
      worstEfficiency: Math.max(0, accumulator.worstEfficiency),
    };
  }

  private buildStatsForEmptyFleet(fleet: Fleet): MovementStats {
    const cargoMass = this.calculateCargoMass(fleet);
    return {
      maxWarp: 0,
      idealWarp: 0,
      totalMass: Math.max(MIN_TOTAL_MASS, cargoMass),
      totalFuel: 0,
      worstEfficiency: 0,
    };
  }

  private initializeMovementAccumulator(): MovementAccumulator {
    return {
      maxWarp: Number.POSITIVE_INFINITY,
      idealWarp: Number.POSITIVE_INFINITY,
      totalMass: 0,
      totalFuel: 0,
      worstEfficiency: Number.NEGATIVE_INFINITY,
    };
  }

  private accumulateMovementStats(
    stats: MovementAccumulator,
    designId: string,
    count: number,
  ): MovementAccumulator {
    const design = this.shipDesigns.getDesign(designId);
    const stackMass = (design.mass ?? DEFAULT_MASS) * count;

    return {
      maxWarp: Math.min(stats.maxWarp, design.warpSpeed ?? MIN_WARP_SPEED),
      idealWarp: Math.min(stats.idealWarp, design.idealWarp ?? DEFAULT_WARP),
      totalMass: stats.totalMass + stackMass,
      totalFuel: stats.totalFuel + (design.fuelCapacity ?? 0) * count,
      worstEfficiency: Math.max(stats.worstEfficiency, design.fuelEfficiency ?? DEFAULT_EFFICIENCY),
    };
  }

  private calculateCargoMass(fleet: Fleet): number {
    const minerals = fleet.cargo.minerals;
    const mineralMass = minerals.ironium + minerals.boranium + minerals.germanium;
    const colonistMass = Math.floor(fleet.cargo.colonists / COLONIST_MASS_DIVISOR);
    return mineralMass + colonistMass;
  }
}
