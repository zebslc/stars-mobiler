import { Injectable } from '@angular/core';
import { ComponentStats } from '../../data/tech-atlas.types';
import { LoggingService } from '../core/logging.service';
import { LogContext } from '../../models/service-interfaces.model';
import { HullSlot } from './hull-slot-validation.service';
import { HullSlotValidationService } from './hull-slot-validation.service';

/**
 * Interface for slot operation results
 */
export interface SlotOperationResult {
  success: boolean;
  slot: HullSlot;
  errors: string[];
  warnings: string[];
}

/**
 * Interface for slot display information
 */
export interface SlotDisplayInfo {
  isEmpty: boolean;
  componentName: string;
  componentCount: number;
  maxCount: number;
  slotType: string;
  slotTypeDisplay: string;
}

/**
 * Interface for component assignment in a slot
 */
export interface SlotComponentAssignment {
  componentId: string;
  component: ComponentStats;
  count: number;
}

/**
 * Extended hull slot with component assignments
 */
export interface HullSlotWithComponents extends HullSlot {
  components: SlotComponentAssignment[];
}

/**
 * Service for hull slot operations
 * Handles component placement, removal, and slot state management
 */
@Injectable({
  providedIn: 'root'
})
export class HullSlotOperationsService {
  constructor(
    private loggingService: LoggingService,
    private validationService: HullSlotValidationService
  ) {}

  /**
   * Place a component in a slot
   */
  placeComponent(slot: HullSlotWithComponents, component: ComponentStats, count: number): SlotOperationResult {
    const context: LogContext = {
      service: 'HullSlotOperationsService',
      operation: 'placeComponent',
      entityId: component.id,
      entityType: 'Component',
      additionalData: { slotId: slot.id, count }
    };

    this.loggingService.debug('Placing component in slot', context);

    const validation = this.validationService.validateComponentPlacement(slot, component, count);
    if (!validation.isValid) {
      return { success: false, slot, errors: validation.errors, warnings: validation.warnings };
    }

    const newSlot = this.createSlotWithComponent(slot, component, count);
    return { success: true, slot: newSlot, errors: [], warnings: validation.warnings };
  }

  private createSlotWithComponent(
    slot: HullSlotWithComponents, 
    component: ComponentStats, 
    count: number
  ): HullSlotWithComponents {
    return {
      ...slot,
      components: [{ componentId: component.id, component, count }]
    };
  }

  /**
   * Remove component from a slot
   */
  removeComponent(slot: HullSlotWithComponents): SlotOperationResult {
    const context: LogContext = {
      service: 'HullSlotOperationsService',
      operation: 'removeComponent',
      entityId: slot.id,
      entityType: 'HullSlot',
      additionalData: { slotId: slot.id, hasComponents: slot.components.length > 0 }
    };

    this.loggingService.debug('Removing component from slot', context);

    const newSlot: HullSlotWithComponents = { ...slot, components: [] };
    this.loggingService.debug('Component removed successfully', context);
    return { success: true, slot: newSlot, errors: [], warnings: [] };
  }

  /**
   * Increment component count in a slot
   */
  incrementComponent(slot: HullSlotWithComponents, componentId: string): SlotOperationResult {
    const context: LogContext = {
      service: 'HullSlotOperationsService',
      operation: 'incrementComponent',
      entityId: componentId,
      entityType: 'Component',
      additionalData: { slotId: slot.id }
    };

    const assignment = slot.components.find(c => c.componentId === componentId);
    if (!assignment) {
      const error = `Component ${componentId} not found in slot ${slot.id}`;
      this.loggingService.error(error, context);
      return { success: false, slot, errors: [error], warnings: [] };
    }

    return this.tryIncrementComponent(slot, assignment, context);
  }

  private tryIncrementComponent(
    slot: HullSlotWithComponents, 
    assignment: SlotComponentAssignment, 
    context: LogContext
  ): SlotOperationResult {
    const newCount = assignment.count + 1;
    const maxCount = this.validationService.getMaxComponentCount(slot, assignment.component);

    if (newCount > maxCount) {
      const error = `Cannot increment - would exceed maximum count of ${maxCount}`;
      this.loggingService.warn(error, context);
      return { success: false, slot, errors: [error], warnings: [] };
    }

    const newSlot: HullSlotWithComponents = {
      ...slot,
      components: slot.components.map(c => 
        c.componentId === assignment.componentId ? { ...c, count: newCount } : c
      )
    };

    return { success: true, slot: newSlot, errors: [], warnings: [] };
  }

