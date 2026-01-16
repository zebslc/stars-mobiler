import { Injectable } from '@angular/core';
import type { Fleet } from '../../../models/game.model';
import type { FleetLocation, GalaxyCoordinate, MovementValidationResult } from '../../../models/service-interfaces.model';
import { FleetFuelCalculatorService } from '../fuel/fleet-fuel-calculator.service';
import type { MovementStats, MovementValidationAnalysis, MovementRequirement } from './fleet-movement.types';
import { DEFAULT_COORDINATE } from './fleet-movement.constants';

interface ValidationMessages {
  errors: Array<string>;
  warnings: Array<string>;
}

@Injectable({ providedIn: 'root' })
export class FleetMovementValidatorService {
  constructor(private fuelCalculator: FleetFuelCalculatorService) {}

  evaluateMovement(
    fleet: Fleet,
    destination: FleetLocation,
    stats: MovementStats,
  ): MovementValidationAnalysis {
    const messages = this.initializeValidationMessages();
    this.ensureFleetHasShips(fleet, messages);
    this.ensureFleetHasEngines(stats, messages);

    const distance = this.calculateDistanceToDestination(fleet, destination);
    const requirement = this.fuelCalculator.buildMovementRequirement(fleet, stats.maxWarp, distance);

    this.evaluateFuelAvailability(fleet.fuel, requirement, messages);
    this.validateDestination(destination, messages);

    const result = this.buildValidationResult(messages, requirement, fleet.fuel);
    return { result, requirement, distance };
  }

  private initializeValidationMessages(): ValidationMessages {
    return { errors: [], warnings: [] };
  }

  private ensureFleetHasShips(fleet: Fleet, messages: ValidationMessages): void {
    if (fleet.ships.length === 0) {
      messages.errors.push('Fleet has no ships');
    }
  }

  private ensureFleetHasEngines(stats: MovementStats, messages: ValidationMessages): void {
    if (stats.maxWarp <= 0) {
      messages.errors.push('Fleet has no functional engines');
    }
  }

  private evaluateFuelAvailability(
    fuelAvailable: number,
    requirement: MovementRequirement,
    messages: ValidationMessages,
  ): void {
    if (requirement.fuelRequired > fuelAvailable) {
      const needed = Math.ceil(requirement.fuelRequired);
      messages.warnings.push(`Insufficient fuel: need ${needed}, have ${fuelAvailable}`);
    }
  }

  private validateDestination(destination: FleetLocation, messages: ValidationMessages): void {
    if (destination.type === 'space') {
      if (destination.x === undefined || destination.y === undefined) {
        messages.errors.push('Space destination requires x and y coordinates');
      }
      return;
    }

    if (!destination.starId) {
      messages.errors.push('Orbit destination requires starId');
    }
  }

  private buildValidationResult(
    messages: ValidationMessages,
    requirement: MovementRequirement,
    fuelAvailable: number,
  ): MovementValidationResult {
    const fuelRequiredRounded = Math.ceil(requirement.fuelRequired);
    const canMove = messages.errors.length === 0 && fuelRequiredRounded <= fuelAvailable;

    return {
      isValid: messages.errors.length === 0,
      errors: messages.errors,
      warnings: messages.warnings,
      fuelRequired: fuelRequiredRounded,
      fuelAvailable,
      canMove,
    };
  }

  private calculateDistanceToDestination(fleet: Fleet, destination: FleetLocation): number {
    const currentPos = this.getFleetPosition(fleet);
    const destPos =
      destination.type === 'space'
        ? { x: destination.x ?? currentPos.x, y: destination.y ?? currentPos.y }
        : DEFAULT_COORDINATE;
    return Math.hypot(destPos.x - currentPos.x, destPos.y - currentPos.y);
  }

  private getFleetPosition(fleet: Fleet): GalaxyCoordinate {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    return { ...DEFAULT_COORDINATE };
  }
}
