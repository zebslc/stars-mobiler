import { Injectable, computed, signal } from '@angular/core';
import type { PlayerTech, ShipDesign, SlotAssignment, Species } from '../../models/game.model';
import { compileShipStats } from '../../models/ship-design.model';
import type { HullTemplate } from '../../data/tech-atlas.types';
import { getHull } from '../../utils/data-access.util';

const INITIAL_TECH_LEVELS: PlayerTech = {
  Energy: 0,
  Kinetics: 0,
  Propulsion: 0,
  Construction: 0,
};

@Injectable({
  providedIn: 'root',
})
export class ShipDesignStore {
  private readonly _currentDesign = signal<ShipDesign | null>(null);
  private readonly _techLevels = signal<PlayerTech>({ ...INITIAL_TECH_LEVELS });
  private readonly _playerSpecies = signal<Species | null>(null);

  readonly currentDesign = computed(() => this._currentDesign());
  readonly techLevels = computed(() => this._techLevels());
  readonly playerSpecies = computed(() => this._playerSpecies());

  readonly currentHull = computed((): HullTemplate | null => {
    const design = this._currentDesign();
    if (!design) return null;
    return getHull(design.hullId) ?? null;
  });

  readonly compiledStats = computed(() => {
    const design = this._currentDesign();
    const hull = this.currentHull();
    const techLevels = this._techLevels();

    if (!design || !hull) return null;
    return compileShipStats(hull, design.slots, techLevels);
  });

  setDesign(design: ShipDesign | null): void {
    this._currentDesign.set(design ? { ...design } : null);
  }

  updateDesign(mapper: (design: ShipDesign) => ShipDesign): void {
    const design = this._currentDesign();
    if (!design) return;
    this._currentDesign.set(mapper(design));
  }

  updateSlots(mapper: (slots: Array<SlotAssignment>) => Array<SlotAssignment>): void {
    this.updateDesign((design) => ({ ...design, slots: mapper(design.slots) }));
  }

  setTechLevels(techLevels: PlayerTech): void {
    this._techLevels.set({ ...techLevels });
  }

  setPlayerSpecies(species: Species | null): void {
    this._playerSpecies.set(species ? { ...species } : null);
  }

  clearDesign(): void {
    this._currentDesign.set(null);
  }
}
