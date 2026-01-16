import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../../../services/core/logging.service';
import type { 
  IGalaxyCoordinateService, 
  GalaxyMapState, 
  ScreenCoordinate, 
  GalaxyCoordinate,
  LogContext 
} from '../../../models/service-interfaces.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyCoordinateService implements IGalaxyCoordinateService {
  private logging = inject(LoggingService);

  private readonly MIN_ZOOM = 0.5;
  private readonly MAX_ZOOM = 15;
  private readonly ZOOM_FACTOR = 1.1;

  screenToGalaxy(screenX: number, screenY: number, mapState: GalaxyMapState): GalaxyCoordinate {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'screenToGalaxy',
      additionalData: { 
        screenX, 
        screenY, 
        zoom: mapState.zoom,
        panX: mapState.panX,
        panY: mapState.panY
      }
    };

    this.logging.debug('Converting screen coordinates to galaxy coordinates', context);

    // Convert screen coordinates to world coordinates
    const worldX = (screenX - mapState.panX) / mapState.zoom;
    const worldY = (screenY - mapState.panY) / mapState.zoom;

    const result: GalaxyCoordinate = { x: worldX, y: worldY };

    this.logging.debug('Screen to galaxy conversion completed', {
      ...context,
      additionalData: { 
        ...context.additionalData,
        resultX: result.x,
        resultY: result.y
      }
    });

    return result;
  }

  galaxyToScreen(galaxyX: number, galaxyY: number, mapState: GalaxyMapState): ScreenCoordinate {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'galaxyToScreen',
      additionalData: { 
        galaxyX, 
        galaxyY, 
        zoom: mapState.zoom,
        panX: mapState.panX,
        panY: mapState.panY
      }
    };

    this.logging.debug('Converting galaxy coordinates to screen coordinates', context);

    // Convert world coordinates to screen coordinates
    const screenX = galaxyX * mapState.zoom + mapState.panX;
    const screenY = galaxyY * mapState.zoom + mapState.panY;

    const result: ScreenCoordinate = { x: screenX, y: screenY };

    this.logging.debug('Galaxy to screen conversion completed', {
      ...context,
      additionalData: { 
        ...context.additionalData,
        resultX: result.x,
        resultY: result.y
      }
    });

    return result;
  }

  calculateZoomLevel(currentZoom: number, delta: number): number {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'calculateZoomLevel',
      additionalData: { 
        currentZoom, 
        delta,
        minZoom: this.MIN_ZOOM,
        maxZoom: this.MAX_ZOOM
      }
    };

    this.logging.debug('Calculating new zoom level', context);

    let newZoom: number;

    if (delta > 0) {
      // Zoom in
      newZoom = Math.min(currentZoom * this.ZOOM_FACTOR, this.MAX_ZOOM);
    } else {
      // Zoom out
      newZoom = Math.max(currentZoom / this.ZOOM_FACTOR, this.MIN_ZOOM);
    }

    // Clamp to valid range
    newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom));

    this.logging.debug('Zoom level calculation completed', {
      ...context,
      additionalData: { 
        ...context.additionalData,
        newZoom,
        zoomChanged: newZoom !== currentZoom
      }
    });

    return newZoom;
  }

  /**
   * Converts SVG element coordinates to galaxy coordinates
   */
  svgToGalaxy(svgX: number, svgY: number, svgElement: SVGSVGElement, mapState: GalaxyMapState): GalaxyCoordinate {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'svgToGalaxy',
      additionalData: { svgX, svgY }
    };

    this.logging.debug('Converting SVG coordinates to galaxy coordinates', context);

    // Create SVG point and transform
    const point = svgElement.createSVGPoint();
    point.x = svgX;
    point.y = svgY;
    
    const ctm = svgElement.getScreenCTM();
    if (!ctm) {
      this.logging.warn('Could not get screen CTM from SVG element', context);
      return { x: 0, y: 0 };
    }

    const transformedPoint = point.matrixTransform(ctm.inverse());
    
    // Apply map state transformation
    const galaxyX = (transformedPoint.x - mapState.panX) / mapState.zoom;
    const galaxyY = (transformedPoint.y - mapState.panY) / mapState.zoom;

    return { x: galaxyX, y: galaxyY };
  }

  /**
   * Calculates the viewport bounds in galaxy coordinates
   */
  getViewportBounds(viewportWidth: number, viewportHeight: number, mapState: GalaxyMapState): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'getViewportBounds',
      additionalData: { viewportWidth, viewportHeight, zoom: mapState.zoom }
    };

    this.logging.debug('Calculating viewport bounds', context);

    const topLeft = this.screenToGalaxy(0, 0, mapState);
    const bottomRight = this.screenToGalaxy(viewportWidth, viewportHeight, mapState);

    const bounds = {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y)
    };

    this.logging.debug('Viewport bounds calculated', {
      ...context,
      additionalData: { ...context.additionalData, bounds }
    });

    return bounds;
  }

  /**
   * Calculates the distance between two galaxy coordinates
   */
  calculateDistance(point1: GalaxyCoordinate, point2: GalaxyCoordinate): number {
    const distance = Math.hypot(point2.x - point1.x, point2.y - point1.y);
    
    this.logging.debug('Distance calculated between galaxy points', {
      service: 'GalaxyCoordinateService',
      operation: 'calculateDistance',
      additionalData: { 
        point1, 
        point2, 
        distance 
      }
    });

    return distance;
  }

  /**
   * Checks if a galaxy coordinate is within the viewport
   */
  isPointInViewport(point: GalaxyCoordinate, viewportWidth: number, viewportHeight: number, mapState: GalaxyMapState): boolean {
    const bounds = this.getViewportBounds(viewportWidth, viewportHeight, mapState);
    
    const isInside = point.x >= bounds.minX && 
                    point.x <= bounds.maxX && 
                    point.y >= bounds.minY && 
                    point.y <= bounds.maxY;

    this.logging.debug('Point visibility check completed', {
      service: 'GalaxyCoordinateService',
      operation: 'isPointInViewport',
      additionalData: { 
        point, 
        bounds, 
        isInside 
      }
    });

    return isInside;
  }

  /**
   * Calculates the optimal zoom level to fit a bounding box in the viewport
   */
  calculateFitZoom(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    viewportWidth: number,
    viewportHeight: number,
    padding: number = 50
  ): number {
    const context: LogContext = {
      service: 'GalaxyCoordinateService',
      operation: 'calculateFitZoom',
      additionalData: { bounds, viewportWidth, viewportHeight, padding }
    };

    this.logging.debug('Calculating fit zoom level', context);

    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;

    if (boundsWidth <= 0 || boundsHeight <= 0) {
      this.logging.warn('Invalid bounds for fit zoom calculation', context);
      return 1;
    }

    const availableWidth = viewportWidth - (padding * 2);
    const availableHeight = viewportHeight - (padding * 2);

    const zoomX = availableWidth / boundsWidth;
    const zoomY = availableHeight / boundsHeight;

    const optimalZoom = Math.min(zoomX, zoomY);
    const clampedZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, optimalZoom));

    this.logging.debug('Fit zoom calculation completed', {
      ...context,
      additionalData: { 
        ...context.additionalData,
        boundsWidth,
        boundsHeight,
        zoomX,
        zoomY,
        optimalZoom,
        clampedZoom
      }
    });

    return clampedZoom;
  }

  /**
   * Calculates the center point for a bounding box
   */
  calculateBoundsCenter(bounds: { minX: number; minY: number; maxX: number; maxY: number }): GalaxyCoordinate {
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };

    this.logging.debug('Bounds center calculated', {
      service: 'GalaxyCoordinateService',
      operation: 'calculateBoundsCenter',
      additionalData: { bounds, center }
    });

    return center;
  }
}