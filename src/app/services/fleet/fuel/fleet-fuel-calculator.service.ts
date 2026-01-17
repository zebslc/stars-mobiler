import { Injectable } from '@angular/core';
import type { Fleet } from '../../../models/game.model';
import { LoggingService } from '../../core/logging.service';
import { ENGINE_COMPONENTS } from '../../../data/techs/engines.data';
import { FleetShipDesignService } from '../design/fleet-ship-design.service';
import type { MovementRequirement } from '../movement/fleet-movement.types';
import { COLONIST_MASS_DIVISOR, DEFAULT_MASS, FUEL_USAGE_DIVISOR } from '../movement/fleet-movement.constants';

interface EngineComponentDefinition {
  id: string;
  stats: {
    fuelUsage: Record<string, number>;
  };
}

interface ShipFuelCostSummary {
  totalCost: number;
  totalMass: number;
  weightedFactor: number;
}

const ENGINE_COMPONENT_DATA = ENGINE_COMPONENTS as unknown as Array<EngineComponentDefinition>;

@Injectable({ providedIn: 'root' })
export class FleetFuelCalculatorService {
  constructor(
    private logging: LoggingService,
    private shipDesigns: FleetShipDesignService,
  ) {}

  buildMovementRequirement(fleet: Fleet, warp: number, distance: number): MovementRequirement {
    const fuelPerLy = this.calculateFleetFuelCostPerLy(fleet, warp);
    return {
      distance,
      fuelPerLy,
      fuelRequired: this.calculateFuelRequirement(distance, fuelPerLy),
    };
  }

  private calculateFuelRequirement(distance: number, fuelPerLy: number): number {
    return fuelPerLy * distance;
  }

  private calculateFleetFuelCostPerLy(fleet: Fleet, warp: number): number {
    const summary = fleet.ships.reduce<ShipFuelCostSummary>(
      (aggregate, stack) =>
        this.accumulateShipFuelCost(aggregate, stack.designId, stack.count, warp),
      { totalCost: 0, totalMass: 0, weightedFactor: 0 },
    );

    const cargoMass = this.calculateCargoMass(fleet);
    const averageFactor = this.calculateAverageEngineFactor(summary);
    const cargoCost = (cargoMass * averageFactor) / FUEL_USAGE_DIVISOR;

    return summary.totalCost + cargoCost;
  }

  private accumulateShipFuelCost(
    summary: ShipFuelCostSummary,
    designId: string,
    count: number,
    warp: number,
  ): ShipFuelCostSummary {
    const design = this.shipDesigns.getDesign(designId);

    // Ships without engines (starbases, orbital structures, or incomplete designs) don't consume fuel
    if (!design.engine?.id) {
      this.logging.debug('Ship design has no engine - skipping fuel calculation', {
        service: 'FleetFuelCalculatorService',
        operation: 'accumulateShipFuelCost',
        entityId: designId,
        entityType: 'shipDesign',
        additionalData: {
          isStarbase: design.isStarbase,
          mass: design.mass,
        },
      });
      return summary;
    }

    const mass = (design.mass ?? DEFAULT_MASS) * count;
    const engineFactor = this.resolveEngineFactor(design.id ?? designId, design.engine.id, warp);
    const stackCost = (mass * engineFactor) / FUEL_USAGE_DIVISOR;

    return {
      totalCost: summary.totalCost + stackCost,
      totalMass: summary.totalMass + mass,
      weightedFactor: summary.weightedFactor + engineFactor * mass,
    };
  }

  private resolveEngineFactor(designId: string, engineId: string, warp: number): number {
    const engine = this.getEngineComponent(designId, engineId);
    const fuelUsage = this.getEngineFuelUsage(designId, engine.id, engine.stats.fuelUsage);
    return this.getFuelUsageForWarp(designId, engine.id, fuelUsage, warp);
  }

  private getEngineComponent(designId: string, engineId: string): EngineComponentDefinition {
    const engine = ENGINE_COMPONENT_DATA.find((component) => component.id === engineId);
    if (!engine) {
      this.reportEngineDataError(
        designId,
        `Engine component ${engineId} referenced by ship design ${designId} was not found`,
      );
    }

    return engine as EngineComponentDefinition;
  }

  private getEngineFuelUsage(
    designId: string,
    engineId: string,
    fuelUsage: Record<string, number>,
  ): Record<string, number> {
    if (!fuelUsage || Object.keys(fuelUsage).length === 0) {
      this.reportEngineDataError(
        designId,
        `Fuel usage data is missing for engine ${engineId} referenced by ship design ${designId}`,
      );
    }

    return fuelUsage;
  }

  private getFuelUsageForWarp(
    designId: string,
    engineId: string,
    fuelUsage: Record<string, number>,
    warp: number,
  ): number {
    const usage = fuelUsage[`warp${warp}`];
    if (usage === undefined) {
      this.reportEngineDataError(
        designId,
        `Fuel usage for engine ${engineId} at warp ${warp} is undefined`,
      );
    }

    return usage;
  }

  private calculateAverageEngineFactor(summary: ShipFuelCostSummary): number {
    return summary.totalMass > 0 ? summary.weightedFactor / summary.totalMass : 0;
  }

  private calculateCargoMass(fleet: Fleet): number {
    const minerals = fleet.cargo.minerals;
    const mineralMass = minerals.ironium + minerals.boranium + minerals.germanium;
    const colonistMass = Math.floor(fleet.cargo.colonists / COLONIST_MASS_DIVISOR);
    return mineralMass + colonistMass;
  }

  private reportEngineDataError(designId: string, message: string): never {
    this.logging.error(message, {
      service: 'FleetFuelCalculatorService',
      operation: 'resolveEngineFactor',
      entityId: designId,
      entityType: 'shipDesign',
    });
    throw new Error(message);
  }
}
