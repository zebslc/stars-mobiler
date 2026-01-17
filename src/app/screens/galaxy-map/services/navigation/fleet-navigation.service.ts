import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { MapViewportService } from './map-viewport.service';
import type { Fleet } from '../../../../models/game.model';
import type { GalaxyCoordinate, LogContext } from '../../../../models/service-interfaces.model';

/**
 * Handles fleet-related navigation operations.
 * Responsible for centering on fleets, handling fleet location logic, and opening fleet detail views.
 */
@Injectable({
  providedIn: 'root',
})
export class FleetNavigationService {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private logging = inject(LoggingService);
  private mapState = inject(GalaxyMapStateService);
  private viewport = inject(MapViewportService);

  /**
   * Centers the map on a fleet's current position
   */
  centerOnFleet(fleet: Fleet, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'FleetNavigationService',
      operation: 'centerOnFleet',
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: { 
        fleetLocation: fleet.location,
        viewportWidth,
        viewportHeight
      }
    };

    this.logging.debug('Centering map on fleet', context);

    let position: GalaxyCoordinate;

    if (fleet.location.type === 'space') {
      position = { x: fleet.location.x, y: fleet.location.y };
    } else if (fleet.location.type === 'orbit') {
      // Fleet is in orbit - find the associated star
      const orbitStarId = fleet.location.starId;
      const star = this.gs
        .stars()
        .find((candidate) => candidate.id === orbitStarId);

      if (star) {
        position = star.position;
      } else {
        this.logging.warn('Could not find star for orbiting fleet', {
          ...context,
          additionalData: {
            ...context.additionalData,
            attemptedStarId: orbitStarId
          }
        });
        return;
      }
    } else {
      // Unknown location type
      this.logging.warn('Unknown fleet location type', context);
      return;
    }

    const dims = this.viewport.getDefaultViewportDimensions();
    const width = viewportWidth || dims.width;
    const height = viewportHeight || dims.height;

    this.viewport.centerOnPoint(position.x, position.y, width, height);
  }

  /**
   * Opens fleet detail view by ID.
   */
  openFleet(fleetId: string): void {
    const context: LogContext = {
      service: 'FleetNavigationService',
      operation: 'openFleet',
      entityId: fleetId,
      entityType: 'fleet'
    };

    this.logging.debug('Opening fleet detail', context);
    this.router.navigateByUrl(`/fleet/${fleetId}`);
  }
}
