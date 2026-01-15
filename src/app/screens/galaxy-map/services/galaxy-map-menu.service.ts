import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameStateService } from '../../../services/game/game-state.service';
import { SettingsService } from '../../../services/core/settings.service';
import { LoggingService } from '../../../services/core/logging.service';
import { GalaxyMapStateService } from './galaxy-map-state.service';
import { GalaxyWaypointService, FinalizeWaypointResult } from './waypoints/galaxy-waypoint.service';
import { GalaxyFleetPositionService } from './galaxy-fleet-position.service';
import { FLEET_ORDER_TYPE } from '../../../models/fleet-order.constants';
import { Fleet, FleetOrder, GameState, Star } from '../../../models/game.model';
import { getDesign } from '../../../data/ships.data';

export interface MenuAction {
  action: string;
  available: boolean;
  reason: string;
}

export type PlanetMenuState = { visible: boolean; x: number; y: number; star: Star | null };
export type FleetMenuState = { visible: boolean; x: number; y: number; fleet: Fleet | null };
export type WaypointMenuState = {
  visible: boolean;
  x: number;
  y: number;
  fleetId: string | null;
  orderIndex: number;
  order: FleetOrder | null;
};

@Injectable({ providedIn: 'root' })
export class GalaxyMapMenuService {
  private readonly gs = inject(GameStateService);
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly logging = inject(LoggingService);
  private readonly state = inject(GalaxyMapStateService);
  private readonly waypoints = inject(GalaxyWaypointService);
  private readonly fleetPositions = inject(GalaxyFleetPositionService);

