import { Injectable, inject } from '@angular/core';
import type { Fleet, FleetOrder, GameState, Star } from '../../models/game.model';
import { FleetColonizationService } from './fleet-colonization.service';
import { FleetFuelCalculatorService } from './fleet-fuel-calculator.service';
import { FleetMovementStatsService } from './fleet-movement-stats.service';
import { FleetShipDesignService } from './fleet-ship-design.service';
import { buildStarIndex, getStarPosition } from './fleet.helpers';
import {
  MOVEMENT_COMPLETION_EPSILON,
  ORBIT_REFUEL_RATE_WITHOUT_STARDOCK,
  ORBIT_REFUEL_RATE_WITH_STARDOCK,
  RAMSCOOP_REFUEL_RATE,
  SPACE_CAPTURE_DISTANCE,
  STARDOCK_DESIGN_ID,
  WARP_DISTANCE_FACTOR,
} from './fleet.constants';
import type { MovementStats } from './fleet-movement.types';

@Injectable({ providedIn: 'root' })
export class FleetProcessingService {
  private readonly colonization = inject(FleetColonizationService);
  private readonly movementStats = inject(FleetMovementStatsService);
  private readonly fuelCalculator = inject(FleetFuelCalculatorService);
  private readonly shipDesigns = inject(FleetShipDesignService);

