import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DraggedWaypoint, FinalizeWaypointResult, FleetWaypoints, SnapTarget } from './galaxy-waypoint.models';
import { GalaxyWaypointService } from './galaxy-waypoint.service';
import { GalaxyWaypointOrderService } from './galaxy-waypoint-order.service';
import { GalaxyWaypointStateService } from './galaxy-waypoint-state.service';
import { GalaxyWaypointVisualService } from './galaxy-waypoint-visual.service';
import type { Fleet } from '../../../../models/game.model';

class VisualStub implements GalaxyWaypointVisualService {
  fleetWaypoints = signal<Array<FleetWaypoints>>([
    {
      fleetId: 'fleet-1',
      segments: [],
    },
  ]);
}

class StateStub implements GalaxyWaypointStateService {
  draggedWaypoint = signal<DraggedWaypoint | null>(null);
  snapTarget = signal<SnapTarget | null>(null);
  navigationModeFleetId = signal<string | null>(null);

  startDragCalls: Array<Fleet> = [];
  updateDragCalls: Array<{ x: number; y: number }> = [];
  checkSnapArgs: Array<{ x: number; y: number; scale: number }> = [];
  moveWaypointCalls: Array<{ fleetId: string; index: number }> = [];

  startDrag(fleet: Fleet): void {
    this.startDragCalls.push(fleet);
  }

  updateDragPosition(x: number, y: number): void {
    this.updateDragCalls.push({ x, y });
  }

  checkSnap(x: number, y: number, scale: number): SnapTarget | null {
    this.checkSnapArgs.push({ x, y, scale });
    return this.snapTarget();
  }

  moveWaypoint(fleetId: string, orderIndex: number): void {
    this.moveWaypointCalls.push({ fleetId, index: orderIndex });
  }

  resetNavigation(): void {
    this.navigationModeFleetId.set(null);
    this.draggedWaypoint.set(null);
    this.snapTarget.set(null);
  }
}

class OrderStub implements GalaxyWaypointOrderService {
  finalizeWaypointResult: FinalizeWaypointResult | null = {
    fleetId: 'fleet-1',
    orderIndex: 0,
    order: { type: 'test-order' as unknown as never },
  };
  deleteWaypointCalls: Array<{ fleetId: string; index: number }> = [];
  setWaypointSpeedCalls: Array<{ fleetId: string; index: number }> = [];
  exitNavigationModeResult: FinalizeWaypointResult | null = null;

  finalizeWaypoint(): FinalizeWaypointResult | null {
    return this.finalizeWaypointResult;
  }

  deleteWaypoint(fleetId: string, orderIndex: number): void {
    this.deleteWaypointCalls.push({ fleetId, index: orderIndex });
  }

  setWaypointSpeed(fleetId: string, orderIndex: number): void {
    this.setWaypointSpeedCalls.push({ fleetId, index: orderIndex });
  }

  exitNavigationMode(): FinalizeWaypointResult | null {
    return this.exitNavigationModeResult;
  }
}

describe('GalaxyWaypointService', () => {
  let service: GalaxyWaypointService;
  let visual: VisualStub;
  let state: StateStub;
  let order: OrderStub;

  beforeEach(() => {
    visual = new VisualStub();
    state = new StateStub();
    order = new OrderStub();

    TestBed.configureTestingModule({
      providers: [
        GalaxyWaypointService,
        { provide: GalaxyWaypointVisualService, useValue: visual },
        { provide: GalaxyWaypointStateService, useValue: state },
        { provide: GalaxyWaypointOrderService, useValue: order },
      ],
    });

    service = TestBed.inject(GalaxyWaypointService);
  });

  it('exposes signals from underlying services', () => {
    expect(service.fleetWaypoints()).toEqual(visual.fleetWaypoints());
    expect(service.draggedWaypoint()).toBeNull();
    expect(service.snapTarget()).toBeNull();
    expect(service.navigationModeFleetId()).toBeNull();
  });

  it('delegates drag lifecycle to the state service', () => {
    const fleet = { id: 'fleet-1' } as Fleet;
    state.snapTarget.set({ type: 'star', starId: 'alpha', position: { x: 0, y: 0 } });
    service.startDrag(fleet);
    service.updateDragPosition(10, 20);
    const snap = service.checkSnap(5, 6, 2);

    expect(state.startDragCalls).toEqual([fleet]);
    expect(state.updateDragCalls).toEqual([{ x: 10, y: 20 }]);
    expect(state.checkSnapArgs).toEqual([{ x: 5, y: 6, scale: 2 }]);
    expect(snap).toEqual(state.snapTarget());
  });

  it('delegates waypoint mutations to the order service', () => {
    const finalized = service.finalizeWaypoint();
    service.deleteWaypoint('fleet-1', 3);
    service.setWaypointSpeed('fleet-2', 4);
    order.exitNavigationModeResult = { fleetId: 'fleet-3', orderIndex: 1, order: { type: 'noop' as never } };
    const exitResult = service.exitNavigationMode();

    expect(finalized).toBe(order.finalizeWaypointResult);
    expect(order.deleteWaypointCalls).toEqual([{ fleetId: 'fleet-1', index: 3 }]);
    expect(order.setWaypointSpeedCalls).toEqual([{ fleetId: 'fleet-2', index: 4 }]);
    expect(exitResult).toEqual(order.exitNavigationModeResult);
  });

  it('delegates waypoint move back to state service', () => {
    service.moveWaypoint('fleet-9', 7);
    expect(state.moveWaypointCalls).toEqual([{ fleetId: 'fleet-9', index: 7 }]);
  });
});
