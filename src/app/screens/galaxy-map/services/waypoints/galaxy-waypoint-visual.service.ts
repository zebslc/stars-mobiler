import { Injectable, computed, inject } from '@angular/core';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyFleetPositionService } from '../galaxy-fleet-position.service';
import type { Fleet, GameState, ShipDesign, Star, FleetOrder } from '../../../../models/game.model';
import type { GalaxyCoordinate, LogContext } from '../../../../models/service-interfaces.model';
import { FLEET_ORDER_TYPE } from '../../../../models/fleet-order.constants';
import type { FleetWaypoints, WaypointSegment } from './galaxy-waypoint.models';

@Injectable({
  providedIn: 'root',
})
export class GalaxyWaypointVisualService {
  private gs = inject(GameStateService);
  private logging = inject(LoggingService);
  private fleetPositions = inject(GalaxyFleetPositionService);

  readonly fleetWaypoints = computed(() => this.computeFleetWaypoints());

  fleetWaypointById(fleetId: string): FleetWaypoints | undefined {
    return this.fleetWaypoints().find((entry) => entry.fleetId === fleetId);
  }

  lastKnownPosition(fleetId: string): GalaxyCoordinate {
    return this.fleetWaypointById(fleetId)?.lastPos ?? this.fleetPositions.fleetPos(fleetId);
  }

  private computeFleetWaypoints(): Array<FleetWaypoints> {
    const context: LogContext = {
      service: 'GalaxyWaypointVisualService',
      operation: 'fleetWaypoints',
      additionalData: {},
    };

    this.logging.debug('Computing fleet waypoints', context);

    const game = this.gs.game();
    if (!game) {
      return [];
    }

    const waypoints = this.buildWaypointsForPlayer(game);

    this.logging.debug('Fleet waypoints computed', {
      ...context,
      additionalData: { waypointCount: waypoints.length },
    });

    return waypoints;
  }

  private buildWaypointsForPlayer(game: GameState): Array<FleetWaypoints> {
    const playerId = this.gs.player()?.id;
    if (!playerId) {
      return [];
    }

    const fleets = game.fleets || [];
    const stars = game.stars || [];
    const shipDesigns = game.shipDesigns || [];

    return fleets
      .filter((fleet) => fleet.ownerId === playerId)
      .map((fleet) => this.buildFleetWaypoint(fleet, fleets, stars, shipDesigns));
  }

  private buildFleetWaypoint(
    fleet: Fleet,
    fleets: Array<Fleet>,
    stars: Array<Star>,
    shipDesigns: Array<ShipDesign>,
  ): FleetWaypoints {
    const { segments, lastPos } = this.buildSegmentsForFleet(fleet, fleets, stars, shipDesigns);
    return { fleetId: fleet.id, segments, lastPos };
  }

  private buildSegmentsForFleet(
    fleet: Fleet,
    fleets: Array<Fleet>,
    stars: Array<Star>,
    shipDesigns: Array<ShipDesign>,
  ): { segments: Array<WaypointSegment>; lastPos: GalaxyCoordinate } {
    const maxFleetSpeed = this.resolveMaxFleetSpeed(fleet, shipDesigns);
    let currentPos = this.fleetPositions.fleetPos(fleet.id);
    const segments: Array<WaypointSegment> = [];

    for (const order of fleet.orders || []) {
      const dest = this.resolveOrderDestination(order, fleets, stars);
      if (!dest) {
        continue;
      }

      const orderSpeed = this.resolveOrderSpeed(order);
      const distance = Math.round(Math.hypot(dest.x - currentPos.x, dest.y - currentPos.y));
      const warning =
        orderSpeed !== undefined && orderSpeed > maxFleetSpeed ? 'Speed too high' : undefined;

      segments.push({
        x1: currentPos.x,
        y1: currentPos.y,
        x2: dest.x,
        y2: dest.y,
        distance,
        type: order.type,
        order,
        color: this.getSpeedColor(orderSpeed),
        warning,
      });

      currentPos = dest;
    }

    return { segments, lastPos: currentPos };
  }

  private getSpeedColor(speed?: number): string {
    if (!speed) return '#3498db';
    if (speed <= 5) return '#2ecc71';
    if (speed <= 8) return '#f1c40f';
    return '#e74c3c';
  }

  private resolveMaxFleetSpeed(fleet: Fleet, designs: Array<ShipDesign>): number {
    let maxFleetSpeed = 10;
    for (const stack of fleet.ships) {
      const design = designs.find((d) => d.id === stack.designId);
      if (design?.spec && design.spec.warpSpeed > 0 && design.spec.warpSpeed < maxFleetSpeed) {
        maxFleetSpeed = design.spec.warpSpeed;
      }
    }
    return maxFleetSpeed;
  }

  private resolveOrderDestination(
    order: FleetOrder,
    fleets: Array<Fleet>,
    stars: Array<Star>,
  ): GalaxyCoordinate | null {
    switch (order.type) {
      case FLEET_ORDER_TYPE.MOVE:
        return order.destination;
      case FLEET_ORDER_TYPE.ORBIT:
      case FLEET_ORDER_TYPE.COLONIZE: {
        const star = stars.find((s) => s.id === order.starId);
        return star ? star.position : null;
      }
      case FLEET_ORDER_TYPE.ATTACK: {
        const target = fleets.find((f) => f.id === order.targetFleetId);
        return target ? this.fleetPositions.fleetPos(target.id) : null;
      }
      default:
        return null;
    }
  }

  private resolveOrderSpeed(order: FleetOrder): number | undefined {
    return 'warpSpeed' in order ? order.warpSpeed : undefined;
  }
}
