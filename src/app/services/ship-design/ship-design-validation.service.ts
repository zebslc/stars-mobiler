import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../core/logging.service';
import { DataAccessService } from '../data/data-access.service';
import type { 
  IShipDesignValidationService, 
  ValidationResult, 
  ComponentData, 
  LogContext 
} from '../../models/service-interfaces.model';
import type { ShipDesign, PlayerTech } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';
import { canInstallComponent } from '../../models/ship-design.model';
import { compileShipStats } from '../../models/ship-design.model';

/**
 * Ship Design Validation Service
 * 
 * Handles all validation logic for ship designs, component placement,
 * and hull selection. Replaces validation logic previously scattered
 * across components and services.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignValidationService implements IShipDesignValidationService {
  private readonly loggingService = inject(LoggingService);
  private readonly dataAccess = inject(DataAccessService);

  /**
   * Validate a complete ship design
   */
  validateDesign(design: ShipDesign, techLevels: PlayerTech): ValidationResult {
    const context: LogContext = {
      service: 'ShipDesignValidationService',
      operation: 'validateDesign',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { hullId: design.hullId }
    };

    this.loggingService.debug('Starting ship design validation', context);

    const errors: Array<string> = [];
    const warnings: Array<string> = [];

    try {
      // Get hull for validation
      const hull = this.dataAccess.getHull(design.hullId);
      if (!hull) {
        const error = `Hull ${design.hullId} not found`;
        this.loggingService.error(error, context);
        errors.push(error);
        return { isValid: false, errors, warnings };
      }

      // Validate hull tech requirements
      const hullValidation = this.validateHullSelection(design.hullId, techLevels);
      if (!hullValidation.isValid) {
        errors.push(...hullValidation.errors);
        warnings.push(...hullValidation.warnings);
      }

      // Validate each slot assignment
      for (const slotAssignment of design.slots) {
        for (const componentAssignment of slotAssignment.components) {
          const component = this.dataAccess.getComponent(componentAssignment.componentId);
          if (!component) {
            const error = `Component ${componentAssignment.componentId} not found`;
            errors.push(error);
            continue;
          }

          const componentData: ComponentData = {
            id: component.id,
            name: component.name,
            type: component.type,
            stats: component.stats,
            mass: component.mass
          };

          const placementValidation = this.validateComponentPlacement(
            slotAssignment.slotId, 
            componentData, 
            componentAssignment.count
          );

          if (!placementValidation.isValid) {
            errors.push(...placementValidation.errors);
            warnings.push(...placementValidation.warnings);
          }
        }
      }

      // Validate required slots are filled
      this.validateRequiredSlots(hull, design, errors, warnings);

      // Validate design stats
      this.validateDesignStats(hull, design, techLevels, errors, warnings);

      const isValid = errors.length === 0;
      
      this.loggingService.debug(
        `Design validation completed: ${isValid ? 'valid' : 'invalid'}`, 
        { ...context, additionalData: { ...context.additionalData, errorCount: errors.length, warningCount: warnings.length } }
      );

      return { isValid, errors, warnings };

    } catch (error) {
      const errorMessage = `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      errors.push(errorMessage);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate component placement in a specific slot
   */
  validateComponentPlacement(slotId: string, component: ComponentData, count: number): ValidationResult {
    const context: LogContext = {
      service: 'ShipDesignValidationService',
      operation: 'validateComponentPlacement',
      entityId: component.id,
      entityType: 'Component',
      additionalData: { slotId, count }
    };

    this.loggingService.debug('Validating component placement', context);

    const errors: Array<string> = [];
    const warnings: Array<string> = [];

    try {
      // Validate count is positive
      if (count <= 0) {
        errors.push('Component count must be greater than 0');
      }

      // Additional validation would require hull context
      // This is a simplified validation - full validation happens in validateDesign
      
      const isValid = errors.length === 0;
      
      this.loggingService.debug(
        `Component placement validation: ${isValid ? 'valid' : 'invalid'}`, 
        { ...context, additionalData: { ...context.additionalData, isValid } }
      );

      return { isValid, errors, warnings };

    } catch (error) {
      const errorMessage = `Component placement validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      errors.push(errorMessage);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate hull selection against tech levels
   */
  validateHullSelection(hullId: string, techLevels: PlayerTech): ValidationResult {
    const context: LogContext = {
      service: 'ShipDesignValidationService',
      operation: 'validateHullSelection',
      entityId: hullId,
      entityType: 'Hull'
    };

    this.loggingService.debug('Validating hull selection', context);

    const errors: Array<string> = [];
    const warnings: Array<string> = [];

    try {
      const hull = this.dataAccess.getHull(hullId);
      if (!hull) {
        const error = `Hull ${hullId} not found`;
        this.loggingService.error(error, context);
        errors.push(error);
        return { isValid: false, errors, warnings };
      }

      // Check tech requirements
      if (hull.techReq) {
        for (const [techField, requiredLevel] of Object.entries(hull.techReq)) {
          const playerLevel = techLevels[techField as keyof PlayerTech] || 0;
          if (playerLevel < requiredLevel) {
            errors.push(`Insufficient ${techField} tech level: ${playerLevel}/${requiredLevel} required`);
          }
        }
      }

      const isValid = errors.length === 0;
      
      this.loggingService.debug(
        `Hull selection validation: ${isValid ? 'valid' : 'invalid'}`, 
        { ...context, additionalData: { isValid, hullName: hull.Name } }
      );

      return { isValid, errors, warnings };

    } catch (error) {
      const errorMessage = `Hull validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      errors.push(errorMessage);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate that all required slots are filled
   */
  private validateRequiredSlots(hull: HullTemplate, design: ShipDesign, errors: Array<string>, warnings: Array<string>): void {
    for (const hullSlot of hull.Slots) {
      if (hullSlot.Required) {
        const slotId = hullSlot.Code || `slot_${hull.Slots.indexOf(hullSlot)}`;
        const slotAssignment = design.slots.find(s => s.slotId === slotId);
        
        if (!slotAssignment || slotAssignment.components.length === 0) {
          errors.push(`Required slot ${slotId} is empty`);
        }
      }
    }
  }

  /**
   * Validate design stats and constraints
   */
  private validateDesignStats(hull: HullTemplate, design: ShipDesign, techLevels: PlayerTech, errors: Array<string>, warnings: Array<string>): void {
    try {
      const stats = compileShipStats(hull, design.slots, techLevels, this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup());
      
      if (!stats.isValid) {
        errors.push(...stats.validationErrors);
      }

      // Additional stat validations can be added here
      if (stats.mass && stats.mass <= 0) {
        warnings.push('Design has no mass - may indicate missing components');
      }

    } catch (error) {
      errors.push(`Failed to compile design stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}