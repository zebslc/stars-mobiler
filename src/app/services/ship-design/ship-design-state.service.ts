import { Injectable, computed, inject, signal } from '@angular/core';
import type { PlayerTech, ShipDesign, SlotAssignment, Species } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';
import type { LogContext } from '../../models/service-interfaces.model';
import { compileShipStats, createEmptyDesign } from '../../models/ship-design.model';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';

/**
 * Ship Design State Service
 *
 * Centralizes ship designer state management and exposes derived data via signals.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignStateService {
  private readonly loggingService = inject(LoggingService);
  private readonly dataAccess = inject(DataAccessService);

  private readonly _currentDesign = signal<ShipDesign | null>(null);
  private readonly _techLevels = signal<PlayerTech>({
    Energy: 0,
    Kinetics: 0,
    Propulsion: 0,
    Construction: 0,
  });
  private readonly _playerSpecies = signal<Species | null>(null);

  readonly currentDesign = computed(() => this._currentDesign());
  readonly techLevels = computed(() => this._techLevels());
  readonly playerSpecies = computed(() => this._playerSpecies());

  readonly currentHull = computed(() => {
    const design = this._currentDesign();
    if (!design) return null;
    return this.dataAccess.getHull(design.hullId) ?? null;
  });

  readonly compiledStats = computed(() => {
    const design = this._currentDesign();
    const hull = this.currentHull();
    const techLevels = this._techLevels();
    if (!design || !hull) return null;
    return compileShipStats(hull, design.slots, techLevels, this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup());
  });

  setTechLevels(techLevels: PlayerTech): void {
    this._techLevels.set({ ...techLevels });
  }

  setPlayerSpecies(species: Species): void {
    this._playerSpecies.set(species);
  }

  startNewDesign(hullId: string, playerId: string, turn: number): void {
    const context: LogContext = {
      service: 'ShipDesignStateService',
      operation: 'startNewDesign',
      entityId: hullId,
      entityType: 'Hull',
      additionalData: { playerId, turn },
    };

    this.loggingService.debug('Starting new ship design', context);

    const hull = this.dataAccess.getHull(hullId);
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

  loadDesign(design: ShipDesign): void {
    const context: LogContext = {
      service: 'ShipDesignStateService',
      operation: 'loadDesign',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { hullId: design.hullId },
    };

    this.loggingService.debug('Loading existing design for editing', context);

    const hull = this.dataAccess.getHull(design.hullId);
    const slots = hull
      ? this.buildSlotsFromHull(design, hull.Slots)
      : this.cloneSlots(design.slots);

    if (!hull) {
      this.loggingService.warn(`Hull ${design.hullId} not found during loadDesign`, context);
    }

    this._currentDesign.set({
      ...design,
      slots,
    });

    this.loggingService.debug('Design loaded successfully', context);
  }

  setDesignName(name: string): void {
    const design = this._currentDesign();
    if (!design) return;
    this._currentDesign.set({
      ...design,
      name,
    });
  }

  clearDesign(): void {
    this._currentDesign.set(null);
  }

  replaceDesign(design: ShipDesign): void {
    this._currentDesign.set(design);
  }

  updateDesign(updater: (design: ShipDesign) => ShipDesign): boolean {
    const design = this._currentDesign();
    if (!design) return false;
    this._currentDesign.set(updater(design));
    return true;
  }

  getDesignSnapshot(): ShipDesign | null {
    return this._currentDesign();
  }

  getTechLevelSnapshot(): PlayerTech {
    return this._techLevels();
  }

  getSpeciesSnapshot(): Species | null {
    return this._playerSpecies();
  }

  getCurrentDesign(): ShipDesign | null {
    const design = this._currentDesign();
    const stats = this.compiledStats();
    if (!design || !stats) return null;
    return { ...design, spec: stats };
  }

  private buildSlotsFromHull(
    design: ShipDesign,
    hullSlots: HullTemplate['Slots'],
  ): Array<SlotAssignment> {
    return hullSlots.map((hullSlot, index) => {
      const slotId = hullSlot.Code || `slot_${index}`;
      const existingSlot = design.slots.find((slot) => slot.slotId === slotId);
      if (existingSlot) {
        return {
          ...existingSlot,
          components: existingSlot.components.map((component) => ({ ...component })),
        };
      }
      return {
        slotId,
        components: [],
      };
    });
  }

  private cloneSlots(slots: Array<SlotAssignment>): Array<SlotAssignment> {
    return slots.map((slot) => ({
      ...slot,
      components: slot.components.map((component) => ({ ...component })),
    }));
  }
}
