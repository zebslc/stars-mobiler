import { Injectable, inject } from '@angular/core';
import { GalaxyMapStateService } from './galaxy-map-state.service';
import type { Fleet, FleetOrder } from '../../../models/game.model';
import { GalaxyWaypointInteractionService } from './galaxy-waypoint-interaction.service';
import { GalaxyMapMenuService } from './galaxy-map-menu.service';

const DRAG_START_THRESHOLD_PX = 5;
const TOUCH_HOLD_CANCEL_DISTANCE_PX = 20;
const LONG_PRESS_CANCEL_DISTANCE_PX = 20;
const WAYPOINT_HOLD_CANCEL_DISTANCE_PX = 20;

@Injectable({ providedIn: 'root' })
export class GalaxyMapInteractionService {
  private readonly state = inject(GalaxyMapStateService);
  private readonly waypointInteractions = inject(GalaxyWaypointInteractionService);
  private readonly menus = inject(GalaxyMapMenuService);

  private potentialDragFleet: Fleet | null = null;
  private potentialDragStart: { x: number; y: number } | null = null;

  private touchHoldTimer: ReturnType<typeof setTimeout> | undefined;
  private touchHoldStartPos: { x: number; y: number } | null = null;
  private isTouchHolding = false;

  private longPressTimer: ReturnType<typeof setTimeout> | undefined;
  private isLongPressing = false;
  private longPressStartPos: { x: number; y: number } | null = null;
  private pressedFleet: Fleet | null = null;

