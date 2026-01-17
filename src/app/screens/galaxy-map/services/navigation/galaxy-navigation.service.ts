import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { StarNavigationService } from './star-navigation.service';
import { FleetNavigationService } from './fleet-navigation.service';
import { MapViewportService } from './map-viewport.service';
import type { 
  Star, 
  Fleet
} from '../../../../models/game.model';
import type { LogContext } from '../../../../models/service-interfaces.model';

/**
 * Facade service for galaxy navigation.
 * Coordinates and delegates to specialized navigation services.
 * Responsible for routing (new game) and query parameter navigation logic.
 */
@Injectable({
  providedIn: 'root',
})
export class GalaxyNavigationService {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private logging = inject(LoggingService);
  private mapState = inject(GalaxyMapStateService);
  private starNav = inject(StarNavigationService);
  private fleetNav = inject(FleetNavigationService);
  private viewport = inject(MapViewportService);

  /**
   * Centers the map view on a specific star
   */
  centerOnStar(star: Star, viewportWidth?: number, viewportHeight?: number): void {
    this.starNav.centerOnStar(star, viewportWidth, viewportHeight);
  }

  /**
   * Centers the map view on a specific coordinate point
   */
  centerOnPoint(x: number, y: number, viewportWidth?: number, viewportHeight?: number): void {
    this.viewport.centerOnPoint(x, y, viewportWidth, viewportHeight);
  }

  /**
   * Centers the map on a fleet's current position
   */
  centerOnFleet(fleet: Fleet, viewportWidth?: number, viewportHeight?: number): void {
    this.fleetNav.centerOnFleet(fleet, viewportWidth, viewportHeight);
  }

  /**
   * Opens the star detail view for the provided star
   */
  openStarDetail(star: Star): void {
    this.starNav.openStarDetail(star);
  }

  /**
   * Opens star detail view by ID
   */
  openStar(starId: string): void {
    this.starNav.openStar(starId);
  }

  /**
   * Navigates to new game screen
   */
  startNewGame(): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'startNewGame'
    };

    this.logging.debug('Starting new game', context);
    this.router.navigateByUrl('/');
  }

  /**
   * Alias for startNewGame for simpler template binding.
   */
  newGame(): void {
    this.startNewGame();
  }

  /**
   * Opens fleet detail view by ID.
   */
  openFleet(fleetId: string): void {
    this.fleetNav.openFleet(fleetId);
  }

  /**
   * Finds and centers on the player's home star
   */
  centerOnHomeStar(viewportWidth?: number, viewportHeight?: number): void {
    this.starNav.centerOnHomeStar(viewportWidth, viewportHeight);
  }

  /**
   * Fits the entire galaxy in the viewport
   */
  fitGalaxyToView(viewportWidth?: number, viewportHeight?: number): void {
    this.starNav.fitGalaxyToView(viewportWidth, viewportHeight);
  }

  /**
   * Handles query parameter navigation (starId, fleetId)
   */
  handleQueryParamNavigation(starId?: string, fleetId?: string, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'handleQueryParamNavigation',
      additionalData: { 
        starId, 
        fleetId,
        viewportWidth,
        viewportHeight
      }
    };

    this.logging.debug('Handling query parameter navigation', context);

    if (starId) {
      const star = this.gs
        .stars()
        .find((candidate) => candidate.id === starId);

      if (star) {
        this.centerOnStar(star, viewportWidth, viewportHeight);
        this.mapState.selectedStarId.set(star.id);

        this.logging.info('Navigated to star via query param', {
          ...context,
          entityId: star.id,
          entityType: 'star',
          additionalData: {
            ...context.additionalData,
            starName: star.name
          }
        });
        return;
      }
    }

    if (fleetId) {
      const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
      if (fleet) {
        this.mapState.selectedFleetId.set(fleet.id);
        this.centerOnFleet(fleet, viewportWidth, viewportHeight);
        
        this.logging.info('Navigated to fleet via query param', {
          ...context,
          entityId: fleetId,
          entityType: 'fleet'
        });
        return;
      }
    }

    // Default behavior: center on home star
    this.centerOnHomeStar(viewportWidth, viewportHeight);
  }
}