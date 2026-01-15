import { Injectable, inject, signal, computed } from '@angular/core';
import { GameStateService } from '../../../services/game/game-state.service';
import { LoggingService } from '../../../services/core/logging.service';
import { GalaxyFleetPositionService } from './galaxy-fleet-position.service';
import { 
  Fleet, 
  Star,
  GameState 
} from '../../../models/game.model';
import { 
  GalaxyCoordinate, 
  LogContext 
} from '../../../models/service-interfaces.model';

export interface WaypointSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  type: string;
  order: any;
  color: string;
  warning?: string;
}

export interface FleetWaypoints {
  fleetId: string;
  segments: WaypointSegment[];
  lastPos: GalaxyCoordinate;
}

export interface DraggedWaypoint {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  fleetId: string;
  orderIndex?: number;
}

export interface SnapTarget {
  type: 'planet' | 'fleet' | 'space';
  id?: string;
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root',
})
export class GalaxyWaypointService {
  private gs = inject(GameStateService);
  private logging = inject(LoggingService);
  private fleetPositions = inject(GalaxyFleetPositionService);

  // Waypoint drag state
  readonly draggedWaypoint = signal<DraggedWaypoint | null>(null);
  readonly snapTarget = signal<SnapTarget | null>(null);

  // Navigation mode state
  readonly navigationModeFleetId = signal<string | null>(null);

  private readonly SNAP_THRESHOLD = 20; // pixels

