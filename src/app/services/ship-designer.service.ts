import { Injectable, computed, signal } from '@angular/core';
import { HullTemplate, ComponentStats, getSlotTypeForComponentType } from '../data/tech-atlas.types';
import { ALL_HULLS, getAllComponents } from '../data/tech-atlas.data';
import { getHull, getComponent, getPrimaryTechField, getRequiredTechLevel } from '../utils/data-access.util';
import { PlayerTech, ShipDesign, SlotAssignment, CompiledShipStats } from '../models/game.model';
import { miniaturizeComponent, MiniaturizedComponent } from '../utils/miniaturization.util';
import {
  compileShipStats,
  canInstallComponent,
  createEmptyDesign,
} from '../models/ship-design.model';

/**
 * Ship Designer Service
 *
 * Manages custom ship designs and provides design validation
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignerService {
  private _currentDesign = signal<ShipDesign | null>(null);
  private _techLevels = signal<PlayerTech>({
    Energy: 0,
    Kinetics: 0,
    Propulsion: 0,
    Construction: 0,
  });

  // Computed signals
  readonly currentDesign = this._currentDesign.asReadonly();
  readonly techLevels = this._techLevels.asReadonly();

  readonly currentHull = computed(() => {
    const design = this._currentDesign();
    if (!design) return null;
    return getHull(design.hullId);
  });

  readonly miniaturizedComponents = computed(() => {
    const techLevels = this._techLevels();
    return getAllComponents().map((comp) => miniaturizeComponent(comp, techLevels));
  });

  readonly compiledStats = computed(() => {
    const design = this._currentDesign();
    const hull = this.currentHull();
    const components = this.miniaturizedComponents();

    if (!design || !hull) {
      return null;
    }

    return compileShipStats(hull, design.slots, components);
  });

  /**
   * Set player tech levels for miniaturization calculations
   */
  setTechLevels(techLevels: PlayerTech): void {
    this._techLevels.set({ ...techLevels });
  }

  /**
   * Start designing a new ship from a hull
   */
  startNewDesign(hullId: string, playerId: string, turn: number): void {
    const hull = getHull(hullId);
    if (!hull) {
      console.error(`Hull ${hullId} not found`);
      return;
    }

    const design = createEmptyDesign(hull, playerId, turn);
    this._currentDesign.set(design);
  }

  /**
   * Load an existing design for editing
   */
  loadDesign(design: ShipDesign): void {
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
      console.warn(`Hull ${design.hullId} not found during loadDesign`);
      slots = design.slots.map((slot) => ({
        ...slot,
        components: slot.components ? slot.components.map((c) => ({ ...c })) : [],
      }));
    }

    this._currentDesign.set({
      ...design,
      slots,
    });
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
    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) return false;

    // Find the slot
    const hullSlot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlot) {
      console.error(`Slot ${slotId} not found in hull`);
      return false;
    }

    // Get the component
    const component = getComponent(componentId);
    if (!component) {
      console.error(`Component ${componentId} not found`);
      return false;
    }

    // Convert SlotDefinition to HullSlot for compatibility checking
    const convertedSlot = {
      id: hullSlot.Code || slotId,
      allowedTypes: hullSlot.Allowed.map(type => getSlotTypeForComponentType(type)) as any[],
      max: hullSlot.Max,
      required: hullSlot.Required,
      editable: hullSlot.Editable,
      size: typeof hullSlot.Size === 'number' ? hullSlot.Size : undefined,
    };

    // Check if component can be installed
    const canInstall = canInstallComponent(component, convertedSlot);
    if (!canInstall) {
      console.error(
        `Component ${component.name} (${component.type}) cannot be installed in slot ${slotId} (Allowed: ${convertedSlot.allowedTypes})`,
      );
      return false;
    }

    // Replace all components in the slot with this one
    // Enforce max count
    const maxCount = hullSlot.Max || 1;
    const finalCount = Math.min(count, maxCount);

    console.log(`Setting slot ${slotId} to component ${component.name} (count: ${finalCount})`);

    const newSlots = design.slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;

      return {
        ...slot,
        components: [{ componentId, count: finalCount }],
      };
    });

    console.log('New slots:', JSON.stringify(newSlots));

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
    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) return false;

    // Find the slot
    const hullSlotDef = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlotDef) {
      console.error(`Slot ${slotId} not found in hull`);
      return false;
    }

    // Convert SlotDefinition to HullSlot for compatibility
    const hullSlot = {
      id: hullSlotDef.Code || slotId,
      allowedTypes: hullSlotDef.Allowed.map(type => getSlotTypeForComponentType(type)) as any[],
      max: hullSlotDef.Max,
      required: hullSlotDef.Required,
      editable: hullSlotDef.Editable,
      size: typeof hullSlotDef.Size === 'number' ? hullSlotDef.Size : undefined,
    };

    // Get the component
    const component = getComponent(componentId);
    if (!component) {
      console.error(`Component ${componentId} not found`);
      return false;
    }

    // Check if component can be installed
    if (!canInstallComponent(component, hullSlot)) {
      console.error(`Component ${component.name} cannot be installed in slot ${slotId}`);
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
    const miniaturizedComponents = this.miniaturizedComponents();

    if (!hull) return [];

    const hullSlot = hull.Slots.find((s, index) => (s.Code || `slot_${index}`) === slotId);
    if (!hullSlot) return [];

    // Filter components that:
    // 1. Can be installed in this slot type
    // 2. Player has the required tech level
    return miniaturizedComponents.filter((miniComp) => {
      const baseComponent = getComponent(miniComp.id);
      if (!baseComponent) return false;

      // Map old tech field names to new ones
      const fieldMap: Record<string, keyof PlayerTech> = {
        energy: 'Energy',
        Energy: 'Energy',
        weapons: 'Kinetics',
        Kinetics: 'Kinetics',
        propulsion: 'Propulsion',
        Propulsion: 'Propulsion',
        construction: 'Construction',
        Construction: 'Construction',
        electronics: 'Energy',
        Electronics: 'Energy',
        biotechnology: 'Construction',
        Biotechnology: 'Construction',
      };

      // Check tech level requirement using new system
      const primaryField = getPrimaryTechField(baseComponent);
      const requiredLevel = getRequiredTechLevel(baseComponent);
      const playerLevel = techLevels[primaryField as keyof PlayerTech] || 0;
      if (playerLevel < requiredLevel) {
        return false;
      }

      // Check slot compatibility - Convert SlotDefinition to HullSlot for compatibility
      const convertedSlot = {
        id: hullSlot.Code || slotId,
        allowedTypes: hullSlot.Allowed.map(type => getSlotTypeForComponentType(type)) as any[],
        max: hullSlot.Max,
        required: hullSlot.Required,
        editable: hullSlot.Editable,
        size: typeof hullSlot.Size === 'number' ? hullSlot.Size : undefined,
      };
      return canInstallComponent(baseComponent, convertedSlot);
    });
  }

  /**
   * Get available hulls based on construction tech level
   */
  getAvailableHulls(): HullTemplate[] {
    const techLevels = this._techLevels();
    const constructionLevel = techLevels.Construction;

    return ALL_HULLS.filter(
      (hull) => (hull.techReq?.Construction || 0) <= constructionLevel,
    );
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
