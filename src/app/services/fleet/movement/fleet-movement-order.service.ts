import { Injectable } from '@angular/core';
import { GameState, FleetOrder } from '../../../models/game.model';
import { FleetLocation, GalaxyCoordinate } from '../../../models/service-interfaces.model';
import { DEFAULT_COORDINATE } from './fleet-movement.constants';
import { FLEET_ORDER_TYPE } from '../../../models/fleet-order.constants';

@Injectable({ providedIn: 'root' })
export class FleetMovementOrderService {
  createMoveOrder(game: GameState, destination: FleetLocation): FleetOrder {
    return {
      type: FLEET_ORDER_TYPE.MOVE,
      destination: this.resolveDestinationCoordinate(game, destination),
    };
  }

  private resolveDestinationCoordinate(
    game: GameState,
    destination: FleetLocation,
  ): GalaxyCoordinate {
    if (destination.type === 'space') {
      return {
        x: destination.x ?? DEFAULT_COORDINATE.x,
        y: destination.y ?? DEFAULT_COORDINATE.y,
      };
    }

    return destination.starId
      ? this.getStarPosition(game, destination.starId)
      : { ...DEFAULT_COORDINATE };
  }

  private getStarPosition(game: GameState, starId: string): GalaxyCoordinate {
    const star = game.stars.find((entry) => entry.id === starId);
    return star ? star.position : { ...DEFAULT_COORDINATE };
  }
}