  readonly fleetWaypoints = computed(() => {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'fleetWaypoints',
      additionalData: {}
    };

    this.logging.debug('Computing fleet waypoints', context);

    const game = this.gs.game();
    const fleets = game?.fleets || [];
    const stars = this.gs.stars();
    const shipDesigns = game?.shipDesigns || [];
    const myFleets = fleets.filter((f) => f.ownerId === this.gs.player()?.id);

    const waypoints = myFleets.map((fleet) => {
      let currentPos = this.fleetPositions.fleetPos(fleet.id);
      const segments: WaypointSegment[] = [];

      // Calculate max speed for this fleet
      let maxFleetSpeed = 10;
      let fuelCapacity = 0;
      let currentFuel = fleet.fuel;

      // Simple check: find the slowest ship in the fleet
      for (const stack of fleet.ships) {
        const design = shipDesigns.find((d) => d.id === stack.designId);
        if (design && design.spec) {
          if (design.spec.warpSpeed < maxFleetSpeed && design.spec.warpSpeed > 0) {
            maxFleetSpeed = design.spec.warpSpeed;
          }
          fuelCapacity += design.spec.fuelCapacity * stack.count;
        }
      }

      if (fleet.orders) {
        for (const order of fleet.orders) {
          let dest: GalaxyCoordinate | null = null;

          if (order.type === 'move') {
            dest = order.destination;
          } else if (order.type === 'orbit') {
            const star = stars.find((s) => s.planets.some((p) => p.id === order.starId));
            if (star) dest = star.position;
          } else if (order.type === 'attack') {
            const target = fleets.find((f) => f.id === order.targetFleetId);
            if (target) dest = this.fleetPositions.fleetPos(target.id);
          }

          if (dest) {
            const dist = Math.hypot(dest.x - currentPos.x, dest.y - currentPos.y);
            const orderSpeed = (order as any).warpSpeed || 9;
            let warning: string | null = null;

            if (orderSpeed > maxFleetSpeed) {
              warning = 'Speed too high';
            }

            segments.push({
              x1: currentPos.x,
              y1: currentPos.y,
              x2: dest.x,
              y2: dest.y,
              distance: Math.round(dist),
              type: order.type,
              order: order,
              color: this.getSpeedColor(orderSpeed),
              warning,
            });
            currentPos = dest;
          }
        }
      }
      return { fleetId: fleet.id, segments, lastPos: currentPos };
    });

    this.logging.debug('Fleet waypoints computed', {
      ...context,
      additionalData: { waypointCount: waypoints.length }
    });

    return waypoints;
  });

  startDrag(fleet: Fleet): void {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'startDrag',
      entityId: fleet.id,
      entityType: 'fleet'
    };

    this.logging.debug('Starting waypoint drag for fleet', context);

    const fw = this.fleetWaypoints().find((f) => f.fleetId === fleet.id);
    const startPos = fw?.lastPos || this.fleetPositions.fleetPos(fleet.id);

    this.draggedWaypoint.set({
      startX: startPos.x,
      startY: startPos.y,
      currentX: startPos.x,
      currentY: startPos.y,
      fleetId: fleet.id,
    });

    // Enter navigation mode for this fleet automatically
    this.navigationModeFleetId.set(fleet.id);
  }

  updateDragPosition(worldX: number, worldY: number): void {
    this.draggedWaypoint.update((dw) =>
      dw ? { ...dw, currentX: worldX, currentY: worldY } : null,
    );
    this.checkSnap(worldX, worldY);
  }

  checkSnap(x: number, y: number): void {
    const threshold = this.SNAP_THRESHOLD;

    // Check stars
    const stars = this.gs.stars();
    for (const star of stars) {
      for (const p of star.planets) {
        const pPos = (p as any).position || star.position;
        const dx = pPos.x - x;
        const dy = pPos.y - y;
        if (dx * dx + dy * dy < threshold * threshold) {
          this.snapTarget.set({
            type: 'planet',
            id: p.id,
            x: pPos.x,
            y: pPos.y,
          });
          return;
        }
      }
    }

    // Check fleets
    const fleets = this.gs.game()?.fleets || [];
    for (const fleet of fleets) {
      if (fleet.id === this.draggedWaypoint()?.fleetId) continue;

      const fPos = this.fleetPositions.fleetPos(fleet.id);
      const dx = fPos.x - x;
      const dy = fPos.y - y;
      if (dx * dx + dy * dy < threshold * threshold) {
        this.snapTarget.set({ type: 'fleet', id: fleet.id, x: fPos.x, y: fPos.y });
        return;
      }
    }

    this.snapTarget.set(null);
  }

  finalizeWaypoint(): void {
    const wp = this.draggedWaypoint();
    const snap = this.snapTarget();

    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'finalizeWaypoint',
      entityId: wp?.fleetId,
      entityType: 'fleet',
      additionalData: { 
        hasSnap: !!snap,
        snapType: snap?.type,
        orderIndex: wp?.orderIndex
      }
    };

    this.logging.debug('Finalizing waypoint', context);

    if (wp) {
      const fleet = this.gs.game()?.fleets.find((f) => f.id === wp.fleetId);
      if (fleet) {
        let newOrder: any = null;
        // Preserve existing order properties if editing
        const existingOrder =
          wp.orderIndex !== undefined && fleet.orders ? fleet.orders[wp.orderIndex] : {};

        if (snap) {
          if (snap.type === 'planet' && snap.id) {
            newOrder = { ...existingOrder, type: 'orbit', starId: snap.id };
            // Remove destination if switching to orbit
            delete newOrder.destination;
          } else if (snap.type === 'fleet' && snap.id) {
            newOrder = { ...existingOrder, type: 'move', destination: { x: snap.x, y: snap.y } };
            // TODO: Handle merge/attack types specifically if needed
            delete newOrder.starId;
          }
        } else {
          newOrder = {
            ...existingOrder,
            type: 'move',
            destination: { x: wp.currentX, y: wp.currentY },
          };
          delete newOrder.starId;
        }

        if (newOrder) {
          const currentOrders = [...(fleet.orders || [])];
          if (wp.orderIndex !== undefined && wp.orderIndex >= 0) {
            // Update existing order
            currentOrders[wp.orderIndex] = newOrder;
          } else {
            // Append new order
            currentOrders.push(newOrder);
          }
          this.gs.setFleetOrders(wp.fleetId, currentOrders);

          this.logging.info('Waypoint finalized and fleet orders updated', {
            ...context,
            additionalData: { 
              ...context.additionalData,
              orderType: newOrder.type,
              orderCount: currentOrders.length
            }
          });
        }
      }
    }

    this.draggedWaypoint.set(null);
    this.snapTarget.set(null);
  }

  deleteWaypoint(fleetId: string, orderIndex: number): void {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'deleteWaypoint',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex }
    };

    this.logging.debug('Deleting waypoint', context);

    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (fleet && fleet.orders) {
      const newOrders = [...fleet.orders];
      newOrders.splice(orderIndex, 1);
      this.gs.setFleetOrders(fleetId, newOrders);

      this.logging.info('Waypoint deleted', {
        ...context,
        additionalData: { 
          ...context.additionalData,
          remainingOrders: newOrders.length
        }
      });
    }
  }

  moveWaypoint(fleetId: string, orderIndex: number): void {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'moveWaypoint',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex }
    };

    this.logging.debug('Starting waypoint move', context);

    const fw = this.fleetWaypoints().find((f) => f.fleetId === fleetId);
    if (fw && fw.segments[orderIndex]) {
      const segment = fw.segments[orderIndex];
      this.draggedWaypoint.set({
        startX: segment.x1,
        startY: segment.y1,
        currentX: segment.x2,
        currentY: segment.y2,
        fleetId: fleetId,
        orderIndex: orderIndex,
      });
      this.navigationModeFleetId.set(fleetId);
    }
  }

  setWaypointSpeed(fleetId: string, orderIndex: number): void {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'setWaypointSpeed',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex }
    };

    this.logging.debug('Setting waypoint speed', context);

    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (fleet && fleet.orders && fleet.orders[orderIndex]) {
      const order = fleet.orders[orderIndex];
      // Cycle speed: 1 -> ... -> 9 -> 1
      const currentSpeed = (order as any).warpSpeed || 9;
      let newSpeed = currentSpeed + 1;
      if (newSpeed > 9) newSpeed = 1;

      if (order.type !== 'colonize') {
        const newOrders = [...fleet.orders];
        newOrders[orderIndex] = { ...order, warpSpeed: newSpeed } as any;
        this.gs.setFleetOrders(fleetId, newOrders);

        this.logging.info('Waypoint speed updated', {
          ...context,
          additionalData: { 
            ...context.additionalData,
            oldSpeed: currentSpeed,
            newSpeed
          }
        });
      }
    }
  }

  exitNavigationMode(): void {
    const context: LogContext = {
      service: 'GalaxyWaypointService',
      operation: 'exitNavigationMode',
      additionalData: { 
        hadDraggedWaypoint: !!this.draggedWaypoint(),
        fleetId: this.navigationModeFleetId()
      }
    };

    this.logging.debug('Exiting navigation mode', context);

    // Finalize any dragged waypoint
    this.finalizeWaypoint();

    this.navigationModeFleetId.set(null);
    this.draggedWaypoint.set(null);
    this.snapTarget.set(null);
  }

  private getSpeedColor(speed?: number): string {
    if (!speed) return '#3498db'; // Default blue
    if (speed <= 5) return '#2ecc71'; // Green (safe/slow)
    if (speed <= 8) return '#f1c40f'; // Yellow (medium)
    return '#e74c3c'; // Red (fast/dangerous)
  }
}