  onFleetDown(event: { originalEvent: MouseEvent | TouchEvent }, fleet: Fleet): void {
    const original = event.originalEvent;
    if (original instanceof MouseEvent && original.button !== 0) {
      return;
    }

    if (original instanceof MouseEvent) {
      this.potentialDragFleet = fleet;
      this.potentialDragStart = { x: original.clientX, y: original.clientY };
      return;
    }

    const touch = (original as TouchEvent).touches[0];
    const clientX = touch?.clientX ?? 0;
    const clientY = touch?.clientY ?? 0;

    this.potentialDragFleet = fleet;
    this.potentialDragStart = { x: clientX, y: clientY };
    this.isLongPressing = true;
    this.pressedFleet = fleet;
    this.longPressStartPos = { x: clientX, y: clientY };

    this.longPressTimer = setTimeout(() => {
      if (this.isLongPressing) {
        this.startDrag(fleet);
        this.isLongPressing = false;
        this.pressedFleet = null;
      }
    }, 500);
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button === 1) {
      event.preventDefault();
      this.state.startPan(event.clientX, event.clientY);
    }
  }

  onMouseMove(event: MouseEvent, svg: SVGSVGElement | null, group: SVGGElement | null): void {
    if (this.waypointInteractions.isDraggingWaypoint()) {
      this.handleMove(event.clientX, event.clientY, svg, group);
      return;
    }

    if (this.potentialDragFleet && this.potentialDragStart) {
      const dist = Math.hypot(
        event.clientX - this.potentialDragStart.x,
        event.clientY - this.potentialDragStart.y,
      );
      if (dist > DRAG_START_THRESHOLD_PX) {
        this.startDrag(this.potentialDragFleet);
        this.potentialDragFleet = null;
        this.potentialDragStart = null;
        this.handleMove(event.clientX, event.clientY, svg, group);
      }
      return;
    }

    this.checkLongPressMove(event.clientX, event.clientY);
    this.state.pan(event.clientX, event.clientY);
  }

  onMouseUp(): void {
    this.potentialDragFleet = null;
    this.potentialDragStart = null;
    this.isLongPressing = false;
    clearTimeout(this.longPressTimer);
    this.state.endPan();
    if (this.waypointInteractions.isDraggingWaypoint()) {
      this.waypointInteractions.finalizeDragIfActive();
    }
  }

  onWheel(event: WheelEvent, host: HTMLElement | null): void {
    event.preventDefault();
    if (!host) {
      return;
    }
    const delta = Math.sign(event.deltaY) * -1;
    const rect = host.getBoundingClientRect();
    this.state.handleWheel(delta, event.clientX, event.clientY, rect.left, rect.top);
  }

  onTouchStart(event: TouchEvent, svg: SVGSVGElement | null): void {
    if (event.touches.length === 1) {
      this.state.startTouch(event.touches[0].clientX, event.touches[0].clientY);

      this.touchHoldStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.isTouchHolding = true;
      this.touchHoldTimer = setTimeout(() => {
        if (this.isTouchHolding) {
          this.menus.handleMapRightClick(event as unknown as MouseEvent);
        }
      }, 500);
    } else if (event.touches.length === 2) {
      if (svg) {
        this.state.startTouchZoom(event.touches, svg);
      }
      this.cancelTouchHold();
      this.waypointInteractions.cancelWaypointHold();
    }
  }

  onTouchMove(event: TouchEvent, svg: SVGSVGElement | null, group: SVGGElement | null): void {
    event.preventDefault();

    const touchCount = event.touches.length;
    if (touchCount === 0) {
      return;
    }

    if (this.waypointInteractions.isDraggingWaypoint() && touchCount === 1) {
      const touch = event.touches[0];
      this.handleMove(touch.clientX, touch.clientY, svg, group);
      return;
    }

    if (touchCount === 1) {
      const touch = event.touches[0];
      if (this.handlePotentialFleetDragTouch(touch, svg, group)) {
        return;
      }
      this.cancelTouchHoldIfMoved(touch);
      if (this.waypointInteractions.shouldBlockForHold(touch.clientX, touch.clientY)) {
        return;
      }
      this.waypointInteractions.cancelHoldIfMovedBeyond(
        touch.clientX,
        touch.clientY,
        WAYPOINT_HOLD_CANCEL_DISTANCE_PX,
      );
      this.checkLongPressMove(touch.clientX, touch.clientY);
      this.state.moveTouchPan(touch.clientX, touch.clientY);
      return;
    }

    this.handlePinchMove(event);
  }

  onTouchEnd(): void {
    this.state.endTouch();
    this.cancelTouchHold();
    this.waypointInteractions.cancelWaypointHold();

    this.potentialDragFleet = null;
    this.potentialDragStart = null;
    this.isLongPressing = false;
    this.pressedFleet = null;
    clearTimeout(this.longPressTimer);
    this.waypointInteractions.finalizeDragIfActive();
  }

  onWaypointDown(event: MouseEvent | TouchEvent, fleetId: string, orderIndex: number): void {
    this.waypointInteractions.onWaypointDown(event, fleetId, orderIndex);
  }

  onWaypointTouchEnd(): void {
    this.waypointInteractions.onWaypointTouchEnd();
  }

  onWaypointRightClick(event: MouseEvent, fleetId: string, orderIndex: number): void {
    this.waypointInteractions.onWaypointRightClick(event, fleetId, orderIndex);
  }

  onWaypointClick(event: MouseEvent, fleetId: string, order: FleetOrder): void {
    this.waypointInteractions.onWaypointClick(event, fleetId, order);
  }

  onWaypointTouchStart(event: TouchEvent, fleetId: string, waypointIndex: number): void {
    this.waypointInteractions.onWaypointTouchStart(event, fleetId, waypointIndex);
  }

  private handlePotentialFleetDragTouch(
    touch: Touch,
    svg: SVGSVGElement | null,
    group: SVGGElement | null,
  ): boolean {
    if (!this.potentialDragFleet || !this.potentialDragStart) {
      return false;
    }

    const dist = Math.hypot(
      touch.clientX - this.potentialDragStart.x,
      touch.clientY - this.potentialDragStart.y,
    );

    if (dist > DRAG_START_THRESHOLD_PX) {
      this.startDrag(this.potentialDragFleet);
      this.potentialDragFleet = null;
      this.potentialDragStart = null;
      this.isLongPressing = false;
      this.pressedFleet = null;
      clearTimeout(this.longPressTimer);
      this.handleMove(touch.clientX, touch.clientY, svg, group);
    }

    return true;
  }

  private cancelTouchHoldIfMoved(touch: Touch): void {
    if (!this.isTouchHolding || !this.touchHoldStartPos) {
      return;
    }

    const dist = Math.hypot(
      touch.clientX - this.touchHoldStartPos.x,
      touch.clientY - this.touchHoldStartPos.y,
    );

    if (dist > TOUCH_HOLD_CANCEL_DISTANCE_PX) {
      this.cancelTouchHold();
    }
  }

  private handlePinchMove(event: TouchEvent): void {
    if (event.touches.length < 2) {
      return;
    }

    this.state.moveTouchZoom(event.touches);
    this.cancelTouchHold();
    this.waypointInteractions.cancelWaypointHold();
  }

  checkLongPressMove(clientX: number, clientY: number): void {
    if (this.isLongPressing && this.longPressStartPos) {
      const dist = Math.hypot(clientX - this.longPressStartPos.x, clientY - this.longPressStartPos.y);
      if (dist > LONG_PRESS_CANCEL_DISTANCE_PX) {
        this.isLongPressing = false;
        clearTimeout(this.longPressTimer);
      }
    }
  }

  exitNavigationMode(): void {
    this.waypointInteractions.exitNavigationMode();
  }

  private startDrag(fleet: Fleet): void {
    this.waypointInteractions.startDrag(fleet);
    this.state.endPan();
  }

  private handleMove(
    clientX: number,
    clientY: number,
    svg: SVGSVGElement | null,
    group: SVGGElement | null,
  ): void {
    this.waypointInteractions.handleDragMove(clientX, clientY, svg, group);
  }

  private cancelTouchHold(): void {
    this.isTouchHolding = false;
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = undefined;
    }
    this.touchHoldStartPos = null;
  }
}
