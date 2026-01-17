import { Injectable, inject } from '@angular/core';
import type { Fleet } from '../../models/game.model';
import { GameStateService } from '../game/game-state.service';
import { ShipDesignResolverService } from '../ship-design';
import type { CompiledDesign } from '../data/ship-design-registry.service';

@Injectable({ providedIn: 'root' })
export class FleetMathService {
  private gs = inject(GameStateService);
  private shipDesignResolver = inject(ShipDesignResolverService);

  getShipDesign(designId: string): CompiledDesign {
    return (
      this.shipDesignResolver.resolve(designId, this.gs.game()) ?? {
        id: designId,
        name: 'Unknown Design',
        hullId: designId,
        hullName: 'Unknown',
        mass: 0,
        cargoCapacity: 0,
        fuelCapacity: 0,
        fuelEfficiency: 100,
        warpSpeed: 0,
        idealWarp: 0,
        armor: 0,
        shields: 0,
        initiative: 0,
        firepower: 0,
        colonistCapacity: 0,
        colonyModule: false,
        scannerRange: 0,
        cloakedRange: 0,
        cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
        components: [],
      }
    );
  }

  totalShipCount(fleet: Fleet | null): number {
    if (!fleet) return 0;
    return fleet.ships.reduce((acc, s) => acc + s.count, 0);
  }

  cargoCapacity(fleet: Fleet | null): number {
    if (!fleet) return 0;
    return fleet.ships.reduce(
      (sum, s) => sum + this.getShipDesign(s.designId).cargoCapacity * s.count,
      0,
    );
  }

  isSameLocation(f1: Fleet, f2: Fleet): boolean {
    if (f1.location.type !== f2.location.type) return false;
    if (f1.location.type === 'orbit') {
      return (f1.location as { starId: string }).starId === (f2.location as { starId: string }).starId;
    }
    return (
      (f1.location as any).x === (f2.location as any).x &&
      (f1.location as any).y === (f2.location as any).y
    );
  }

  calculateTurns(fleet: Fleet | null, distance: number): number {
    if (!fleet || distance === 0) return 0;
    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = this.getShipDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const speed = Math.max(1, maxWarp * 20);
    return Math.ceil(distance / speed);
  }

  rangeLy(fleet: Fleet | null): number {
    if (!fleet) return 0;
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of fleet.ships) {
      const d = this.getShipDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass +=
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      fleet.cargo.colonists;
    totalMass = Math.max(1, totalMass);
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = worstEfficiency / 100;
    const perLy = worstEfficiency === 0 ? 0 : Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
    return perLy === 0 ? 1000 : fleet.fuel / perLy;
  }
}
