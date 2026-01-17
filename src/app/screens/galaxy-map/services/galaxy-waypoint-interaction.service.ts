import { Injectable, inject } from '@angular/core';
import { GalaxyWaypointService } from './waypoints/galaxy-waypoint.service';
import { GalaxyMapMenuService } from './galaxy-map-menu.service';
import { GameStateService } from '../../../services/game/game-state.service';
import { GalaxyMapStateService } from './galaxy-map-state.service';
import type { Fleet, FleetOrder } from '../../../models/game.model';

@Injectable({ providedIn: 'root' })
export class GalaxyWaypointInteractionService {
  private readonly waypoints = inject(GalaxyWaypointService);
  private readonly menus = inject(GalaxyMapMenuService);
  private readonly gs = inject(GameStateService);
  private readonly state = inject(GalaxyMapStateService);

  private waypointDropScreenPos: { x: number; y: number } | null = null;
  private waypointHoldTimer: ReturnType<typeof setTimeout> | undefined;
  private waypointHoldStartPos: { x: number; y: number } | null = null;
  private isWaypointHolding = false;

  onWaypointDown(event: MouseEvent | TouchEvent, fleetId: string, orderIndex: number): void {
    event.stopPropagation();
    this.menus.logWaypointSelection(fleetId, orderIndex, event);

    if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent && event.touches.length) {
      const touch = event.touches[0];
      this.startWaypointHold(fleetId, orderIndex, touch.clientX, touch.clientY);
    }
  }

  onWaypointRightClick(event: MouseEvent, fleetId: string, orderIndex: number): void {
    event.preventDefault();
    event.stopPropagation();

    const order = this.lookupOrder(fleetId, orderIndex);
    if (!order) {
      return;
    }

    this.menus.showWaypointMenu(event, fleetId, orderIndex, order, 'right-click');
  }

  onWaypointClick(event: MouseEvent, fleetId: string, order: FleetOrder): void {
    event.stopPropagation();
    event.preventDefault();

    const fleet = this.gs.game()?.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet?.orders) {
      return;
    }

    const index = fleet.orders.indexOf(order);
    if (index === -1) {
      return;
    }

    this.menus.showWaypointMenu(event, fleetId, index, order, 'click');
  }

  onWaypointTouchStart(event: TouchEvent, fleetId: string, orderIndex: number): void {
    event.stopPropagation();
    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    this.startWaypointHold(fleetId, orderIndex, touch.clientX, touch.clientY);
  }

  onWaypointTouchEnd(): void {
    this.cancelWaypointHold();
  }

  shouldBlockForHold(clientX: number, clientY: number, threshold = 10): boolean {
    if (!this.isWaypointHolding || !this.waypointHoldStartPos) {
      return false;
    }

    const dist = Math.hypot(clientX - this.waypointHoldStartPos.x, clientY - this.waypointHoldStartPos.y);
    if (dist > threshold) {
      this.cancelWaypointHold();
      return false;
    }

    return true;
  }

  cancelHoldIfMovedBeyond(clientX: number, clientY: number, threshold = 20): void {
    if (!this.isWaypointHolding || !this.waypointHoldStartPos) {
      return;
    }

    const dist = Math.hypot(clientX - this.waypointHoldStartPos.x, clientY - this.waypointHoldStartPos.y);
    if (dist > threshold) {
      this.cancelWaypointHold();
    }
  }

  isDraggingWaypoint(): boolean {
    return !!this.waypoints.draggedWaypoint();
  }

  startDrag(fleet: Fleet): void {
    this.waypoints.startDrag(fleet);
    this.waypointDropScreenPos = null;
  }

  handleDragMove(
    clientX: number,
    clientY: number,
    svg: SVGSVGElement | null,
    group: SVGGElement | null,
  ): void {
    if (!svg || !group) {
      return;
    }

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const ctm = group.getScreenCTM();
    if (!ctm) {
      return;
    }

    const inverse = ctm.inverse();
    const worldPoint = point.matrixTransform(inverse);

    this.waypointDropScreenPos = { x: clientX, y: clientY };
    this.waypoints.updateDragPosition(worldPoint.x, worldPoint.y);

    const snap = this.waypoints.checkSnap(worldPoint.x, worldPoint.y, this.state.scale());
    this.menus.logSnapCheck(worldPoint.x, worldPoint.y, snap);
  }

  finalizeDragIfActive(): void {
    if (!this.waypoints.draggedWaypoint()) {
      return;
    }

    const result = this.waypoints.exitNavigationMode();
    this.menus.showWaypointMenuFromResult(result, this.waypointDropScreenPos);
    this.waypointDropScreenPos = null;
  }

  exitNavigationMode(): void {
    const result = this.waypoints.exitNavigationMode();
    this.menus.showWaypointMenuFromResult(result, this.waypointDropScreenPos);
    this.waypointDropScreenPos = null;
  }

  cancelWaypointHold(): void {
    this.isWaypointHolding = false;
    this.waypointHoldStartPos = null;
    if (this.waypointHoldTimer) {
      clearTimeout(this.waypointHoldTimer);
      this.waypointHoldTimer = undefined;
    }
  }

  private startWaypointHold(fleetId: string, orderIndex: number, clientX: number, clientY: number): void {
    this.cancelWaypointHold();
    this.isWaypointHolding = true;
    this.waypointHoldStartPos = { x: clientX, y: clientY };

    this.waypointHoldTimer = setTimeout(() => {
      if (!this.isWaypointHolding) {
        return;
      }

      const order = this.lookupOrder(fleetId, orderIndex);
      if (!order) {
        return;
      }

      const mouseEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX,
        clientY,
      } as unknown as MouseEvent;

      this.menus.showWaypointMenu(mouseEvent, fleetId, orderIndex, order, 'right-click');
      this.cancelWaypointHold();
    }, 500);
  }

  private lookupOrder(fleetId: string, orderIndex: number): FleetOrder | null {
    const fleet = this.gs.game()?.fleets.find((candidate) => candidate.id === fleetId);
    return fleet?.orders?.[orderIndex] ?? null;
  }
}
