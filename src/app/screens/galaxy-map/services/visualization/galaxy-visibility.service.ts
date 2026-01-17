import { Injectable, inject, computed } from '@angular/core';
import { GameStateService } from '../../../../services/game/game-state.service';
import { SettingsService } from '../../../../services/core/settings.service';
import { GalaxyFleetPositionService } from '../fleet/galaxy-fleet-position.service';
import type { Fleet } from '../../../../models/game.model';
import { ShipDesignRegistry } from '../../../../services/data/ship-design-registry.service';

@Injectable({
  providedIn: 'root',
})
export class GalaxyVisibilityService {
  private gs = inject(GameStateService);
  private settings = inject(SettingsService);
  private fleetPositions = inject(GalaxyFleetPositionService);
  private shipDesignRegistry = inject(ShipDesignRegistry);

  // Helper
  getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  getFleetScanCapabilities(fleet: Fleet): { scanRange: number; cloakedRange: number } {
    let maxScanRange = 0;
    let maxCloakedRange = 0;

    for (const stack of fleet.ships) {
      const designId = stack.designId;

      let scanRange = 0;
      let cloakedRange = 0;

      const customDesign = this.gs.game()?.shipDesigns.find((d) => d.id === designId);
      if (customDesign && customDesign.spec) {
        scanRange = customDesign.spec.scanRange || 0;
        cloakedRange = customDesign.spec.canDetectCloaked ? customDesign.spec.scanRange || 0 : 0;
      } else {
        // Fallback for legacy/standard designs if needed
        const design = this.shipDesignRegistry.getDesign(designId);
        if (design) {
          scanRange = design.scannerRange;
          cloakedRange = design.cloakedRange || 0;
        }
      }

      if (scanRange > maxScanRange) {
        maxScanRange = scanRange;
      }
      if (cloakedRange > maxCloakedRange) {
        maxCloakedRange = cloakedRange;
      }
    }

    return {
      scanRange: maxScanRange,
      cloakedRange: maxCloakedRange,
    };
  }

  // Visibility Logic
  readonly visibleStars = computed(() => {
    const stars = this.gs.stars();
    const player = this.gs.player();
    if (!player) return new Set<string>();

    const visibleIds = new Set<string>();
    const game = this.gs.game();

    // 1. All stars with owned planets are visible
    for (const star of stars) {
      if (star.ownerId === player.id) {
        visibleIds.add(star.id);
      }
    }

    // 2. Calculate scanner sources
    const scanners: Array<{ x: number; y: number; r: number }> = [];

    // Planet Scanners
    for (const star of stars) {
      if (star.ownerId === player.id && star.scanner > 0) {
        scanners.push({
          x: star.position.x,
          y: star.position.y,
          r: star.scanner,
        });
      }
    }

    // Fleet Scanners
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.fleetPositions.getFleetPosition(f);
            if (pos) {
              scanners.push({ ...pos, r: caps.scanRange });
            }
          }
        }
      }
    }

    // 3. Check visibility for all stars
    for (const star of stars) {
      if (visibleIds.has(star.id)) continue; // Already visible

      for (const scanner of scanners) {
        if (this.getDistance(star.position, scanner) <= scanner.r) {
          visibleIds.add(star.id);
          break;
        }
      }
    }

    return visibleIds;
  });

  // Scanner Range Visualization
  readonly scannerRanges = computed(() => {
    if (!this.settings.showScannerRanges()) return [];

    const ranges: Array<{ x: number; y: number; r: number; type: 'planet' | 'fleet' }> = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.gs.stars()) {
      if (star.ownerId === player.id && star.scanner > 0) {
        ranges.push({
          x: star.position.x,
          y: star.position.y,
          r: star.scanner * rangePct,
          type: 'planet',
        });
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.fleetPositions.getFleetPosition(f);
            if (pos) {
              ranges.push({
                x: pos.x,
                y: pos.y,
                r: caps.scanRange * rangePct,
                type: 'fleet',
              });
            }
          }
        }
      }
    }
    return ranges;
  });

  readonly cloakedRanges = computed(() => {
    if (!this.settings.showScannerRanges() || !this.settings.showCloakedRanges()) return [];

    const ranges: Array<{ x: number; y: number; r: number; type: 'planet' | 'fleet' }> = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.gs.stars()) {
      if (star.ownerId === player.id && star.scanner > 0) {
        ranges.push({
          x: star.position.x,
          y: star.position.y,
          r: star.scanner * rangePct,
          type: 'planet',
        });
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game && game.fleets) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.cloakedRange > 0) {
            const pos = this.fleetPositions.getFleetPosition(f);
            if (pos) {
              ranges.push({
                x: pos.x,
                y: pos.y,
                r: caps.cloakedRange * rangePct,
                type: 'fleet',
              });
            }
          }
        }
      }
    }
    return ranges;
  });
}
