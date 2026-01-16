import { Injectable, inject } from '@angular/core';
import type { HullTemplate } from '../../data/tech-atlas.types';
import type { PlayerTech, ShipDesign, Species } from '../../models/game.model';
import type { MiniaturizedComponent } from '../../utils/miniaturization.util';
import { ShipDesignAvailabilityService } from './ship-design-availability.service';
import { ShipDesignComponentService } from './ship-design-component.service';
import { ShipDesignStateService } from './ship-design-state.service';

/**
 * Ship Designer Service
 *
 * Facade that composes specialized ship design services while
 * keeping the existing public API stable for consumers.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignerService {
  private readonly state = inject(ShipDesignStateService);
  private readonly componentService = inject(ShipDesignComponentService);
  private readonly availability = inject(ShipDesignAvailabilityService);

  readonly currentDesign = this.state.currentDesign;
  readonly techLevels = this.state.techLevels;
  readonly currentHull = this.state.currentHull;
  readonly compiledStats = this.state.compiledStats;

  setTechLevels(techLevels: PlayerTech): void {
    this.state.setTechLevels(techLevels);
  }

  setPlayerSpecies(species: Species): void {
    this.state.setPlayerSpecies(species);
  }

  startNewDesign(hullId: string, playerId: string, turn: number): void {
    this.state.startNewDesign(hullId, playerId, turn);
  }

  loadDesign(design: ShipDesign): void {
    this.state.loadDesign(design);
  }

  setDesignName(name: string): void {
    this.state.setDesignName(name);
  }

  setSlotComponent(slotId: string, componentId: string, count: number = 1): boolean {
    return this.componentService.setSlotComponent(slotId, componentId, count);
  }

  addComponent(slotId: string, componentId: string, count: number = 1): boolean {
    return this.componentService.addComponent(slotId, componentId, count);
  }

  installComponent(slotId: string, componentId: string, count: number = 1): boolean {
    return this.componentService.installComponent(slotId, componentId, count);
  }

  removeComponent(slotId: string, componentId: string): void {
    this.componentService.removeComponent(slotId, componentId);
  }

  clearSlot(slotId: string): void {
    this.componentService.clearSlot(slotId);
  }

  getAvailableComponentsForSlot(slotId: string): Array<MiniaturizedComponent> {
    return this.availability.getAvailableComponentsForSlot(slotId);
  }

  getAvailableHulls(): Array<HullTemplate> {
    return this.availability.getAvailableHulls();
  }

  clearDesign(): void {
    this.state.clearDesign();
  }

  getCurrentDesign(): ShipDesign | null {
    return this.state.getCurrentDesign();
  }
}
