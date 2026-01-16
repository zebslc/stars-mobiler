import type {
  OnInit,
  ElementRef} from '@angular/core';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Params } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { SettingsService } from '../../services/core/settings.service';
import type { Star, Fleet, FleetOrder } from '../../models/game.model';
import { PlanetContextMenuComponent } from '../../components/planet-context-menu.component';
import { FleetContextMenuComponent } from '../../components/fleet-context-menu.component';
import { WaypointContextMenuComponent } from './components/waypoint-context-menu.component';
import { GalaxyStarComponent } from './components/galaxy-star.component';
import { GalaxyFleetComponent } from './components/galaxy-fleet.component';
import { GalaxyMapControlsComponent } from './components/galaxy-map-controls.component';
import { GalaxyMapSettingsComponent } from './components/galaxy-map-settings.component';
import { GalaxyMapStateService } from './services/galaxy-map-state.service';
import { GalaxyVisibilityService } from './services/galaxy-visibility.service';
import { GalaxyFleetFilterService } from './services/galaxy-fleet-filter.service';
import { GalaxyFleetPositionService } from './services/galaxy-fleet-position.service';
import { GalaxyFleetStationService } from './services/galaxy-fleet-station.service';
import { GalaxyWaypointService } from './services/waypoints/galaxy-waypoint.service';
import { GALAXY_SIZES } from '../../core/constants/galaxy.constants';
import { GalaxyMapMenuService } from './services/galaxy-map-menu.service';
import { GalaxyMapInteractionService } from './services/galaxy-map-interaction.service';

