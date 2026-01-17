import { Injectable } from '@angular/core';
import type { GameState, Fleet, FleetOrder } from '../../../models/game.model';
import type {
  IFleetMovementService,
  FleetLocation,
  MovementValidationResult,
  LogContext,
} from '../../../models/service-interfaces.model';
import { LoggingService } from '../../core/logging.service';
import { FleetMovementOrderService } from './fleet-movement-order.service';
import { FleetMovementStatsService } from './fleet-movement-stats.service';
import { FleetFuelCalculatorService } from '../fuel/fleet-fuel-calculator.service';
import { FleetMovementValidatorService } from './fleet-movement-validator.service';
import { FleetShipDesignService } from '../design/fleet-ship-design.service';
import type { MovementRequirement } from './fleet-movement.types';

@Injectable({ providedIn: 'root' })
export class FleetMovementService implements IFleetMovementService {
  constructor(
    private logging: LoggingService,
    private orderService: FleetMovementOrderService,
    private statsService: FleetMovementStatsService,
    private fuelCalculator: FleetFuelCalculatorService,
    private validator: FleetMovementValidatorService,
    private shipDesigns: FleetShipDesignService,
  ) {}

  moveFleet(game: GameState, fleetId: string, destination: FleetLocation): void {
    const context = this.createContext('moveFleet', fleetId, { destination });
    this.logging.debug(`Moving fleet ${fleetId} to destination`, context);

    const fleet = this.findFleet(game, fleetId, context);
    if (!fleet) {
      return;
    }

    const moveOrder = this.orderService.createMoveOrder(game, destination);
    this.assignMoveOrder(fleet, moveOrder);
    this.logMoveOrder(context, fleet, destination.type);
  }

  calculateFuelConsumption(fleet: Fleet, distance: number): number {
    const context = this.createContext('calculateFuelConsumption', fleet.id, { distance });
    this.logging.debug(`Calculating fuel consumption for ${distance} LY`, context);

    if (this.isFleetEmpty(fleet, context)) {
      return 0;
    }

    this.validateEngineConfiguration(fleet, context);

    const stats = this.statsService.calculateMovementStats(fleet);
    const requirement = this.fuelCalculator.buildMovementRequirement(fleet, stats.maxWarp, distance);
    this.logFuelConsumption(context, stats.maxWarp, requirement);

    return requirement.fuelRequired;
  }

  validateMovement(fleet: Fleet, destination: FleetLocation): MovementValidationResult {
    const context = this.createContext('validateMovement', fleet.id, { destination });
    this.logging.debug('Validating fleet movement', context);

    const stats = this.statsService.calculateMovementStats(fleet);
    const analysis = this.validator.evaluateMovement(fleet, destination, stats);

    this.logValidationResult(context, analysis.result, analysis.requirement);
    return analysis.result;
  }

  private createContext(
    operation: LogContext['operation'],
    entityId: string,
    additionalData?: Record<string, unknown>,
  ): LogContext {
    return {
      service: 'FleetMovementService',
      operation,
      entityId,
      entityType: 'fleet',
      additionalData,
    };
  }

  private findFleet(game: GameState, fleetId: string, context: LogContext): Fleet | undefined {
    const fleet = game.fleets.find((entry) => entry.id === fleetId);
    if (!fleet) {
      this.logging.error(`Fleet not found: ${fleetId}`, context);
    }
    return fleet;
  }

  private assignMoveOrder(fleet: Fleet, moveOrder: FleetOrder): void {
    fleet.orders = [moveOrder];
  }

  private logMoveOrder(context: LogContext, fleet: Fleet, destinationType: FleetLocation['type']): void {
    this.logging.info(`Fleet ${fleet.name} ordered to move to ${destinationType} location`, {
      ...context,
      additionalData: { ...context.additionalData, fleetName: fleet.name },
    });
  }

  private isFleetEmpty(fleet: Fleet, context: LogContext): boolean {
    const isEmpty = fleet.ships.length === 0;
    if (isEmpty) {
      this.logging.warn('Fleet has no ships for fuel calculation', context);
    }
    return isEmpty;
  }

  private validateEngineConfiguration(fleet: Fleet, context: LogContext): void {
    for (const stack of fleet.ships) {
      const design = this.shipDesigns.getDesign(stack.designId);
      if (!design.engine) {
        throw new Error(`Ship design ${stack.designId} missing engine configuration`);
      }
    }
  }

  private logFuelConsumption(context: LogContext, warp: number, requirement: MovementRequirement): void {
    this.logging.debug(
      `Fuel consumption: ${requirement.fuelRequired} for ${requirement.distance} LY at warp ${warp}`,
      {
        ...context,
        additionalData: {
          ...context.additionalData,
          fuelCost: requirement.fuelRequired,
          warpSpeed: warp,
          fuelPerLy: requirement.fuelPerLy,
        },
      },
    );
  }

  private logValidationResult(
    context: LogContext,
    result: MovementValidationResult,
    requirement: MovementRequirement,
  ): void {
    this.logging.debug(`Movement validation result: ${result.isValid}`, {
      ...context,
      additionalData: {
        ...context.additionalData,
        isValid: result.isValid,
        canMove: result.canMove,
        distance: requirement.distance,
        fuelRequired: result.fuelRequired,
        fuelAvailable: result.fuelAvailable,
      },
    });
  }
}