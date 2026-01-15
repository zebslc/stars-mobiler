import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from '../../../services/game/game-state.service';
import { Fleet } from '../../../models/game.model';
import { getDesign } from '../../../data/ships.data';

@Injectable({
  providedIn: 'root',
})
export class GalaxyFleetStationService {
  private gs = inject(GameStateService);

  readonly stationByStarId = computed(() => {
    const game = this.gs.game();
    const fleets = game?.fleets ?? [];
    const stationMap = new Map<string, string>();

    for (const fleet of fleets) {
      if (!this.isStation(fleet)) continue;
      if (fleet.location.type !== 'orbit') continue;

      const starId = fleet.location.starId;
      const designId = fleet.ships[0]?.designId;
      stationMap.set(starId, this.resolveDesignName(designId));
    }

    return stationMap;
  });

  isStation(fleet: Fleet): boolean {
    if (!fleet.ships.length) return false;

    const designId = fleet.ships[0]?.designId;
    if (!designId) return false;

    const game = this.gs.game();
    const customDesign = game?.shipDesigns.find((design) => design.id === designId);
    if (customDesign?.spec) {
      return !!customDesign.spec.isStarbase;
    }

    const design = getDesign(designId);
    return design?.isStarbase ?? false;
  }

  private resolveDesignName(designId: string | undefined): string {
    if (!designId) return 'Unknown Station';

    const game = this.gs.game();
    const customDesign = game?.shipDesigns.find((design) => design.id === designId);
    if (customDesign) return customDesign.name;

    const design = getDesign(designId);
    return design?.name ?? 'Unknown Station';
  }
}
