import { Injectable, inject, computed } from '@angular/core';
import { GameStateService } from '../../../services/game/game-state.service';
import { SettingsService } from '../../../services/core/settings.service';
import { Fleet, Star } from '../../../models/game.model';
import { getDesign } from '../../../data/ships.data';

@Injectable({
  providedIn: 'root',
})
export class GalaxyFleetService {
  private gs = inject(GameStateService);
  private settings = inject(SettingsService);

  readonly filteredFleets = computed(() => {
    const fleets = this.gs.game()?.fleets ?? [];
    const player = this.gs.player();
    if (!player) return [];

    const filter = this.settings.fleetFilter();
    const enemyOnly = this.settings.showEnemyFleets();

    return fleets.filter((f) => {
      if (f.ships.reduce((sum: number, s: any) => sum + s.count, 0) <= 0) return false;

      if (this.isStation(f)) return false;

      if (enemyOnly && f.ownerId === player.id) return false;

      // Type filter (Empty = None)
      if (filter.size === 0) return false;

      const design = getDesign(f.ships[0].designId);
      if (!design) return false;

      return filter.has(design.type || 'warship');
    });
  });

  readonly stationByStarId = computed(() => {
    const fleets = this.gs.game()?.fleets ?? [];
    const stars = this.gs.stars();
    const planetToStar = new Map<string, string>();
    stars.forEach((s) => s.planets.forEach((p) => planetToStar.set(p.id, s.id)));

    const stationMap = new Map<string, string>();

    fleets.forEach((f) => {
      if (this.isStation(f) && f.location.type === 'orbit') {
        const starId = planetToStar.get(f.location.planetId);
        if (starId) {
          const designId = f.ships[0]?.designId;
          let designName = 'Unknown Station';
          const customDesign = this.gs.game()?.shipDesigns.find((d) => d.id === designId);
          if (customDesign) {
            designName = customDesign.name;
          } else {
            const design = getDesign(designId);
            if (design) designName = design.name;
          }
          stationMap.set(starId, designName);
        }
      }
    });
    return stationMap;
  });

  isStation(fleet: Fleet): boolean {
    const designId = fleet.ships[0]?.designId;
    if (!designId) return false;

    // Check custom designs
    const customDesign = this.gs.game()?.shipDesigns.find((d) => d.id === designId);
    if (customDesign && customDesign.spec) {
      return customDesign.spec.isStarbase;
    }

    // Fallback
    const design = getDesign(designId);
    if (design) {
      return design.isStarbase ?? false;
    }
    return false;
  }

  getFleetPosition(fleet: Fleet): { x: number; y: number } | null {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    const star = this.gs.stars().find((s) =>
      s.planets.some((p) => p.id === (fleet.location as any).planetId),
    );
    return star ? { x: star.position.x, y: star.position.y } : null;
  }

  getSpaceFleetPos(fleet: Fleet): { x: number; y: number } {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    return { x: 0, y: 0 };
  }

  fleetPos(id: string): { x: number; y: number } {
    const game = this.gs.game();
    if (!game) return { x: 0, y: 0 };
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return { x: 0, y: 0 };
    if (fleet.location.type === 'orbit') {
      const orbitPos = this.fleetOrbitPosition(fleet);
      if (orbitPos) return orbitPos;
      return this.planetPos(fleet.location.planetId);
    }
    return { x: fleet.location.x, y: fleet.location.y };
  }

  // Helper for fleetPos
  private planetPos(planetId: string): { x: number; y: number } {
    const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  fleetsAtStar(star: Star) {
    const ids = star.planets.map((p) => p.id);
    const fleets = this.gs.game()?.fleets ?? [];
    return fleets.filter((f) => f.location.type === 'orbit' && ids.includes(f.location.planetId));
  }

  fleetOrbitPosition(fleet: any): { x: number; y: number } | null {
    if (fleet.location.type !== 'orbit') return null;
    const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === fleet.location.planetId));
    if (!star) return null;
    const fleets = this.fleetsAtStar(star);
    const idx = fleets.findIndex((f) => f.id === fleet.id);
    const total = fleets.length || 1;
    const angle = (Math.PI * 2 * idx) / total;
    const radius = 18;
    return {
      x: star.position.x + Math.cos(angle) * radius,
      y: star.position.y + Math.sin(angle) * radius,
    };
  }

  fleetRange(id: string): { x: number; y: number; oneWay: number; roundTrip: number } | null {
    const game = this.gs.game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return null;
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass = Math.max(1, totalMass);
    // Cargo mass: minerals + colonists (1 kT per 1000)
    totalMass +=
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      fleet.cargo.colonists;
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const fuelPerLy = Math.floor(basePerLy * (worstEfficiency / 100) * speedMultiplier);
    // Simplified range calc
    const fuel = fleet.fuel;
    const range = fuelPerLy > 0 ? fuel / fuelPerLy : 0;
    const pos = this.fleetPos(id);
    return {
      x: pos.x,
      y: pos.y,
      oneWay: range,
      roundTrip: range / 2,
    };
  }

  orderDest(fleetId: string): { x: number; y: number } | null {
    const game = this.gs.game();
    const fleet = game?.fleets.find((f) => f.id === fleetId);
    if (!fleet || !fleet.orders.length) return null;

    const moveOrder = fleet.orders.find((o) => o.type === 'move');
    if (moveOrder && moveOrder.type === 'move') {
      return moveOrder.destination;
    }
    return null;
  }

  pathMarkers(fleetId: string, star: Star): { x: number; y: number }[] | null {
    return this.pathMarkersTo(fleetId, star.position);
  }

  pathMarkersTo(fleetId: string, dest: { x: number; y: number }): { x: number; y: number }[] {
    const game = this.gs.game();
    const fleet = game?.fleets.find((f) => f.id === fleetId);
    if (!fleet) return [];

    const start = this.fleetPos(fleetId);
    const dx = dest.x - start.x;
    const dy = dest.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return [];

    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      if (d) {
        maxWarp = Math.min(maxWarp, d.warpSpeed);
      }
    }
    if (maxWarp === Infinity) maxWarp = 0;

    const speed = maxWarp * maxWarp; // LY/year
    if (speed <= 0) return [];

    const markers: { x: number; y: number }[] = [];
    let currentDist = speed;

    while (currentDist < dist) {
      const ratio = currentDist / dist;
      markers.push({
        x: start.x + dx * ratio,
        y: start.y + dy * ratio,
      });
      currentDist += speed;
    }

    return markers;
  }
}