  processFleets(game: GameState): void {
    const starIndex = buildStarIndex(game);

    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;

      const stats = this.movementStats.calculateMovementStats(fleet);
      this.refuelFleet(game, fleet, starIndex, stats);

      const order = fleet.orders[0];
      if (!order) continue;

      if (order.type === 'move' || order.type === 'orbit') {
        this.processMovementOrder(game, fleet, order, starIndex, stats);
      } else if (order.type === 'colonize') {
        this.colonization.colonizeNow(game, fleet.id);
      }
    }
  }

  private refuelFleet(
    game: GameState,
    fleet: Fleet,
    starIndex: Map<string, Star>,
    stats: MovementStats,
  ): void {
    if (stats.totalFuel <= 0) return;

    if (fleet.location.type === 'orbit') {
      this.refuelFromStar(game, fleet, starIndex, stats.totalFuel);
    } else {
      this.refuelFromSpace(game, fleet, stats.totalFuel);
    }
  }

  private refuelFromStar(
    game: GameState,
    fleet: Fleet,
    starIndex: Map<string, Star>,
    totalFuelCapacity: number,
  ): void {
    const starId = (fleet.location as { type: 'orbit'; starId: string }).starId;
    const star = starIndex.get(starId);
    if (!star || star.ownerId !== fleet.ownerId) return;

    const hasStardock = this.hasLocalStardock(game, fleet, starId);
    const rate = hasStardock ? ORBIT_REFUEL_RATE_WITH_STARDOCK : ORBIT_REFUEL_RATE_WITHOUT_STARDOCK;
    fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * rate);
  }

  private refuelFromSpace(game: GameState, fleet: Fleet, totalFuelCapacity: number): void {
    const hasRamscoop = fleet.ships.some((stack) => stack.damage === 0 && this.hasRamscoopDesign(game, stack.designId));
    if (!hasRamscoop) return;

    fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * RAMSCOOP_REFUEL_RATE);
  }

  private hasRamscoopDesign(game: GameState, designId: string): boolean {
    const dynamicDesign = game.shipDesigns.find((design) => design.id === designId)?.spec;
    if (dynamicDesign?.isRamscoop || dynamicDesign?.fuelEfficiency === 0) {
      return true;
    }

    const staticDesign = this.shipDesigns.getDesign(designId);
    return Boolean(staticDesign?.fuelEfficiency === 0 || staticDesign?.isRamscoop);
  }

  private hasLocalStardock(game: GameState, fleet: Fleet, starId: string): boolean {
    return game.fleets.some(
      (candidate) =>
        candidate.ownerId === fleet.ownerId &&
        candidate.location.type === 'orbit' &&
        (candidate.location as { type: 'orbit'; starId: string }).starId === starId &&
        candidate.ships.some((stack) => stack.designId === STARDOCK_DESIGN_ID),
    );
  }

  private processMovementOrder(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    starIndex: Map<string, Star>,
    stats: MovementStats,
  ): void {
    const destination = this.resolveDestination(game, fleet, order, starIndex);
    if (!destination) return;

    const currentPosition = this.getCurrentPosition(game, fleet);
    const distance = Math.hypot(destination.x - currentPosition.x, destination.y - currentPosition.y);
    const warp = this.determineTravelWarp(fleet, order, stats, distance);
    const perLy = this.fuelCalculator.buildMovementRequirement(fleet, warp, 1).fuelPerLy;
    const maxLy = perLy > 0 ? fleet.fuel / perLy : distance;
    const step = Math.min(distance, maxLy, warp * WARP_DISTANCE_FACTOR);

    if (step >= distance - MOVEMENT_COMPLETION_EPSILON) {
      this.completeMovement(game, fleet, destination, order);
      fleet.fuel = Math.max(0, fleet.fuel - perLy * distance);
    } else {
      const ratio = distance > 0 ? step / distance : 0;
      fleet.location = {
        type: 'space',
        x: currentPosition.x + (destination.x - currentPosition.x) * ratio,
        y: currentPosition.y + (destination.y - currentPosition.y) * ratio,
      };
      fleet.fuel = Math.max(0, fleet.fuel - perLy * step);
    }
  }

  private resolveDestination(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    starIndex: Map<string, Star>,
  ): { x: number; y: number } | null {
    if (order.type === 'orbit') {
      const star = starIndex.get(order.starId);
      if (!star) {
        fleet.orders.shift();
        return null;
      }
      if (fleet.location.type === 'orbit' && fleet.location.starId === order.starId) {
        if (order.action === 'colonize') {
          fleet.orders.splice(1, 0, { type: 'colonize', starId: order.starId });
        }
        fleet.orders.shift();
        return null;
      }
      return getStarPosition(game, order.starId);
    }

    if (order.type === 'move') {
      return order.destination;
    }

    return null;
  }

  private getCurrentPosition(game: GameState, fleet: Fleet): { x: number; y: number } {
    if (fleet.location.type === 'orbit') {
      return getStarPosition(game, fleet.location.starId);
    }
    return { x: fleet.location.x, y: fleet.location.y };
  }

  private determineTravelWarp(
    fleet: Fleet,
    order: FleetOrder,
    stats: MovementStats,
    distance: number,
  ): number {
    const requested = 'warpSpeed' in order && order.warpSpeed ? order.warpSpeed : stats.maxWarp;
    const maxWarp = Math.min(requested, stats.maxWarp);

    for (let warp = maxWarp; warp >= 1; warp--) {
      const requirement = this.fuelCalculator.buildMovementRequirement(fleet, warp, distance);
      if (requirement.fuelRequired <= fleet.fuel || warp === 1) {
        return warp;
      }
    }
    return 1;
  }

  private completeMovement(
    game: GameState,
    fleet: Fleet,
    destination: { x: number; y: number },
    order: FleetOrder,
  ): void {
    if (order.type === 'orbit') {
      fleet.location = { type: 'orbit', starId: order.starId };
      if (order.action === 'colonize') {
        fleet.orders.splice(1, 0, { type: 'colonize', starId: order.starId });
      }
    } else {
      const targetStar = game.stars.find(
        (star) => Math.hypot(star.position.x - destination.x, star.position.y - destination.y) < SPACE_CAPTURE_DISTANCE,
      );
      if (targetStar) {
        fleet.location = { type: 'orbit', starId: targetStar.id };
      } else {
        fleet.location = { type: 'space', ...destination };
      }
    }
    fleet.orders.shift();
  }
}
