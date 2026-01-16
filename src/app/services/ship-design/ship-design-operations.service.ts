import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../core/logging.service';
import type {
  IShipDesignOperationsService,
  ComponentData,
  ResourceCost,
  LogContext,
} from '../../models/service-interfaces.model';
import type { ShipDesign, SlotAssignment } from '../../models/game.model';
import type { HullTemplate, SlotDefinition, ComponentStats } from '../../data/tech-atlas.types';
import { getHull, getComponent } from '../../utils/data-access.util';
import { canInstallComponent, createEmptyDesign } from '../../models/ship-design.model';
import { getSlotTypeForComponentType } from '../../data/tech-atlas.types';

interface NormalizedHullSlot {
  id: string;
  allowedTypes: Array<string>;
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
}

interface SlotContext {
  hullSlot: SlotDefinition;
  fullComponent: ComponentStats;
  convertedSlot: NormalizedHullSlot;
}

/**
 * Ship Design Operations Service
 *
 * Handles all ship design operations including slot management,
 * component placement, and design manipulation. Replaces console.log
 * statements with proper logging.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignOperationsService implements IShipDesignOperationsService {
  private readonly loggingService = inject(LoggingService);

  /**
   * Set a component in a slot (replaces any existing components)
   */
  setSlotComponent(
    design: ShipDesign,
    slotId: string,
    component: ComponentData,
    count: number,
  ): ShipDesign {
    return this.withOperation(
      design,
      {
        operation: 'setSlotComponent',
        startMessage: 'Setting slot component',
        successMessage: 'Slot component set successfully',
        failureMessage: 'Failed to set slot component',
        additionalData: { slotId, componentId: component.id, count },
      },
      (context) => this.applySlotReplacement(design, slotId, component, count, context),
    );
  }

  /**
   * Clear all components from a slot
   */
  clearSlot(design: ShipDesign, slotId: string): ShipDesign {
    return this.withOperation(
      design,
      {
        operation: 'clearSlot',
        startMessage: 'Clearing slot',
        successMessage: 'Slot cleared successfully',
        failureMessage: 'Failed to clear slot',
        additionalData: { slotId },
      },
      () => ({ ...design, slots: this.clearSlotAssignments(design.slots, slotId) }),
    );
  }

  /**
   * Change the hull of a design (creates new design with same name)
   */
  changeHull(design: ShipDesign, newHullId: string): ShipDesign {
    const context = this.createContext('changeHull', design, {
      oldHullId: design.hullId,
      newHullId,
    });
    this.loggingService.debug('Changing hull', context);

    try {
      const newHull = this.getHullOrThrow(newHullId, context);
      const result = this.buildHullChangeResult(design, newHull);
      const successContext = this.extendContext(context, { newHullName: newHull.Name });
      this.loggingService.debug('Hull changed successfully', successContext);
      return result;
    } catch (error) {
      this.throwWithLoggedError('Failed to change hull', error, context);
    }
  }

  /**
   * Calculate the resource cost of a design
   */
  calculateDesignCost(design: ShipDesign): ResourceCost {
    const context = this.createContext('calculateDesignCost', design);
    this.loggingService.debug('Calculating design cost', context);

    try {
      const totalCost = this.buildDesignCost(design);
      this.loggingService.debug(
        'Design cost calculated',
        this.extendContext(context, { totalCost }),
      );
      return totalCost;
    } catch (error) {
      this.throwWithLoggedError('Failed to calculate design cost', error, context);
    }
  }

  /**
   * Add a component to a slot (or increment if already present)
   */
  addComponent(
    design: ShipDesign,
    slotId: string,
    component: ComponentData,
    count: number = 1,
  ): ShipDesign {
    const context = this.createContext('addComponent', design, {
      slotId,
      componentId: component.id,
      count,
    });
    this.loggingService.debug('Adding component to slot', context);

    try {
      const details = this.resolveSlotContext(design, slotId, component.id, context);
      this.ensureComponentAllowed(details.fullComponent, details.convertedSlot, context);
      const slots = this.incrementSlotComponents(design.slots, slotId, component.id, count);
      const successContext = this.extendContext(context, {
        componentName: details.fullComponent.name,
      });
      this.loggingService.debug('Component added successfully', successContext);
      return { ...design, slots };
    } catch (error) {
      this.throwWithLoggedError('Failed to add component', error, context);
    }
  }

  /**
   * Remove one instance of a component from a slot
   */
  removeComponent(design: ShipDesign, slotId: string, componentId: string): ShipDesign {
    return this.withOperation(
      design,
      {
        operation: 'removeComponent',
        startMessage: 'Removing component from slot',
        successMessage: 'Component removed successfully',
        failureMessage: 'Failed to remove component',
        additionalData: { slotId, componentId },
      },
      () => ({ ...design, slots: this.decrementSlotComponent(design.slots, slotId, componentId) }),
    );
  }

  /**
   * Convert SlotDefinition to HullSlot for compatibility with existing validation
   */
  private createContext(
    operation: string,
    design: ShipDesign,
    additionalData?: Record<string, unknown>,
  ): LogContext {
    return {
      service: 'ShipDesignOperationsService',
      operation,
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData,
    };
  }

  private withOperation<T>(
    design: ShipDesign,
    details: {
      operation: string;
      startMessage: string;
      successMessage: string;
      failureMessage: string;
      additionalData?: Record<string, unknown>;
    },
    executor: (context: LogContext) => T,
  ): T {
    const context = this.createContext(details.operation, design, details.additionalData);
    this.loggingService.debug(details.startMessage, context);
    try {
      const result = executor(context);
      this.loggingService.debug(details.successMessage, context);
      return result;
    } catch (error) {
      this.throwWithLoggedError(details.failureMessage, error, context);
    }
  }

  private resolveSlotContext(
    design: ShipDesign,
    slotId: string,
    componentId: string,
    context: LogContext,
  ): SlotContext {
    const hull = this.getHullOrThrow(design.hullId, context);
    const hullSlot = this.getHullSlotOrThrow(hull, slotId, context);
    const fullComponent = this.getComponentOrThrow(componentId, context);
    const convertedSlot = this.convertSlotDefinitionToHullSlot(hullSlot, slotId);
    return { hullSlot, fullComponent, convertedSlot };
  }

  private getHullOrThrow(hullId: string, context: LogContext): HullTemplate {
    const hull = getHull(hullId);
    if (!hull) {
      const error = `Hull ${hullId} not found`;
      this.loggingService.error(error, context);
      throw new Error(error);
    }
    return hull;
  }

  private getHullSlotOrThrow(
    hull: HullTemplate,
    slotId: string,
    context: LogContext,
  ): SlotDefinition {
    const slot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!slot) {
      const error = `Slot ${slotId} not found in hull`;
      this.loggingService.error(error, this.extendContext(context, { hullId: hull.id }));
      throw new Error(error);
    }
    return slot;
  }

  private getComponentOrThrow(componentId: string, context: LogContext): ComponentStats {
    const component = getComponent(componentId);
    if (!component) {
      const error = `Component ${componentId} not found`;
      this.loggingService.error(error, context);
      throw new Error(error);
    }
    return component;
  }

  private ensureComponentAllowed(
    component: ComponentStats,
    slot: NormalizedHullSlot,
    context: LogContext,
  ): void {
    if (canInstallComponent(component, slot)) return;
    const error = `Component ${component.name} (${component.type}) cannot be installed in slot ${slot.id}`;
    const errorContext = this.extendContext(context, {
      allowedTypes: slot.allowedTypes,
      componentType: component.type,
    });
    this.loggingService.error(error, errorContext);
    throw new Error(error);
  }

  private calculateFinalCount(slot: SlotDefinition, requested: number) {
    const maxCount = slot.Max || 1;
    return { finalCount: Math.min(requested, maxCount), maxCount };
  }

  private buildHullChangeResult(design: ShipDesign, newHull: HullTemplate): ShipDesign {
    const base = createEmptyDesign(newHull, design.playerId, design.createdTurn);
    return {
      ...base,
      id: design.id,
      name: design.name,
      createdTurn: design.createdTurn,
      playerId: design.playerId,
    };
  }

  private replaceSlotComponents(
    slots: Array<SlotAssignment>,
    slotId: string,
    componentId: string,
    count: number,
  ): Array<SlotAssignment> {
    return slots.map((slot) =>
      slot.slotId !== slotId
        ? slot
        : {
            ...slot,
            components: [{ componentId, count }],
          },
    );
  }

  private incrementSlotComponents(
    slots: Array<SlotAssignment>,
    slotId: string,
    componentId: string,
    count: number,
  ): Array<SlotAssignment> {
    return slots.map((slot) =>
      slot.slotId !== slotId
        ? slot
        : {
            ...slot,
            components: this.mergeComponentCount(slot.components, componentId, count),
          },
    );
  }

  private mergeComponentCount(
    components: SlotAssignment['components'],
    componentId: string,
    count: number,
  ): SlotAssignment['components'] {
    const existing = components.find((c) => c.componentId === componentId);
    if (!existing) {
      return [...components, { componentId, count }];
    }
    return components.map((assignment) =>
      assignment.componentId === componentId
        ? { ...assignment, count: assignment.count + count }
        : assignment,
    );
  }

  private buildDesignCost(design: ShipDesign): ResourceCost {
    const total = this.createEmptyCost();
    this.addHullCost(total, design.hullId);
    design.slots.forEach((slot) => this.addSlotCost(total, slot));
    return total;
  }

  private applySlotReplacement(
    design: ShipDesign,
    slotId: string,
    component: ComponentData,
    count: number,
    context: LogContext,
  ): ShipDesign {
    const { hullSlot, fullComponent, convertedSlot } = this.resolveSlotContext(
      design,
      slotId,
      component.id,
      context,
    );
    this.ensureComponentAllowed(fullComponent, convertedSlot, context);
    const { finalCount, maxCount } = this.calculateFinalCount(hullSlot, count);
    this.loggingService.debug(
      `Setting slot ${slotId} to component ${fullComponent.name} (count: ${finalCount})`,
      this.extendContext(context, { finalCount, maxCount, componentName: fullComponent.name }),
    );
    const slots = this.replaceSlotComponents(design.slots, slotId, component.id, finalCount);
    return { ...design, slots };
  }

  private clearSlotAssignments(slots: Array<SlotAssignment>, slotId: string): Array<SlotAssignment> {
    return slots.map((slot) => (slot.slotId === slotId ? { ...slot, components: [] } : slot));
  }

  private decrementSlotComponent(
    slots: Array<SlotAssignment>,
    slotId: string,
    componentId: string,
  ): Array<SlotAssignment> {
    return slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;
      const components = slot.components
        .map((item) =>
          item.componentId === componentId ? { ...item, count: item.count - 1 } : item,
        )
        .filter((item) => item.count > 0);
      return { ...slot, components };
    });
  }

  private createEmptyCost(): ResourceCost {
    return { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
  }

  private addHullCost(total: ResourceCost, hullId: string): void {
    const hull = getHull(hullId);
    const hullCost = hull?.Cost;
    if (!hullCost) return;
    total.resources += hullCost.Resources || 0;
    total.ironium += hullCost.Ironium || 0;
    total.boranium += hullCost.Boranium || 0;
    total.germanium += hullCost.Germanium || 0;
  }

  private addSlotCost(total: ResourceCost, slot: SlotAssignment): void {
    slot.components.forEach((component) =>
      this.addComponentCost(total, component.componentId, component.count),
    );
  }

  private addComponentCost(total: ResourceCost, componentId: string, count: number): void {
    const component = getComponent(componentId);
    const cost = component?.cost;
    if (!cost) return;
    total.resources += (cost.resources || 0) * count;
    total.ironium += (cost.ironium || 0) * count;
    total.boranium += (cost.boranium || 0) * count;
    total.germanium += (cost.germanium || 0) * count;
  }

  private extendContext(context: LogContext, data: Record<string, unknown>): LogContext {
    return {
      ...context,
      additionalData: { ...(context.additionalData ?? {}), ...data },
    };
  }

  private throwWithLoggedError(message: string, error: unknown, context: LogContext): never {
    const errorMessage = `${message}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    this.loggingService.error(errorMessage, context);
    throw error instanceof Error ? error : new Error(String(error));
  }

  private convertSlotDefinitionToHullSlot(
    slotDef: SlotDefinition,
    slotId: string,
  ): NormalizedHullSlot {
    return {
      id: slotDef.Code || slotId,
      allowedTypes: slotDef.Allowed.map((type) => getSlotTypeForComponentType(type)) as Array<string>,
      max: slotDef.Max,
      required: slotDef.Required,
      editable: slotDef.Editable,
      size: typeof slotDef.Size === 'number' ? slotDef.Size : undefined,
    };
  }
}