import { Injectable } from '@angular/core';
import { GameState, Fleet, FleetOrder } from '../models/game.model';
import { 
  IFleetMovementService, 
  FleetLocation, 
  MovementValidationResult,
  LogContext,
  GalaxyCoordinate 
} from '../models/service-interfaces.model';
import { LoggingService } from './logging.service';
import { ENGINE_COMPONENTS } from '../data/techs/engines.data';
import { getDesign } from '../data/ships.data';

@Injectable({ providedIn: 'root' })
export class FleetMovementService implements IFleetMovementService {

  constructor(private logging: LoggingService) {}

  moveFleet(game: GameState, fleetId: string, destination: FleetLocation): void {
    const context: LogContext = {
      service: 'FleetMovementService',
      operation: 'moveFleet',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { destination }
    };

    this.logging.debug(`Moving fleet ${fleetId} to destination`, context);

    const fleet = game.fleets.find(f => f.id === fleetId);
    if (!fleet) {
      this.logging.error(`Fleet not found: ${fleetId}`, context);
      return;
    }

    // Create move order
    const moveOrder: FleetOrder = {
      type: 'move',
      destination: destination.type === 'space' 
        ? { x: destination.x!, y: destination.y! }
        : this.getPlanetPosition(game, destination.planetId!)
    };

    fleet.orders = [moveOrder];
    
    this.logging.info(`Fleet ${fleet.name} ordered to move to ${destination.type} location`, {
      ...context,
      additionalData: { ...context.additionalData, fleetName: fleet.name }
    });
  }

  calculateFuelConsumption(fleet: Fleet, distance: number): number {
    const context: LogContext = {
      service: 'FleetMovementService',
      operation: 'calculateFuelConsumption',
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: { distance }
    };

    this.logging.debug(`Calculating fuel consumption for ${distance} LY`, context);

    if (fleet.ships.length === 0) {
      this.logging.warn('Fleet has no ships for fuel calculation', context);
      return 0;
    }

    // Calculate at maximum warp speed for this fleet
    const stats = this.calculateMovementStats(fleet);
    const fuelCost = this.calculateFleetFuelCostPerLy(fleet, stats.maxWarp) * distance;

    this.logging.debug(`Fuel consumption: ${fuelCost} for ${distance} LY at warp ${stats.maxWarp}`, {
      ...context,
      additionalData: { 
        ...context.additionalData, 
        fuelCost, 
        warpSpeed: stats.maxWarp,
        fuelPerLy: this.calculateFleetFuelCostPerLy(fleet, stats.maxWarp)
      }
    });

    return fuelCost;
  }

  validateMovement(fleet: Fleet, destination: FleetLocation): MovementValidationResult {
    const context: LogContext = {
      service: 'FleetMovementService',
      operation: 'validateMovement',
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: { destination }
    };

    this.logging.debug('Validating fleet movement', context);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check fleet has ships
    if (fleet.ships.length === 0) {
      errors.push('Fleet has no ships');
    }

    // Check fleet has engines
    const stats = this.calculateMovementStats(fleet);
    if (stats.maxWarp <= 0) {
      errors.push('Fleet has no functional engines');
    }

    // Calculate distance and fuel requirements
    const currentPos = this.getFleetPosition(fleet);
    const destPos = destination.type === 'space' 
      ? { x: destination.x!, y: destination.y! }
      : { x: 0, y: 0 }; // Would need planet position lookup

    const distance = Math.hypot(destPos.x - currentPos.x, destPos.y - currentPos.y);
    const fuelRequired = this.calculateFleetFuelCostPerLy(fleet, stats.maxWarp) * distance;
    const fuelAvailable = fleet.fuel;

    if (fuelRequired > fuelAvailable) {
      warnings.push(`Insufficient fuel: need ${Math.ceil(fuelRequired)}, have ${fuelAvailable}`);
    }

    // Check destination validity
    if (destination.type === 'space') {
      if (destination.x === undefined || destination.y === undefined) {
        errors.push('Space destination requires x and y coordinates');
      }
    } else if (destination.type === 'orbit') {
      if (!destination.planetId) {
        errors.push('Orbit destination requires planetId');
      }
    }

    const result: MovementValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      fuelRequired: Math.ceil(fuelRequired),
      fuelAvailable,
      canMove: errors.length === 0 && fuelRequired <= fuelAvailable
    };

