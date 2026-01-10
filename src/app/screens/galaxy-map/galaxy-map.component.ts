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
import { GameStateService } from '../../services/game-state.service';
import { SettingsService } from '../../services/settings.service';
import { Star, Fleet } from '../../models/game.model';
import { PlanetContextMenuComponent } from '../../components/planet-context-menu.component';
import { FleetContextMenuComponent } from '../../components/fleet-context-menu.component';
import { GalaxyStarComponent } from './components/galaxy-star.component';
import { GalaxyFleetComponent } from './components/galaxy-fleet.component';
import { GalaxyMapControlsComponent } from './components/galaxy-map-controls.component';
import { GalaxyMapSettingsComponent } from './components/galaxy-map-settings.component';
import { GalaxyMapStateService } from './services/galaxy-map-state.service';
import { GalaxyVisibilityService } from './services/galaxy-visibility.service';
import { GalaxyFleetService } from './services/galaxy-fleet.service';

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
          style="border:1px solid #ccc; position: relative; flex-grow: 1; overflow: hidden;"
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
            [attr.viewBox]="'0 0 2000 2000'"
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
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" result="noise"></feTurbulence>
                <feColorMatrix in="noise" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" result="noiseAlpha"></feColorMatrix>
                <feComposite in="noiseAlpha" in2="SourceGraphic" operator="over"></feComposite>
              </filter>
              <filter id="galaxyNebulaBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="18"></feGaussianBlur>
              </filter>
            </defs>

            <g [attr.transform]="state.transformString()">
              <!-- Background Layer -->
              <rect x="0" y="0" width="2000" height="2000" fill="url(#galaxyBgGradient)"></rect>
              <rect x="0" y="0" width="2000" height="2000" filter="url(#galaxyNoise)" opacity="0.55"></rect>

              <!-- Nebulae -->
              <g style="mix-blend-mode: screen; opacity: 0.9;">
                <circle cx="500" cy="520" r="240" fill="#2b3bff" opacity="0.08" filter="url(#galaxyNebulaBlur)"></circle>
                <circle cx="1840" cy="840" r="320" fill="#ff2bd6" opacity="0.05" filter="url(#galaxyNebulaBlur)"></circle>
                <circle cx="1300" cy="380" r="280" fill="#2bffd5" opacity="0.04" filter="url(#galaxyNebulaBlur)"></circle>
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

              <!-- Draw fleets first so stars remain clickable on top -->
              @for (fleet of fleetService.filteredFleets(); track fleet.id) {
                @if (fleet.location.type === 'orbit') {
                  @if (fleetService.fleetOrbitPosition(fleet); as pos) {
                    <g
                      app-galaxy-fleet
                      [fleet]="fleet"
                      [position]="pos"
                      [isOrbit]="true"
                      (fleetClick)="onFleetClick(fleet, $event)"
                      (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                      (fleetContext)="onFleetRightClick($event, fleet)"
                    ></g>
                  }
                } @else {
                  <!-- Space fleet -->
                  <g
                    app-galaxy-fleet
                    [fleet]="fleet"
                    [position]="fleetService.getSpaceFleetPos(fleet)"
                    [isOrbit]="false"
                    (fleetClick)="onFleetClick(fleet, $event)"
                    (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                    (fleetContext)="onFleetRightClick($event, fleet)"
                  ></g>
                }
              }

              @if (state.selectedFleetId(); as fid) {
                @if (fleetService.fleetRange(fid); as fr) {
                  <circle
                    [attr.cx]="fr.x"
                    [attr.cy]="fr.y"
                    [attr.r]="fr.roundTrip"
                    fill="rgba(46,204,113,0.08)"
                    stroke="#2ecc71"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events: none"
                  />
                  <circle
                    [attr.cx]="fr.x"
                    [attr.cy]="fr.y"
                    [attr.r]="fr.oneWay"
                    fill="rgba(241,196,15,0.06)"
                    stroke="#f1c40f"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events: none"
                  />
                }
              }

              @if (state.selectedFleetId(); as fid) {
                @if (fleetService.orderDest(fid); as dest) {
                  <line
                    [attr.x1]="fleetService.fleetPos(fid).x"
                    [attr.y1]="fleetService.fleetPos(fid).y"
                    [attr.x2]="dest.x"
                    [attr.y2]="dest.y"
                    stroke="#34495e"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events:none"
                  />
                  @for (m of fleetService.pathMarkersTo(fid, dest); track $index) {
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

              <!-- Draw stars on top for clear selection -->
              @for (star of stars(); track star.id) {
                <g
                  app-galaxy-star
                  [star]="star"
                  [scale]="state.scale()"
                  [isVisible]="visibility.visibleStars().has(star.id)"
                  [viewMode]="settings.viewMode()"
                  [showLabels]="settings.showLabels()"
                  [stationName]="fleetService.stationByStarId().get(star.id)"
                  (starClick)="onStarClick(star, $event)"
                  (starDoubleClick)="onStarDoubleClick(star, $event)"
                  (starContext)="onStarRightClick($event, star)"
                ></g>
              }

              @if (selectedStar() && state.selectedFleetId(); as fid) {
                @if (fleetService.pathMarkers(fid, selectedStar()!); as marks) {
                  <line
                    [attr.x1]="fleetService.fleetPos(fid).x"
                    [attr.y1]="fleetService.fleetPos(fid).y"
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
            </g>
          </svg>

          <!-- Overlay Controls -->
          <app-galaxy-map-settings></app-galaxy-map-settings>

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
        ></app-fleet-context-menu>
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

  // Injected Services
  readonly state = inject(GalaxyMapStateService);
  readonly visibility = inject(GalaxyVisibilityService);
  readonly fleetService = inject(GalaxyFleetService);

  // SVG element reference
  readonly galaxySvg = viewChild<ElementRef<SVGSVGElement>>('galaxySvg');

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

  // Touch hold state
  private touchHoldTimer: any;
  private touchHoldStartPos: { x: number; y: number } | null = null;
  private isTouchHolding = false;

  ngOnInit() {
    // Check for query params to center on a specific planet or fleet
    this.route.queryParams.subscribe((params) => {
      const planetId = params['planetId'];
      const fleetId = params['fleetId'];

      if (planetId) {
        const star = this.stars().find((s) => s.planets.some((p) => p.id === planetId));
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
            const loc = fleet.location as { planetId: string };
            const star = this.stars().find((s) => s.planets.some((p) => p.id === loc.planetId));
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
      const homeStar = stars.find((s) => s.planets.some((p) => p.ownerId === this.gs.player()?.id));
      if (homeStar) {
        this.state.scale.set(3.4);
        this.centerOnStar(homeStar);
      }
    });
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
    this.state.pan(event.clientX, event.clientY);
  }

  onMouseUp() {
    this.state.endPan();
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -1;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.state.handleWheel(delta, event.clientX, event.clientY, rect.left, rect.top);
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

    if (this.isTouchHolding && this.touchHoldStartPos) {
      const dist = Math.hypot(
        event.touches[0].clientX - this.touchHoldStartPos.x,
        event.touches[0].clientY - this.touchHoldStartPos.y,
      );
      if (dist > 10) {
        this.cancelTouchHold();
      }
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
  }

  private cancelTouchHold() {
    this.isTouchHolding = false;
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    this.touchHoldStartPos = null;
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
    const p = star.planets.find((pl) => pl.ownerId === this.gs.player()?.id) ?? star.planets[0];
    if (p) {
      this.router.navigateByUrl(`/planet/${p.id}`);
    }
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
  }

  closeContextMenus() {
    this.planetContextMenu.update((v) => ({ ...v, visible: false }));
    this.fleetContextMenu.update((v) => ({ ...v, visible: false }));
  }

  onViewPlanet(planetId: string) {
    this.router.navigateByUrl(`/planet/${planetId}`);
    this.closeContextMenus();
  }

  onSendFleetToStar(star: Star) {
    const fid = this.state.selectedFleetId();
    if (fid) {
      this.gs.issueFleetOrder(fid, { type: 'move', destination: star.position });
      this.state.selectedFleetId.set(null);
      this.state.selectedStarId.set(null);
    }
    this.closeContextMenus();
  }

  onViewFleet(fleetId: string) {
    this.openFleet(fleetId);
    this.closeContextMenus();
  }
}
