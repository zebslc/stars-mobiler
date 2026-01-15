import { Injectable, WritableSignal, Signal } from '@angular/core';
import { GalaxyWaypointVisualService } from './galaxy-waypoint-visual.service';
import { GalaxyWaypointStateService } from './galaxy-waypoint-state.service';
import { GalaxyWaypointOrderService } from './galaxy-waypoint-order.service';
import {
  DraggedWaypoint,
  FinalizeWaypointResult,
  FleetWaypoints,
  SnapTarget,
  WaypointSegment,
} from './galaxy-waypoint.models';
import { Fleet } from '../../../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyWaypointService {
  constructor(
    private readonly visualService: GalaxyWaypointVisualService,
    private readonly stateService: GalaxyWaypointStateService,
    private readonly orderService: GalaxyWaypointOrderService,
  ) {}

  get fleetWaypoints(): Signal<FleetWaypoints[]> {
    return this.visualService.fleetWaypoints;
  }

  get draggedWaypoint(): WritableSignal<DraggedWaypoint | null> {
    return this.stateService.draggedWaypoint;
  }

  get snapTarget(): WritableSignal<SnapTarget | null> {
    return this.stateService.snapTarget;
  }

  get navigationModeFleetId(): WritableSignal<string | null> {
    return this.stateService.navigationModeFleetId;
  }

  startDrag(fleet: Fleet): void {
    this.stateService.startDrag(fleet);
  }

  updateDragPosition(worldX: number, worldY: number): void {
    this.stateService.updateDragPosition(worldX, worldY);
  }

  checkSnap(x: number, y: number, scale: number): SnapTarget | null {
    return this.stateService.checkSnap(x, y, scale);
  }

  finalizeWaypoint(): FinalizeWaypointResult | null {
    return this.orderService.finalizeWaypoint();
  }

  deleteWaypoint(fleetId: string, orderIndex: number): void {
    this.orderService.deleteWaypoint(fleetId, orderIndex);
  }

  moveWaypoint(fleetId: string, orderIndex: number): void {
    this.stateService.moveWaypoint(fleetId, orderIndex);
  }

  setWaypointSpeed(fleetId: string, orderIndex: number): void {
    this.orderService.setWaypointSpeed(fleetId, orderIndex);
  }

  exitNavigationMode(): FinalizeWaypointResult | null {
    return this.orderService.exitNavigationMode();
  }
}

export type { WaypointSegment, FleetWaypoints, DraggedWaypoint, SnapTarget, FinalizeWaypointResult };