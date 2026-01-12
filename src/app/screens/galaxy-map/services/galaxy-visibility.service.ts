import { Injectable, inject, computed } from '@angular/core';
import { GameStateService } from '../../../services/game-state.service';
import { SettingsService } from '../../../services/settings.service';
import { GalaxyFleetService } from './galaxy-fleet.service';
import { Fleet } from '../../../models/game.model';
import { getDesign } from '../../../data/ships.data';

@Injectable({
  providedIn: 'root',
})
export class GalaxyVisibilityService {
  private gs = inject(GameStateService);
  private settings = inject(SettingsService);
  private fleetService = inject(GalaxyFleetService);

  // Helper
  getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  getFleetScanCapabilities(fleet: Fleet): { scanRange: number; cloakedRange: number } {
    let totalScanPower4 = 0;
    let totalCloakedScanPower4 = 0;

    for (const stack of fleet.ships) {
      const designId = stack.designId;
      const count = stack.count;

      let scanRange = 0;
      let cloakedRange = 0;

      // Check custom designs first
      const customDesign = this.gs.game()?.shipDesigns.find((d) => d.id === designId);
      if (customDesign && customDesign.spec) {
        scanRange = customDesign.spec.scanRange;
        cloakedRange = customDesign.spec.canDetectCloaked ? customDesign.spec.scanRange : 0;
      } else {
        // Fallback to legacy/compiled designs
        const design = getDesign(designId);
        if (design) {
          scanRange = design.scannerRange;
          cloakedRange = design.cloakedRange || 0;
        }
      }

      if (scanRange > 0) {
        totalScanPower4 += count * Math.pow(scanRange, 4);
      }
      if (cloakedRange > 0) {
        totalCloakedScanPower4 += count * Math.pow(cloakedRange, 4);
      }
    }

    return {
      scanRange: totalScanPower4 > 0 ? Math.pow(totalScanPower4, 0.25) : 0,
      cloakedRange: totalCloakedScanPower4 > 0 ? Math.pow(totalCloakedScanPower4, 0.25) : 0,
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
      if (star.planets.some((p) => p.ownerId === player.id)) {
        visibleIds.add(star.id);
      }
    }

    // 2. Calculate scanner sources
    const scanners: { x: number; y: number; r: number }[] = [];

    // Planet Scanners
    for (const star of stars) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          scanners.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner,
          });
        }
      }
    }

    // Fleet Scanners
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.fleetService.getFleetPosition(f);
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

    const ranges: { x: number; y: number; r: number; type: 'planet' | 'fleet' }[] = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.gs.stars()) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          ranges.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner * rangePct,
            type: 'planet',
          });
        }
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.fleetService.getFleetPosition(f);
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

    const ranges: { x: number; y: number; r: number; type: 'planet' | 'fleet' }[] = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.gs.stars()) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          ranges.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner * rangePct,
            type: 'planet',
          });
        }
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game && game.fleets) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.cloakedRange > 0) {
            const pos = this.fleetService.getFleetPosition(f);
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
