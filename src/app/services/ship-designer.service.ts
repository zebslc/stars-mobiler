import { Injectable, computed, signal, inject } from '@angular/core';
import {
  HullTemplate,
  getSlotTypeForComponentType,
} from '../data/tech-atlas.types';
import { ALL_HULLS, getAllComponents } from '../data/tech-atlas.data';
import {
  getHull,
  getComponent,
  getPrimaryTechField,
  getRequiredTechLevel,
} from '../utils/data-access.util';
import { PlayerTech, ShipDesign, SlotAssignment, Species } from '../models/game.model';
import {
  compileShipStats,
  canInstallComponent,
  createEmptyDesign,
} from '../models/ship-design.model';
import { miniaturizeComponent, MiniaturizedComponent } from '../utils/miniaturization.util';
import { LoggingService } from './logging.service';
import { LogContext } from '../models/service-interfaces.model';

/**
 * Ship Designer Service
 *
 * Manages custom ship designs and provides design validation
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignerService {
  private readonly loggingService = inject(LoggingService);

  private _currentDesign = signal<ShipDesign | null>(null);
  private _techLevels = signal<PlayerTech>({
    Energy: 0,
    Kinetics: 0,
    Propulsion: 0,
    Construction: 0,
  });
  private _playerSpecies = signal<Species | null>(null);

  // Computed signals
  readonly currentDesign = this._currentDesign.asReadonly();
  readonly techLevels = this._techLevels.asReadonly();

  readonly currentHull = computed(() => {
    const design = this._currentDesign();
    if (!design) return null;
    return getHull(design.hullId);
  });

  readonly compiledStats = computed(() => {
    const design = this._currentDesign();
    const hull = this.currentHull();
    const techLevels = this._techLevels();

    if (!design || !hull) {
      return null;
    }

    return compileShipStats(hull, design.slots, techLevels);
  });

  /**
   * Set player tech levels for miniaturization calculations
   */
  setTechLevels(techLevels: PlayerTech): void {
    this._techLevels.set({ ...techLevels });
  }

  /**
   * Set player species for trait-based component filtering
   */
  setPlayerSpecies(species: Species): void {
    this._playerSpecies.set(species);
  }

  /**
   * Start designing a new ship from a hull
   */
  startNewDesign(hullId: string, playerId: string, turn: number): void {
    const context: LogContext = {
      service: 'ShipDesignerService',
      operation: 'startNewDesign',
      entityId: hullId,
      entityType: 'Hull',
      additionalData: { playerId, turn },
    };

    this.loggingService.debug('Starting new ship design', context);

    const hull = getHull(hullId);
    if (!hull) {
      const error = `Hull ${hullId} not found`;
      this.loggingService.error(error, context);
      return;
    }

    const design = createEmptyDesign(hull, playerId, turn);
    this._currentDesign.set(design);

    this.loggingService.debug('New ship design started successfully', {
      ...context,
      additionalData: { ...context.additionalData, designId: design.id },
    });
  }

  /**
   * Load an existing design for editing
   */
  loadDesign(design: ShipDesign): void {
    const context: LogContext = {
      service: 'ShipDesignerService',
      operation: 'loadDesign',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { hullId: design.hullId },
    };

    this.loggingService.debug('Loading existing design for editing', context);

    const hull = getHull(design.hullId);
    let slots: SlotAssignment[];

    if (hull) {
      // Create slots based on hull to ensure all are present and in sync with hull definition
      slots = hull.Slots.map((hullSlot, index) => {
        const slotId = hullSlot.Code || `slot_${index}`;
        const existingSlot = design.slots.find((s) => s.slotId === slotId);
        if (existingSlot) {
          // Deep copy existing slot components
          return {
            ...existingSlot,
            components: existingSlot.components
              ? existingSlot.components.map((c) => ({ ...c }))
              : [],
          };
        } else {
          // Create empty slot if missing in design
          return {
            slotId,
            components: [],
          };
        }
      });
    } else {
      // Fallback if hull not found (shouldn't happen)
      this.loggingService.warn(`Hull ${design.hullId} not found during loadDesign`, context);
      slots = design.slots.map((slot) => ({
        ...slot,
        components: slot.components ? slot.components.map((c) => ({ ...c })) : [],
      }));
    }

    this._currentDesign.set({
      ...design,
      slots,
    });

    this.loggingService.debug('Design loaded successfully', context);
  }

  /**
   * Update design name
   */
  setDesignName(name: string): void {
    const design = this._currentDesign();
    if (!design) return;

    this._currentDesign.set({
      ...design,
      name,
    });
  }

  /**
   * Set a component in a slot (replaces any existing components)
   */
  setSlotComponent(slotId: string, componentId: string, count: number = 1): boolean {
    const context: LogContext = {
      service: 'ShipDesignerService',
      operation: 'setSlotComponent',
      entityId: componentId,
      entityType: 'Component',
      additionalData: { slotId, count },
    };

    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) {
      this.loggingService.warn('No design or hull available for slot component setting', context);
      return false;
    }

    // Find the slot
    const hullSlot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlot) {
      const error = `Slot ${slotId} not found in hull`;
      this.loggingService.error(error, context);
      return false;
    }

    // Get the component
    const component = getComponent(componentId);
    if (!component) {
      const error = `Component ${componentId} not found`;
      this.loggingService.error(error, context);
      return false;
    }

    // Convert SlotDefinition to HullSlot for compatibility checking
    const convertedSlot = {
      id: hullSlot.Code || slotId,
      allowedTypes: hullSlot.Allowed.map((type) => getSlotTypeForComponentType(type)) as any[],
      max: hullSlot.Max,
      required: hullSlot.Required,
      editable: hullSlot.Editable,
      size: typeof hullSlot.Size === 'number' ? hullSlot.Size : undefined,
    };

    // Check if component can be installed
    const canInstall = canInstallComponent(component, convertedSlot);
    if (!canInstall) {
      const error = `Component ${component.name} (${component.type}) cannot be installed in slot ${slotId} (Allowed: ${convertedSlot.allowedTypes})`;
      this.loggingService.error(error, {
        ...context,
        additionalData: {
          ...context.additionalData,
          componentType: component.type,
          allowedTypes: convertedSlot.allowedTypes,
        },
      });
      return false;
    }

    // Replace all components in the slot with this one
    // Enforce max count
    const maxCount = hullSlot.Max || 1;
    const finalCount = Math.min(count, maxCount);

    this.loggingService.debug(
      `Setting slot ${slotId} to component ${component.name} (count: ${finalCount})`,
      {
        ...context,
        additionalData: {
          ...context.additionalData,
          componentName: component.name,
          finalCount,
          maxCount,
        },
      },
    );

    const newSlots = design.slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;

      return {
        ...slot,
        components: [{ componentId, count: finalCount }],
      };
    });

    this.loggingService.debug('Slot component set successfully', {
      ...context,
      additionalData: { ...context.additionalData, slotCount: newSlots.length },
    });

    this._currentDesign.set({
      ...design,
      slots: newSlots,
    });

    return true;
  }

  /**
   * Add a component to a slot (or increment if already present)
   */
  addComponent(slotId: string, componentId: string, count: number = 1): boolean {
    const context: LogContext = {
      service: 'ShipDesignerService',
      operation: 'addComponent',
      entityId: componentId,
      entityType: 'Component',
      additionalData: { slotId, count },
    };

    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) {
      this.loggingService.warn('No design or hull available for component addition', context);
      return false;
    }

    // Find the slot
    const hullSlotDef = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlotDef) {
      const error = `Slot ${slotId} not found in hull`;
      this.loggingService.error(error, context);
      return false;
    }

    // Convert SlotDefinition to HullSlot for compatibility
    const hullSlot = {
      id: hullSlotDef.Code || slotId,
      allowedTypes: hullSlotDef.Allowed.map((type) => getSlotTypeForComponentType(type)) as any[],
      max: hullSlotDef.Max,
      required: hullSlotDef.Required,
      editable: hullSlotDef.Editable,
      size: typeof hullSlotDef.Size === 'number' ? hullSlotDef.Size : undefined,
    };

    // Get the component
    const component = getComponent(componentId);
    if (!component) {
      const error = `Component ${componentId} not found`;
      this.loggingService.error(error, context);
      return false;
    }

    // Check if component can be installed
    if (!canInstallComponent(component, hullSlot)) {
      const error = `Component ${component.name} cannot be installed in slot ${slotId}`;
      this.loggingService.error(error, {
        ...context,
        additionalData: { ...context.additionalData, componentName: component.name },
      });
      return false;
    }

    // Update slot assignment
    const newSlots = design.slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;

      const existingComp = slot.components.find((c) => c.componentId === componentId);
      if (existingComp) {
        // Increment count
        return {
          ...slot,
          components: slot.components.map((c) =>
            c.componentId === componentId ? { ...c, count: c.count + count } : c,
          ),
        };
      } else {
        // Add new component
        return {
          ...slot,
          components: [...slot.components, { componentId, count }],
        };
      }
    });

    this.loggingService.debug('Component added successfully', {
      ...context,
      additionalData: { ...context.additionalData, componentName: component.name },
    });

    this._currentDesign.set({
      ...design,
      slots: newSlots,
    });

    return true;
  }

  /**
   * Install a component in a slot (alias for addComponent)
   */
  installComponent(slotId: string, componentId: string, count: number = 1): boolean {
    return this.addComponent(slotId, componentId, count);
  }

  /**
   * Remove one instance of a component from a slot
   */
  removeComponent(slotId: string, componentId: string): void {
    const design = this._currentDesign();
    if (!design) return;

    const newSlots = design.slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;

      return {
        ...slot,
        components: slot.components
          .map((c) => (c.componentId === componentId ? { ...c, count: c.count - 1 } : c))
          .filter((c) => c.count > 0),
      };
    });

    this._currentDesign.set({
      ...design,
      slots: newSlots,
    });
  }

  /**
   * Clear all components from a slot
   */
  clearSlot(slotId: string): void {
    const design = this._currentDesign();
    if (!design) return;

    const newSlots = design.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, components: [] } : slot,
    );

    this._currentDesign.set({
      ...design,
      slots: newSlots,
    });
  }

  /**
   * Get available components for a specific slot
   */
  getAvailableComponentsForSlot(slotId: string): MiniaturizedComponent[] {
    const hull = this.currentHull();
    const techLevels = this._techLevels();
    const species = this._playerSpecies();

    if (!hull) return [];

    const hullSlot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlot) return [];

    // Filter components that:
    // 1. Can be installed in this slot type
    // 2. Player has the required tech level
    // 3. Player meets racial trait requirements
    const availableComponents = getAllComponents().filter((baseComponent) => {
      // Check tech level requirement using new system
      const primaryField = getPrimaryTechField(baseComponent);
      const requiredLevel = getRequiredTechLevel(baseComponent);
      const playerLevel = techLevels[primaryField as keyof PlayerTech] || 0;
      if (playerLevel < requiredLevel) {
        return false;
      }

      // Check Primary Racial Trait
      if (
        baseComponent.primaryRacialTraitRequired &&
        baseComponent.primaryRacialTraitRequired.length > 0 &&
        species
      ) {
        if (!species.primaryTraits) return false;
        const hasAllRequired = baseComponent.primaryRacialTraitRequired.every((req) =>
          species.primaryTraits?.includes(req),
        );
        if (!hasAllRequired) {
          return false;
        }
      }

      // Check Lesser Racial Trait
      if (
        baseComponent.lesserRacialTraitUnavailable &&
        baseComponent.lesserRacialTraitUnavailable.length > 0 &&
        species
      ) {
        if (species.lesserTraits) {
          const hasAnyForbidden = baseComponent.lesserRacialTraitUnavailable.some((forbidden) =>
            species.lesserTraits?.includes(forbidden),
          );
          if (hasAnyForbidden) {
            return false;
          }
        }
      }

      // Check Primary Racial Trait (Unavailable)
      if (
        baseComponent.primaryRacialTraitUnavailable &&
        baseComponent.primaryRacialTraitUnavailable.length > 0 &&
        species
      ) {
        if (species.primaryTraits) {
          const hasAnyForbidden = baseComponent.primaryRacialTraitUnavailable.some((forbidden) =>
            species.primaryTraits?.includes(forbidden),
          );
          if (hasAnyForbidden) {
            return false;
          }
        }
      }

      // Check Lesser Racial Trait (Required)
      if (
        baseComponent.lesserRacialTraitRequired &&
        baseComponent.lesserRacialTraitRequired.length > 0 &&
        species
      ) {
        if (!species.lesserTraits) return false;
        const hasAllRequired = baseComponent.lesserRacialTraitRequired.every((req) =>
          species.lesserTraits?.includes(req),
        );
        if (!hasAllRequired) {
          return false;
        }
      }

      // Check Hull Restrictions
      if (baseComponent.hullRestrictions && baseComponent.hullRestrictions.length > 0 && hull) {
        // hull.Name is usually "Scout", "Destroyer", etc.
        // The data says: hullRestrictions: ['Mini-Colonist']
        // We need to match against the current hull's name or class.
        // Assuming hull.Name matches.
        if (!baseComponent.hullRestrictions.includes(hull.Name)) {
          return false;
        }
      }

      // Check slot compatibility - Convert SlotDefinition to HullSlot for compatibility
      const convertedSlot = {
        id: hullSlot.Code || slotId,
        allowedTypes: hullSlot.Allowed.map((type) => getSlotTypeForComponentType(type)) as any[],
        max: hullSlot.Max,
        required: hullSlot.Required,
        editable: hullSlot.Editable,
        size: typeof hullSlot.Size === 'number' ? hullSlot.Size : undefined,
      };
      return canInstallComponent(baseComponent, convertedSlot);
    });

    // Return miniaturized versions of available components
    return availableComponents.map((component) => miniaturizeComponent(component, techLevels));
  }

  /**
   * Get available hulls based on construction tech level
   */
  getAvailableHulls(): HullTemplate[] {
    const techLevels = this._techLevels();
    const constructionLevel = techLevels.Construction;

    return ALL_HULLS.filter((hull) => (hull.techReq?.Construction || 0) <= constructionLevel);
  }

  /**
   * Clear current design
   */
  clearDesign(): void {
    this._currentDesign.set(null);
  }

  /**
   * Get the current design (for saving)
   */
  getCurrentDesign(): ShipDesign | null {
    const design = this._currentDesign();
    const stats = this.compiledStats();

    if (!design || !stats) return null;

    return {
      ...design,
      spec: stats,
    };
  }
}