  readonly planetMenu = signal<PlanetMenuState>({ visible: false, x: 0, y: 0, star: null });
  readonly fleetMenu = signal<FleetMenuState>({ visible: false, x: 0, y: 0, fleet: null });
  readonly waypointMenu = signal<WaypointMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fleetId: null,
    orderIndex: -1,
    order: null,
  });

  private readonly COLONIZE_THRESHOLD = 20;

  readonly canColonizeWaypoint = computed(() => {
    const ctx = this.waypointMenu();
    if (!ctx.visible) {
      return false;
    }

    const game = this.gs.game();
    if (!game) {
      return false;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === ctx.fleetId);
    const order = ctx.order;

    if (!fleet || !order) {
      return false;
    }

    const targetStar = this.resolveWaypointTargetStar(order, game);
    if (!targetStar) {
      return false;
    }

    const hasColony = this.hasColonyShipForFleet(game, fleet);

    if (this.settings.developerMode()) {
      this.logging.debug('Colonize waypoint eligibility evaluated', {
        service: 'GalaxyMapMenuService',
        operation: 'canColonizeWaypoint',
        additionalData: {
          fleetId: fleet.id,
          hasColony,
          orderType: order.type,
          orderDestination: 'destination' in order ? order.destination : undefined,
          targetStarId: targetStar.id,
        },
      });
    }

    return hasColony;
  });

  showPlanetMenu(event: MouseEvent, star: Star): void {
    event.preventDefault();
    event.stopPropagation();

    this.planetMenu.set({ visible: true, x: event.clientX, y: event.clientY, star });
    this.fleetMenu.update((state) => ({ ...state, visible: false }));
    this.logMenuOpen('planet', {
      starId: star.id,
      starName: star.name,
      availableActions: this.getPlanetMenuActions(star),
    });
  }

  showFleetMenu(event: MouseEvent, fleet: Fleet): void {
    event.preventDefault();
    event.stopPropagation();

    this.fleetMenu.set({ visible: true, x: event.clientX, y: event.clientY, fleet });
    this.planetMenu.update((state) => ({ ...state, visible: false }));
    this.logMenuOpen('fleet', {
      fleetId: fleet.id,
      fleetName: fleet.name,
      availableActions: this.getFleetMenuActions(fleet),
    });
  }

  showWaypointMenu(
    event: MouseEvent,
    fleetId: string,
    orderIndex: number,
    order: FleetOrder,
    reason: 'click' | 'right-click' = 'click',
  ): void {
    event.stopPropagation();
    event.preventDefault();

    this.closeMenus(false);
    this.waypointMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleetId,
      orderIndex,
      order,
    });
    this.logMenuOpen('waypoint', {
      reason,
      fleetId,
      orderIndex,
      order,
    });
  }

  showWaypointMenuFromResult(
    result: FinalizeWaypointResult | null,
    screenPoint?: { x: number; y: number } | null,
  ): void {
    if (!result || !screenPoint) {
      return;
    }

    this.closeMenus(false);
    this.waypointMenu.set({
      visible: true,
      x: screenPoint.x,
      y: screenPoint.y,
      fleetId: result.fleetId,
      orderIndex: result.orderIndex,
      order: result.order,
    });

    this.logMenuOpen('waypoint', {
      reason: 'drag-finalize',
      fleetId: result.fleetId,
      orderIndex: result.orderIndex,
      order: result.order,
    });
  }

  closeMenus(closeAll = true): void {
    const hadMenu =
      this.planetMenu().visible ||
      this.fleetMenu().visible ||
      (closeAll && this.waypointMenu().visible);

    this.planetMenu.update((state) => ({ ...state, visible: false }));
    this.fleetMenu.update((state) => ({ ...state, visible: false }));
    if (closeAll) {
      this.waypointMenu.set({
        visible: false,
        x: 0,
        y: 0,
        fleetId: null,
        orderIndex: -1,
        order: null,
      });
    }

    if (hadMenu && this.settings.developerMode()) {
      this.logging.info('Context menus closed', {
        service: 'GalaxyMapMenuService',
        operation: 'MenuClose',
      });
    }
  }

  handleStarView(starId: string): void {
    this.router.navigateByUrl(`/star/${starId}`);
    this.closeMenus();
  }

  handleFleetView(fleetId: string): void {
    this.router.navigateByUrl(`/fleet/${fleetId}`);
    this.closeMenus();
  }

  handleSendFleetToStar(star: Star, selectedFleetId: string | null): void {
    if (selectedFleetId) {
      this.gs.issueFleetOrder(selectedFleetId, {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: star.position,
      });
    }
    this.closeMenus();
  }

  handleDeleteWaypoint(): void {
    const ctx = this.waypointMenu();
    const fleetId = ctx.fleetId;
    if (ctx.visible && fleetId) {
      this.waypoints.deleteWaypoint(fleetId, ctx.orderIndex);
    }
    this.closeMenus();
  }

  handleMoveWaypoint(): void {
    const ctx = this.waypointMenu();
    const fleetId = ctx.fleetId;
    if (ctx.visible && fleetId) {
      this.waypoints.moveWaypoint(fleetId, ctx.orderIndex);
    }
    this.closeMenus();
  }

  handleWaypointSpeed(): void {
    const ctx = this.waypointMenu();
    const fleetId = ctx.fleetId;
    if (ctx.visible && fleetId) {
      this.waypoints.setWaypointSpeed(fleetId, ctx.orderIndex);
    }
    this.closeMenus();
  }

  handleColonizeWaypoint(): void {
    const ctx = this.waypointMenu();
    const fleetId = ctx.fleetId;
    if (!ctx.visible || !fleetId) {
      return;
    }

    const game = this.gs.game();
    if (!game) {
      return;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    const order = ctx.order;
    if (!fleet || !order) {
      return;
    }

    const star = this.resolveWaypointTargetStar(order, game);
    if (!star) {
      return;
    }

    const newOrders = [...(fleet.orders ?? [])];
    const existingWarpSpeed = this.extractWarpSpeed(order);
    newOrders[ctx.orderIndex] = {
      type: FLEET_ORDER_TYPE.ORBIT,
      starId: star.id,
      warpSpeed: existingWarpSpeed,
      action: 'colonize',
    };

    this.gs.setFleetOrders(fleetId, newOrders);
    this.closeMenus();
  }

  handleColonizeFleet(fleetId: string): void {
    const game = this.gs.game();
    if (!game) {
      this.closeMenus();
      return;
    }

    const fleet = this.getFleetInOrbit(game, fleetId);
    if (!fleet) {
      this.closeMenus();
      return;
    }

    if (!this.confirmColonizationHabitability(fleet.location.starId)) {
      this.closeMenus();
      return;
    }

    if (this.tryColonizeImmediately(fleetId)) {
      this.closeMenus();
      return;
    }

    this.gs.issueFleetOrder(fleetId, {
      type: FLEET_ORDER_TYPE.COLONIZE,
      starId: fleet.location.starId,
    });
    this.router.navigateByUrl('/map');
    this.closeMenus();
  }

  handleLoadCargo(fleetId: string): void {
    const game = this.gs.game();
    if (!game) {
      this.closeMenus();
      return;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.closeMenus();
      return;
    }

    const starId = fleet.location.starId;
    this.gs.loadCargo(fleetId, starId, {
      resources: 'fill',
      ironium: 'fill',
      boranium: 'fill',
      germanium: 'fill',
      colonists: 'fill',
    });
    this.closeMenus();
  }

  private getFleetInOrbit(
    game: GameState,
    fleetId: string,
  ): (Fleet & { location: { type: 'orbit'; starId: string } }) | null {
    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      return null;
    }
    return fleet as Fleet & { location: { type: 'orbit'; starId: string } };
  }

  private confirmColonizationHabitability(starId: string): boolean {
    const habitability = this.gs.habitabilityFor(starId);
    if (habitability > 0) {
      return true;
    }

    return confirm('Warning: This world is inhospitable. Colonists will die each turn. Proceed?');
  }

  private tryColonizeImmediately(fleetId: string): boolean {
    const colonizedStarId = this.gs.colonizeNow(fleetId);
    if (!colonizedStarId) {
      return false;
    }

    this.router.navigateByUrl(`/star/${colonizedStarId}`);
    return true;
  }

  handleUnloadCargo(fleetId: string): void {
    const game = this.gs.game();
    if (!game) {
      this.closeMenus();
      return;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.closeMenus();
      return;
    }

    const starId = fleet.location.starId;
    this.gs.unloadCargo(fleetId, starId, {
      ironium: 'all',
      boranium: 'all',
      germanium: 'all',
      colonists: 'all',
    });
    this.closeMenus();
  }

  handleDecommission(fleetId: string): void {
    const game = this.gs.game();
    if (!game) {
      this.closeMenus();
      return;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet) {
      this.closeMenus();
      return;
    }

    const name = fleet.name || `Fleet ${fleet.id.slice(-4)}`;
    const ok = confirm(`Decommission ${name}? This will scrap all ships and cargo in this fleet.`);
    if (!ok) {
      this.closeMenus();
      return;
    }

    this.gs.decommissionFleet(fleetId);
    this.closeMenus();
  }

  handleMapRightClick(event: MouseEvent): void {
    event.preventDefault();
    this.closeMenus();
  }

  getPlanetMenuActions(_star: Star): MenuAction[] {
    const selectedFleet = this.state.selectedFleetId();
    return [
      { action: 'viewPlanet', available: true, reason: 'Always available' },
      {
        action: 'sendFleetToStar',
        available: !!selectedFleet,
        reason: selectedFleet ? 'Fleet selected' : 'No fleet selected',
      },
    ];
  }

  getFleetMenuActions(fleet: Fleet): MenuAction[] {
    const actions: MenuAction[] = [
      { action: 'viewFleet', available: true, reason: 'Always available' },
      { action: 'decommission', available: true, reason: 'Always available' },
    ];

    const inOrbit = fleet.location.type === 'orbit';
    if (inOrbit) {
      actions.push({ action: 'loadCargo', available: true, reason: 'In orbit' });
      actions.push({ action: 'unloadCargo', available: true, reason: 'In orbit' });

      const starId = (fleet.location as { starId: string }).starId;
      const hab = this.gs.habitabilityFor(starId);
      actions.push({
        action: 'colonize',
        available: true,
        reason: hab > 0 ? 'In orbit and habitable' : 'In orbit (warning: inhospitable)',
      });
    } else {
      actions.push({ action: 'loadCargo', available: false, reason: 'Not in orbit' });
      actions.push({ action: 'unloadCargo', available: false, reason: 'Not in orbit' });
      actions.push({ action: 'colonize', available: false, reason: 'Not in orbit' });
    }

    return actions;
  }

  logWaypointSelection(fleetId: string, orderIndex: number, event: MouseEvent | TouchEvent): void {
    if (!this.settings.developerMode()) {
      return;
    }

    const game = this.gs.game();
    if (!game) {
      return;
    }

    const fleet = game.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet) {
      return;
    }

    const order = fleet.orders?.[orderIndex];
    const fw = this.waypoints.fleetWaypoints().find((candidate) => candidate.fleetId === fleetId);
    const segment = fw?.segments[orderIndex];

    let clientX = 0;
    let clientY = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent && event.touches.length) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    this.logging.info('Waypoint selected', {
      service: 'GalaxyMapMenuService',
      operation: 'WaypointSelection',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: {
        orderIndex,
        fleetName: fleet.name,
        currentOrder: order,
        segment: segment
          ? {
              x1: segment.x1,
              y1: segment.y1,
              x2: segment.x2,
              y2: segment.y2,
              distance: segment.distance,
            }
          : null,
        clickCoordinates: { x: clientX, y: clientY },
        availableActions: this.getWaypointActionsStatus(fleet),
      },
    });

    this.dumpWaypointDebugData(fleetId);
  }

  logSnapCheck(x: number, y: number, snapResult: { type: string; id?: string } | null): void {
    if (!this.settings.developerMode()) {
      return;
    }

    if (!snapResult) {
      this.lastSnapLogKey = null;
      return;
    }

    const key = `${snapResult.type}:${snapResult.id ?? ''}`;
    if (key === this.lastSnapLogKey) {
      return;
    }
    this.lastSnapLogKey = key;

    this.logging.debug('Waypoint snapped', {
      service: 'GalaxyMapMenuService',
      operation: 'SnapCheck',
      additionalData: {
        cursor: { x, y },
        snapTarget: snapResult,
      },
    });
  }

  private lastSnapLogKey: string | null = null;

  private resolveWaypointTargetStar(order: FleetOrder, game: GameState): Star | undefined {
    if (order.type === FLEET_ORDER_TYPE.ORBIT || order.type === FLEET_ORDER_TYPE.COLONIZE) {
      return game.stars.find((candidate) => candidate.id === order.starId);
    }

    if (order.type === FLEET_ORDER_TYPE.MOVE && order.destination) {
      return this.findClosestStar(order.destination.x, order.destination.y, game);
    }

    return undefined;
  }

  private findClosestStar(x: number, y: number, game: GameState): Star | undefined {
    const thresholdSquared = this.COLONIZE_THRESHOLD * this.COLONIZE_THRESHOLD;
    let closest: { star: Star; distance: number } | undefined;
    for (const star of game.stars) {
      const dx = star.position.x - x;
      const dy = star.position.y - y;
      const distance = dx * dx + dy * dy;
      if (distance <= thresholdSquared && (!closest || distance < closest.distance)) {
        closest = { star, distance };
      }
    }
    return closest?.star;
  }

  private hasColonyShipForFleet(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((ship) => {
      const dynamicDesign = game.shipDesigns.find((design) => design.id === ship.designId);
      if (dynamicDesign?.spec?.hasColonyModule && ship.count > 0) {
        return true;
      }
      const compiled = getDesign(ship.designId);
      return !!compiled?.colonyModule && ship.count > 0;
    });
  }

  private extractWarpSpeed(order: FleetOrder): number | undefined {
    return 'warpSpeed' in order ? order.warpSpeed : undefined;
  }

  private getWaypointActionsStatus(fleet: Fleet): MenuAction[] {
    const actions: MenuAction[] = [
      { action: 'move', available: true, reason: 'Always available' },
      { action: 'delete', available: true, reason: 'Always available' },
    ];

    const hasColony = fleet.ships.some((ship) => {
      const dynamicDesign = this.gs
        .game()
        ?.shipDesigns.find((design) => design.id === ship.designId);
      const stock = getDesign(ship.designId);
      return ship.count > 0 && (dynamicDesign?.spec?.hasColonyModule || stock?.colonyModule);
    });

    actions.push({
      action: 'colonise',
      available: hasColony,
      reason: hasColony ? 'Colony module present' : 'No colony module',
    });

    return actions;
  }

  private dumpWaypointDebugData(activeFleetId: string): void {
    const game = this.gs.game();
    if (!game) {
      return;
    }

    const waypoints = this.waypoints
      .fleetWaypoints()
      .find((candidate) => candidate.fleetId === activeFleetId);
    this.logging.debug('Debug: Waypoint Array', {
      service: 'GalaxyMapMenuService',
      operation: 'DebugDump',
      additionalData: {
        waypoints: waypoints?.segments.map((segment) => ({
          coordinates: { x: segment.x2, y: segment.y2 },
          type: segment.type,
          warning: segment.warning,
          distance: segment.distance,
        })),
      },
    });

    const fleet = game.fleets.find((candidate) => candidate.id === activeFleetId);
    if (!fleet) {
      return;
    }

    const pos = this.fleetPositions.fleetPos(fleet.id);
    const nearbyStars: Array<{
      name: string;
      id: string;
      coordinates: Star['position'];
      distance: number;
      ownerId: string | undefined;
      selectable: boolean;
    }> = [];
    const threshold = 100;

    for (const star of game.stars) {
      const dist = Math.hypot(star.position.x - pos.x, star.position.y - pos.y);
      if (dist < threshold) {
        nearbyStars.push({
          name: star.name,
          id: star.id,
          coordinates: star.position,
          distance: dist,
          ownerId: star.ownerId ?? undefined,
          selectable: true,
        });
      }
    }

    this.logging.debug('Debug: Nearby Stars', {
      service: 'GalaxyMapMenuService',
      operation: 'DebugDump',
      additionalData: { stars: nearbyStars },
    });
  }

  private logMenuOpen(type: 'waypoint' | 'planet' | 'fleet', context: unknown): void {
    if (!this.settings.developerMode()) {
      return;
    }

    this.logging.info(`Context menu opened: ${type}`, {
      service: 'GalaxyMapMenuService',
      operation: 'MenuOpen',
      entityType: type,
      additionalData: context,
    });
  }
}
