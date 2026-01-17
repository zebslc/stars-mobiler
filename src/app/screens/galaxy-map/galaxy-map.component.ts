import type { OnInit, ElementRef } from '@angular/core';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
import { GalaxySelectionService } from './services/galaxy-selection.service';
import { GalaxyNavigationService } from './services/galaxy-navigation.service';
import { GALAXY_SIZES } from '../../core/constants/galaxy.constants';
import { GalaxyMapMenuService } from './services/galaxy-map-menu.service';
import { GalaxyMapInteractionService } from './services/galaxy-map-interaction.service';

@Component({
  standalone: true,
  selector: 'app-galaxy-map',
  styles: [':host { display: flex; flex-direction: column; flex: 1; overflow: hidden; }'],
  templateUrl: './galaxy-map.component.html',
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
  // Core services
  private readonly gs = inject(GameStateService);
  private readonly route = inject(ActivatedRoute);

  // Public services for template binding
  readonly settings = inject(SettingsService);
  readonly menus = inject(GalaxyMapMenuService);
  readonly interaction = inject(GalaxyMapInteractionService);
  readonly state = inject(GalaxyMapStateService);
  readonly visibility = inject(GalaxyVisibilityService);
  readonly fleetFilter = inject(GalaxyFleetFilterService);
  readonly fleetPositions = inject(GalaxyFleetPositionService);
  readonly fleetStations = inject(GalaxyFleetStationService);
  readonly waypoints = inject(GalaxyWaypointService);
  readonly selection = inject(GalaxySelectionService);
  readonly navigation = inject(GalaxyNavigationService);

  // Context menu shortcuts
  readonly planetContextMenu = this.menus.planetMenu;
  readonly fleetContextMenu = this.menus.fleetMenu;
  readonly waypointContextMenu = this.menus.waypointMenu;

  // Galaxy dimensions
  readonly galaxySize = computed(() => {
    const size = this.gs.game()?.settings.galaxySize || 'small';
    return GALAXY_SIZES[size];
  });
  readonly width = computed(() => this.galaxySize().width);
  readonly height = computed(() => this.galaxySize().height);

  // SVG element references
  readonly galaxySvg = viewChild<ElementRef<SVGSVGElement>>('galaxySvg');
  readonly worldGroup = viewChild<ElementRef<SVGGElement>>('worldGroup');

  // Game state shortcuts
  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;

  // Derived state
  readonly selectedStar = computed(() => {
    const id = this.state.selectedStarId();
    return this.stars().find((s) => s.id === id) || null;
  });

  readonly selectedFleet = computed(() => {
    const id = this.state.selectedFleetId();
    if (!id) return null;
    return this.gs.game()?.fleets.find((f) => f.id === id) || null;
  });

  // Waypoint state shortcuts
  readonly draggedWaypoint = this.waypoints.draggedWaypoint;
  readonly snapTarget = this.waypoints.snapTarget;
  readonly navigationModeFleetId = this.waypoints.navigationModeFleetId;
  readonly fleetWaypoints = this.waypoints.fleetWaypoints;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.navigation.handleQueryParamNavigation(params['starId'], params['fleetId']);
    });
  }

  // Mouse/Touch Handlers - delegate to interaction service
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

  // Star Interaction
  onStarClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    const isDoubleTap = this.selection.selectStar(star.id);
    if (isDoubleTap) {
      this.navigation.openStarDetail(star);
    }
  }

  onStarDoubleClick(star: Star, event: MouseEvent) {
    event.stopPropagation();
    this.navigation.openStarDetail(star);
  }

  onStarRightClick(event: MouseEvent, star: Star) {
    this.menus.showPlanetMenu(event, star);
  }

  // Fleet Interaction
  onFleetClick(fleet: Fleet, event: MouseEvent) {
    event.stopPropagation();
    const isDoubleTap = this.selection.selectFleet(fleet.id);
    if (isDoubleTap) {
      this.navigation.openFleet(fleet.id);
    }
  }

  onFleetDoubleClick(fleet: Fleet, event: MouseEvent) {
    event.stopPropagation();
    this.navigation.openFleet(fleet.id);
  }

  onFleetRightClick(event: MouseEvent, fleet: Fleet) {
    this.menus.showFleetMenu(event, fleet);
  }

  onFleetDown(event: { originalEvent: MouseEvent | TouchEvent }, fleet: Fleet) {
    this.interaction.onFleetDown(event, fleet);
  }

  // Waypoint Interaction
  onWaypointDown(event: MouseEvent | TouchEvent, fleetId: string, orderIndex: number) {
    this.interaction.onWaypointDown(event, fleetId, orderIndex);
  }

  onWaypointClick(event: MouseEvent, fleetId: string, order: FleetOrder) {
    this.interaction.onWaypointClick(event, fleetId, order);
  }

  onWaypointRightClick(event: MouseEvent, fleetId: string, orderIndex: number) {
    this.interaction.onWaypointRightClick(event, fleetId, orderIndex);
  }

  onWaypointTouchStart(event: TouchEvent, fleetId: string, waypointIndex: number) {
    this.interaction.onWaypointTouchStart(event, fleetId, waypointIndex);
  }

  onWaypointTouchEnd() {
    this.interaction.onWaypointTouchEnd();
  }

  exitNavigationMode() {
    this.interaction.exitNavigationMode();
  }
}
