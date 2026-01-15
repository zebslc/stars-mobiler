import { Injectable, signal, inject } from '@angular/core';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyFleetPositionService } from '../galaxy-fleet-position.service';
import { GalaxyWaypointVisualService } from './galaxy-waypoint-visual.service';
import { DraggedWaypoint, SnapTarget } from './galaxy-waypoint.models';
import { Fleet, GameState } from '../../../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyWaypointStateService {
  private gs = inject(GameStateService);
  private logging = inject(LoggingService);
  private fleetPositions = inject(GalaxyFleetPositionService);
  private visualService = inject(GalaxyWaypointVisualService);

  readonly draggedWaypoint = signal<DraggedWaypoint | null>(null);
  readonly snapTarget = signal<SnapTarget | null>(null);
  readonly navigationModeFleetId = signal<string | null>(null);

  // Resolver pipeline keeps snap detection composable for future targets.
  private readonly snapResolvers: SnapResolver[] = [
    (context) => this.snapToStars(context),
    (context) => this.snapToFleets(context),
  ];

  private readonly SNAP_THRESHOLD = 10;

  startDrag(fleet: Fleet): void {
    const context = {
      service: 'GalaxyWaypointStateService',
      operation: 'startDrag',
      entityId: fleet.id,
      entityType: 'fleet',
    } as const;

    this.logging.debug('Starting waypoint drag for fleet', context);

    const startPos = this.visualService.lastKnownPosition(fleet.id);

    this.draggedWaypoint.set({
      startX: startPos.x,
      startY: startPos.y,
      currentX: startPos.x,
      currentY: startPos.y,
      fleetId: fleet.id,
    });

    this.navigationModeFleetId.set(fleet.id);
  }

  updateDragPosition(worldX: number, worldY: number): void {
    this.draggedWaypoint.update((dw) =>
      dw ? { ...dw, currentX: worldX, currentY: worldY } : null,
    );
  }

  checkSnap(x: number, y: number, scale: number): SnapTarget | null {
    const game = this.gs.game();
    const threshold = this.snapThreshold(scale);

    const context: SnapContext | null = game
      ? {
          game,
          x,
          y,
          thresholdSquared: threshold * threshold,
          draggedFleetId: this.draggedWaypoint()?.fleetId ?? null,
        }
      : null;

    const snap = context ? this.findSnapTarget(context) : null;
    this.snapTarget.set(snap);
    return snap;
  }

  moveWaypoint(fleetId: string, orderIndex: number): void {
    const context = {
      service: 'GalaxyWaypointStateService',
      operation: 'moveWaypoint',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { orderIndex },
    } as const;

    this.logging.debug('Starting waypoint move', context);

    const fw = this.visualService.fleetWaypointById(fleetId);
    if (!fw || !fw.segments[orderIndex]) {
      return;
    }

    const segment = fw.segments[orderIndex];
    this.draggedWaypoint.set({
      startX: segment.x1,
      startY: segment.y1,
      currentX: segment.x2,
      currentY: segment.y2,
      fleetId,
      orderIndex,
    });

    this.navigationModeFleetId.set(fleetId);
  }

  clearDragState(): void {
    this.draggedWaypoint.set(null);
    this.snapTarget.set(null);
  }

  setNavigationMode(fleetId: string | null): void {
    this.navigationModeFleetId.set(fleetId);
  }

  private snapThreshold(scale: number): number {
    const clampedScale = scale > 0 ? scale : 1;
    return this.SNAP_THRESHOLD / clampedScale;
  }

  private findSnapTarget(context: SnapContext): SnapTarget | null {
    for (const resolver of this.snapResolvers) {
      const target = resolver(context);
      if (target) {
        return target;
      }
    }
    return null;
  }

  private snapToStars({ game, x, y, thresholdSquared }: SnapContext): SnapTarget | null {
    for (const star of game.stars || []) {
      const dx = star.position.x - x;
      const dy = star.position.y - y;
      if (dx * dx + dy * dy < thresholdSquared) {
        return {
          type: 'star',
          id: star.id,
          x: star.position.x,
          y: star.position.y,
        };
      }
    }
    return null;
  }

  private snapToFleets({ game, x, y, thresholdSquared, draggedFleetId }: SnapContext): SnapTarget | null {
    for (const fleet of game.fleets || []) {
      if (fleet.id === draggedFleetId) {
        continue;
      }

      const pos = this.fleetPositions.fleetPos(fleet.id);
      const dx = pos.x - x;
      const dy = pos.y - y;
      if (dx * dx + dy * dy < thresholdSquared) {
        return { type: 'fleet', id: fleet.id, x: pos.x, y: pos.y };
      }
    }
    return null;
  }
}

type SnapResolver = (context: SnapContext) => SnapTarget | null;

type SnapContext = {
  game: GameState;
  x: number;
  y: number;
  thresholdSquared: number;
  draggedFleetId: string | null;
};
