import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../../../services/game/game-state.service';
import { Fleet, FleetOrder, Star } from '../../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../../models/fleet-order.constants';
import { getDesign } from '../../../data/ships.data';

interface FleetRangeStats {
  x: number;
  y: number;
  oneWay: number;
  roundTrip: number;
}

@Injectable({
  providedIn: 'root',
})
export class GalaxyFleetPositionService {
  private gs = inject(GameStateService);

  getFleetPosition(fleet: Fleet): { x: number; y: number } | null {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }

    const star = this.findStar(fleet.location.starId);
    return star ? { ...star.position } : null;
  }

  getSpaceFleetPos(fleet: Fleet): { x: number; y: number } {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    return { x: 0, y: 0 };
  }

  fleetPos(id: string): { x: number; y: number } {
    const fleet = this.findFleet(id);
    if (!fleet) {
      return { x: 0, y: 0 };
    }

    if (fleet.location.type === 'orbit') {
      return this.fleetOrbitPosition(fleet) ?? this.starPos(fleet.location.starId);
    }

    return { x: fleet.location.x, y: fleet.location.y };
  }

  fleetOrbitPosition(fleet: Fleet): { x: number; y: number } | null {
    if (fleet.location.type !== 'orbit') {
      return null;
    }

    const star = this.findStar(fleet.location.starId);
    if (!star) {
      return null;
    }

    const fleets = this.fleetsAtStar(star);
    const index = fleets.findIndex((candidate) => candidate.id === fleet.id);
    const total = fleets.length || 1;

    const angle = (Math.PI * 2 * index) / total;
    const radius = 18;

    return {
      x: star.position.x + Math.cos(angle) * radius,
      y: star.position.y + Math.sin(angle) * radius,
    };
  }

  fleetRange(id: string): FleetRangeStats | null {
    const fleet = this.findFleet(id);
    if (!fleet) {
      return null;
    }

    const speed = this.resolveFleetSpeed(fleet);
    if (!speed) {
      return null;
    }

    const basePerLy = speed.totalMass / 100;
    const ideal = Math.max(1, speed.idealWarp);
    const ratio = Math.max(1, speed.maxWarp / ideal);
    const multiplier = ratio <= 1 ? 1 : Math.pow(ratio, 2.5);
    const fuelPerLy = Math.floor(basePerLy * (speed.worstEfficiency / 100) * multiplier);
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
    const fleet = this.findFleet(fleetId);
    if (!fleet?.orders.length) {
      return null;
    }

    const moveOrder = fleet.orders.find((order) => order.type === FLEET_ORDER_TYPE.MOVE) as
      | Extract<FleetOrder, { type: typeof FLEET_ORDER_TYPE.MOVE }>
      | undefined;

    return moveOrder ? moveOrder.destination : null;
  }

  pathMarkers(fleetId: string, star: Star): { x: number; y: number }[] | null {
    return this.pathMarkersTo(fleetId, star.position);
  }

  pathMarkersTo(
    fleetId: string,
    dest: { x: number; y: number },
  ): { x: number; y: number }[] {
    const fleet = this.findFleet(fleetId);
    if (!fleet) {
      return [];
    }

    const start = this.fleetPos(fleetId);
    const dx = dest.x - start.x;
    const dy = dest.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      return [];
    }

    const maxWarp = this.resolveMaxWarp(fleet);
    if (maxWarp <= 0) {
      return [];
    }

    const speed = maxWarp * maxWarp;
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

  private findFleet(id: string): Fleet | undefined {
    return this.gs.game()?.fleets.find((fleet) => fleet.id === id);
  }

  private findStar(starId: string): Star | undefined {
    return this.gs.stars().find((star) => star.id === starId);
  }

  private starPos(starId: string): { x: number; y: number } {
    const star = this.findStar(starId);
    return star ? { ...star.position } : { x: 0, y: 0 };
  }

  private fleetsAtStar(star: Star): Fleet[] {
    const fleets = this.gs.game()?.fleets ?? [];
    return fleets.filter(
      (fleet) => fleet.location.type === 'orbit' && fleet.location.starId === star.id,
    );
  }

  private resolveFleetSpeed(
    fleet: Fleet,
  ): {
    maxWarp: number;
    idealWarp: number;
    totalMass: number;
    worstEfficiency: number;
  } | null {
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;

    for (const stack of fleet.ships) {
      const stats = this.resolveDesignStats(stack.designId);
      if (!stats) {
        continue;
      }

      maxWarp = Math.min(maxWarp, stats.warpSpeed);
      idealWarp = Math.min(idealWarp, stats.idealWarp);
      totalMass += stats.mass * stack.count;
      worstEfficiency = Math.max(worstEfficiency, stats.fuelEfficiency);
    }

    if (maxWarp === Infinity || idealWarp === Infinity || worstEfficiency === -Infinity) {
      return null;
    }

    totalMass = Math.max(1, totalMass);
    totalMass +=
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      fleet.cargo.colonists;

    return {
      maxWarp,
      idealWarp,
      totalMass,
      worstEfficiency,
    };
  }

  private resolveDesignStats(
    designId: string,
  ):
    | {
        warpSpeed: number;
        idealWarp: number;
        mass: number;
        fuelEfficiency: number;
      }
    | null {
    const game = this.gs.game();
    const custom = game?.shipDesigns.find((design) => design.id === designId);

    if (custom?.spec) {
      const stats = custom.spec;
      return {
        warpSpeed: stats.warpSpeed,
        idealWarp: stats.idealWarp,
        mass: stats.mass,
        fuelEfficiency: stats.fuelEfficiency ?? 100,
      };
    }

    const design = getDesign(designId);
    return {
      warpSpeed: design.warpSpeed,
      idealWarp: design.idealWarp,
      mass: design.mass,
      fuelEfficiency: design.fuelEfficiency,
    };
  }

  private resolveMaxWarp(fleet: Fleet): number {
    let maxWarp = Infinity;
    for (const stack of fleet.ships) {
      const stats = this.resolveDesignStats(stack.designId);
      if (!stats) {
        continue;
      }
      maxWarp = Math.min(maxWarp, stats.warpSpeed);
    }

    if (maxWarp === Infinity) {
      return 0;
    }
    return maxWarp;
  }
}
