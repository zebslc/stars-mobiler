import { Injectable, inject } from '@angular/core';
import type { HullTemplate } from '../../data/tech-atlas.types';
import type { MiniaturizedComponent } from '../../utils/miniaturization.util';
import { ShipComponentEligibilityService } from './ship-component-eligibility.service';
import { ShipDesignStateService } from './ship-design-state.service';

/**
 * Ship Design Availability Service
 *
 * Provides hull and component availability queries based on current state.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignAvailabilityService {
  private readonly eligibility = inject(ShipComponentEligibilityService);
  private readonly state = inject(ShipDesignStateService);

  getAvailableComponentsForSlot(slotId: string): Array<MiniaturizedComponent> {
    return this.eligibility.getAvailableComponentsForSlot(
      this.state.currentHull(),
      slotId,
      this.state.getTechLevelSnapshot(),
      this.state.getSpeciesSnapshot(),
    );
  }

  getAvailableHulls(): Array<HullTemplate> {
    return this.eligibility.getAvailableHulls(this.state.getTechLevelSnapshot());
  }
}