@Component({
  standalone: true,
  selector: 'app-galaxy-map',
  styles: [':host { display: flex; flex-direction: column; flex: 1; overflow: hidden; }'],
  template: `
    <main
      style="padding:var(--space-md); flex: 1; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box;"
    >
      @if (stars().length > 0) {
        <section
          style="border:1px solid #ccc; position: relative; flex-grow: 1; overflow: hidden; touch-action: none;"
          (mousedown)="onMouseDown($event)"
          (mousemove)="onMouseMove($event)"
          (mouseup)="onMouseUp()"
          (mouseleave)="onMouseUp()"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd()"
          (wheel)="onWheel($event)"
          (click)="closeContextMenus()"
        >
          <svg
            #galaxySvg
            [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;height:100%;touch-action:none;background:#02030a"
            (contextmenu)="onMapRightClick($event)"
          >
            <defs>
              <radialGradient id="galaxyBgGradient" cx="50%" cy="50%" r="80%">
                <stop offset="0%" stop-color="#0b1030"></stop>
                <stop offset="45%" stop-color="#05081a"></stop>
                <stop offset="100%" stop-color="#02030a"></stop>
              </radialGradient>
              <filter id="galaxyNoise" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.8"
                  numOctaves="3"
                  seed="7"
                  result="noise"
                ></feTurbulence>
                <feColorMatrix
                  in="noise"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0"
                  result="noiseAlpha"
                ></feColorMatrix>
                <feComposite in="noiseAlpha" in2="SourceGraphic" operator="over"></feComposite>
              </filter>
              <filter id="galaxyNebulaBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="18"></feGaussianBlur>
              </filter>
            </defs>

            <g #worldGroup [attr.transform]="state.transformString()">
              <!-- Background Layer -->
              <rect
                x="0"
                y="0"
                [attr.width]="width()"
                [attr.height]="height()"
                fill="url(#galaxyBgGradient)"
              ></rect>
              <rect
                x="0"
                y="0"
                [attr.width]="width()"
                [attr.height]="height()"
                filter="url(#galaxyNoise)"
                opacity="0.55"
              ></rect>

              <!-- Nebulae -->
              <g style="mix-blend-mode: screen; opacity: 0.9;">
                <circle
                  [attr.cx]="width() * 0.25"
                  [attr.cy]="height() * 0.26"
                  [attr.r]="width() * 0.12"
                  fill="#2b3bff"
                  opacity="0.08"
                  filter="url(#galaxyNebulaBlur)"
                ></circle>
                <circle
                  [attr.cx]="width() * 0.8"
                  [attr.cy]="height() * 0.4"
                  [attr.r]="width() * 0.16"
                  fill="#ff2bd6"
                  opacity="0.05"
                  filter="url(#galaxyNebulaBlur)"
                ></circle>
                <circle
                  [attr.cx]="width() * 0.6"
                  [attr.cy]="height() * 0.75"
                  [attr.r]="width() * 0.14"
                  fill="#2bffd5"
                  opacity="0.04"
                  filter="url(#galaxyNebulaBlur)"
                ></circle>
              </g>

              <!-- Scanner Ranges -->
              @if (settings.showScannerRanges()) {
                @for (range of visibility.scannerRanges(); track $index) {
                  <circle
                    [attr.cx]="range.x"
                    [attr.cy]="range.y"
                    [attr.r]="range.r"
                    fill="rgba(52, 152, 219, 0.1)"
                    stroke="#3498db"
                    stroke-width="1"
                    style="pointer-events: none"
                  />
                }
              }

              <!-- Cloaked Ranges -->
              @if (settings.showCloakedRanges()) {
                @for (range of visibility.cloakedRanges(); track $index) {
                  <circle
                    [attr.cx]="range.x"
                    [attr.cy]="range.y"
                    [attr.r]="range.r"
                    fill="none"
                    stroke="#9b59b6"
                    stroke-width="1"
                    stroke-dasharray="4,4"
                    style="pointer-events: none"
                  />
                }
              }

              <!-- Fleet Waypoints -->
              @for (fw of fleetWaypoints(); track fw.fleetId) {
                @if (fw.segments.length > 0) {
                  <g
                    class="waypoints"
                    [style.opacity]="navigationModeFleetId() === fw.fleetId ? 1 : 0.4"
                  >
                    @for (seg of fw.segments; track $index) {
                      <line
                        [attr.x1]="seg.x1"
                        [attr.y1]="seg.y1"
                        [attr.x2]="seg.x2"
                        [attr.y2]="seg.y2"
                        stroke="#2ecc71"
                        stroke-width="1"
                        stroke-dasharray="4,4"
                        style="pointer-events: none;"
                      />
                      <circle
                        [attr.cx]="seg.x2"
                        [attr.cy]="seg.y2"
                        r="4"
                        fill="#2ecc71"
                        stroke="#000"
                        stroke-width="0.5"
                        (mousedown)="onWaypointDown($event, fw.fleetId, $index)"
                        (touchstart)="onWaypointDown($event, fw.fleetId, $index)"
                        (click)="onWaypointClick($event, fw.fleetId, seg.order)"
                        style="cursor: pointer"
                      />
                    }
                  </g>
                }
              }

              <!-- Draw fleets first so stars remain clickable on top -->
              @for (fleet of fleetFilter.filteredFleets(); track fleet.id) {
                @if (fleet.location.type === 'orbit') {
                  @if (fleetPositions.fleetOrbitPosition(fleet); as pos) {
                    <g
                      app-galaxy-fleet
                      [fleet]="fleet"
                      [position]="pos"
                      [isOrbit]="true"
                      (fleetClick)="onFleetClick(fleet, $event)"
                      (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                      (fleetContext)="onFleetRightClick($event, fleet)"
                      (fleetDown)="onFleetDown($event, fleet)"
                    ></g>
                  }
                } @else {
                  <!-- Space fleet -->
                  <g
                    app-galaxy-fleet
                    [fleet]="fleet"
                    [position]="fleetPositions.getSpaceFleetPos(fleet)"
                    [isOrbit]="false"
                    (fleetClick)="onFleetClick(fleet, $event)"
                    (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                    (fleetContext)="onFleetRightClick($event, fleet)"
                    (fleetDown)="onFleetDown($event, fleet)"
                  ></g>
                }
              }

              @if (selectedFleet(); as fleet) {
                @if (fleetPositions.getFleetPosition(fleet); as pos) {
                  @if (visibility.getFleetScanCapabilities(fleet); as caps) {
                    @if (caps.scanRange > 0) {
                      <circle
                        [attr.cx]="pos.x"
                        [attr.cy]="pos.y"
                        [attr.r]="caps.scanRange"
                        fill="rgba(52, 152, 219, 0.1)"
                        stroke="#3498db"
                        stroke-dasharray="4,3"
                        [attr.stroke-width]="2"
                        style="pointer-events: none"
                      />
                    }
                    @if (caps.cloakedRange > 0) {
                      <circle
                        [attr.cx]="pos.x"
                        [attr.cy]="pos.y"
                        [attr.r]="caps.cloakedRange"
                        fill="none"
                        stroke="#9b59b6"
                        stroke-dasharray="4,3"
                        [attr.stroke-width]="1"
                        style="pointer-events: none"
                      />
                    }
                  }
                }
              }

              <!-- Draw stars on top for clear selection -->
              @for (star of stars(); track star.id) {
                <g
                  app-galaxy-star
                  [star]="star"
                  [scale]="state.scale()"
                  [isVisible]="visibility.visibleStars().has(star.id)"
                  [viewMode]="settings.viewMode()"
                  [showLabels]="settings.showLabels()"
                  [stationName]="fleetStations.stationByStarId().get(star.id)"
                  (starClick)="onStarClick(star, $event)"
                  (starDoubleClick)="onStarDoubleClick(star, $event)"
                  (starContext)="onStarRightClick($event, star)"
                ></g>
              }

              @if (selectedStar() && state.selectedFleetId(); as fid) {
                @if (fleetPositions.pathMarkers(fid, selectedStar()!); as marks) {
                  <line
                    [attr.x1]="fleetPositions.fleetPos(fid).x"
                    [attr.y1]="fleetPositions.fleetPos(fid).y"
                    [attr.x2]="selectedStar()!.position.x"
                    [attr.y2]="selectedStar()!.position.y"
                    stroke="#34495e"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events:none"
                  />
                  @for (m of marks; track $index) {
                    <circle
                      [attr.cx]="m.x"
                      [attr.cy]="m.y"
                      [attr.r]="3"
                      fill="#34495e"
                      style="pointer-events:none"
                    />
                  }
                }
              }

              @for (fleet of fleetWaypoints(); track fleet.fleetId) {
                @for (seg of fleet.segments; track $index) {
                  @if (
                    draggedWaypoint()?.fleetId !== fleet.fleetId ||
                    draggedWaypoint()?.orderIndex !== $index
                  ) {
                    <line
                      [attr.x1]="seg.x1"
                      [attr.y1]="seg.y1"
                      [attr.x2]="seg.x2"
                      [attr.y2]="seg.y2"
                      [attr.stroke]="seg.color"
                      stroke-width="2"
                      stroke-dasharray="4"
                      style="pointer-events: none;"
                    />
                    @if (seg.distance > 0) {
                      <text
                        [attr.x]="(seg.x1 + seg.x2) / 2"
                        [attr.y]="(seg.y1 + seg.y2) / 2"
                        fill="white"
                        font-size="10"
                        text-anchor="middle"
                        dy="-5"
                        style="pointer-events: none; text-shadow: 1px 1px 1px #000;"
                      >
                        {{ seg.distance }} ly
                      </text>
                    }
                    @if (seg.warning) {
                      <text
                        [attr.x]="(seg.x1 + seg.x2) / 2"
                        [attr.y]="(seg.y1 + seg.y2) / 2"
                        fill="#e74c3c"
                        font-size="12"
                        text-anchor="middle"
                        dy="10"
                        style="pointer-events: none; font-weight: bold; text-shadow: 1px 1px 1px #000;"
                      >
                        ⚠️
                      </text>
                    }
                    <circle
                      [attr.cx]="seg.x2"
                      [attr.cy]="seg.y2"
                      r="5"
                      [attr.fill]="seg.color"
                      stroke="#fff"
                      stroke-width="1"
                      class="waypoint-marker"
                      style="pointer-events: auto; cursor: context-menu;"
                      (contextmenu)="onWaypointRightClick($event, fleet.fleetId, $index)"
                      (touchstart)="onWaypointTouchStart($event, fleet.fleetId, $index)"
                      (touchend)="onWaypointTouchEnd()"
                    />
                  }
                }
              }

              @if (draggedWaypoint()) {
                <line
                  [attr.x1]="draggedWaypoint()!.startX"
                  [attr.y1]="draggedWaypoint()!.startY"
                  [attr.x2]="draggedWaypoint()!.currentX"
                  [attr.y2]="draggedWaypoint()!.currentY"
                  stroke="#2ecc71"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                  style="pointer-events: none;"
                />
                <circle
                  [attr.cx]="draggedWaypoint()!.currentX"
                  [attr.cy]="draggedWaypoint()!.currentY"
                  r="5"
                  fill="#2ecc71"
                  stroke="#fff"
                  stroke-width="1"
                  style="pointer-events: none;"
                />
                @if (snapTarget()) {
                  <circle
                    [attr.cx]="snapTarget()!.x"
                    [attr.cy]="snapTarget()!.y"
                    r="15"
                    fill="none"
                    stroke="#e74c3c"
                    stroke-width="2"
                    style="pointer-events: none;"
                  />
                }
              }
            </g>
          </svg>

          <!-- Overlay Controls -->
          <app-galaxy-map-settings
            [navigationMode]="!!navigationModeFleetId()"
            (exitNavigation)="exitNavigationMode()"
          >
          </app-galaxy-map-settings>

          @if (settings.showMapControls()) {
            <app-galaxy-map-controls
              (zoomIn)="state.zoomIn()"
              (zoomOut)="state.zoomOut()"
              (pan)="state.panArrow($event.x, $event.y)"
              (reset)="state.resetView()"
            ></app-galaxy-map-controls>
          }
        </section>

        <!-- Context Menus -->
        <app-planet-context-menu
          [visible]="planetContextMenu().visible"
          [x]="planetContextMenu().x"
          [y]="planetContextMenu().y"
          [star]="planetContextMenu().star"
          [selectedFleet]="selectedFleet()"
          [canSendFleet]="!!selectedFleet()"
          (close)="closeContextMenus()"
          (viewPlanet)="onViewPlanet($event)"
          (sendFleetToStar)="onSendFleetToStar($event)"
        ></app-planet-context-menu>

        <app-fleet-context-menu
          [visible]="fleetContextMenu().visible"
          [x]="fleetContextMenu().x"
          [y]="fleetContextMenu().y"
          [fleet]="fleetContextMenu().fleet"
          (close)="closeContextMenus()"
          (viewFleet)="onViewFleet($event)"
          (colonize)="onColonize($event)"
          (loadCargo)="onLoadCargo($event)"
          (unloadCargo)="onUnloadCargo($event)"
          (decommission)="onDecommission($event)"
        ></app-fleet-context-menu>

        <app-waypoint-context-menu
          [visible]="waypointContextMenu().visible"
          [x]="waypointContextMenu().x"
          [y]="waypointContextMenu().y"
          [canColonize]="canColonizeWaypoint()"
          (close)="closeContextMenus()"
          (delete)="onDeleteWaypoint()"
          (move)="onMoveWaypoint()"
          (setSpeed)="onSetWaypointSpeed()"
          (colonize)="onColonizeWaypoint()"
        ></app-waypoint-context-menu>
      } @else {
        <div style="padding: 2rem; text-align: center;">
          <p>No game active or no stars found.</p>
          <button (click)="newGame()">Start New Game</button>
        </div>
      }
    </main>
  `,
  imports: [
    CommonModule,
    PlanetContextMenuComponent,
    FleetContextMenuComponent,
    WaypointContextMenuComponent,
    GalaxyStarComponent,
    GalaxyFleetComponent,
    GalaxyMapControlsComponent,
    GalaxyMapSettingsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyMapComponent implements OnInit {
  readonly gs = inject(GameStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly settings = inject(SettingsService);
  readonly menus = inject(GalaxyMapMenuService);
  readonly interaction = inject(GalaxyMapInteractionService);
  readonly planetContextMenu = this.menus.planetMenu;
  readonly fleetContextMenu = this.menus.fleetMenu;
  readonly waypointContextMenu = this.menus.waypointMenu;

  readonly galaxySize = computed(() => {
    const size = this.gs.game()?.settings.galaxySize || 'small';
    return GALAXY_SIZES[size];
  });
  readonly width = computed(() => this.galaxySize().width);
  readonly height = computed(() => this.galaxySize().height);

  // Injected Services
  readonly state = inject(GalaxyMapStateService);
  readonly visibility = inject(GalaxyVisibilityService);
  readonly fleetFilter = inject(GalaxyFleetFilterService);
  readonly fleetPositions = inject(GalaxyFleetPositionService);
  readonly fleetStations = inject(GalaxyFleetStationService);
  readonly waypoints = inject(GalaxyWaypointService);

  // SVG element reference
  readonly galaxySvg = viewChild<ElementRef<SVGSVGElement>>('galaxySvg');
  readonly worldGroup = viewChild<ElementRef<SVGGElement>>('worldGroup');

  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;

  // Derived state for template convenience
  readonly selectedStar = computed(() => {
    const id = this.state.selectedStarId();
    return this.stars().find((s) => s.id === id) || null;
  });

  // Helper to get selected fleet object (needed for context menu)
  readonly selectedFleet = computed(() => {
    const id = this.state.selectedFleetId();
    if (!id) return null;
    return this.gs.game()?.fleets.find((f) => f.id === id) || null;
  });

  // Waypoint Creation State
  readonly draggedWaypoint = this.waypoints.draggedWaypoint;
  readonly snapTarget = this.waypoints.snapTarget;
  readonly navigationModeFleetId = this.waypoints.navigationModeFleetId;
  readonly fleetWaypoints = this.waypoints.fleetWaypoints;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => this.handleQueryParams(params));
  }

  // Fleet Press Handler
  onFleetDown(event: { originalEvent: MouseEvent | TouchEvent }, fleet: Fleet) {
    this.interaction.onFleetDown(event, fleet);
  }

  // Mouse Handlers
  onMouseDown(event: MouseEvent) {
    this.interaction.onMouseDown(event);
  }

  onMouseMove(event: MouseEvent) {
    this.interaction.onMouseMove(
      event,
      this.galaxySvg()?.nativeElement ?? null,
      this.worldGroup()?.nativeElement ?? null,
    );
  }

  onMouseUp() {
    this.interaction.onMouseUp();
  }

  onWheel(event: WheelEvent) {
    this.interaction.onWheel(event, event.currentTarget as HTMLElement | null);
  }

  // Waypoint Touch Handlers
  onWaypointTouchStart(event: TouchEvent, fleetId: string, waypointIndex: number) {
    this.interaction.onWaypointTouchStart(event, fleetId, waypointIndex);
  }

  onWaypointTouchEnd() {
    this.interaction.onWaypointTouchEnd();
  }

  // Touch Handlers
  onTouchStart(event: TouchEvent) {
    this.interaction.onTouchStart(event, this.galaxySvg()?.nativeElement ?? null);
  }

  onTouchMove(event: TouchEvent) {
    this.interaction.onTouchMove(
      event,
      this.galaxySvg()?.nativeElement ?? null,
      this.worldGroup()?.nativeElement ?? null,
    );
  }

  onTouchEnd() {
    this.interaction.onTouchEnd();
  }

  // Interaction Logic
  lastClickTime = 0;

  onStarClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    const now = Date.now();
    const isDoubleTap = this.state.selectedStarId() === star.id && now - this.lastClickTime < 300;

    this.state.selectedStarId.set(star.id);
    this.lastClickTime = now;

    if (isDoubleTap) {
      this.openStarDetail(star);
    }
  }

  onStarDoubleClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    this.openStarDetail(star);
  }

  onFleetClick(fleet: Fleet, event: MouseEvent) {
    event.stopPropagation();
    const now = Date.now();
    const isDoubleTap = this.state.selectedFleetId() === fleet.id && now - this.lastClickTime < 300;

    this.state.selectedFleetId.set(fleet.id);
    this.lastClickTime = now;

    if (isDoubleTap) {
      this.openFleet(fleet.id);
    }
  }

  onFleetDoubleClick(fleet: Fleet, event: MouseEvent) {
    event.stopPropagation();
    this.openFleet(fleet.id);
  }

  // Navigation & Actions
  openStarDetail(star: Star) {
    this.router.navigateByUrl(`/star/${star.id}`);
  }

  openFleet(id: string) {
    this.router.navigateByUrl(`/fleet/${id}`);
  }

  newGame() {
    this.router.navigateByUrl('/');
  }

  centerOnStar(star: Star) {
    this.state.translateX.set(-star.position.x * this.state.scale() + 500); // Approximation
    this.state.translateY.set(-star.position.y * this.state.scale() + 500);
  }

  centerOnPoint(x: number, y: number) {
    this.state.translateX.set(-x * this.state.scale() + 500);
    this.state.translateY.set(-y * this.state.scale() + 500);
  }

  private handleQueryParams(params: Params) {
    if (this.tryCenterOnQueryStar(params['starId'])) {
      return;
    }

    if (this.tryCenterOnQueryFleet(params['fleetId'])) {
      return;
    }

    this.centerOnHomeStar();
  }

  private tryCenterOnQueryStar(rawStarId: unknown): boolean {
    const starId = this.extractParamId(rawStarId);
    if (!starId) {
      return false;
    }

    const star = this.stars().find((candidate) => candidate.id === starId);
    if (!star) {
      return false;
    }

    this.centerOnStar(star);
    this.state.selectedStarId.set(star.id);
    return true;
  }

  private tryCenterOnQueryFleet(rawFleetId: unknown): boolean {
    const fleetId = this.extractParamId(rawFleetId);
    if (!fleetId) {
      return false;
    }

    const fleet = this.gs.game()?.fleets.find((candidate) => candidate.id === fleetId);
    if (!fleet) {
      return false;
    }

    this.state.selectedFleetId.set(fleet.id);

    if (fleet.location.type === 'orbit') {
      const orbitLocation = fleet.location as { starId: string };
      const star = this.stars().find((candidate) => candidate.id === orbitLocation.starId);
      if (star) {
        this.centerOnStar(star);
      }
    } else {
      const { x, y } = fleet.location as { x: number; y: number };
      this.centerOnPoint(x, y);
    }

    return true;
  }

  private centerOnHomeStar() {
    const playerId = this.gs.player()?.id;
    const homeStar = this.stars().find((candidate) => candidate.ownerId === playerId);
    if (!homeStar) {
      return;
    }

    this.state.scale.set(6);
    this.centerOnStar(homeStar);
  }

  private extractParamId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : null;
    }

    return typeof value === 'string' ? value : String(value);
  }

  // Waypoint Interaction
  onWaypointDown(event: MouseEvent | TouchEvent, fleetId: string, orderIndex: number) {
    this.interaction.onWaypointDown(event, fleetId, orderIndex);
  }

  onWaypointRightClick(event: MouseEvent, fleetId: string, orderIndex: number) {
    this.interaction.onWaypointRightClick(event, fleetId, orderIndex);
  }

  onWaypointClick(event: MouseEvent, fleetId: string, order: FleetOrder) {
    this.interaction.onWaypointClick(event, fleetId, order);
  }

  onDeleteWaypoint() {
    this.menus.handleDeleteWaypoint();
  }

  onMoveWaypoint() {
    this.menus.handleMoveWaypoint();
  }

  readonly canColonizeWaypoint = this.menus.canColonizeWaypoint;

  onColonizeWaypoint() {
    this.menus.handleColonizeWaypoint();
  }

  onSetWaypointSpeed() {
    this.menus.handleWaypointSpeed();
  }

  exitNavigationMode() {
    this.interaction.exitNavigationMode();
  }

  // Context Menus
  onMapRightClick(event: MouseEvent) {
    this.menus.handleMapRightClick(event);
  }

  onStarRightClick(event: MouseEvent, star: Star) {
    this.menus.showPlanetMenu(event, star);
  }

  onFleetRightClick(event: MouseEvent, fleet: Fleet) {
    this.menus.showFleetMenu(event, fleet);
  }

  closeContextMenus(closeAll = true) {
    this.menus.closeMenus(closeAll);
  }

  onViewPlanet(starId: string) {
    this.menus.handleStarView(starId);
  }

  onSendFleetToStar(star: Star) {
    this.menus.handleSendFleetToStar(star, this.state.selectedFleetId());
  }

  onViewFleet(fleetId: string) {
    this.menus.handleFleetView(fleetId);
  }

  onColonize(fleetId: string) {
    this.menus.handleColonizeFleet(fleetId);
  }

  onLoadCargo(fleetId: string) {
    this.menus.handleLoadCargo(fleetId);
  }

  onUnloadCargo(fleetId: string) {
    this.menus.handleUnloadCargo(fleetId);
  }

  onDecommission(fleetId: string) {
    this.menus.handleDecommission(fleetId);
  }
}