    this.logging.debug(`Movement validation result: ${result.isValid}`, {
      ...context,
      additionalData: { 
        ...context.additionalData, 
        isValid: result.isValid,
        canMove: result.canMove,
        distance,
        fuelRequired: result.fuelRequired,
        fuelAvailable: result.fuelAvailable
      }
    });

    return result;
  }

  private getFleetPosition(fleet: Fleet): GalaxyCoordinate {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    // For orbit, would need to look up planet position
    return { x: 0, y: 0 };
  }

  private getPlanetPosition(game: GameState, planetId: string): GalaxyCoordinate {
    const star = game.stars.find(s => s.planets.some(p => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  private calculateMovementStats(fleet: Fleet) {
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let totalFuel = 0;
    let worstEfficiency = -Infinity;

    for (const stack of fleet.ships) {
      const design = this.getShipDesign(stack.designId);
      maxWarp = Math.min(maxWarp, design.warpSpeed || 1);
      idealWarp = Math.min(idealWarp, design.idealWarp || 6);
      totalMass += (design.mass || 10) * stack.count;
      totalFuel += (design.fuelCapacity || 0) * stack.count;
      worstEfficiency = Math.max(worstEfficiency, design.fuelEfficiency || 100);
    }

    // Add cargo mass
    totalMass +=
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      Math.floor(fleet.cargo.colonists / 1000);

    return {
      maxWarp: Math.max(1, maxWarp),
      idealWarp: Math.max(1, idealWarp),
      totalMass: Math.max(1, totalMass),
      totalFuel,
      worstEfficiency: Math.max(0, worstEfficiency),
    };
  }

  private calculateFleetFuelCostPerLy(fleet: Fleet, warp: number): number {
    let totalCost = 0;
    let totalShipMass = 0;
    let weightedEngineFactorSum = 0;

    // Calculate cost for ships
    for (const stack of fleet.ships) {
      const design = this.getShipDesign(stack.designId);
      
      // Try to find engine component
      let engineStat: any = null;
      if (design.engine) {
        const engId = design.engine.id;
        engineStat = ENGINE_COMPONENTS.find((c: any) => c.id === engId);
      }

      let factor = 0;
      if (engineStat && engineStat.stats && engineStat.stats.fuelUsage) {
        const key = `warp${warp}` as keyof typeof engineStat.stats.fuelUsage;
        factor = engineStat.stats.fuelUsage[key] || 0;
      } else {
        // Fallback to legacy formula
        factor = this.calculateLegacyEngineFactor(design, warp);
      }

      const mass = design.mass || 10;
      totalCost += (mass * stack.count * factor) / 2000;

      weightedEngineFactorSum += factor * mass * stack.count;
      totalShipMass += mass * stack.count;
    }

    // Calculate cost for cargo
    const cargoMass =
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      Math.floor(fleet.cargo.colonists / 1000);

    // Average engine factor for the fleet
    const averageFactor = totalShipMass > 0 ? weightedEngineFactorSum / totalShipMass : 0;
    totalCost += (cargoMass * averageFactor) / 2000;

    return totalCost;
  }

  private calculateLegacyEngineFactor(design: any, warp: number): number {
    if (!design) return 0;
    const efficiency = design.fuelEfficiency || 100;
    const idealWarp = design.idealWarp || 6;
    if (efficiency === 0) return 0;

    const speedRatio = warp / idealWarp;
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = efficiency / 100;

    return 20 * speedMultiplier * efficiencyMultiplier;
  }

  private getShipDesign(designId: string): any {
    // This would normally get from game state, but for now use legacy designs
    const legacyDesign = getDesign(designId);
    return legacyDesign || {
      warpSpeed: 1,
      idealWarp: 6,
      mass: 10,
      fuelCapacity: 0,
      fuelEfficiency: 100
    };
  }
}