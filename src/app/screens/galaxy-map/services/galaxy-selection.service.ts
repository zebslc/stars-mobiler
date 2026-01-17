import { Injectable, inject } from '@angular/core';
import { GalaxyMapStateService } from './galaxy-map-state.service';

/**
 * Handles selection of stars and fleets with double-tap detection.
 *
 * Single-tap selects the entity, double-tap triggers navigation.
 */
@Injectable({
  providedIn: 'root',
})
export class GalaxySelectionService {
  private readonly state = inject(GalaxyMapStateService);
  private lastClickTime = 0;
  private readonly DOUBLE_TAP_THRESHOLD = 300;

  /**
   * Select a star. Returns true if this was a double-tap.
   */
  selectStar(starId: string): boolean {
    const now = Date.now();
    const isDoubleTap =
      this.state.selectedStarId() === starId && now - this.lastClickTime < this.DOUBLE_TAP_THRESHOLD;

    this.state.selectedStarId.set(starId);
    this.lastClickTime = now;

    return isDoubleTap;
  }

  /**
   * Select a fleet. Returns true if this was a double-tap.
   */
  selectFleet(fleetId: string): boolean {
    const now = Date.now();
    const isDoubleTap =
      this.state.selectedFleetId() === fleetId &&
      now - this.lastClickTime < this.DOUBLE_TAP_THRESHOLD;

    this.state.selectedFleetId.set(fleetId);
    this.lastClickTime = now;

    return isDoubleTap;
  }

  /**
   * Clear all selections.
   */
  clearSelection(): void {
    this.state.selectedStarId.set(null);
    this.state.selectedFleetId.set(null);
  }
}
