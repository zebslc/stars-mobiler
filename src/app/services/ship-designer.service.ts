import { Injectable, inject } from '@angular/core';
import type { ComponentStats, HullTemplate } from '../data/tech-atlas.types';
import { getHull, getComponent } from '../utils/data-access.util';
import type { PlayerTech, ShipDesign, SlotAssignment, Species } from '../models/game.model';
import { createEmptyDesign } from '../models/ship-design.model';
import type { MiniaturizedComponent } from '../utils/miniaturization.util';
import { LoggingService } from './core/logging.service';
import type { LogContext } from '../models/service-interfaces.model';
import { ShipDesignStore } from '../core/state/ship-design.store';
import { ShipComponentEligibilityService } from './ship-design/ship-component-eligibility.service';
import { ShipSlotOperatorService } from './ship-design/ship-slot-operator.service';

const SLOT_ID_PREFIX = 'slot_';
const DEFAULT_COMPONENT_COUNT = 1;

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
  private readonly store = inject(ShipDesignStore);
  private readonly eligibility = inject(ShipComponentEligibilityService);
  private readonly slotOperator = inject(ShipSlotOperatorService);

  readonly currentDesign = this.store.currentDesign;
  readonly techLevels = this.store.techLevels;
  readonly currentHull = this.store.currentHull;
  readonly compiledStats = this.store.compiledStats;

  /**
   * Set player tech levels for miniaturization calculations
   */
  setTechLevels(techLevels: PlayerTech): void {
    this.store.setTechLevels(techLevels);
  }

  /**
   * Set player species for trait-based component filtering
   */
  setPlayerSpecies(species: Species): void {
    this.store.setPlayerSpecies(species);
  }

  /**
   * Start designing a new ship from a hull
   */
  startNewDesign(hullId: string, playerId: string, turn: number): void {
    const context = this.createContext('startNewDesign', hullId, 'Hull', { playerId, turn });
    this.loggingService.debug('Starting new ship design', context);

    const hull = this.getHullOrLog(hullId, context);
    if (!hull) return;

    const design = createEmptyDesign(hull, playerId, turn);
    this.store.setDesign(design);

    this.loggingService.debug('New ship design started successfully', {
      ...context,
      additionalData: { ...(context.additionalData ?? {}), designId: design.id },
    });
  }

  /**
   * Load an existing design for editing
   */
  loadDesign(design: ShipDesign): void {
    const context = this.createContext('loadDesign', design.id, 'ShipDesign', {
      hullId: design.hullId,
    });
    this.loggingService.debug('Loading existing design for editing', context);

    const hull = getHull(design.hullId) ?? null;
    const slots = this.buildSlotsForDesign(design, hull, context);

    this.store.setDesign({ ...design, slots });
    this.loggingService.debug('Design loaded successfully', context);
  }

  /**
   * Update design name
   */
  setDesignName(name: string): void {
    const design = this.store.currentDesign();
    if (!design) return;

    this.store.updateDesign((current) => ({ ...current, name }));
  }

  /**
   * Set a component in a slot (replaces any existing components)
   */
  setSlotComponent(
    slotId: string,
    componentId: string,
    count: number = DEFAULT_COMPONENT_COUNT,
  ): boolean {
    return this.executeSlotMutation(
      'setSlotComponent',
      slotId,
      componentId,
      count,
      (design, component) => this.slotOperator.setSlotComponent(design, slotId, component, count),
    );
  }

  /**
   * Add a component to a slot (or increment if already present)
   */
  addComponent(
    slotId: string,
    componentId: string,
    count: number = DEFAULT_COMPONENT_COUNT,
  ): boolean {
    return this.executeSlotMutation(
      'addComponent',
      slotId,
      componentId,
      count,
      (design, component) => this.slotOperator.addComponent(design, slotId, component, count),
    );
  }

  /**
   * Install a component in a slot (alias for addComponent)
   */
  installComponent(
    slotId: string,
    componentId: string,
    count: number = DEFAULT_COMPONENT_COUNT,
  ): boolean {
    return this.addComponent(slotId, componentId, count);
  }

  /**
   * Remove one instance of a component from a slot
   */
  removeComponent(slotId: string, componentId: string): void {
    const design = this.store.currentDesign();
    if (!design) return;
    const context = this.createContext('removeComponent', componentId, 'Component', { slotId });

    try {
      const updatedDesign = this.slotOperator.removeComponent(design, slotId, componentId);
      this.store.setDesign(updatedDesign);
    } catch {
      this.loggingService.warn('Failed to remove component from slot', context);
    }
  }

  /**
   * Clear all components from a slot
   */
  clearSlot(slotId: string): void {
    const design = this.store.currentDesign();
    if (!design) return;
    const context = this.createContext('clearSlot', design.id, 'ShipDesign', { slotId });

    try {
      const updatedDesign = this.slotOperator.clearSlot(design, slotId);
      this.store.setDesign(updatedDesign);
    } catch {
      this.loggingService.warn('Failed to clear slot', context);
    }
  }

  /**
   * Get available components for a specific slot
   */
  getAvailableComponentsForSlot(slotId: string): Array<MiniaturizedComponent> {
    const hull = this.currentHull();
    const techLevels = this.store.techLevels();
    const species = this.store.playerSpecies();
    return this.eligibility.getAvailableComponentsForSlot(hull, slotId, techLevels, species);
  }

  /**
   * Get available hulls based on construction tech level
   */
  getAvailableHulls(): Array<HullTemplate> {
    return this.eligibility.getAvailableHulls(this.store.techLevels());
  }

  /**
   * Clear current design
   */
  clearDesign(): void {
    this.store.clearDesign();
  }

  /**
   * Get the current design (for saving)
   */
  getCurrentDesign(): ShipDesign | null {
    const design = this.store.currentDesign();
    const stats = this.store.compiledStats();

    if (!design || !stats) return null;

    return {
      ...design,
      spec: stats,
    };
  }

  private createContext(
    operation: string,
    entityId: string,
    entityType: LogContext['entityType'],
    additionalData?: Record<string, unknown>,
  ): LogContext {
    return {
      service: 'ShipDesignerService',
      operation,
      entityId,
      entityType,
      additionalData,
    };
  }

  private getHullOrLog(hullId: string, context: LogContext): HullTemplate | null {
    const hull = getHull(hullId);
    if (!hull) {
      this.loggingService.error(`Hull ${hullId} not found`, context);
      return null;
    }
    return hull;
  }

  private getComponentOrLog(componentId: string, context: LogContext): ComponentStats | null {
    const component = getComponent(componentId);
    if (!component) {
      this.loggingService.error(`Component ${componentId} not found`, context);
      return null;
    }
    return component;
  }

  private executeSlotMutation(
    operation: string,
    slotId: string,
    componentId: string,
    count: number,
    mutate: (design: ShipDesign, component: ComponentStats) => ShipDesign,
  ): boolean {
    const context = this.createContext(operation, componentId, 'Component', { slotId, count });
    const design = this.store.currentDesign();
    if (!design) return this.warnAndFail(context, 'No design available for slot operation');
    const component = this.getComponentOrLog(componentId, context);
    if (!component) return false;
    return this.applySlotMutation(design, component, mutate, context);
  }

  private warnAndFail(context: LogContext, message: string): boolean {
    this.loggingService.warn(message, context);
    return false;
  }

  private applySlotMutation(
    design: ShipDesign,
    component: ComponentStats,
    mutate: (design: ShipDesign, component: ComponentStats) => ShipDesign,
    context: LogContext,
  ): boolean {
    try {
      const updatedDesign = mutate(design, component);
      this.store.setDesign(updatedDesign);
      return true;
    } catch {
      this.loggingService.warn('Slot operation failed', context);
      return false;
    }
  }

  private buildSlotsForDesign(
    design: ShipDesign,
    hull: HullTemplate | null,
    context: LogContext,
  ): Array<SlotAssignment> {
    if (!hull) {
      this.loggingService.warn(`Hull ${design.hullId} not found during loadDesign`, context);
      return design.slots.map((slot) => this.cloneSlot(slot));
    }
    return hull.Slots.map((hullSlot, index) => this.mergeSlotWithDesign(hullSlot, index, design));
  }

  private mergeSlotWithDesign(
    hullSlot: HullTemplate['Slots'][number],
    index: number,
    design: ShipDesign,
  ): SlotAssignment {
    const slotId = this.resolveSlotId(hullSlot, index);
    const existing = design.slots.find((slot) => slot.slotId === slotId);
    return existing ? this.cloneSlot(existing) : { slotId, components: [] };
  }

  private cloneSlot(slot: SlotAssignment): SlotAssignment {
    return {
      ...slot,
      components: (slot.components ?? []).map((component) => ({ ...component })),
    };
  }

  private resolveSlotId(slot: HullTemplate['Slots'][number], index: number): string {
    return slot.Code ?? this.buildSlotId(index);
  }

  private buildSlotId(index: number): string {
    return `${SLOT_ID_PREFIX}${index}`;
  }
}
