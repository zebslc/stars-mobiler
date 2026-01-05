import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { HabitabilityService } from '../../services/habitability.service';
import { ToastService } from '../../services/toast.service';
import { getDesign, COMPILED_DESIGNS } from '../../data/ships.data';
import { ShipOption } from '../../components/ship-selector.component';
import { PlanetSummaryComponent } from './components/planet-summary.component';
import { PlanetResourcesComponent } from './components/planet-resources.component';
import { PlanetBuildQueueComponent } from './components/planet-build-queue.component';
import { PlanetColonizationComponent } from './components/planet-colonization.component';
import { Fleet } from '../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-planet-detail',
  imports: [
    CommonModule,
    PlanetSummaryComponent,
    PlanetResourcesComponent,
    PlanetBuildQueueComponent,
    PlanetColonizationComponent,
  ],
  template: `
    @if (planet(); as p) {
      <main class="planet-detail-container">
        <button (click)="back()" class="btn-small back-btn">← Back</button>
        <section class="summary-section">
          <app-planet-summary
            [planet]="p"
            [habitability]="habitability()"
            [planetTexture]="planetTexture()"
            [projectionDelta]="projectionDelta()"
            [defenseCoverage]="defenseCoverage()"
            [scannerRange]="scannerRange()"
          ></app-planet-summary>

          <app-planet-resources
            [planet]="p"
            [resourcesPerTurn]="resourcesPerTurn()"
          ></app-planet-resources>
        </section>

        <hr class="divider" />

        @if (p.ownerId === gs.player()?.id) {
          <section>
            <app-planet-build-queue
              [planet]="p"
              [shipOptions]="shipOptions()"
              [selectedShipOption]="selectedShipOption()"
              [buildAmount]="buildAmount()"
              [shipyardDesign]="shipyardDesign"
              [shipyardLimit]="shipyardLimit"
              [shouldShowTerraform]="shouldShowTerraform()"
              [shouldShowScanner]="shouldShowScanner()"
              (queue)="queue($event)"
              (remove)="remove($event)"
              (onGovernorType)="onGovernorType($event)"
              (onShipyardDesignChange)="onShipyardDesignChange($event)"
              (onShipyardLimit)="onShipyardLimit($event)"
              (setBuildAmount)="setBuildAmount($event)"
              (onShipSelected)="onShipSelected($event)"
            ></app-planet-build-queue>
          </section>
        }

        @if (p.ownerId !== gs.player()?.id) {
          <section>
            <app-planet-colonization
              [planet]="p"
              [colonizersInOrbit]="colonizersInOrbit()"
              [colonizersEnRoute]="colonizersEnRoute()"
              [colonizersIdle]="colonizersIdle()"
              (colonizeNow)="colonizeNow($event)"
              (sendColonizer)="sendColonizer($event)"
            ></app-planet-colonization>
          </section>
        }
      </main>
    } @else {
      <main class="error-container">
        <h2>Planet not found</h2>
      </main>
    }
  `,
  styleUrl: './planet-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly gs = inject(GameStateService);
  private hab = inject(HabitabilityService);
  private toast = inject(ToastService);

  private planetId = this.route.snapshot.paramMap.get('id');

  planet = computed(() => {
    // Dependency on turn ensures re-evaluation when turn changes
    this.gs.turn();
    const p =
      this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === this.planetId) || null;
    // Return a shallow copy to trigger change detection since the object might have been mutated in place
    return p ? { ...p } : null;
  });

  ngOnInit() {
    // Check if planet exists on init
    const planet = this.planet();
    if (!planet) {
      this.toast.error(`Planet does not exist`);
      this.router.navigateByUrl('/map');
    }
  }

  resourcesPerTurn = computed(() => {
    const p = this.planet();
    if (!p) return 0;
    return Math.min(p.factories, Math.floor(p.population / 10));
  });

  habitability = computed(() => {
    const p = this.planet();
    const species = this.gs.playerSpecies();
    if (!p || !species) return 0;
    return this.hab.calculate(p, species);
  });

  planetTexture = computed(() => {
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

    // Create a "rough" texture using multiple gradients
    return `
      radial-gradient(circle at 30% 30%, ${color1}, transparent 80%),
      radial-gradient(circle at 70% 70%, rgba(0,0,0,0.4), transparent 50%),
      conic-gradient(from 0deg, rgba(255,255,255,0.1), transparent 30%, rgba(0,0,0,0.1) 60%, transparent),
      linear-gradient(135deg, ${color1} 0%, #2c3e50 100%)
    `;
  });

  projectionDelta = computed(() => {
    const p = this.planet();
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
    const p = this.planet();
    if (!p) return 0;
    // Each defense provides roughly 1% coverage, capped at 100%
    return Math.min(100, p.defenses);
  });

  scannerRange = computed(() => {
    const p = this.planet();
    if (!p || !p.scanner) return 0;
    // Base scanner range - 50 LY per scanner level
    return p.scanner * 50;
  });

  colonizersInOrbit = computed(() => {
    const game = this.gs.game();
    const p = this.planet();
    if (!game || !p) return [];
    return game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.ships.some((s) => s.designId === 'settler') &&
        f.location.type === 'orbit' &&
        (f.location as any).planetId === p.id,
    ) as Fleet[];
  });

  colonizersEnRoute = computed(() => {
    const game = this.gs.game();
    const p = this.planet();
    if (!game || !p) return [];
    const star = this.gs.stars().find((s) => s.planets.some((pl) => pl.id === p.id));
    if (!star) return [];

    return game.fleets.filter((f) => {
      if (f.ownerId !== game.humanPlayer.id) return false;
      if (!f.ships.some((s) => s.designId === 'settler')) return false;
      const move = f.orders.find((o) => o.type === 'move');
      if (!move) return false;
      return move.destination.x === star.position.x && move.destination.y === star.position.y;
    }) as Fleet[];
  });

  colonizersIdle = computed(() => {
    const game = this.gs.game();
    const p = this.planet();
    if (!game || !p) return [];
    return game.fleets.filter((f) => {
      if (f.ownerId !== game.humanPlayer.id) return false;
      if (!f.ships.some((s) => s.designId === 'settler')) return false;

      if (f.location.type === 'orbit' && (f.location as any).planetId === p.id) return false;

      const star = this.gs.stars().find((s) => s.planets.some((pl) => pl.id === p.id));
      if (star) {
        const move = f.orders.find((o) => o.type === 'move');
        if (
          move &&
          move.destination.x === star.position.x &&
          move.destination.y === star.position.y
        )
          return false;
      }

      const move = f.orders.find((o) => o.type === 'move');
      return !move;
    }) as Fleet[];
  });

  shipOptions = computed(() => {
    const game = this.gs.game();
    if (!game) return [];

    const shipDesigns = [
      'scout',
      'frigate',
      'destroyer',
      'small_freighter',
      'super_freighter',
      'fuel_transport',
      'colony_ship',
    ];

    return shipDesigns
      .map((designId) => {
        const design = COMPILED_DESIGNS[designId];
        if (!design) return null;

        const cost = design.cost;

        // Determine ship type
        let shipType: 'attack' | 'cargo' | 'support' | 'colony';
        if (design.colonyModule) {
          shipType = 'colony';
        } else if (design.cargoCapacity > 0) {
          shipType = 'cargo';
        } else if (design.firepower > 0) {
          shipType = 'attack';
        } else {
          shipType = 'support';
        }

        // Check if affordable from this planet's resources
        const planet = this.planet();
        const canAfford = planet
          ? planet.resources >= cost.resources &&
            planet.surfaceMinerals.iron >= (cost.iron ?? 0) &&
            planet.surfaceMinerals.boranium >= (cost.boranium ?? 0) &&
            planet.surfaceMinerals.germanium >= (cost.germanium ?? 0)
          : false;

        return {
          design,
          cost,
          shipType,
          canAfford,
        } as ShipOption;
      })
      .filter((opt): opt is ShipOption => opt !== null);
  });

  selectedShipOption = computed(() => {
    return this.shipOptions().find((opt) => opt.design.id === this.selectedDesign()) || null;
  });

  selectedDesign = signal('scout');
  shipyardDesign = 'scout';
  shipyardLimit = 0;
  buildAmount = signal(1);

  setBuildAmount(amount: number) {
    this.buildAmount.set(amount);
  }

  colonizeNow(fleetId: string) {
    if (!this.planet()) return;
    this.gs.colonizeNow(fleetId);
  }

  sendColonizer(fleetId: string) {
    const p = this.planet();
    if (!p) return;
    const star = this.gs.stars().find((s) => s.planets.some((pl) => pl.id === p.id));
    if (!star) return;

    this.gs.setFleetOrders(fleetId, [
      { type: 'move', destination: star.position },
      { type: 'colonize', planetId: p.id },
    ]);
  }

  shouldShowTerraform(): boolean {
    const hab = this.habitability();
    return hab < 100;
  }

  shouldShowScanner(): boolean {
    const planet = this.planet();
    if (!planet) return false;
    if (planet.scanner > 0) return false;
    const player = this.gs.player();
    if (!player) return false;
    // Scanners are now part of Energy tech tree
    return player.techLevels.Energy >= 1;
  }

  queue(project: 'mine' | 'factory' | 'defense' | 'research' | 'terraform' | 'scanner' | 'ship') {
    const p = this.planet();
    if (!p) return;
    let item =
      project === 'mine'
        ? { project, cost: { resources: 5 } }
        : project === 'factory'
          ? { project, cost: { resources: 10, germanium: 4 } }
          : project === 'defense'
            ? { project, cost: { resources: 15, iron: 2, boranium: 2 } }
            : project === 'research'
              ? { project, cost: { resources: 10 } }
              : project === 'terraform'
                ? { project, cost: { resources: 25, germanium: 5 } }
                : project === 'scanner'
                  ? { project, cost: { resources: 50, germanium: 10, iron: 5 } }
                  : ({
                      project: 'ship',
                      cost: COMPILED_DESIGNS[this.selectedDesign()]?.cost || { resources: 0 },
                      shipDesignId: this.selectedDesign(),
                    } as any);

    // Add count (scanner should always be 1)
    item.count = project === 'scanner' ? 1 : this.buildAmount();

    this.gs.addToBuildQueue(p.id, item);
  }

  endTurn() {
    this.gs.endTurn();
  }

  back() {
    history.back();
  }

  remove(index: number) {
    const p = this.planet();
    if (!p) return;
    this.gs.removeFromQueue(p.id, index);
  }

  onGovernorType(event: Event) {
    const p = this.planet();
    if (!p) return;
    const val = (event.target as HTMLSelectElement).value as any;
    const governor =
      val === 'shipyard'
        ? { type: 'shipyard', shipDesignId: this.shipyardDesign, buildLimit: this.shipyardLimit }
        : { type: val };
    this.gs.setGovernor(p.id, governor as any);
  }

  onShipSelected(option: ShipOption) {
    this.selectedDesign.set(option.design.id);
  }

  onShipyardDesignChange(event: Event) {
    this.shipyardDesign = (event.target as HTMLSelectElement).value;
    this.onGovernorType(new Event('change'));
  }
  onShipyardLimit(event: Event) {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.shipyardLimit = Number.isFinite(val) ? val : this.shipyardLimit;
    this.onGovernorType(new Event('change'));
  }
}
