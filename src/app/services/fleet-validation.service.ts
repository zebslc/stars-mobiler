import { Injectable } from '@angular/core';
import { Fleet } from '../models/game.model';
import { IFleetValidationService, ValidationResult, LogContext } from '../models/service-interfaces.model';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class FleetValidationService implements IFleetValidationService {
  readonly MAX_SHIPS_PER_DESIGN = 32000;

  constructor(private logging: LoggingService) {}

  validateShipAddition(fleet: Fleet, shipDesignId: string, count: number): ValidationResult {
    const context: LogContext = {
      service: 'FleetValidationService',
      operation: 'validateShipAddition',
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: { shipDesignId, count }
    };

    this.logging.debug(`Validating addition of ${count} ships of design ${shipDesignId}`, context);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check count is positive
    if (count <= 0) {
      errors.push('Ship count must be positive');
    }

    // Check design ID is valid
    if (!shipDesignId || shipDesignId.trim().length === 0) {
      errors.push('Ship design ID is required');
    }

    // Check if adding would exceed per-design limit
    const existingStack = fleet.ships.find((s) => s.designId === shipDesignId && (s.damage || 0) === 0);
    const currentCount = existingStack?.count || 0;
    
    if (currentCount + count > this.MAX_SHIPS_PER_DESIGN) {
      errors.push(`Adding ${count} ships would exceed maximum of ${this.MAX_SHIPS_PER_DESIGN} ships per design (current: ${currentCount})`);
    }

    // Check if count itself exceeds limit
    if (count > this.MAX_SHIPS_PER_DESIGN) {
      errors.push(`Cannot add ${count} ships: exceeds maximum of ${this.MAX_SHIPS_PER_DESIGN} ships per design`);
    }

    // Warning for large additions
    if (count > 1000) {
      warnings.push(`Adding ${count} ships is a large operation`);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    this.logging.debug(`Ship addition validation result: ${result.isValid}`, {
      ...context,
      additionalData: { 
        ...context.additionalData, 
        isValid: result.isValid, 
        errorCount: errors.length, 
        warningCount: warnings.length 
      }
    });

    return result;
  }

  validateFleetComposition(fleet: Fleet): ValidationResult {
    const context: LogContext = {
      service: 'FleetValidationService',
      operation: 'validateFleetComposition',
      entityId: fleet.id,
      entityType: 'fleet'
    };

    this.logging.debug('Validating fleet composition', context);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check fleet has ships
    if (fleet.ships.length === 0) {
      warnings.push('Fleet has no ships');
    }

    // Check for invalid ship counts
    for (const ship of fleet.ships) {
      if (ship.count <= 0) {
        errors.push(`Ship stack for design ${ship.designId} has invalid count: ${ship.count}`);
      }
      
      if (ship.count > this.MAX_SHIPS_PER_DESIGN) {
        errors.push(`Ship stack for design ${ship.designId} exceeds maximum: ${ship.count} > ${this.MAX_SHIPS_PER_DESIGN}`);
      }

      if (ship.damage < 0 || ship.damage > 100) {
        errors.push(`Ship stack for design ${ship.designId} has invalid damage: ${ship.damage}`);
      }
    }

    // Check for duplicate stacks (same design and damage)
    const stackKeys = new Set<string>();
    for (const ship of fleet.ships) {
      const key = `${ship.designId}-${ship.damage || 0}`;
      if (stackKeys.has(key)) {
        errors.push(`Duplicate ship stacks found for design ${ship.designId} with damage ${ship.damage || 0}`);
      }
      stackKeys.add(key);
    }

    // Check fuel is non-negative
    if (fleet.fuel < 0) {
      errors.push(`Fleet fuel cannot be negative: ${fleet.fuel}`);
    }

    // Check cargo is non-negative
    if (fleet.cargo.resources < 0) {
      errors.push(`Fleet cargo resources cannot be negative: ${fleet.cargo.resources}`);
    }

    if (fleet.cargo.colonists < 0) {
      errors.push(`Fleet cargo colonists cannot be negative: ${fleet.cargo.colonists}`);
    }

    const minerals = fleet.cargo.minerals;
    if (minerals.ironium < 0 || minerals.boranium < 0 || minerals.germanium < 0) {
      errors.push('Fleet cargo minerals cannot be negative');
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    this.logging.debug(`Fleet composition validation result: ${result.isValid}`, {
      ...context,
      additionalData: { 
        isValid: result.isValid, 
        errorCount: errors.length, 
        warningCount: warnings.length,
        shipCount: fleet.ships.length
      }
    });

    return result;
  }

  checkFleetLimits(playerFleets: Fleet[], maxFleets: number): boolean {
    const context: LogContext = {
      service: 'FleetValidationService',
      operation: 'checkFleetLimits',
      additionalData: { currentFleets: playerFleets.length, maxFleets }
    };

    const isValid = playerFleets.length <= maxFleets;
    
    this.logging.debug(`Fleet limits check: ${playerFleets.length}/${maxFleets} -> ${isValid}`, {
      ...context,
      additionalData: { ...context.additionalData, isValid }
    });

    return isValid;
  }
}