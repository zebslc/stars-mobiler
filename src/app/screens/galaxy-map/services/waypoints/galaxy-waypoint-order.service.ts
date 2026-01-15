import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyWaypointStateService } from './galaxy-waypoint-state.service';
import { DraggedWaypoint, FinalizeWaypointResult, SnapTarget } from './galaxy-waypoint.models';
import { Fleet, FleetOrder } from '../../../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../../../models/fleet-order.constants';
import { LogContext } from '../../../../models/service-interfaces.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyWaypointOrderService {
  private gs = inject(GameStateService);
  private logging = inject(LoggingService);
  private state = inject(GalaxyWaypointStateService);

  finalizeWaypoint(): FinalizeWaypointResult | null {
    const waypoint = this.state.draggedWaypoint();
    const snap = this.state.snapTarget();

    const context: LogContext = {
      service: 'GalaxyWaypointOrderService',
      operation: 'finalizeWaypoint',
      entityId: waypoint?.fleetId,
      entityType: 'fleet',
      additionalData: {
        hasSnap: !!snap,
        snapType: snap?.type,
        orderIndex: waypoint?.orderIndex,
      },
    };

    this.logging.debug('Finalizing waypoint', context);

    if (!waypoint) {
      this.state.clearDragState();
      return null;
    }

    const fleet = this.findFleetById(waypoint.fleetId);
    if (!fleet) {
      this.state.clearDragState();
      return null;
    }

    const preparation = this.prepareFinalization(fleet, waypoint, snap);
    if (!preparation) {
      this.state.clearDragState();
      return null;
    }

    this.gs.setFleetOrders(waypoint.fleetId, preparation.orders);
    this.logFinalizationSuccess(context, preparation.order.type, preparation.orders.length);

    this.state.clearDragState();
    return {
      fleetId: waypoint.fleetId,
      orderIndex: preparation.orderIndex,
      order: preparation.order,
    };
  }

  deleteWaypoint(fleetId: string, orderIndex: number): void {
    const context: LogContext = {
      service: 'GalaxyWaypointOrderService',
      operation: 'deleteWaypoint',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex },
    };

    this.logging.debug('Deleting waypoint', context);

    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (!fleet || !fleet.orders) {
      return;
    }

    const newOrders = [...fleet.orders];
    newOrders.splice(orderIndex, 1);
    this.gs.setFleetOrders(fleetId, newOrders);

    this.logging.info('Waypoint deleted', {
      ...context,
      additionalData: {
        ...context.additionalData,
        remainingOrders: newOrders.length,
      },
    });
  }

  setWaypointSpeed(fleetId: string, orderIndex: number): void {
    const context: LogContext = {
      service: 'GalaxyWaypointOrderService',
      operation: 'setWaypointSpeed',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex },
    };

    this.logging.debug('Setting waypoint speed', context);

    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (!fleet || !fleet.orders || !fleet.orders[orderIndex]) {
      return;
    }

    const order = fleet.orders[orderIndex];
    if (order.type === FLEET_ORDER_TYPE.COLONIZE) {
      return;
    }

    const currentSpeed = this.resolveOrderSpeed(order) || 9;
    const newSpeed = currentSpeed >= 9 ? 1 : currentSpeed + 1;

    const newOrders = [...fleet.orders];
    newOrders[orderIndex] = { ...order, warpSpeed: newSpeed } as FleetOrder;
    this.gs.setFleetOrders(fleetId, newOrders);

    this.logging.info('Waypoint speed updated', {
      ...context,
      additionalData: {
        ...context.additionalData,
        oldSpeed: currentSpeed,
        newSpeed,
      },
    });
  }

  exitNavigationMode(): FinalizeWaypointResult | null {
    const context: LogContext = {
      service: 'GalaxyWaypointOrderService',
      operation: 'exitNavigationMode',
      additionalData: {
        hadDraggedWaypoint: !!this.state.draggedWaypoint(),
        fleetId: this.state.navigationModeFleetId(),
      },
    };

    this.logging.debug('Exiting navigation mode', context);

    const result = this.finalizeWaypoint();
    this.state.setNavigationMode(null);
    this.state.clearDragState();
    return result;
  }

  private prepareFinalization(
    fleet: Fleet,
    waypoint: DraggedWaypoint,
    snap: SnapTarget | null,
  ): { orders: FleetOrder[]; orderIndex: number; order: FleetOrder } | null {
    const warpSpeed = this.resolveExistingWarpSpeed(fleet, waypoint.orderIndex);
    const newOrder = this.createOrderFromContext(waypoint, snap, warpSpeed);

    if (!newOrder) {
      return null;
    }

    const { orders, index } = this.mergeOrders(fleet.orders, newOrder, waypoint.orderIndex);
    return { orders, orderIndex: index, order: newOrder };
  }

  private resolveExistingWarpSpeed(fleet: Fleet, orderIndex?: number): number | undefined {
    if (
      orderIndex === undefined ||
      !fleet.orders ||
      orderIndex < 0 ||
      orderIndex >= fleet.orders.length
    ) {
      return undefined;
    }

    const order = fleet.orders[orderIndex];
    return order && 'warpSpeed' in order ? order.warpSpeed : undefined;
  }

  private mergeOrders(
    existingOrders: FleetOrder[] | undefined,
    newOrder: FleetOrder,
    orderIndex?: number,
  ): { orders: FleetOrder[]; index: number } {
    const orders = existingOrders ? [...existingOrders] : [];

    if (orderIndex !== undefined && orderIndex >= 0 && orderIndex < orders.length) {
      orders[orderIndex] = newOrder;
      return { orders, index: orderIndex };
    }

    orders.push(newOrder);
    return { orders, index: orders.length - 1 };
  }

  private createOrderFromContext(
    waypoint: DraggedWaypoint,
    snap: SnapTarget | null,
    warpSpeed?: number,
  ): FleetOrder | null {
    if (snap?.type === 'star' && snap.id) {
      return {
        type: FLEET_ORDER_TYPE.ORBIT,
        starId: snap.id,
        warpSpeed,
      };
    }

    if (snap?.type === 'fleet' && snap.id) {
      return {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: snap.x, y: snap.y },
        warpSpeed,
      };
    }

    return {
      type: FLEET_ORDER_TYPE.MOVE,
      destination: { x: waypoint.currentX, y: waypoint.currentY },
      warpSpeed,
    };
  }

  private resolveOrderSpeed(order: FleetOrder): number {
    return 'warpSpeed' in order && order.warpSpeed ? order.warpSpeed : 9;
  }

  private logFinalizationSuccess(
    context: LogContext,
    orderType: FleetOrder['type'],
    orderCount: number,
  ): void {
    this.logging.info('Waypoint finalized and fleet orders updated', {
      ...context,
      additionalData: {
        ...context.additionalData,
        orderType,
        orderCount,
      },
    });
  }

  private findFleetById(fleetId: string): Fleet | undefined {
    return this.gs.game()?.fleets.find((candidate) => candidate.id === fleetId);
  }
}
