import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { SettingsService } from '../../services/core/settings.service';
import { LoggingService } from '../../services/core/logging.service';
import { Star, Fleet, FleetOrder, GameState } from '../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../models/fleet-order.constants';
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
import {
  GalaxyWaypointService,
  WaypointSegment,
  SnapTarget,
  FinalizeWaypointResult,
} from './services/waypoints/galaxy-waypoint.service';
import { GALAXY_SIZES } from '../../core/constants/galaxy.constants';
import { getDesign } from '../../data/ships.data';

interface MenuAction {
  action: string;
  available: boolean;
  reason: string;
}

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
  settings = inject(SettingsService);
  private logging = inject(LoggingService);

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

  // Context menu state (UI specific, keeping here)
  planetContextMenu = signal<{ visible: boolean; x: number; y: number; star: Star | null }>({
    visible: false,
    x: 0,
    y: 0,
    star: null,
  });

  fleetContextMenu = signal<{ visible: boolean; x: number; y: number; fleet: Fleet | null }>({
    visible: false,
    x: 0,
    y: 0,
    fleet: null,
  });

  waypointContextMenu = signal<
    | { visible: boolean; x: number; y: number; fleetId: string; orderIndex: number; order: FleetOrder }
    | { visible: false; x: 0; y: 0; fleetId: null; orderIndex: -1; order: null }
  >({
    visible: false,
    x: 0,
    y: 0,
    fleetId: null,
    orderIndex: -1,
    order: null,
  });

  // Touch hold state
  private touchHoldTimer: ReturnType<typeof setTimeout> | undefined;
  private touchHoldStartPos: { x: number; y: number } | null = null;
  private isTouchHolding = false;

  // Waypoint hold state
  private waypointHoldTimer: ReturnType<typeof setTimeout> | undefined;
  private waypointHoldStartPos: { x: number; y: number } | null = null;
  private isWaypointHolding = false;

  // Fleet Drag state
  private pressedFleet: Fleet | null = null;

  // Waypoint Creation State
  readonly draggedWaypoint = this.waypoints.draggedWaypoint;
  readonly snapTarget = this.waypoints.snapTarget;
  readonly navigationModeFleetId = this.waypoints.navigationModeFleetId;
  readonly fleetWaypoints = this.waypoints.fleetWaypoints;

  private potentialDragFleet: Fleet | null = null;
  private potentialDragStart: { x: number; y: number } | null = null;
  private waypointDropScreenPos: { x: number; y: number } | null = null;

  private startDrag(fleet: Fleet) {
    this.waypoints.startDrag(fleet);
    this.state.endPan();
  }

  private longPressTimer: ReturnType<typeof setTimeout> | undefined;
  private isLongPressing = false;
  private longPressStartPos: { x: number; y: number } | null = null;

  ngOnInit() {
    // Check for query params to center on a specific planet or fleet
    this.route.queryParams.subscribe((params) => {
      const planetId = params['planetId'];
      const fleetId = params['fleetId'];

      if (planetId) {
        // planetId is now starId
        const star = this.stars().find((s) => s.id === planetId);
        if (star) {
          this.centerOnStar(star);
          this.state.selectedStarId.set(star.id);
          return;
        }
      }

      if (fleetId) {
        const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
        if (fleet) {
          this.state.selectedFleetId.set(fleet.id);

          if (fleet.location.type === 'orbit') {
            const loc = fleet.location as { starId: string };
            const star = this.stars().find((s) => s.id === loc.starId);
            if (star) {
              this.centerOnStar(star);
            }
          } else {
            const loc = fleet.location as { x: number; y: number };
            this.centerOnPoint(loc.x, loc.y);
          }
          return;
        }
      }

      // Default behavior: center on home star if no specific planet requested
      const stars = this.stars();
      const homeStar = stars.find((s) => s.ownerId === this.gs.player()?.id);
      if (homeStar) {
        this.state.scale.set(6);
        this.centerOnStar(homeStar);
      }
    });
  }

  // Fleet Press Handler
  onFleetDown(event: { originalEvent: MouseEvent | TouchEvent }, fleet: Fleet) {
    if (event.originalEvent instanceof MouseEvent && event.originalEvent.button !== 0) return;

    if (event.originalEvent instanceof MouseEvent) {
      this.potentialDragFleet = fleet;
      this.potentialDragStart = { x: event.originalEvent.clientX, y: event.originalEvent.clientY };
      return;
    }

    const clientX =
      (event.originalEvent as any).clientX || (event.originalEvent as any).touches[0].clientX;
    const clientY =
      (event.originalEvent as any).clientY || (event.originalEvent as any).touches[0].clientY;

    this.potentialDragFleet = fleet;
    this.potentialDragStart = { x: clientX, y: clientY };
    this.isLongPressing = true;
    this.pressedFleet = fleet;
    this.longPressStartPos = { x: clientX, y: clientY };

    this.longPressTimer = setTimeout(() => {
      if (this.isLongPressing) {
        this.startDrag(fleet);
        this.isLongPressing = false; // Reset flag as we are now dragging
        this.pressedFleet = null;
      }
    }, 500);
  }

  // Mouse Handlers
  onMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      // Middle click
      event.preventDefault();
      this.state.startPan(event.clientX, event.clientY);
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.draggedWaypoint()) {
      this.handleMove(event.clientX, event.clientY);
    } else if (this.potentialDragFleet && this.potentialDragStart) {
      const dist = Math.hypot(
        event.clientX - this.potentialDragStart.x,
        event.clientY - this.potentialDragStart.y,
      );
      if (dist > 5) {
        this.startDrag(this.potentialDragFleet);
        this.potentialDragFleet = null;
        this.potentialDragStart = null;
        // Immediately update position
        this.handleMove(event.clientX, event.clientY);
      }
    } else {
      this.checkLongPressMove(event.clientX, event.clientY);
      this.state.pan(event.clientX, event.clientY);
    }
  }

  onMouseUp() {
    this.potentialDragFleet = null;
    this.potentialDragStart = null;
    this.isLongPressing = false;
    clearTimeout(this.longPressTimer);
    this.state.endPan();
    if (this.draggedWaypoint()) {
      this.finalizeWaypoint();
    }
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -1;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.state.handleWheel(delta, event.clientX, event.clientY, rect.left, rect.top);
  }

  // Waypoint Touch Handlers
  onWaypointTouchStart(event: TouchEvent, fleetId: string, waypointIndex: number) {
    event.stopPropagation();
    if (event.touches.length !== 1) return;

    this.isWaypointHolding = true;
    this.waypointHoldStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };

    this.waypointHoldTimer = setTimeout(() => {
      if (this.isWaypointHolding) {
        const mouseEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: event.touches[0].clientX,
          clientY: event.touches[0].clientY,
        } as unknown as MouseEvent;

        this.onWaypointRightClick(mouseEvent, fleetId, waypointIndex);
        this.isWaypointHolding = false;
        this.waypointHoldStartPos = null;
      }
    }, 500);
  }

  onWaypointTouchEnd() {
    this.isWaypointHolding = false;
    this.waypointHoldStartPos = null;
    clearTimeout(this.waypointHoldTimer);
  }

  // Touch Handlers
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.state.startTouch(event.touches[0].clientX, event.touches[0].clientY);

      // Context menu logic
      this.touchHoldStartPos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.isTouchHolding = true;
      this.touchHoldTimer = setTimeout(() => {
        if (this.isTouchHolding) {
          this.onMapRightClick(event as unknown as MouseEvent);
        }
      }, 500);
    } else if (event.touches.length === 2) {
      const svgEl = this.galaxySvg();
      if (svgEl) {
        this.state.startTouchZoom(event.touches, svgEl.nativeElement);
      }
      this.cancelTouchHold();
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    if (this.draggedWaypoint() && event.touches.length === 1) {
      this.handleMove(event.touches[0].clientX, event.touches[0].clientY);
      return;
    }

    if (this.potentialDragFleet && this.potentialDragStart && event.touches.length === 1) {
      const dist = Math.hypot(
        event.touches[0].clientX - this.potentialDragStart.x,
        event.touches[0].clientY - this.potentialDragStart.y,
      );

      if (dist > 5) {
        this.startDrag(this.potentialDragFleet);
        this.potentialDragFleet = null;
        this.potentialDragStart = null;
        this.isLongPressing = false;
        this.pressedFleet = null;
        clearTimeout(this.longPressTimer);

        this.handleMove(event.touches[0].clientX, event.touches[0].clientY);
      }
      return;
    }

    // Check Waypoint Hold
    if (this.isWaypointHolding && this.waypointHoldStartPos) {
      const dist = Math.hypot(
        event.touches[0].clientX - this.waypointHoldStartPos.x,
        event.touches[0].clientY - this.waypointHoldStartPos.y,
      );
      if (dist > 10) {
        this.isWaypointHolding = false;
        clearTimeout(this.waypointHoldTimer);
      }
      return;
    }

    if (this.isTouchHolding && this.touchHoldStartPos) {
      const dist = Math.hypot(
        event.touches[0].clientX - this.touchHoldStartPos.x,
        event.touches[0].clientY - this.touchHoldStartPos.y,
      );
      if (dist > 20) {
        this.cancelTouchHold();
      }
    }

    if (this.isWaypointHolding && this.waypointHoldStartPos) {
      const dist = Math.hypot(
        event.touches[0].clientX - this.waypointHoldStartPos.x,
        event.touches[0].clientY - this.waypointHoldStartPos.y,
      );
      if (dist > 20) {
        this.cancelWaypointHold();
      }
    }

    if (event.touches.length === 1) {
      this.checkLongPressMove(event.touches[0].clientX, event.touches[0].clientY);
    }

    if (event.touches.length === 1) {
      this.state.moveTouchPan(event.touches[0].clientX, event.touches[0].clientY);
    } else if (event.touches.length === 2) {
      this.state.moveTouchZoom(event.touches);
    }
  }

  onTouchEnd() {
    this.state.endTouch();
    this.cancelTouchHold();
    this.cancelWaypointHold();

    this.potentialDragFleet = null;
    this.potentialDragStart = null;
    this.isLongPressing = false;
    this.pressedFleet = null;
    clearTimeout(this.longPressTimer);
    if (this.draggedWaypoint()) {
      this.finalizeWaypoint();
    }
  }

  private cancelTouchHold() {
    this.isTouchHolding = false;
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = undefined;
    }
    this.touchHoldStartPos = null;
  }

  private cancelWaypointHold() {
    this.isWaypointHolding = false;
    if (this.waypointHoldTimer) {
      clearTimeout(this.waypointHoldTimer);
      this.waypointHoldTimer = undefined;
    }
    this.waypointHoldStartPos = null;
  }

  checkLongPressMove(clientX: number, clientY: number) {
    if (this.isLongPressing && this.longPressStartPos) {
      const dist = Math.hypot(
        clientX - this.longPressStartPos.x,
        clientY - this.longPressStartPos.y,
      );
      if (dist > 20) {
        this.isLongPressing = false;
        clearTimeout(this.longPressTimer);
      }
    }
  }

  handleMove(clientX: number, clientY: number) {
    const svg = this.galaxySvg()?.nativeElement;
    const group = this.worldGroup()?.nativeElement;
    if (!svg || !group) return;

    // Use SVG matrix transformation for robust screen-to-world conversion
    // This handles viewBox, preserveAspectRatio, and current zoom/pan transform
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    const ctm = group.getScreenCTM();
    if (!ctm) return;

    const inverse = ctm.inverse();
    const worldPt = pt.matrixTransform(inverse);
    const worldX = worldPt.x;
    const worldY = worldPt.y;

    this.waypointDropScreenPos = { x: clientX, y: clientY };

    this.waypoints.updateDragPosition(worldX, worldY);
    const snap = this.waypoints.checkSnap(worldX, worldY, this.state.scale());
    this.logSnapCheck(worldX, worldY, snap);
  }

  finalizeWaypoint() {
    const result = this.waypoints.finalizeWaypoint();
    this.handleWaypointFinalizeResult(result);
  }

  private handleWaypointFinalizeResult(result: FinalizeWaypointResult | null) {
    if (result && this.waypointDropScreenPos) {
      this.closeContextMenus(false);
      this.waypointContextMenu.set({
        visible: true,
        x: this.waypointDropScreenPos.x,
        y: this.waypointDropScreenPos.y,
        fleetId: result.fleetId,
        orderIndex: result.orderIndex,
        order: result.order,
      });
    }

    this.waypointDropScreenPos = null;
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
      this.openFirstPlanet(star);
    }
  }

  onStarDoubleClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    this.openFirstPlanet(star);
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
  openFirstPlanet(star: Star) {
    // In the merged model, star IS the planet
    this.router.navigateByUrl(`/planet/${star.id}`);
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

  // Waypoint Interaction
  onWaypointDown(event: MouseEvent | TouchEvent, fleetId: string, orderIndex: number) {
    event.stopPropagation();

    // Log waypoint selection
    this.logWaypointSelection(fleetId, orderIndex, event);

    // Handle touch long press for context menu
    if (window.TouchEvent && event instanceof TouchEvent) {
      const touch = event.touches[0];
      this.waypointHoldStartPos = { x: touch.clientX, y: touch.clientY };
      this.isWaypointHolding = true;

      this.waypointHoldTimer = setTimeout(() => {
        if (this.isWaypointHolding) {
          // Create a fake MouseEvent for onWaypointRightClick
          const fakeEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            clientX: touch.clientX,
            clientY: touch.clientY,
          } as unknown as MouseEvent;
          this.onWaypointRightClick(fakeEvent, fleetId, orderIndex);
          this.isWaypointHolding = false; // Reset after triggering
        }
      }, 500);
    }
  }

  onWaypointRightClick(event: MouseEvent, fleetId: string, orderIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (!fleet || !fleet.orders || !fleet.orders[orderIndex]) return;

    this.waypointContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleetId,
      orderIndex: orderIndex,
      order: fleet.orders[orderIndex],
    });
    this.logMenuOpen('waypoint', {
      reason: 'right-click',
      fleetId,
      orderIndex,
      order: fleet.orders[orderIndex],
    });

    this.closeContextMenus(false);
  }

  onWaypointClick(event: MouseEvent, fleetId: string, order: FleetOrder) {
    event.stopPropagation();
    event.preventDefault();

    // Find the actual index of this order in the fleet's orders
    const fleet = this.gs.game()?.fleets.find((f) => f.id === fleetId);
    if (!fleet || !fleet.orders) return;

    const index = fleet.orders.indexOf(order);
    if (index === -1) return;

    this.waypointContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleetId,
      orderIndex: index,
      order,
    });
    this.logMenuOpen('waypoint', {
      reason: 'click',
      fleetId,
      orderIndex: index,
      order,
    });

    this.closeContextMenus(false); // Close others but keep this one
  }

  onDeleteWaypoint() {
    const ctx = this.waypointContextMenu();
    if (ctx.visible && ctx.fleetId && ctx.orderIndex >= 0) {
      this.waypoints.deleteWaypoint(ctx.fleetId, ctx.orderIndex);
    }
    this.closeContextMenus();
  }

  onMoveWaypoint() {
    const ctx = this.waypointContextMenu();
    if (ctx.visible && ctx.fleetId && ctx.orderIndex >= 0) {
      this.waypoints.moveWaypoint(ctx.fleetId, ctx.orderIndex);
    }
    this.closeContextMenus();
  }

  readonly canColonizeWaypoint = computed(() => {
    const ctx = this.waypointContextMenu();
    if (!ctx.visible || !ctx.fleetId || !ctx.order) return false;

    const game = this.gs.game();
    if (!game) return false;

    const fleet = game.fleets.find((f) => f.id === ctx.fleetId);
    if (!fleet) return false;

    const order = ctx.order;
    let targetStarId: string | undefined;

    if (order.type === FLEET_ORDER_TYPE.ORBIT || order.type === FLEET_ORDER_TYPE.COLONIZE) {
      targetStarId = order.starId;
    } else if (order.type === FLEET_ORDER_TYPE.MOVE && order.destination) {
      const threshold = 10 / this.state.scale();
      targetStarId = this.findClosestStar(order.destination.x, order.destination.y, threshold);
    }

    const hasColonyModule = this.hasColonyShipForFleet(game, fleet);
    const canColonize = !!targetStarId && hasColonyModule;

    let targetStarName: string | undefined;

    if (targetStarId) {
      const star = this.stars().find((s) => s.id === targetStarId);
      if (star) {
        targetStarName = star.name;
      }
    }

    if (this.settings.developerMode()) {
      this.logging.debug('Colonize check', {
        service: 'GalaxyMap',
        operation: 'canColonizeWaypoint',
        additionalData: {
          fleetId: ctx.fleetId,
          hasColonyModule,
          orderType: order.type,
          orderDest: order.type === FLEET_ORDER_TYPE.MOVE ? order.destination : undefined,
          orderStarId:
            order.type === FLEET_ORDER_TYPE.ORBIT || order.type === FLEET_ORDER_TYPE.COLONIZE
              ? order.starId
              : undefined,
          targetStarId,
          targetStarName,
          canColonize,
        },
      });
    }

    return canColonize;
  });

  onColonizeWaypoint() {
    const ctx = this.waypointContextMenu();
    if (!ctx.visible || !ctx.fleetId || ctx.orderIndex == null || ctx.orderIndex < 0) return;

    const game = this.gs.game();
    if (!game) return;

    const fleet = game.fleets.find((f) => f.id === ctx.fleetId);
    if (!fleet || !fleet.orders) return;

    const order = fleet.orders[ctx.orderIndex];
    let starId: string | undefined;

    if (order.type === FLEET_ORDER_TYPE.ORBIT || order.type === FLEET_ORDER_TYPE.COLONIZE) {
      starId = order.starId;
    } else if (order.type === FLEET_ORDER_TYPE.MOVE && order.destination) {
      const threshold = 10 / this.state.scale();
      starId = this.findClosestStar(order.destination.x, order.destination.y, threshold);
    }

    if (starId) {
      const newOrders = [...fleet.orders];
      // Use orbit order with colonize action to preserve movement semantics/speed if needed
      const existingWarpSpeed = 'warpSpeed' in order ? order.warpSpeed : undefined;
      newOrders[ctx.orderIndex] = {
        type: FLEET_ORDER_TYPE.ORBIT,
        starId,
        warpSpeed: existingWarpSpeed,
        action: 'colonize',
      };
      this.gs.setFleetOrders(ctx.fleetId, newOrders);
      this.closeContextMenus();
    }
  }

  private findClosestStar(x: number, y: number, threshold = 5): string | undefined {
    const stars = this.stars();
    for (const star of stars) {
      const dx = star.position.x - x;
      const dy = star.position.y - y;
      if (dx * dx + dy * dy < threshold * threshold) {
        return star.id;
      }
    }
    return undefined;
  }

  onSetWaypointSpeed() {
    const ctx = this.waypointContextMenu();
    if (ctx.visible && ctx.fleetId && ctx.orderIndex >= 0) {
      this.waypoints.setWaypointSpeed(ctx.fleetId, ctx.orderIndex);
    }
    this.closeContextMenus();
  }

  exitNavigationMode() {
    const result = this.waypoints.exitNavigationMode();
    this.handleWaypointFinalizeResult(result);
  }

  // Context Menus
  onMapRightClick(event: MouseEvent) {
    event.preventDefault();
    this.closeContextMenus();
  }

  onStarRightClick(event: MouseEvent, star: Star) {
    event.preventDefault();
    event.stopPropagation();
    this.planetContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      star: star,
    });
    this.fleetContextMenu.update((v) => ({ ...v, visible: false }));
    this.logMenuOpen('planet', {
      starId: star.id,
      starName: star.name,
      availableActions: this.getPlanetMenuActions(star),
    });
  }

  onFleetRightClick(event: MouseEvent, fleet: Fleet) {
    event.preventDefault();
    event.stopPropagation();
    this.fleetContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleet: fleet,
    });
    this.planetContextMenu.update((v) => ({ ...v, visible: false }));
    this.logMenuOpen('fleet', {
      fleetId: fleet.id,
      fleetName: fleet.name,
      availableActions: this.getFleetMenuActions(fleet),
    });
  }

  private getPlanetMenuActions(_star: Star): MenuAction[] {
    const actions: MenuAction[] = [{ action: 'viewPlanet', available: true, reason: 'Always available' }];

    if (this.state.selectedFleetId()) {
      actions.push({ action: 'sendFleetToStar', available: true, reason: 'Fleet selected' });
    } else {
      actions.push({ action: 'sendFleetToStar', available: false, reason: 'No fleet selected' });
    }
    return actions;
  }

  private getFleetMenuActions(fleet: Fleet): MenuAction[] {
    const actions: MenuAction[] = [
      { action: 'viewFleet', available: true, reason: 'Always available' },
      { action: 'decommission', available: true, reason: 'Always available' },
    ];

    const isOrbit = fleet.location.type === 'orbit';
    if (isOrbit) {
      actions.push({ action: 'loadCargo', available: true, reason: 'In orbit' });
      actions.push({ action: 'unloadCargo', available: true, reason: 'In orbit' });

      // Narrowing to orbit type to access starId
      const loc = fleet.location as { type: 'orbit'; starId: string };
      const hab = this.gs.habitabilityFor(loc.starId);
      if (hab > 0) {
        actions.push({ action: 'colonize', available: true, reason: 'In orbit and habitable' });
      } else {
        actions.push({
          action: 'colonize',
          available: true,
          reason: 'In orbit (warning: inhospitable)',
        });
      }
    } else {
      actions.push({ action: 'loadCargo', available: false, reason: 'Not in orbit' });
      actions.push({ action: 'unloadCargo', available: false, reason: 'Not in orbit' });
      actions.push({ action: 'colonize', available: false, reason: 'Not in orbit' });
    }

    return actions;
  }

  private hasColonyShipForFleet(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const dynamicDesign = game.shipDesigns.find((d) => d.id === s.designId);
      if (dynamicDesign?.spec?.hasColonyModule && s.count > 0) {
        return true;
      }
      const compiled = getDesign(s.designId);
      return !!compiled?.colonyModule && s.count > 0;
    });
  }

  closeContextMenus(closeAll = true) {
    const wasVisible =
      this.planetContextMenu().visible ||
      this.fleetContextMenu().visible ||
      (closeAll && this.waypointContextMenu().visible);

    this.planetContextMenu.update((v) => ({ ...v, visible: false }));
    this.fleetContextMenu.update((v) => ({ ...v, visible: false }));
    if (closeAll) {
      this.waypointContextMenu.update((v) => ({ ...v, visible: false }));
    }

    if (wasVisible && this.settings.developerMode()) {
      this.logging.info('Context menus closed', {
        service: 'GalaxyMap',
        operation: 'MenuClose',
      });
    }
  }

  onViewPlanet(starId: string) {
    this.router.navigateByUrl(`/planet/${starId}`);
    this.closeContextMenus();
  }

  onSendFleetToStar(star: Star) {
    const fid = this.state.selectedFleetId();
    if (fid) {
      this.gs.issueFleetOrder(fid, { type: FLEET_ORDER_TYPE.MOVE, destination: star.position });
    }
    this.closeContextMenus();
  }

  onViewFleet(fleetId: string) {
    this.openFleet(fleetId);
    this.closeContextMenus();
  }

  onColonize(fleetId: string) {
    const game = this.gs.game();
    if (!game) {
      this.closeContextMenus();
      return;
    }
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.closeContextMenus();
      return;
    }
    const starId = fleet.location.starId;
    const hab = this.gs.habitabilityFor(starId);
    if (hab <= 0) {
      const ok = confirm(
        'Warning: This world is inhospitable. Colonists will die each turn. Proceed?',
      );
      if (!ok) {
        this.closeContextMenus();
        return;
      }
    }
    const sid = this.gs.colonizeNow(fleetId);
    if (sid) {
      this.router.navigateByUrl(`/planet/${sid}`);
    } else {
      this.gs.issueFleetOrder(fleetId, { type: FLEET_ORDER_TYPE.COLONIZE, starId });
      this.router.navigateByUrl('/map');
    }
    this.closeContextMenus();
  }

  onLoadCargo(fleetId: string) {
    const game = this.gs.game();
    if (!game) {
      this.closeContextMenus();
      return;
    }
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.closeContextMenus();
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
    this.closeContextMenus();
  }

  onUnloadCargo(fleetId: string) {
    const game = this.gs.game();
    if (!game) {
      this.closeContextMenus();
      return;
    }
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.closeContextMenus();
      return;
    }
    const starId = fleet.location.starId;
    this.gs.unloadCargo(fleetId, starId, {
      ironium: 'all',
      boranium: 'all',
      germanium: 'all',
      colonists: 'all',
    });
    this.closeContextMenus();
  }

  onDecommission(fleetId: string) {
    const game = this.gs.game();
    if (!game) {
      this.closeContextMenus();
      return;
    }
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet) {
      this.closeContextMenus();
      return;
    }
    const name = fleet.name || `Fleet ${fleet.id.slice(-4)}`;
    const ok = confirm(`Decommission ${name}? This will scrap all ships and cargo in this fleet.`);
    if (!ok) {
      this.closeContextMenus();
      return;
    }
    this.gs.decommissionFleet(fleetId);
    this.closeContextMenus();
  }

  // =================================================================================================
  // Debug Logging Implementation
  // =================================================================================================

  private logWaypointSelection(
    fleetId: string,
    orderIndex: number,
    event: MouseEvent | TouchEvent,
  ) {
    if (!this.settings.developerMode()) return;

    const game = this.gs.game();
    if (!game) return;

    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet) return;

    const order = fleet.orders?.[orderIndex];
    const fw = this.fleetWaypoints().find((f) => f.fleetId === fleetId);
    const segment = fw?.segments[orderIndex];

    const metadata = {
      service: 'GalaxyMap',
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
      },
    };

    // Log click coordinates
    let clickX = 0,
      clickY = 0;
    if (event instanceof MouseEvent) {
      clickX = event.clientX;
      clickY = event.clientY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      clickX = event.touches[0].clientX;
      clickY = event.touches[0].clientY;
    }

    this.logging.info('Waypoint selected', {
      ...metadata,
      additionalData: {
        ...metadata.additionalData,
        clickCoordinates: { x: clickX, y: clickY },
        availableActions: this.getWaypointActionsStatus(fleet, order),
      },
    });

    // Dump arrays as requested
    this.dumpWaypointDebugData(fleetId);
  }

  private getWaypointActionsStatus(fleet: Fleet, _order: FleetOrder): MenuAction[] {
    const actions: MenuAction[] = [
      { action: 'move', available: true, reason: 'Always available' },
      { action: 'delete', available: true, reason: 'Always available' },
    ];

    // Check colony module
    const hasColonyModule = fleet.ships.some((s) => {
      const d = this.gs.game()?.shipDesigns.find((sd) => sd.id === s.designId);
      const stock = getDesign(s.designId);
      return d?.spec?.hasColonyModule || stock?.colonyModule;
    });

    if (hasColonyModule) {
      actions.push({ action: 'colonise', available: true, reason: 'Colony module present' });
    } else {
      actions.push({ action: 'colonise', available: false, reason: 'No colony module' });
    }

    return actions;
  }

  private dumpWaypointDebugData(activeFleetId: string) {
    const game = this.gs.game();
    if (!game) return;

    // Waypoint Array
    const waypoints = this.fleetWaypoints().find((f) => f.fleetId === activeFleetId);
    this.logging.debug('Debug: Waypoint Array', {
      service: 'GalaxyMap',
      operation: 'DebugDump',
      additionalData: {
        waypoints: waypoints?.segments.map((s) => ({
          coordinates: { x: s.x2, y: s.y2 },
          type: s.type,
          warning: s.warning,
          distance: s.distance,
        })),
      },
    });

    // Star Coordinate Array (nearby stars)
    const fleet = game.fleets.find((f) => f.id === activeFleetId);
    if (fleet) {
      const pos = this.fleetPositions.fleetPos(fleet.id);
      const nearbyStars = [];
      const threshold = 100; // Arbitrary large range for debug dump

      for (const star of this.stars()) {
        const dist = Math.hypot(star.position.x - pos.x, star.position.y - pos.y);
        if (dist < threshold) {
          nearbyStars.push({
            name: star.name,
            id: star.id,
            coordinates: star.position,
            distance: dist,
            ownerId: star.ownerId,
            selectable: true, // Simplified
          });
        }
      }

      this.logging.debug('Debug: Nearby Stars', {
        service: 'GalaxyMap',
        operation: 'DebugDump',
        additionalData: { stars: nearbyStars },
      });
    }
  }

  private lastSnapLogKey: string | null = null;

  private logSnapCheck(x: number, y: number, snapResult: SnapTarget | null) {
    if (!this.settings.developerMode()) return;

    if (!snapResult) {
      this.lastSnapLogKey = null;
      return;
    }

    const key = `${snapResult.type}:${snapResult.id ?? ''}`;
    if (key === this.lastSnapLogKey) return;
    this.lastSnapLogKey = key;

    this.logging.debug('Waypoint snapped', {
      service: 'GalaxyMap',
      operation: 'SnapCheck',
      additionalData: {
        cursor: { x, y },
        snapTarget: snapResult,
      },
    });
  }

  private logMenuOpen(type: 'waypoint' | 'planet' | 'fleet', context: any) {
    if (!this.settings.developerMode()) return;

    this.logging.info(`Context menu opened: ${type}`, {
      service: 'GalaxyMap',
      operation: 'MenuOpen',
      entityType: type,
      additionalData: context,
    });
  }
}
