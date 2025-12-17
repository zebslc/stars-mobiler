import { Injectable, computed, signal } from '@angular/core';
import { HULLS, Hull, getHull } from '../data/hulls.data';
import { COMPONENTS, Component, getComponent } from '../data/components.data';
import { PlayerTech, ShipDesign, SlotAssignment } from '../models/game.model';
import {
  miniaturizeComponent,
  MiniaturizedComponent,
} from '../utils/miniaturization.util';
import {
  compileShipStats,
  CompiledShipStats,
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
    energy: 0,
    weapons: 0,
    propulsion: 0,
    construction: 0,
    electronics: 0,
    biotechnology: 0,
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
    return Object.values(COMPONENTS).map((comp) =>
      miniaturizeComponent(comp, techLevels)
    );
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
   * Install a component in a slot
   */
  installComponent(slotId: string, componentId: string): boolean {
    const design = this._currentDesign();
    const hull = this.currentHull();
    if (!design || !hull) return false;

    // Find the slot
    const hullSlot = hull.slots.find((s) => s.id === slotId);
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
      console.error(
        `Component ${component.name} cannot be installed in slot ${slotId}`
      );
      return false;
    }

    // Update slot assignment
    const newSlots = design.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, componentId } : slot
    );

    this._currentDesign.set({
      ...design,
      slots: newSlots,
    });

    return true;
  }

  /**
   * Remove component from a slot
   */
  removeComponent(slotId: string): void {
    const design = this._currentDesign();
    if (!design) return;

    const newSlots = design.slots.map((slot) =>
      slot.slotId === slotId ? { ...slot, componentId: null } : slot
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

    const hullSlot = hull.slots.find((s) => s.id === slotId);
    if (!hullSlot) return [];

    // Filter components that:
    // 1. Can be installed in this slot type
    // 2. Player has the required tech level
    return miniaturizedComponents.filter((miniComp) => {
      const baseComponent = getComponent(miniComp.id);
      if (!baseComponent) return false;

      // Check tech level requirement
      const playerLevel = techLevels[baseComponent.techRequired.field];
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
    const constructionLevel = techLevels.construction;

    return Object.values(HULLS).filter(
      (hull) => hull.techRequired.construction <= constructionLevel
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
    return this._currentDesign();
  }
}
