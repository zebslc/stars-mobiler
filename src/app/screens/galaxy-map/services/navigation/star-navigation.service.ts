import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { GalaxyCoordinateService } from './galaxy-coordinate.service';
import { MapViewportService } from './map-viewport.service';
import type { Star } from '../../../../models/game.model';
import type { LogContext } from '../../../../models/service-interfaces.model';

/**
 * Handles star-related navigation operations.
 * Responsible for centering on stars and opening star detail views.
 */
@Injectable({
  providedIn: 'root',
})
export class StarNavigationService {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private logging = inject(LoggingService);
  private mapState = inject(GalaxyMapStateService);
  private coordinateService = inject(GalaxyCoordinateService);
  private viewport = inject(MapViewportService);

  /**
   * Centers the map view on a specific star
   */
  centerOnStar(star: Star, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'StarNavigationService',
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

    const dims = this.viewport.getDefaultViewportDimensions();
    const width = viewportWidth || dims.width;
    const height = viewportHeight || dims.height;

    this.viewport.centerOnPoint(star.position.x, star.position.y, width, height);
  }

  /**
   * Opens the star detail view for the provided star
   */
  openStarDetail(star: Star): void {
    const player = this.gs.player();
    const ownedStarIds = player?.ownedStarIds ?? [];
    const isOwnedByPlayer = star.ownerId === player?.id || ownedStarIds.includes(star.id);

    const context: LogContext = {
      service: 'StarNavigationService',
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
      service: 'StarNavigationService',
      operation: 'openStar',
      entityId: starId,
      entityType: 'star'
    };

    this.logging.debug('Opening star detail', context);
    this.router.navigateByUrl(`/star/${starId}`);
  }

  /**
   * Finds and centers on the player's home star
   */
  centerOnHomeStar(viewportWidth?: number, viewportHeight?: number): void {
    const player = this.gs.player();
    const stars = this.gs.stars();

    const context: LogContext = {
      service: 'StarNavigationService',
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
      service: 'StarNavigationService',
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
    const dims = this.viewport.getDefaultViewportDimensions();
    const width = viewportWidth || dims.width;
    const height = viewportHeight || dims.height;

    // Calculate optimal zoom and center
    const optimalZoom = this.coordinateService.calculateFitZoom(bounds, width, height);
    const center = this.coordinateService.calculateBoundsCenter(bounds);

    this.mapState.scale.set(optimalZoom);
    this.viewport.centerOnPoint(center.x, center.y, width, height);

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
}
