import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { SettingsService } from '../../services/settings.service';
import { Star, Planet, Fleet } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { PlanetContextMenuComponent } from '../../components/planet-context-menu.component';
import { FleetContextMenuComponent } from '../../components/fleet-context-menu.component';
import { GalaxyStarComponent } from './components/galaxy-star.component';
import { GalaxyFleetComponent } from './components/galaxy-fleet.component';
import { GalaxyMapControlsComponent } from './components/galaxy-map-controls.component';
import { GalaxyMapSettingsComponent } from './components/galaxy-map-settings.component';

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
          (mousedown)="startPan($event)"
          (mousemove)="pan($event)"
          (mouseup)="endPan()"
          (mouseleave)="endPan()"
          (touchstart)="startTouch($event)"
          (touchmove)="moveTouch($event)"
          (touchend)="endTouch()"
          (wheel)="onWheel($event)"
          (click)="closeContextMenus()"
        >
          <svg
            #galaxySvg
            [attr.viewBox]="'0 0 1000 1000'"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;height:100%;touch-action:none"
            (contextmenu)="onMapRightClick($event, galaxySvg)"
          >
            <g [attr.transform]="transformString()">
              <!-- Scanner Ranges -->
              @if (settings.showScannerRanges()) {
                @for (range of scannerRanges(); track $index) {
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
                @for (range of cloakedRanges(); track $index) {
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
              @for (fleet of filteredFleets(); track fleet.id) {
                @if (fleet.location.type === 'orbit') {
                  @if (fleetOrbitPosition(fleet); as pos) {
                    <g
                      app-galaxy-fleet
                      [fleet]="fleet"
                      [position]="pos"
                      [isOrbit]="true"
                      (fleetClick)="onFleetClick(fleet, $event)"
                      (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                      (fleetContext)="onFleetRightClick($event, fleet.id)"
                    ></g>
                  }
                } @else {
                  <!-- Space fleet -->
                  <g
                    app-galaxy-fleet
                    [fleet]="fleet"
                    [position]="getSpaceFleetPos(fleet)"
                    [isOrbit]="false"
                    (fleetClick)="onFleetClick(fleet, $event)"
                    (fleetDoubleClick)="onFleetDoubleClick(fleet, $event)"
                    (fleetContext)="onFleetRightClick($event, fleet.id)"
                  ></g>
                }
              }

              @if (selectedFleetId; as fid) {
                @if (fleetRange(fid); as fr) {
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

              @if (selectedFleetId; as fid) {
                @if (orderDest(fid); as dest) {
                  <line
                    [attr.x1]="fleetPos(fid).x"
                    [attr.y1]="fleetPos(fid).y"
                    [attr.x2]="dest.x"
                    [attr.y2]="dest.y"
                    stroke="#34495e"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events:none"
                  />
                  @for (m of pathMarkersTo(fid, dest); track $index) {
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
                  [scale]="scale()"
                  [isVisible]="visibleStars().has(star.id)"
                  (starClick)="onStarClick(star, $event)"
                  (starDoubleClick)="onStarDoubleClick(star, $event)"
                  (starContext)="onStarRightClick($event, star)"
                ></g>
              }

              @if (selectedStar && selectedFleetId; as fid) {
                @if (pathMarkers(fid, selectedStar); as marks) {
                  <line
                    [attr.x1]="fleetPos(fid).x"
                    [attr.y1]="fleetPos(fid).y"
                    [attr.x2]="selectedStar.position.x"
                    [attr.y2]="selectedStar.position.y"
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
              (zoomIn)="zoomIn()"
              (zoomOut)="zoomOut()"
              (pan)="panArrow($event.x, $event.y)"
              (reset)="resetView()"
            ></app-galaxy-map-controls>
          }
        </section>

        <!-- Context Menus -->
        <app-planet-context-menu
          [visible]="planetContextMenu().visible"
          [x]="planetContextMenu().x"
          [y]="planetContextMenu().y"
          [star]="planetContextMenu().star"
          [selectedFleet]="getSelectedFleet()"
          [canSendFleet]="planetContextMenu().star ? canTravelTo(planetContextMenu().star!) : false"
          (close)="closeContextMenus()"
          (viewPlanet)="onContextMenuViewPlanet($event)"
          (sendFleetToStar)="onContextMenuSendFleet($event)"
        />

        <app-fleet-context-menu
          [visible]="fleetContextMenu().visible"
          [x]="fleetContextMenu().x"
          [y]="fleetContextMenu().y"
          [fleet]="fleetContextMenu().fleet"
          [clickedPosition]="fleetContextMenu().position"
          [isFleetSelected]="selectedFleetId !== null"
          (close)="closeContextMenus()"
          (viewFleet)="onContextMenuViewFleet($event)"
          (addWaypoint)="onContextMenuAddWaypoint($event)"
          (moveToPosition)="onContextMenuMoveToPosition($event)"
        />
      } @else {
        <section style="padding:var(--space-lg);display:grid;place-items:center;height:70vh">
          <div
            class="card"
            style="display:grid;gap:var(--space-lg);justify-items:center;text-align:center;max-width:400px"
          >
            <h2>No game loaded</h2>
            <p class="text-muted">Start a new game to generate a galaxy and begin your conquest.</p>
            <button (click)="newGame()" class="btn-primary">Start New Game</button>
          </div>
        </section>
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

  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;
  selectedStar: Star | null = null;
  selectedFleetId: string | null = null;

  // Visibility Logic
  visibleStars = computed(() => {
    const stars = this.stars();
    const player = this.gs.player();
    if (!player) return new Set<string>();

    const visibleIds = new Set<string>();
    const game = this.gs.game();

    // 1. All stars with owned planets are visible
    for (const star of stars) {
      if (star.planets.some((p) => p.ownerId === player.id)) {
        visibleIds.add(star.id);
      }
    }

    // 2. Calculate scanner sources
    const scanners: { x: number; y: number; r: number }[] = [];

    // Planet Scanners
    for (const star of stars) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          scanners.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner, // Range is now stored directly in p.scanner
          });
        }
      }
    }

    // Fleet Scanners
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.getFleetPosition(f);
            if (pos) {
              scanners.push({ ...pos, r: caps.scanRange });
            }
          }
        }
      }
    }

    // 3. Check visibility for all stars
    for (const star of stars) {
      if (visibleIds.has(star.id)) continue; // Already visible

      for (const scanner of scanners) {
        if (this.getDistance(star.position, scanner) <= scanner.r) {
          visibleIds.add(star.id);
          break;
        }
      }
    }

    return visibleIds;
  });

  // Scanner Range Visualization
  scannerRanges = computed(() => {
    if (!this.settings.showScannerRanges()) return [];

    const ranges: { x: number; y: number; r: number; type: 'planet' | 'fleet' }[] = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.stars()) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          ranges.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner * rangePct,
            type: 'planet',
          });
        }
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.scanRange > 0) {
            const pos = this.getFleetPosition(f);
            if (pos) {
              ranges.push({
                x: pos.x,
                y: pos.y,
                r: caps.scanRange * rangePct,
                type: 'fleet',
              });
            }
          }
        }
      }
    }
    return ranges;
  });

  cloakedRanges = computed(() => {
    if (!this.settings.showScannerRanges() || !this.settings.showCloakedRanges()) return [];

    const ranges: { x: number; y: number; r: number; type: 'planet' | 'fleet' }[] = [];
    const player = this.gs.player();
    if (!player) return ranges;

    const rangePct = this.settings.scannerRangePct() / 100;

    // Planets
    for (const star of this.stars()) {
      for (const p of star.planets) {
        if (p.ownerId === player.id && p.scanner > 0) {
          ranges.push({
            x: star.position.x,
            y: star.position.y,
            r: p.scanner * rangePct,
            type: 'planet',
          });
        }
      }
    }

    // Fleets
    const game = this.gs.game();
    if (game && game.fleets) {
      for (const f of game.fleets) {
        if (f.ownerId === player.id) {
          const caps = this.getFleetScanCapabilities(f);
          if (caps.cloakedRange > 0) {
            const pos = this.getFleetPosition(f);
            if (pos) {
              ranges.push({
                x: pos.x,
                y: pos.y,
                r: caps.cloakedRange * rangePct,
                type: 'fleet',
              });
            }
          }
        }
      }
    }
    return ranges;
  });

  getFleetScanCapabilities(fleet: Fleet): { scanRange: number; cloakedRange: number } {
    const designId = fleet.ships[0]?.designId;
    if (!designId) return { scanRange: 0, cloakedRange: 0 };

    // Check custom designs first
    const customDesign = this.gs.game()?.shipDesigns.find((d) => d.id === designId);
    if (customDesign && customDesign.spec) {
      return {
        scanRange: customDesign.spec.scanRange,
        cloakedRange: customDesign.spec.canDetectCloaked ? customDesign.spec.scanRange : 0,
      };
    }

    // Fallback to legacy/compiled designs
    const design = getDesign(designId);
    if (design) {
      return {
        scanRange: design.scannerRange,
        cloakedRange: design.cloakedRange || 0,
      };
    }

    return { scanRange: 0, cloakedRange: 0 };
  }

  getFleetPosition(fleet: Fleet): { x: number; y: number } | null {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    const star = this.stars().find((s) =>
      s.planets.some((p) => p.id === (fleet.location as any).planetId),
    );
    return star ? { x: star.position.x, y: star.position.y } : null;
  }

  getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Zoom & Pan state
  scale = signal(1);
  translateX = signal(0);
  translateY = signal(0);
  isPanning = false;
  panStartClientX = 0;
  panStartClientY = 0;
  panStartTranslateX = 0;
  panStartTranslateY = 0;
  readonly MOUSE_SENSITIVITY = 3;
  lastTouchDistance = 0;

  // Touch state
  touchStartClientX = 0;
  touchStartClientY = 0;
  touchStartTranslateX = 0;
  touchStartTranslateY = 0;
  readonly TOUCH_SENSITIVITY = 2.5;

  // Context menu state
  planetContextMenu = signal<{ visible: boolean; x: number; y: number; star: Star | null }>({
    visible: false,
    x: 0,
    y: 0,
    star: null,
  });
  fleetContextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
    fleet: Fleet | null;
    position: { x: number; y: number } | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    fleet: null,
    position: null,
  });

  // Touch & hold support
  touchHoldTimer: any = null;
  touchHoldStartPos: { x: number; y: number } | null = null;

  ngOnInit() {
    // Check for query params to center on a specific planet
    this.route.queryParams.subscribe((params) => {
      const planetId = params['planetId'];
      if (planetId) {
        const star = this.stars().find((s) => s.planets.some((p) => p.id === planetId));
        if (star) {
          this.centerOnStar(star);
          this.selectedStar = star;
          return;
        }
      }

      // Default behavior: center on home star if no specific planet requested
      const stars = this.stars();
      const homeStar = stars.find((s) => s.planets.some((p) => p.ownerId === this.gs.player()?.id));
      if (homeStar) {
        this.centerOnStar(homeStar);
      }
    });
  }

  private centerOnStar(star: Star) {
    this.scale.set(2);
    // Center on star. ViewBox is 1000x1000. Center is 500,500.
    // ScreenX = TranslateX + WorldX * Scale
    // 500 = TranslateX + star.position.x * Scale
    // TranslateX = 500 - star.position.x * Scale
    this.translateX.set(500 - star.position.x * 2); // Scale is 2
    this.translateY.set(500 - star.position.y * 2);
  }

  getPlanetDetails(star: Star): {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
    surfaceIronium: number;
    surfaceBoronium: number;
    surfaceGermanium: number;
    maxPop: string;
    pop: number;
    owner: string;
    hab: number;
  } | null {
    const p = star.planets[0];
    if (!p) return null;
    return {
      resources: p.resources,
      ironium: p.mineralConcentrations.ironium,
      boranium: p.mineralConcentrations.boranium,
      germanium: p.mineralConcentrations.germanium,
      surfaceIronium: p.surfaceMinerals.ironium,
      surfaceBoronium: p.surfaceMinerals.boranium,
      surfaceGermanium: p.surfaceMinerals.germanium,
      maxPop: (p.maxPopulation / 1_000_000).toFixed(1),
      pop: p.population,
      owner: p.ownerId === this.gs.player()?.id ? 'You' : p.ownerId ? 'Enemy' : 'Unowned',
      hab: this.gs.habitabilityFor(p.id),
    };
  }

  transformString() {
    return `translate(${this.translateX()} ${this.translateY()}) scale(${this.scale()})`;
  }

  getSpaceFleetPos(fleet: Fleet): { x: number; y: number } {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    return { x: 0, y: 0 };
  }

  // Zoom Logic
  zoomIn() {
    this.scale.update((s) => Math.min(s * 1.2, 5));
  }

  zoomOut() {
    this.scale.update((s) => Math.max(s / 1.2, 0.5));
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -1;
    const factor = 1.1;

    // Get cursor position relative to the container
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const oldScale = this.scale();
    let newScale = oldScale;

    if (delta > 0) {
      newScale = Math.min(oldScale * factor, 5);
    } else {
      newScale = Math.max(oldScale / factor, 0.5);
    }

    if (newScale !== oldScale) {
      // Calculate how much the view shifts to keep cursor point fixed
      // The logic is: (cursor - translate) / scale = worldPoint
      // newTranslate = cursor - worldPoint * newScale
      // So: newTranslate = cursor - ((cursor - oldTranslate) / oldScale) * newScale

      const worldX = (cursorX - this.translateX()) / oldScale;
      const worldY = (cursorY - this.translateY()) / oldScale;

      this.scale.set(newScale);
      this.translateX.set(cursorX - worldX * newScale);
      this.translateY.set(cursorY - worldY * newScale);
    }
  }

  // Pan Logic
  startPan(event: MouseEvent) {
    if (event.button === 1) {
      // Middle click
      event.preventDefault();
      this.isPanning = true;
      this.panStartClientX = event.clientX;
      this.panStartClientY = event.clientY;
      this.panStartTranslateX = this.translateX();
      this.panStartTranslateY = this.translateY();
    }
  }

  pan(event: MouseEvent) {
    if (!this.isPanning) return;
    event.preventDefault();
    const deltaX = event.clientX - this.panStartClientX;
    const deltaY = event.clientY - this.panStartClientY;

    this.translateX.set(this.panStartTranslateX + deltaX * this.MOUSE_SENSITIVITY);
    this.translateY.set(this.panStartTranslateY + deltaY * this.MOUSE_SENSITIVITY);
  }

  endPan() {
    this.isPanning = false;
  }

  panArrow(dx: number, dy: number) {
    this.translateX.update((x) => x - dx); // Move view opposite to direction? No, pan means moving the camera. moving content means +dx moves content right.
    // If arrow is "Right", usually implies camera moves right -> content moves left.
    // But map convention: Right Arrow moves map Viewport Right? No, usually pans map to reveal what's on the right.
    // Let's assume Arrow Right moves content Left (view moves Right).
    // dx=50 means move content -50?
    // Actually, usually arrow keys move the "camera".
    // Let's implement standard "pan map" logic.
    // If I click Right Arrow, I want to see what is to the right. So I should move the content LEFT.
    this.translateX.update((x) => x - dx);
    this.translateY.update((y) => y - dy);
  }

  resetView() {
    this.scale.set(1);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  // Touch Logic
  startTouch(event: TouchEvent) {
    const svgElement = event.currentTarget as unknown as SVGSVGElement;

    if (event.touches.length === 1) {
      this.isPanning = true;
      // Record initial touch position and current translation
      this.touchStartClientX = event.touches[0].clientX;
      this.touchStartClientY = event.touches[0].clientY;
      this.touchStartTranslateX = this.translateX();
      this.touchStartTranslateY = this.translateY();

      // Start touch-and-hold timer for context menu
      this.onTouchHoldStart(event, svgElement);
    } else if (event.touches.length === 2) {
      this.isPanning = false;
      this.lastTouchDistance = this.getTouchDistance(event.touches);
      this.cancelTouchHold();
    }
  }

  moveTouch(event: TouchEvent) {
    event.preventDefault();

    // Check touch-and-hold movement
    this.onTouchHoldMove(event);

    if (event.touches.length === 1 && this.isPanning) {
      const deltaX = event.touches[0].clientX - this.touchStartClientX;
      const deltaY = event.touches[0].clientY - this.touchStartClientY;

      // Apply sensitivity multiplier to the delta
      this.translateX.set(this.touchStartTranslateX + deltaX * this.TOUCH_SENSITIVITY);
      this.translateY.set(this.touchStartTranslateY + deltaY * this.TOUCH_SENSITIVITY);
    } else if (event.touches.length === 2) {
      const dist = this.getTouchDistance(event.touches);
      const factor = dist / this.lastTouchDistance;
      this.scale.update((s) => Math.min(Math.max(s * factor, 0.5), 5));
      this.lastTouchDistance = dist;
    }
  }

  endTouch() {
    this.isPanning = false;
    this.onTouchHoldEnd();
  }

  private getTouchDistance(touches: TouchList): number {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  }

  newGame() {
    this.router.navigateByUrl('/');
  }

  openFirstPlanet(star: Star) {
    const p = star.planets.find((pl) => pl.ownerId === this.gs.player()?.id) ?? star.planets[0];
    if (p) {
      this.router.navigateByUrl(`/planet/${p.id}`);
    }
  }
  openPlanet(id: string) {
    this.router.navigateByUrl(`/planet/${id}`);
  }

  endTurn() {
    this.gs.endTurn();
  }

  isIsolated(star: Star): boolean {
    return false;
  }

  openFleet(id: string) {
    this.router.navigateByUrl(`/fleet/${id}`);
  }
  // Removed selectFleet as it is replaced by onFleetClick
  selectFleet(id: string) {
    this.selectedFleetId = id;
  }

  filteredFleets = computed(() => {
    const fleets = this.gs.game()?.fleets ?? [];
    const player = this.gs.player();
    if (!player) return [];

    const filter = this.settings.fleetFilter();
    const enemyOnly = this.settings.showEnemyFleets();

    return fleets.filter((f) => {
      // Must have ships
      if (f.ships.reduce((sum: number, s: any) => sum + s.count, 0) <= 0) return false;

      // Enemy filter
      if (enemyOnly && f.ownerId === player.id) return false;

      // Type filter
      if (filter === 'all') return true;

      const design = getDesign(f.ships[0].designId);
      if (!design) return false;

      switch (filter) {
        case 'warship':
          return design.firepower > 0;
        case 'colonizer':
          return design.colonyModule;
        case 'miner':
          // Check components for mining capability since miningRate might be missing on CompiledDesign
          return design.components.some((c) => c.name.toLowerCase().includes('min'));
        case 'freighter':
          return design.cargoCapacity > 0 && design.firepower === 0 && !design.colonyModule;
        case 'scout':
          return design.scannerRange > 0 && design.firepower === 0 && design.cargoCapacity < 500;
        default:
          return true;
      }
    });
  });

  planetPos(planetId: string): { x: number; y: number } {
    const star = this.stars().find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  lastClickTime = 0;
  lastClickedId = '';

  onStarClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    const now = Date.now();
    const isDoubleTap = this.selectedStar === star && now - this.lastClickTime < 300;

    this.selectedStar = star;
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
    const isDoubleTap = this.selectedFleetId === fleet.id && now - this.lastClickTime < 300;

    this.selectedFleetId = fleet.id;
    this.lastClickTime = now;

    if (isDoubleTap) {
      this.openFleet(fleet.id);
    }
  }

  onFleetDoubleClick(fleet: Fleet, event: MouseEvent) {
    event.stopPropagation();
    this.openFleet(fleet.id);
  }

  planetOwner(ownerId: string | null): string {
    if (!ownerId) return 'Unowned';
    return ownerId === this.gs.player()?.id ? 'You' : 'Enemy';
  }
  fleetsAtStar(star: Star) {
    const ids = star.planets.map((p) => p.id);
    const fleets = this.gs.game()?.fleets ?? [];
    return fleets.filter((f) => f.location.type === 'orbit' && ids.includes(f.location.planetId));
  }
  totalShips(fleet: any): number {
    return fleet.ships.reduce((sum: number, s: any) => sum + s.count, 0);
  }
  fleetOrbitPosition(fleet: any): { x: number; y: number } | null {
    if (fleet.location.type !== 'orbit') return null;
    const star = this.stars().find((s) => s.planets.some((p) => p.id === fleet.location.planetId));
    if (!star) return null;
    const fleets = this.fleetsAtStar(star);
    const idx = fleets.findIndex((f) => f.id === fleet.id);
    const total = fleets.length || 1;
    const angle = (Math.PI * 2 * idx) / total;
    const radius = 18;
    return {
      x: star.position.x + Math.cos(angle) * radius,
      y: star.position.y + Math.sin(angle) * radius,
    };
  }
  fleetRange(id: string): { x: number; y: number; oneWay: number; roundTrip: number } | null {
    const game = this.gs.game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return null;
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass = Math.max(1, totalMass);
    // Cargo mass: minerals + colonists (1 kT per 1000)
    totalMass +=
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      fleet.cargo.colonists;
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = worstEfficiency / 100;
    const perLy =
      worstEfficiency === 0 ? 0 : Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
    const oneWay = perLy === 0 ? 1000 : fleet.fuel / perLy;
    const roundTrip = perLy === 0 ? 500 : fleet.fuel / perLy / 2;
    if (fleet.location.type === 'orbit') {
      const pos = this.planetPos(fleet.location.planetId);
      return { x: pos.x, y: pos.y, oneWay, roundTrip };
    } else {
      return { x: fleet.location.x, y: fleet.location.y, oneWay, roundTrip };
    }
  }
  fleetPos(id: string): { x: number; y: number } {
    const game = this.gs.game();
    if (!game) return { x: 0, y: 0 };
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return { x: 0, y: 0 };
    if (fleet.location.type === 'orbit') return this.planetPos(fleet.location.planetId);
    return { x: fleet.location.x, y: fleet.location.y };
  }
  orderDest(id: string): { x: number; y: number } | null {
    const game = this.gs.game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === id);
    const ord = fleet?.orders[0];
    if (!ord || ord.type !== 'move') return null;
    return ord.destination;
  }
  canTravelTo(star: Star): boolean {
    const fr = this.selectedFleetId ? this.fleetRange(this.selectedFleetId) : null;
    if (!fr) return false;
    const pos = this.fleetPos(this.selectedFleetId!);
    const dist = Math.hypot(star.position.x - pos.x, star.position.y - pos.y);
    return dist <= fr.oneWay;
  }
  travelTo(star: Star) {
    const game = this.gs.game();
    if (!game || !this.selectedFleetId) return;
    this.gs.issueFleetOrder(this.selectedFleetId, { type: 'move', destination: star.position });
    this.selectedFleetId = null;
    this.selectedStar = null;
  }
  pathMarkers(fid: string, star: Star): Array<{ x: number; y: number }> {
    const game = this.gs.game();
    if (!game) return [];
    const fleet = game.fleets.find((f) => f.id === fid);
    if (!fleet) return [];
    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const perTurnDistance = maxWarp * 20;
    const start = this.fleetPos(fid);
    const end = star.position;
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    if (dist === 0) return [];
    const steps = Math.floor(dist / perTurnDistance);
    const marks: Array<{ x: number; y: number }> = [];
    for (let i = 1; i <= steps; i++) {
      const ratio = (perTurnDistance * i) / dist;
      marks.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      });
    }
    return marks;
  }
  pathMarkersTo(fid: string, dest: { x: number; y: number }): Array<{ x: number; y: number }> {
    const game = this.gs.game();
    if (!game) return [];
    const fleet = game.fleets.find((f) => f.id === fid);
    if (!fleet) return [];
    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const perTurnDistance = maxWarp * 20;
    const start = this.fleetPos(fid);
    const end = dest;
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    if (dist === 0) return [];
    const steps = Math.floor(dist / perTurnDistance);
    const marks: Array<{ x: number; y: number }> = [];
    for (let i = 1; i <= steps; i++) {
      const ratio = (perTurnDistance * i) / dist;
      marks.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      });
    }
    return marks;
  }

  // Context menu handlers
  onStarRightClick(event: MouseEvent, star: Star) {
    event.preventDefault();
    event.stopPropagation();
    this.closeContextMenus();
    this.planetContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      star,
    });
  }

  onFleetRightClick(event: MouseEvent, fleetId: string) {
    event.preventDefault();
    event.stopPropagation();
    const game = this.gs.game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet) return;

    this.closeContextMenus();
    this.fleetContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleet,
      position: null,
    });
  }

  onMapRightClick(event: MouseEvent, svgElement: any) {
    event.preventDefault();
    event.stopPropagation();

    // Only show fleet context menu if a fleet is selected
    if (!this.selectedFleetId) return;

    const worldPos = this.screenToWorld(event.clientX, event.clientY, svgElement as SVGSVGElement);
    this.closeContextMenus();
    this.fleetContextMenu.set({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      fleet: null,
      position: worldPos,
    });
  }

  screenToWorld(
    screenX: number,
    screenY: number,
    svgElement: SVGSVGElement,
  ): { x: number; y: number } {
    const rect = svgElement.getBoundingClientRect();
    const viewBoxX = screenX - rect.left;
    const viewBoxY = screenY - rect.top;

    // Apply inverse transform
    const worldX = (viewBoxX - this.translateX()) / this.scale();
    const worldY = (viewBoxY - this.translateY()) / this.scale();

    return { x: worldX, y: worldY };
  }

  closeContextMenus() {
    this.planetContextMenu.update((m) => ({ ...m, visible: false }));
    this.fleetContextMenu.update((m) => ({ ...m, visible: false }));
  }

  onContextMenuViewPlanet(planetId: string) {
    this.openPlanet(planetId);
  }

  onContextMenuSendFleet(star: Star) {
    if (!this.selectedFleetId) return;
    this.travelTo(star);
  }

  onContextMenuViewFleet(fleetId: string) {
    this.openFleet(fleetId);
  }

  onContextMenuAddWaypoint(position: { x: number; y: number }) {
    if (!this.selectedFleetId) return;
    // Add waypoint by appending a move order to the fleet's order list
    const game = this.gs.game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === this.selectedFleetId);
    if (!fleet) return;

    fleet.orders.push({ type: 'move', destination: position });
  }

  onContextMenuMoveToPosition(position: { x: number; y: number }) {
    if (!this.selectedFleetId) return;
    this.gs.issueFleetOrder(this.selectedFleetId, { type: 'move', destination: position });
  }

  getSelectedFleet(): Fleet | null {
    if (!this.selectedFleetId) return null;
    const game = this.gs.game();
    if (!game) return null;
    return game.fleets.find((f) => f.id === this.selectedFleetId) || null;
  }

  // Touch and hold support
  onTouchHoldStart(event: TouchEvent, svgElement: SVGSVGElement) {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.touchHoldStartPos = { x: touch.clientX, y: touch.clientY };

    this.touchHoldTimer = setTimeout(() => {
      if (!this.touchHoldStartPos) return;

      // Simulate right-click at touch position
      if (this.selectedFleetId) {
        const worldPos = this.screenToWorld(
          this.touchHoldStartPos.x,
          this.touchHoldStartPos.y,
          svgElement,
        );
        this.closeContextMenus();
        this.fleetContextMenu.set({
          visible: true,
          x: this.touchHoldStartPos.x,
          y: this.touchHoldStartPos.y,
          fleet: null,
          position: worldPos,
        });
      }

      this.touchHoldStartPos = null;
    }, 500); // 500ms hold to trigger context menu
  }

  onTouchHoldMove(event: TouchEvent) {
    // If touch moves too much, cancel the hold
    if (!this.touchHoldStartPos || event.touches.length !== 1) {
      this.cancelTouchHold();
      return;
    }

    const touch = event.touches[0];
    const dx = touch.clientX - this.touchHoldStartPos.x;
    const dy = touch.clientY - this.touchHoldStartPos.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 10) {
      this.cancelTouchHold();
    }
  }

  onTouchHoldEnd() {
    this.cancelTouchHold();
  }

  cancelTouchHold() {
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
    this.touchHoldStartPos = null;
  }
}
