import { Injectable, inject } from '@angular/core';
import type { LogContext } from '../../models/service-interfaces.model';
import { getComponent } from '../../utils/data-access.util';
import { ShipSlotOperatorService } from './ship-slot-operator.service';
import { ShipDesignStateService } from './ship-design-state.service';
import { LoggingService } from '../core/logging.service';

/**
 * Ship Design Component Service
 *
 * Encapsulates slot component operations while coordinating with design state.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignComponentService {
  private readonly state = inject(ShipDesignStateService);
  private readonly slotOperator = inject(ShipSlotOperatorService);
  private readonly loggingService = inject(LoggingService);

  setSlotComponent(slotId: string, componentId: string, count: number = 1): boolean {
    const context = this.createContext('setSlotComponent', componentId, { slotId, count });
    const design = this.getDesignOrWarn(context);
    if (!design) return false;

    const component = this.getComponentOrError(componentId, context);
    if (!component) return false;

    try {
      const updated = this.slotOperator.setSlotComponent(design, slotId, component, count);
      this.state.replaceDesign(updated);
      return true;
    } catch {
      return false;
    }
  }

  addComponent(slotId: string, componentId: string, count: number = 1): boolean {
    const context = this.createContext('addComponent', componentId, { slotId, count });
    const design = this.getDesignOrWarn(context);
    if (!design) return false;

    const component = this.getComponentOrError(componentId, context);
    if (!component) return false;

    try {
      const updated = this.slotOperator.addComponent(design, slotId, component, count);
      this.state.replaceDesign(updated);
      return true;
    } catch {
      return false;
    }
  }

  installComponent(slotId: string, componentId: string, count: number = 1): boolean {
    return this.addComponent(slotId, componentId, count);
  }

  removeComponent(slotId: string, componentId: string): void {
    const context = this.createContext('removeComponent', componentId, { slotId });
    const design = this.getDesignOrWarn(context);
    if (!design) return;

    try {
      const updated = this.slotOperator.removeComponent(design, slotId, componentId);
      this.state.replaceDesign(updated);
    } catch {
      // Failure already logged by underlying services.
    }
  }

  clearSlot(slotId: string): void {
    const context = this.createContext('clearSlot', undefined, { slotId });
    const design = this.getDesignOrWarn(context);
    if (!design) return;

    try {
      const updated = this.slotOperator.clearSlot(design, slotId);
      this.state.replaceDesign(updated);
    } catch {
      // Failure already logged by underlying services.
    }
  }

  private getDesignOrWarn(context: LogContext) {
    const design = this.state.getDesignSnapshot();
    if (!design) {
      this.loggingService.warn('No design available for slot operation', context);
      return null;
    }
    return design;
  }

  private getComponentOrError(componentId: string, context: LogContext) {
    const component = getComponent(componentId);
    if (!component) {
      const error = `Component ${componentId} not found`;
      this.loggingService.error(error, context);
      return null;
    }
    return component;
  }

  private createContext(
    operation: string,
    entityId?: string,
    additionalData?: Record<string, unknown>,
  ): LogContext {
    return {
      service: 'ShipDesignComponentService',
      operation,
      entityId,
      entityType: entityId ? 'Component' : 'ShipDesign',
      additionalData,
    };
  }
}
