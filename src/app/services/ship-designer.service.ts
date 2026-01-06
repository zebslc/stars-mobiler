import { Injectable, computed, signal } from '@angular/core';
import { HULLS, Hull, getHull } from '../data/hulls.data';
import { COMPONENTS, Component, getComponent } from '../data/components.data';
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
    return Object.values(COMPONENTS).map((comp) => miniaturizeComponent(comp, techLevels));
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
    this._currentDesign.set({ ...design });
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
    const hullSlot = hull.slots.find((s: any) => s.id === slotId);
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

    // Check if component can be installed
    if (!canInstallComponent(component, hullSlot)) {
      console.error(`Component ${component.name} cannot be installed in slot ${slotId}`);
      return false;
    }

    // Replace all components in the slot with this one
    // Enforce max count
    const maxCount = hullSlot.max || 1;
    const finalCount = Math.min(count, maxCount);

    const newSlots = design.slots.map((slot) => {
      if (slot.slotId !== slotId) return slot;

      return {
        ...slot,
        components: [{ componentId, count: finalCount }],
      };
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
    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) return false;

    // Find the slot
    const hullSlot = hull.slots.find((s: any) => s.id === slotId);
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

    const hullSlot = hull.slots.find((s: any) => s.id === slotId);
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

      // Check tech level requirement
      const mappedField = fieldMap[baseComponent.techRequired.field] || fieldMap[baseComponent.techRequired.field.toLowerCase()] || 'Construction';
      const playerLevel = techLevels[mappedField];
      if (playerLevel < baseComponent.techRequired.level) {
        return false;
      }

      // Check slot compatibility
      return canInstallComponent(baseComponent, hullSlot);
    });
  }

  /**
   * Get available hulls based on construction tech level
   */
  getAvailableHulls(): Hull[] {
    const techLevels = this._techLevels();
    const constructionLevel = techLevels.Construction;

    return Object.values(HULLS).filter(
      (hull: any) => (hull.techRequired?.construction || 0) <= constructionLevel,
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
