import { Injectable } from '@angular/core';
import type { ComponentStats, SlotDefinition, SlotType} from '../../data/tech-atlas.types';
import { getSlotTypeForComponentType } from '../../data/tech-atlas.types';
import { LoggingService } from '../core/logging.service';
import type { LogContext } from '../../models/service-interfaces.model';

/**
 * Interface for hull slot validation operations
 */
export interface HullSlot {
  id: string;
  allowedTypes: Array<SlotType>;
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
}

/**
 * Interface for component validation results
 */
export interface ComponentValidationResult {
  isValid: boolean;
  errors: Array<string>;
  warnings: Array<string>;
}

/**
 * Service for hull slot validation operations
 * Handles component fit validation, capacity checking, and constraint validation
 */
@Injectable({
  providedIn: 'root'
})
export class HullSlotValidationService {
  constructor(private loggingService: LoggingService) {}

  /**
   * Validate if a component can fit in a specific slot
   */
  validateComponentFit(slot: HullSlot, component: ComponentStats): boolean {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'validateComponentFit',
      entityId: component.id,
      entityType: 'Component',
      additionalData: { slotId: slot.id, componentType: component.type }
    };

    this.loggingService.debug('Validating component fit in slot', context);

    const componentSlotType = getSlotTypeForComponentType(component.type);
    const canFit = slot.allowedTypes.includes(componentSlotType);

    if (!canFit) {
      this.loggingService.debug('Component cannot fit in slot - type mismatch', context);
    }

    return canFit;
  }

  /**
   * Get the maximum number of components that can be placed in a slot
   */
  getMaxComponentCount(slot: HullSlot, component: ComponentStats): number {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'getMaxComponentCount',
      entityId: component.id,
      entityType: 'Component',
      additionalData: { slotId: slot.id, slotMax: slot.max }
    };

    if (!this.validateComponentFit(slot, component)) {
      this.loggingService.debug('Component cannot fit - returning 0', context);
      return 0;
    }

    const maxCount = slot.max || 1;
    this.loggingService.debug('Calculated max component count', context);
    return maxCount;
  }

  /**
   * Validate slot capacity constraints
   */
  validateSlotCapacity(slot: HullSlot, components: Array<ComponentStats>): boolean {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'validateSlotCapacity',
      entityId: slot.id,
      entityType: 'HullSlot',
      additionalData: { componentCount: components.length, slotMax: slot.max }
    };

    this.loggingService.debug('Validating slot capacity', context);

    const maxCount = slot.max || 1;
    const isValid = components.length <= maxCount;

    if (!isValid) {
      this.loggingService.warn('Slot capacity exceeded', context);
    }

    return isValid;
  }

  /**
   * Comprehensive validation of component placement in slot
   */
  validateComponentPlacement(slot: HullSlot, component: ComponentStats, count: number): ComponentValidationResult {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'validateComponentPlacement',
      entityId: component.id,
      entityType: 'Component',
      additionalData: { slotId: slot.id, count }
    };

    this.loggingService.debug('Performing comprehensive component placement validation', context);

    const errors = this.collectValidationErrors(slot, component, count);
    const warnings: Array<string> = [];

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private collectValidationErrors(slot: HullSlot, component: ComponentStats, count: number): Array<string> {
    const errors: Array<string> = [];

    if (!this.validateComponentFit(slot, component)) {
      errors.push(`Component ${component.name} (${component.type}) cannot be installed in slot ${slot.id}`);
    }

    const maxCount = this.getMaxComponentCount(slot, component);
    if (count > maxCount) {
      errors.push(`Cannot install ${count} ${component.name} - slot ${slot.id} allows maximum ${maxCount}`);
    }

    if (count <= 0) {
      errors.push(`Invalid component count: ${count}`);
    }

    if (slot.editable === false) {
      errors.push(`Slot ${slot.id} is not editable`);
    }

    return errors;
  }

  /**
   * Convert SlotDefinition to HullSlot interface for compatibility
   */
  convertSlotDefinition(slot: SlotDefinition, index: number): HullSlot {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'convertSlotDefinition',
      entityId: slot.Code || `slot_${index}`,
      entityType: 'SlotDefinition',
      additionalData: { slotCode: slot.Code, allowedTypes: slot.Allowed }
    };

    this.loggingService.debug('Converting SlotDefinition to HullSlot', context);

    return {
      id: slot.Code || `slot_${index}`,
      allowedTypes: slot.Allowed.map(type => getSlotTypeForComponentType(type)) as Array<SlotType>,
      max: slot.Max,
      required: slot.Required,
      editable: slot.Editable,
      size: typeof slot.Size === 'number' ? slot.Size : undefined,
    };
  }

  /**
   * Validate required slots are filled in a design
   */
  validateRequiredSlots(
    slots: Array<HullSlot>, 
    assignments: Array<{slotId: string, hasComponents: boolean}>
  ): ComponentValidationResult {
    const context: LogContext = {
      service: 'HullSlotValidationService',
      operation: 'validateRequiredSlots',
      entityType: 'SlotValidation',
      additionalData: { totalSlots: slots.length }
    };

    this.loggingService.debug('Validating required slots', context);

    const errors = this.findEmptyRequiredSlots(slots, assignments);
    const warnings: Array<string> = [];

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private findEmptyRequiredSlots(
    slots: Array<HullSlot>, 
    assignments: Array<{slotId: string, hasComponents: boolean}>
  ): Array<string> {
    const errors: Array<string> = [];

    for (const slot of slots) {
      if (slot.required) {
        const assignment = assignments.find(a => a.slotId === slot.id);
        if (!assignment || !assignment.hasComponents) {
          errors.push(`Required slot ${slot.id} is empty`);
        }
      }
    }

    return errors;
  }
}