  /**
   * Decrement component count in a slot
   */
  decrementComponent(slot: HullSlotWithComponents, componentId: string): SlotOperationResult {
    const assignment = slot.components.find(c => c.componentId === componentId);
    if (!assignment) {
      const error = `Component ${componentId} not found in slot ${slot.id}`;
      return { success: false, slot, errors: [error], warnings: [] };
    }

    const newCount = assignment.count - 1;
    if (newCount <= 0) {
      return this.removeComponent(slot);
    }

    const newSlot = this.createSlotWithDecrementedCount(slot, componentId, newCount);
    return { success: true, slot: newSlot, errors: [], warnings: [] };
  }

  private createSlotWithDecrementedCount(
    slot: HullSlotWithComponents, 
    componentId: string, 
    newCount: number
  ): HullSlotWithComponents {
    return {
      ...slot,
      components: slot.components.map(c => 
        c.componentId === componentId ? { ...c, count: newCount } : c
      )
    };
  }

  /**
   * Get display information for a slot
   */
  getSlotDisplayInfo(slot: HullSlotWithComponents): SlotDisplayInfo {
    const isEmpty = slot.components.length === 0;
    const componentInfo = this.extractComponentInfo(slot);
    const maxCount = slot.max || 1;
    const slotTypeDisplay = this.getSlotTypeDisplay(slot.allowedTypes);

    return {
      isEmpty,
      componentName: componentInfo.name,
      componentCount: componentInfo.count,
      maxCount,
      slotType: slot.allowedTypes.join(', '),
      slotTypeDisplay
    };
  }

  private extractComponentInfo(slot: HullSlotWithComponents): { name: string; count: number } {
    if (slot.components.length === 0 || !slot.components[0]) {
      return { name: '', count: 0 };
    }
    
    return {
      name: slot.components[0].component.name,
      count: slot.components[0].count
    };
  }

  /**
   * Get display representation for slot types
   */
  getSlotTypeDisplay(allowedTypes: string[]): string {
    const context: LogContext = {
      service: 'HullSlotOperationsService',
      operation: 'getSlotTypeDisplay',
      entityType: 'SlotType',
      additionalData: { allowedTypes }
    };

    this.loggingService.debug('Getting slot type display', context);

    const result = this.generateSlotTypeIcons(allowedTypes);
    this.loggingService.debug('Slot type display generated', context);
    return result;
  }

  private generateSlotTypeIcons(allowedTypes: string[]): string {
    const typeMap: Record<string, string> = {
      engine: '🚀', weapon: '🗡️', shield: '☔', armor: '🛡️',
      electronics: '⚡', elect: '⚡', computer: '⚡', scanner: '📡',
      mech: '⚙️', mechanical: '⚙️', general: '🛠️', bomb: '💣',
      mining: '⛏️', mine: '🔆', cargo: '📦', dock: '⚓',
      orb: '🛞', orbital: '🛞',
    };

    let icons = '';
    const addedIcons = new Set<string>();

    for (const type of allowedTypes) {
      const key = type.toLowerCase();
      const icon = key.includes('orbital') ? typeMap['orb'] : typeMap[key];

      if (icon && !addedIcons.has(icon)) {
        icons += icon;
        addedIcons.add(icon);
      }
    }

    return icons || '⚡';
  }

  /**
   * Check if a slot can accept more components
   */
  canAcceptMoreComponents(slot: HullSlotWithComponents): boolean {
    const context: LogContext = {
      service: 'HullSlotOperationsService',
      operation: 'canAcceptMoreComponents',
      entityId: slot.id,
      entityType: 'HullSlot',
      additionalData: { slotId: slot.id, currentComponents: slot.components.length }
    };

    const maxCount = slot.max || 1;
    const currentCount = slot.components.reduce((sum, c) => sum + c.count, 0);
    const canAccept = currentCount < maxCount;

    this.loggingService.debug('Checked if slot can accept more components', context);
    return canAccept;
  }

  /**
   * Get available space in a slot
   */
  getAvailableSpace(slot: HullSlotWithComponents): number {
    const maxCount = slot.max || 1;
    const currentCount = slot.components.reduce((sum, c) => sum + c.count, 0);
    return Math.max(0, maxCount - currentCount);
  }
}