import { Injectable, inject } from '@angular/core';
import { LoggingService } from './logging.service';
import { 
  IShipDesignOperationsService, 
  ComponentData, 
  ResourceCost,
  LogContext 
} from '../models/service-interfaces.model';
import { ShipDesign, SlotAssignment } from '../models/game.model';
import { HullTemplate, SlotDefinition } from '../data/tech-atlas.types';
import { getHull, getComponent } from '../utils/data-access.util';
import { canInstallComponent, createEmptyDesign } from '../models/ship-design.model';
import { getSlotTypeForComponentType } from '../data/tech-atlas.types';

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
  setSlotComponent(design: ShipDesign, slotId: string, component: ComponentData, count: number): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'setSlotComponent',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { slotId, componentId: component.id, count }
    };

    this.loggingService.debug('Setting slot component', context);

    try {
      const hull = getHull(design.hullId);
      if (!hull) {
        const error = `Hull ${design.hullId} not found`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Find the slot definition
      const hullSlot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
      if (!hullSlot) {
        const error = `Slot ${slotId} not found in hull`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Get the component for validation
      const fullComponent = getComponent(component.id);
      if (!fullComponent) {
        const error = `Component ${component.id} not found`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Convert SlotDefinition to HullSlot for compatibility checking
      const convertedSlot = this.convertSlotDefinitionToHullSlot(hullSlot, slotId);

      // Check if component can be installed
      const canInstall = canInstallComponent(fullComponent, convertedSlot);
      if (!canInstall) {
        const error = `Component ${fullComponent.name} (${fullComponent.type}) cannot be installed in slot ${slotId}`;
        this.loggingService.error(error, { 
          ...context, 
          additionalData: { 
            ...context.additionalData, 
            allowedTypes: convertedSlot.allowedTypes,
            componentType: fullComponent.type
          }
        });
        throw new Error(error);
      }

      // Enforce max count
      const maxCount = hullSlot.Max || 1;
      const finalCount = Math.min(count, maxCount);

      this.loggingService.debug(
        `Setting slot ${slotId} to component ${fullComponent.name} (count: ${finalCount})`, 
        { ...context, additionalData: { ...context.additionalData, finalCount, maxCount } }
      );

      // Create new slot assignments
      const newSlots = design.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;

        return {
          ...slot,
          components: [{ componentId: component.id, count: finalCount }],
        };
      });

      this.loggingService.debug('Slot component set successfully', context);

      return {
        ...design,
        slots: newSlots,
      };

    } catch (error) {
      const errorMessage = `Failed to set slot component: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Clear all components from a slot
   */
  clearSlot(design: ShipDesign, slotId: string): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'clearSlot',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { slotId }
    };

    this.loggingService.debug('Clearing slot', context);

    try {
      const newSlots = design.slots.map((slot) =>
        slot.slotId === slotId ? { ...slot, components: [] } : slot,
      );

      this.loggingService.debug('Slot cleared successfully', context);

      return {
        ...design,
        slots: newSlots,
      };

    } catch (error) {
      const errorMessage = `Failed to clear slot: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Change the hull of a design (creates new design with same name)
   */
  changeHull(design: ShipDesign, newHullId: string): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'changeHull',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { oldHullId: design.hullId, newHullId }
    };

    this.loggingService.debug('Changing hull', context);

    try {
      const newHull = getHull(newHullId);
      if (!newHull) {
        const error = `Hull ${newHullId} not found`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Create empty design with new hull
      const newDesign = createEmptyDesign(newHull, design.ownerId, design.turn);
      
      // Preserve name and other metadata
      const result = {
        ...newDesign,
        id: design.id,
        name: design.name,
        version: design.version + 1,
      };

      this.loggingService.debug('Hull changed successfully', { 
        ...context, 
        additionalData: { ...context.additionalData, newHullName: newHull.Name } 
      });

      return result;

    } catch (error) {
      const errorMessage = `Failed to change hull: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Calculate the resource cost of a design
   */
  calculateDesignCost(design: ShipDesign): ResourceCost {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'calculateDesignCost',
      entityId: design.id,
      entityType: 'ShipDesign'
    };

    this.loggingService.debug('Calculating design cost', context);

    try {
      let totalCost: ResourceCost = {
        resources: 0,
        ironium: 0,
        boranium: 0,
        germanium: 0,
      };

      // Add hull cost
      const hull = getHull(design.hullId);
      if (hull?.cost) {
        totalCost.resources += hull.cost.resources || 0;
        totalCost.ironium += hull.cost.ironium || 0;
        totalCost.boranium += hull.cost.boranium || 0;
        totalCost.germanium += hull.cost.germanium || 0;
      }

      // Add component costs
      for (const slotAssignment of design.slots) {
        for (const componentAssignment of slotAssignment.components) {
          const component = getComponent(componentAssignment.componentId);
          if (component?.cost) {
            const multiplier = componentAssignment.count;
            totalCost.resources += (component.cost.resources || 0) * multiplier;
            totalCost.ironium += (component.cost.ironium || 0) * multiplier;
            totalCost.boranium += (component.cost.boranium || 0) * multiplier;
            totalCost.germanium += (component.cost.germanium || 0) * multiplier;
          }
        }
      }

      this.loggingService.debug('Design cost calculated', { 
        ...context, 
        additionalData: { totalCost } 
      });

      return totalCost;

    } catch (error) {
      const errorMessage = `Failed to calculate design cost: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Add a component to a slot (or increment if already present)
   */
  addComponent(design: ShipDesign, slotId: string, component: ComponentData, count: number = 1): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'addComponent',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { slotId, componentId: component.id, count }
    };

    this.loggingService.debug('Adding component to slot', context);

    try {
      const hull = getHull(design.hullId);
      if (!hull) {
        const error = `Hull ${design.hullId} not found`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Find the slot definition
      const hullSlotDef = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
      if (!hullSlotDef) {
        const error = `Slot ${slotId} not found in hull`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Convert SlotDefinition to HullSlot for compatibility
      const hullSlot = this.convertSlotDefinitionToHullSlot(hullSlotDef, slotId);

      // Get the component for validation
      const fullComponent = getComponent(component.id);
      if (!fullComponent) {
        const error = `Component ${component.id} not found`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Check if component can be installed
      if (!canInstallComponent(fullComponent, hullSlot)) {
        const error = `Component ${fullComponent.name} cannot be installed in slot ${slotId}`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Update slot assignment
      const newSlots = design.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;

        const existingComp = slot.components.find((c) => c.componentId === component.id);
        if (existingComp) {
          // Increment count
          return {
            ...slot,
            components: slot.components.map((c) =>
              c.componentId === component.id ? { ...c, count: c.count + count } : c,
            ),
          };
        } else {
          // Add new component
          return {
            ...slot,
            components: [...slot.components, { componentId: component.id, count }],
          };
        }
      });

      this.loggingService.debug('Component added successfully', context);

      return {
        ...design,
        slots: newSlots,
      };

    } catch (error) {
      const errorMessage = `Failed to add component: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Remove one instance of a component from a slot
   */
  removeComponent(design: ShipDesign, slotId: string, componentId: string): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignOperationsService',
      operation: 'removeComponent',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { slotId, componentId }
    };

    this.loggingService.debug('Removing component from slot', context);

    try {
      const newSlots = design.slots.map((slot) => {
        if (slot.slotId !== slotId) return slot;

        return {
          ...slot,
          components: slot.components
            .map((c) => (c.componentId === componentId ? { ...c, count: c.count - 1 } : c))
            .filter((c) => c.count > 0),
        };
      });

      this.loggingService.debug('Component removed successfully', context);

      return {
        ...design,
        slots: newSlots,
      };

    } catch (error) {
      const errorMessage = `Failed to remove component: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Convert SlotDefinition to HullSlot for compatibility with existing validation
   */
  private convertSlotDefinitionToHullSlot(slotDef: SlotDefinition, slotId: string) {
    return {
      id: slotDef.Code || slotId,
      allowedTypes: slotDef.Allowed.map((type) => getSlotTypeForComponentType(type)) as string[],
      max: slotDef.Max,
      required: slotDef.Required,
      editable: slotDef.Editable,
      size: typeof slotDef.Size === 'number' ? slotDef.Size : undefined,
    };
  }
}