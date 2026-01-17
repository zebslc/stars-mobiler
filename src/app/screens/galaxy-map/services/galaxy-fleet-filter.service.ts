import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from '../../../services/game/game-state.service';
import { SettingsService } from '../../../services/core/settings.service';
import { ShipDesignRegistry } from '../../../services/data/ship-design-registry.service';
import { GalaxyFleetStationService } from './galaxy-fleet-station.service';
import type { Fleet } from '../../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyFleetFilterService {
  private gs = inject(GameStateService);
  private settings = inject(SettingsService);
  private stations = inject(GalaxyFleetStationService);
  private shipDesignRegistry = inject(ShipDesignRegistry);

  readonly filteredFleets = computed(() => {
    const game = this.gs.game();
    const player = this.gs.player();
    if (!player) return [];

    const fleets = game?.fleets ?? [];
    const filter = this.settings.fleetFilter();
    const enemyOnly = this.settings.showEnemyFleets();

    if (filter.size === 0) {
      return [];
    }

    return fleets.filter((fleet) => this.isFleetVisible(fleet, player.id, filter, enemyOnly));
  });

  private isFleetVisible(
    fleet: Fleet,
    playerId: string,
    filter: Set<string>,
    enemyOnly: boolean,
  ): boolean {
    if (!fleet.ships.length) return false;

    const totalShips = fleet.ships.reduce((sum, stack) => sum + stack.count, 0);
    if (totalShips <= 0) return false;

    if (this.stations.isStation(fleet)) return false;

    if (enemyOnly && fleet.ownerId === playerId) return false;

    const designId = fleet.ships[0]?.designId;
    if (!designId) return false;

    const design = this.shipDesignRegistry.getDesign(designId);
    if (!design) return false;

    const type = design.type ?? 'warship';
    return filter.has(type);
  }
}
