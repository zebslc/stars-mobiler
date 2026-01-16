import { Injectable, inject, signal } from '@angular/core';
import { LoggingService } from '../../../services/core/logging.service';
import type { 
  IGalaxyContextMenuService,
  ScreenCoordinate,
  Waypoint,
  LogContext 
} from '../../../models/service-interfaces.model';
import type { Fleet, Star } from '../../../models/game.model';

export interface PlanetContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  star: Star | null;
}

export interface FleetContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fleet: Fleet | null;
}

export interface WaypointContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fleetId: string | null;
  orderIndex: number;
  order: any | null;
}

@Injectable({
  providedIn: 'root',
})
export class GalaxyContextMenuService implements IGalaxyContextMenuService {
  private logging = inject(LoggingService);

  // Context menu state signals
  readonly planetContextMenu = signal<PlanetContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    star: null,
  });

  readonly fleetContextMenu = signal<FleetContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fleet: null,
  });

  readonly waypointContextMenu = signal<WaypointContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fleetId: null,
    orderIndex: -1,
    order: null,
  });

  showPlanetContextMenu(star: Star, position: ScreenCoordinate): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'showPlanetContextMenu',
      entityId: star.id,
      entityType: 'star',
      additionalData: { position }
    };

    this.logging.debug('Showing planet context menu', context);

    // Star is passed directly since planets are now part of stars
    
    this.closeAllContextMenus();
    this.planetContextMenu.set({
      visible: true,
      x: position.x,
      y: position.y,
      star: star,
    });
  }

  showFleetContextMenu(fleet: Fleet, position: ScreenCoordinate): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'showFleetContextMenu',
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: { position }
    };

    this.logging.debug('Showing fleet context menu', context);

    this.closeAllContextMenus();
    this.fleetContextMenu.set({
      visible: true,
      x: position.x,
      y: position.y,
      fleet: fleet,
    });
  }

  showWaypointContextMenu(waypoint: Waypoint, position: ScreenCoordinate): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'showWaypointContextMenu',
      entityId: waypoint.id,
      entityType: 'waypoint',
      additionalData: { 
        position,
        fleetId: waypoint.fleetId,
        orderIndex: waypoint.orderIndex
      }
    };

    this.logging.debug('Showing waypoint context menu', context);

    this.closeAllContextMenus();
    this.waypointContextMenu.set({
      visible: true,
      x: position.x,
      y: position.y,
      fleetId: waypoint.fleetId,
      orderIndex: waypoint.orderIndex,
      order: null, // This would need to be populated from the fleet's orders
    });
  }

  closeAllContextMenus(): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'closeAllContextMenus',
      additionalData: {
        planetMenuVisible: this.planetContextMenu().visible,
        fleetMenuVisible: this.fleetContextMenu().visible,
        waypointMenuVisible: this.waypointContextMenu().visible
      }
    };

    this.logging.debug('Closing all context menus', context);

    this.planetContextMenu.update((v) => ({ ...v, visible: false }));
    this.fleetContextMenu.update((v) => ({ ...v, visible: false }));
    this.waypointContextMenu.update((v) => ({ ...v, visible: false }));
  }

  /**
   * Shows context menu for star (planet) right-click
   */
  showStarContextMenu(star: Star, position: ScreenCoordinate): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'showStarContextMenu',
      entityId: star.id,
      entityType: 'star',
      additionalData: { position }
    };

    this.logging.debug('Showing star context menu', context);

    this.closeAllContextMenus();
    this.planetContextMenu.set({
      visible: true,
      x: position.x,
      y: position.y,
      star: star,
    });
  }

  /**
   * Shows context menu for waypoint right-click with fleet and order information
   */
  showWaypointContextMenuWithOrder(fleetId: string, orderIndex: number, order: any, position: ScreenCoordinate): void {
    const context: LogContext = {
      service: 'GalaxyContextMenuService',
      operation: 'showWaypointContextMenuWithOrder',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { 
        position,
        orderIndex,
        orderType: order?.type
      }
    };

    this.logging.debug('Showing waypoint context menu with order', context);

    this.closeAllContextMenus();
    this.waypointContextMenu.set({
      visible: true,
      x: position.x,
      y: position.y,
      fleetId: fleetId,
      orderIndex: orderIndex,
      order: order,
    });
  }

  /**
   * Closes specific context menu types
   */
  closePlanetContextMenu(): void {
    this.logging.debug('Closing planet context menu', {
      service: 'GalaxyContextMenuService',
      operation: 'closePlanetContextMenu'
    });
    this.planetContextMenu.update((v) => ({ ...v, visible: false }));
  }

  closeFleetContextMenu(): void {
    this.logging.debug('Closing fleet context menu', {
      service: 'GalaxyContextMenuService',
      operation: 'closeFleetContextMenu'
    });
    this.fleetContextMenu.update((v) => ({ ...v, visible: false }));
  }

  closeWaypointContextMenu(): void {
    this.logging.debug('Closing waypoint context menu', {
      service: 'GalaxyContextMenuService',
      operation: 'closeWaypointContextMenu'
    });
    this.waypointContextMenu.update((v) => ({ ...v, visible: false }));
  }

  /**
   * Checks if any context menu is currently visible
   */
  isAnyMenuVisible(): boolean {
    return this.planetContextMenu().visible || 
           this.fleetContextMenu().visible || 
           this.waypointContextMenu().visible;
  }

  /**
   * Gets the currently visible menu type
   */
  getVisibleMenuType(): 'planet' | 'fleet' | 'waypoint' | null {
    if (this.planetContextMenu().visible) return 'planet';
    if (this.fleetContextMenu().visible) return 'fleet';
    if (this.waypointContextMenu().visible) return 'waypoint';
    return null;
  }

  private findStarByPlanetId(starId: string): Star | null {
    // This is a placeholder implementation
    // In a real implementation, you would inject a service to find the star
    // or have access to the game state to perform this lookup
    this.logging.warn('findStarByPlanetId not fully implemented', {
      service: 'GalaxyContextMenuService',
      operation: 'findStarByPlanetId',
      entityId: starId,
      entityType: 'star'
    });
    return null;
  }
}