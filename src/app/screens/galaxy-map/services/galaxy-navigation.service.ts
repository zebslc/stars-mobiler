import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../../services/game/game-state.service';
import { LoggingService } from '../../../services/core/logging.service';
import { GalaxyMapStateService } from './galaxy-map-state.service';
import { GalaxyCoordinateService } from './galaxy-coordinate.service';
import type { 
  Star, 
  Fleet
} from '../../../models/game.model';
import type { 
  GalaxyCoordinate,
  LogContext 
} from '../../../models/service-interfaces.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyNavigationService {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private logging = inject(LoggingService);
  private mapState = inject(GalaxyMapStateService);
  private coordinateService = inject(GalaxyCoordinateService);

  private readonly DEFAULT_VIEWPORT_WIDTH = 1000;
  private readonly DEFAULT_VIEWPORT_HEIGHT = 800;

  /**
   * Centers the map view on a specific star
   */
  centerOnStar(star: Star, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'centerOnStar',
      entityId: star.id,
      entityType: 'star',
      additionalData: { 
        starPosition: star.position,
        viewportWidth,
        viewportHeight
      }
    };

    this.logging.debug('Centering map on star', context);

    const width = viewportWidth || this.DEFAULT_VIEWPORT_WIDTH;
    const height = viewportHeight || this.DEFAULT_VIEWPORT_HEIGHT;

    this.centerOnPoint(star.position.x, star.position.y, width, height);
  }

  /**
   * Centers the map view on a specific coordinate point
   */
  centerOnPoint(x: number, y: number, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'centerOnPoint',
      additionalData: { 
        x, 
        y,
        viewportWidth,
        viewportHeight,
        currentScale: this.mapState.scale()
      }
    };

    this.logging.debug('Centering map on point', context);

    const width = viewportWidth || this.DEFAULT_VIEWPORT_WIDTH;
    const height = viewportHeight || this.DEFAULT_VIEWPORT_HEIGHT;
    const scale = this.mapState.scale();

    // Calculate the translation needed to center the point
    const newTranslateX = -x * scale + width / 2;
    const newTranslateY = -y * scale + height / 2;

    this.mapState.translateX.set(newTranslateX);
    this.mapState.translateY.set(newTranslateY);

    this.logging.debug('Map centered on point', {
      ...context,
      additionalData: {
        ...context.additionalData,
        newTranslateX,
        newTranslateY
      }
    });
  }

  /**
   * Centers the map on a fleet's current position
   */
  centerOnFleet(fleet: Fleet, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
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
    } else {
      // Fleet is in orbit - find the associated star
      const star = this.gs
        .stars()
        .find((candidate) => candidate.id === fleet.location.starId);

      if (star) {
        position = star.position;
      } else {
        this.logging.warn('Could not find star for orbiting fleet', {
          ...context,
          additionalData: {
            ...context.additionalData,
            attemptedStarId: fleet.location.starId
          }
        });
        return;
      }
    }

    this.centerOnPoint(position.x, position.y, viewportWidth, viewportHeight);
  }

  /**
   * Opens the star detail view for the provided star
   */
  openStarDetail(star: Star): void {
    const player = this.gs.player();
    const ownedStarIds = player?.ownedStarIds ?? [];
    const isOwnedByPlayer = star.ownerId === player?.id || ownedStarIds.includes(star.id);

    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'openStarDetail',
      entityId: star.id,
      entityType: 'star',
      additionalData: {
        starName: star.name,
        ownerId: star.ownerId,
        playerOwnsStar: isOwnedByPlayer
      }
    };

    this.logging.debug('Opening star detail view', context);

    this.logging.info('Navigating to star detail', {
      ...context,
      additionalData: {
        ...context.additionalData,
        route: `/star/${star.id}`
      }
    });

    this.router.navigateByUrl(`/star/${star.id}`);
  }

  /**
   * Opens star detail view by ID
   */
  openStar(starId: string): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'openStar',
      entityId: starId,
      entityType: 'star'
    };

    this.logging.debug('Opening star detail', context);
    this.router.navigateByUrl(`/star/${starId}`);
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
   * Finds and centers on the player's home star
   */
  centerOnHomeStar(viewportWidth?: number, viewportHeight?: number): void {
    const player = this.gs.player();
    const stars = this.gs.stars();

    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'centerOnHomeStar',
      additionalData: {
        viewportWidth,
        viewportHeight,
        playerId: player?.id,
        ownedStarIds: player?.ownedStarIds ?? []
      }
    };

    this.logging.debug('Centering on home star', context);

    if (!player) {
      this.logging.warn('No player found for home star centering', context);
      return;
    }

    const ownedStarIds = player.ownedStarIds ?? [];
    const primaryHomeStarId = ownedStarIds[0];

    let homeStar = primaryHomeStarId
      ? stars.find((candidate) => candidate.id === primaryHomeStarId)
      : undefined;

    if (!homeStar) {
      homeStar = stars.find((candidate) => candidate.ownerId === player.id);
    }

    if (!homeStar && stars.length) {
      homeStar = stars[0];
    }

    if (homeStar) {
      this.mapState.scale.set(6); // Set a reasonable zoom level
      this.centerOnStar(homeStar, viewportWidth, viewportHeight);

      this.logging.info('Centered on home star', {
        ...context,
        entityId: homeStar.id,
        entityType: 'star',
        additionalData: {
          ...context.additionalData,
          homeStarName: homeStar.name,
          homeStarPosition: homeStar.position
        }
      });
    } else {
      this.logging.warn('No home star available to center on', context);
    }
  }

  /**
   * Fits the entire galaxy in the viewport
   */
  fitGalaxyToView(viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'GalaxyNavigationService',
      operation: 'fitGalaxyToView',
      additionalData: { viewportWidth, viewportHeight }
    };

    this.logging.debug('Fitting galaxy to viewport', context);

    const stars = this.gs.stars();
    if (stars.length === 0) {
      this.logging.warn('No stars found for galaxy fit', context);
      return;
    }

    // Calculate galaxy bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const star of stars) {
      minX = Math.min(minX, star.position.x);
      minY = Math.min(minY, star.position.y);
      maxX = Math.max(maxX, star.position.x);
      maxY = Math.max(maxY, star.position.y);
    }

    const bounds = { minX, minY, maxX, maxY };
    const width = viewportWidth || this.DEFAULT_VIEWPORT_WIDTH;
    const height = viewportHeight || this.DEFAULT_VIEWPORT_HEIGHT;

    // Calculate optimal zoom and center
    const optimalZoom = this.coordinateService.calculateFitZoom(bounds, width, height);
    const center = this.coordinateService.calculateBoundsCenter(bounds);

    this.mapState.scale.set(optimalZoom);
    this.centerOnPoint(center.x, center.y, width, height);

    this.logging.info('Galaxy fitted to viewport', {
      ...context,
      additionalData: {
        ...context.additionalData,
        bounds,
        optimalZoom,
        center
      }
    });
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