import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import type { LogContext } from '../../../../models/service-interfaces.model';

/**
 * Handles low-level map viewport operations.
 * Responsible for centering the map view on coordinates and managing viewport calculations.
 */
@Injectable({
  providedIn: 'root',
})
export class MapViewportService {
  private logging = inject(LoggingService);
  private mapState = inject(GalaxyMapStateService);

  private readonly DEFAULT_VIEWPORT_WIDTH = 1000;
  private readonly DEFAULT_VIEWPORT_HEIGHT = 800;

  /**
   * Centers the map view on a specific coordinate point
   */
  centerOnPoint(x: number, y: number, viewportWidth?: number, viewportHeight?: number): void {
    const context: LogContext = {
      service: 'MapViewportService',
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
   * Get the default viewport dimensions
   */
  getDefaultViewportDimensions(): { width: number; height: number } {
    return {
      width: this.DEFAULT_VIEWPORT_WIDTH,
      height: this.DEFAULT_VIEWPORT_HEIGHT
    };
  }
}
