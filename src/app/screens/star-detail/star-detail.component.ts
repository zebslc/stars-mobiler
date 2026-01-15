import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { HabitabilityService } from '../../services/colony/habitability.service';
import { ShipyardService } from '../../services/ship-design/shipyard.service';
import { TechService } from '../../services/tech/tech.service';
import { getDesign } from '../../data/ships.data';
import { BUILD_COSTS } from '../../data/costs.data';
import { getHull } from '../../utils/data-access.util';
import { ShipOption } from '../../components/ship-selector.component';
import { StarSummaryComponent } from './components/star-summary.component';
import { StarBuildQueueComponent } from './components/star-build-queue.component';
import { StarFleetListComponent } from './components/star-fleet-list.component';
import { Fleet } from '../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-star-detail',
  imports: [
    CommonModule,
    StarSummaryComponent,
    StarBuildQueueComponent,
    StarFleetListComponent,
  ],
  template: `
    @if (star(); as s) {
      <main class="star-detail-container">
        <!-- Header Section -->
        <div class="star-header">
          <div class="header-top">
            <button (click)="back()" class="btn-small back-btn">← Back</button>
            <div class="star-controls">
              <button class="nav-btn" (click)="prevStar()">Prev</button>
              <button class="nav-btn" (click)="nextStar()">Next</button>
            </div>
          </div>

          <div class="star-info-banner">
            <div class="star-visual" [style.background]="starTexture()"></div>
            <div class="star-text">
              <h2>{{ s.name }}</h2>
              <div class="coords">
                X: {{ getStarCoordinates(s)?.x }} Y: {{ getStarCoordinates(s)?.y }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'status'"
            (click)="activeTab.set('status')"
          >
            Status
          </button>

          @if (s.ownerId === gs.player()?.id) {
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'queue'"
              (click)="activeTab.set('queue')"
            >
              Build Queue
            </button>
          }

          <button
            class="tab-btn"
            [class.active]="activeTab() === 'fleet'"
            (click)="activeTab.set('fleet')"
          >
            Ships
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          @switch (activeTab()) {
            @case ('status') {
              <section class="summary-section">
                <app-star-summary
                  [star]="s"
                  [habitability]="habitability()"
                  [starTexture]="starTexture()"
                  [projectionDelta]="projectionDelta()"
                  [defenseCoverage]="defenseCoverage()"
                  [scannerRange]="scannerRange()"
                  [resourcesPerTurn]="resourcesPerTurn()"
                  [starbase]="starbase()"
                  (onGovernorType)="onGovernorType($event)"
                  (viewStarbase)="onViewStarbase($event)"
                ></app-star-summary>
              </section>
            }
            @case ('queue') {
              @if (s.ownerId === gs.player()?.id) {
                <section>
                  <app-star-build-queue
                    [star]="s"
                    [shipOptions]="shipOptions()"
                    [selectedShipOption]="selectedShipOption()"
                    [buildAmount]="buildAmount()"
                    [shipBuildAmount]="shipBuildAmount()"
                    [shouldShowTerraform]="shouldShowTerraform()"
                    [shouldShowScanner]="shouldShowScanner()"
                    (queue)="queue($event)"
                    (remove)="remove($event)"
                    (setBuildAmount)="setBuildAmount($event)"
                    (setShipBuildAmount)="setShipBuildAmount($event)"
                    (onShipSelected)="onShipSelected($event)"
                  ></app-star-build-queue>
                </section>
              }
            }
            @case ('fleet') {
              <section>
                <app-star-fleet-list
                  [fleets]="fleetsInOrbit()"
                  [starOwnerId]="s.ownerId"
                  (colonize)="colonizeNow($event)"
                ></app-star-fleet-list>
              </section>
            }
          }
        </div>
      </main>
    } @else {
      <main class="error-container">
        <h2>Star not found</h2>
      </main>
    }
  `,
  styleUrl: './star-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly gs = inject(GameStateService);
  private hab = inject(HabitabilityService);
  private shipyardService = inject(ShipyardService);
  private techService = inject(TechService);

  private starIdSignal = signal<string | null>(null);
  activeTab = signal<'status' | 'queue' | 'fleet'>('status');

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.starIdSignal.set(params.get('id'));
      // Reset tab to status when navigating to a new star
      this.activeTab.set('status');
    });
  }

  ngOnInit() {}

  star = computed(() => {
    this.gs.turn();
    const id = this.starIdSignal();
    if (!id) return null;
    const star = this.gs.starIndex().get(id) || null;
    return star ? { ...star } : null;
  });

  getStarCoordinates(star: any) {
    const matchedStar = this.gs.stars().find((s) => s.id === star.id);
    return matchedStar ? matchedStar.position : null;
  }

  prevStar() {
    const currentId = this.starIdSignal();
    const playerStars = this.getPlayerStars();
    if (playerStars.length === 0) return;

    const currentIndex = playerStars.findIndex((star) => star.id === currentId);
    if (currentIndex === -1) {
      this.router.navigate(['/star', playerStars[0].id]);
      return;
    }

    const prevIndex = (currentIndex - 1 + playerStars.length) % playerStars.length;
    this.router.navigate(['/star', playerStars[prevIndex].id]);
  }

  nextStar() {
    const currentId = this.starIdSignal();
    const playerStars = this.getPlayerStars();
    if (playerStars.length === 0) return;

    const currentIndex = playerStars.findIndex((star) => star.id === currentId);
    if (currentIndex === -1) {
      this.router.navigate(['/star', playerStars[0].id]);
      return;
    }

    const nextIndex = (currentIndex + 1) % playerStars.length;
    this.router.navigate(['/star', playerStars[nextIndex].id]);
  }

  private getPlayerStars() {
    const playerId = this.gs.player()?.id;
    if (!playerId) return [];
    return this.gs
      .stars()
      .map((s) => s)
      .filter((star) => star.ownerId === playerId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  resourcesPerTurn = computed(() => {
    const star = this.star();
    if (!star) return 0;
    return Math.min(star.factories, Math.floor(star.population / 10));
  });

  habitability = computed(() => {
    const p = this.star();
    const species = this.gs.playerSpecies();
    if (!p || !species) return 0;
    return this.hab.calculate(p, species);
  });

  starTexture = computed(() => {
    const hab = this.habitability();
    let color1 = '#555'; // Base
    if (hab >= 80)
      color1 = '#2ecc71'; // Lush Green
    else if (hab >= 50)
      color1 = '#27ae60'; // Green
    else if (hab >= 20)
      color1 = '#f1c40f'; // Yellow
    else if (hab > 0)
      color1 = '#e67e22'; // Orange
    else color1 = '#c0392b'; // Red

    return `
      radial-gradient(circle at 30% 30%, ${color1}, transparent 80%),
      radial-gradient(circle at 70% 70%, rgba(0,0,0,0.4), transparent 50%),
      conic-gradient(from 0deg, rgba(255,255,255,0.1), transparent 30%, rgba(0,0,0,0.1) 60%, transparent),
      linear-gradient(135deg, ${color1} 0%, #2c3e50 100%)
    `;
  });

  projectionDelta = computed(() => {
    const p = this.star();
    if (!p) return 0;
    const habPct = this.habitability();
    if (habPct <= 0) {
      const lossRate = Math.min(0.15, Math.abs(habPct / 100) * 0.15);
      return -Math.ceil(p.population * lossRate);
    } else {
      const growthRate = (Math.max(0, habPct) / 100) * 0.1;
      const current = p.population;
      const max = p.maxPopulation;
      if (current >= max) return 0;
      const growth = Math.floor(current * growthRate * (1 - current / max));
      return growth;
    }
  });

  defenseCoverage = computed(() => {
    const p = this.star();
    if (!p) return 0;
    return Math.min(100, p.defenses);
  });

  scannerRange = computed(() => {
    const p = this.star();
    if (!p || !p.scanner) return 0;
    return p.scanner;
  });

  private getDesignDetails(designId: string) {
    const playerDesigns = this.gs.game()?.shipDesigns || [];
    const dynamicDesign = playerDesigns.find((d) => d.id === designId);

    if (dynamicDesign) {
      const hull = getHull(dynamicDesign.hullId);
      return {
        id: dynamicDesign.id,
        name: dynamicDesign.name,
        hullId: dynamicDesign.hullId,
        hullName: hull?.Name || '',
        isStarbase:
          hull?.isStarbase ||
          ['Orbital Fort', 'Space Dock', 'Space Station', 'Ultra Station', 'Death Star'].includes(
            hull?.Name || '',
          ),
      };
    }

    return getDesign(designId);
  }

  starbaseFleet = computed(() => {
    const game = this.gs.game();
    const p = this.star();
    if (!game || !p) return null;

    const orbitingFleets = game.fleets.filter(
      (f) => f.location.type === 'orbit' && (f.location as any).starId === p.id,
    );

    return orbitingFleets.find((f) => {
      return f.ships.some((s) => {
        const design = this.getDesignDetails(s.designId);
        return design.isStarbase;
      });
    });
  });

  starbase = computed(() => {
    const fleet = this.starbaseFleet();
    if (!fleet) return null;

    const ship = fleet.ships[0];
    const design = this.getDesignDetails(ship.designId);
    // Use hullName if available, otherwise try to map from name (legacy/fallback)
    const hullName = design.hullName || design.name;
    const imageClass = this.techService.getHullImageClass(hullName);

    return {
      name: design.name,
      fleetId: fleet.id,
      imageClass: imageClass,
    };
  });

  fleetsInOrbit = computed(() => {
    const game = this.gs.game();
    const p = this.star();
    if (!game || !p) return [];

    const sbFleet = this.starbaseFleet();

    return game.fleets.filter(
      (f) =>
        f.location.type === 'orbit' &&
        (f.location as any).starId === p.id &&
        (!sbFleet || f.id !== sbFleet.id),
    ) as Fleet[];
  });

  onViewStarbase(fleetId: string) {
    this.router.navigate(['/map'], { queryParams: { fleetId: fleetId } });
  }

  shipOptions = computed(() => {
    const player = this.gs.player();
    const game = this.gs.game();
    const star = this.star();
    if (!player || !game || !star) return [];

    const options = this.shipyardService.getAvailableShipOptions(star, player, game);

    // Filter out current starbase design
    const currentStarbaseFleet = this.starbaseFleet();
    if (currentStarbaseFleet && currentStarbaseFleet.ships.length > 0) {
      const currentStarbaseDesignId = currentStarbaseFleet.ships[0].designId;
      return options.filter((opt) => opt.design.id !== currentStarbaseDesignId);
    }

    return options;
  });

  onShipSelected(option: ShipOption) {
    this.selectedDesign.set(option.design.id);
  }

  selectedShipOption = computed(() => {
    return this.shipOptions().find((opt) => opt.design.id === this.selectedDesign()) || null;
  });

  selectedDesign = signal<string | null>('scout');
  buildAmount = signal(1);
  shipBuildAmount = signal(1);

  setBuildAmount(amount: number) {
    this.buildAmount.set(amount);
  }

  setShipBuildAmount(amount: number) {
    this.shipBuildAmount.set(amount);
  }

  colonizeNow(fleetId: string) {
    if (!this.star()) return;
    this.gs.colonizeNow(fleetId);
  }

  shouldShowTerraform(): boolean {
    const hab = this.habitability();
    return hab < 100;
  }

  shouldShowScanner(): boolean {
    const star = this.star();
    if (!star) return false;
    if (star.scanner > 0) return false;
    const player = this.gs.player();
    if (!player) return false;
    return player.techLevels.Energy >= 1;
  }

  queue(project: 'mine' | 'factory' | 'defense' | 'research' | 'terraform' | 'scanner' | 'ship') {
    const p = this.star();
    if (!p) return;

    // Get cost from selected ship option if project is ship
    const shipOption = this.selectedShipOption();
    const shipCost = shipOption ? shipOption.cost : { resources: 0 };

    const cost = BUILD_COSTS[project] || (project === 'ship' ? shipCost : { resources: 0 });

    let item = {
      project,
      cost,
      shipDesignId: project === 'ship' ? this.selectedDesign() : undefined,
    } as any;

    item.count =
      project === 'scanner' ? 1 : project === 'ship' ? this.shipBuildAmount() : this.buildAmount();

    this.gs.addToBuildQueue(p.id, item);

    if (project === 'ship') {
      this.selectedDesign.set(null);
    }
  }

  endTurn() {
    this.gs.endTurn();
  }

  back() {
    history.back();
  }

  remove(index: number) {
    const p = this.star();
    if (!p) return;
    this.gs.removeFromQueue(p.id, index);
  }

  onGovernorType(event: Event) {
    const p = this.star();
    if (!p) return;
    const val = (event.target as HTMLSelectElement).value as any;
    const governor = { type: val };
    this.gs.setGovernor(p.id, governor as any);
  }
}
