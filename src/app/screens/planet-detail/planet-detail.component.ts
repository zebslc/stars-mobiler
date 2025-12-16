import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { HabitabilityService } from '../../services/habitability.service';
import { ToastService } from '../../services/toast.service';
import { getDesign, COMPILED_DESIGNS } from '../../data/ships.data';
import { ShipSelectorComponent, ShipOption } from '../../components/ship-selector.component';

@Component({
  standalone: true,
  selector: 'app-planet-detail',
  imports: [CommonModule, ShipSelectorComponent],
  template: `
    <main *ngIf="planet(); else missing" style="padding:var(--space-lg)">
      <header
        class="card-header"
        style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-lg)"
      >
        <div
          style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-lg);flex-wrap:wrap"
        >
          <div style="display:flex;gap:var(--space-md);align-items:center">
            <button
              (click)="back()"
              class="btn-small"
              style="background:rgba(255,255,255,0.2);color:#fff;border:none"
            >
              ← Back
            </button>
            <h2>{{ planet()!.name }}</h2>
          </div>

          <div style="display:flex;gap:var(--space-lg);align-items:center;flex-wrap:wrap">
            <div style="text-align:right">
              <div class="text-xs" style="opacity:0.8">Owner</div>
              <div class="font-bold">
                {{
                  planet()!.ownerId === gs.player()?.id
                    ? 'You'
                    : planet()!.ownerId
                      ? 'Enemy'
                      : 'Unowned'
                }}
              </div>
            </div>
            <button (click)="endTurn()" class="btn-success">End Turn ▶</button>
          </div>
        </div>

        <ng-container *ngIf="planet()!.ownerId === gs.player()?.id">
          <div
            style="display:flex;gap:var(--space-md);align-items:stretch;background:rgba(255,255,255,0.1);padding:var(--space-md);border-radius:var(--radius-md);flex-wrap:wrap"
          >
            <label style="font-weight:bold;white-space:nowrap;color:#fff;align-self:center;margin:0"
              >Governor:</label
            >
            <select
              [value]="planet()!.governor?.type ?? 'manual'"
              (change)="onGovernorType($event)"
              style="background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.3);flex-grow:1;min-width:200px"
            >
              <option value="manual">Manual Control</option>
              <option value="balanced">Balanced (Auto-build all)</option>
              <option value="mining">Mining (Focus Mines)</option>
              <option value="industrial">Industrial (Focus Factories)</option>
              <option value="military">Military (Focus Defenses)</option>
              <option value="shipyard">Shipyard (Auto-build Ships)</option>
            </select>
          </div>

          <div
            *ngIf="planet()!.governor?.type === 'shipyard'"
            style="display:flex;gap:var(--space-md);align-items:end;background:rgba(46, 134, 222, 0.2);padding:var(--space-md);border-radius:var(--radius-md);flex-wrap:wrap"
          >
            <div style="flex-grow:1;min-width:150px">
              <label style="color:#fff;opacity:0.9">Auto-Design</label>
              <select
                [value]="shipyardDesign"
                (change)="onShipyardDesignChange($event)"
                style="width:100%;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.3)"
              >
                <option value="scout">Scout</option>
                <option value="frigate">Frigate</option>
                <option value="destroyer">Destroyer</option>
                <option value="freighter">Freighter</option>
                <option value="super_freighter">Super Freighter</option>
                <option value="tanker">Fuel Tanker</option>
                <option value="settler">Colony Ship</option>
              </select>
            </div>
            <div style="width:100px">
              <label style="color:#fff;opacity:0.9">Build Limit</label>
              <input
                type="number"
                [value]="shipyardLimit"
                (input)="onShipyardLimit($event)"
                style="width:100%;background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.3)"
                placeholder="∞"
              />
            </div>
          </div>
        </ng-container>
      </header>
      <section style="display:flex;flex-wrap:wrap;gap:var(--space-lg)">
        <div class="card" style="flex:1;min-width:280px">
          <h3
            style="margin-bottom:var(--space-md);padding-bottom:var(--space-sm);border-bottom:1px solid var(--color-border)"
          >
            Vital Statistics
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
            <div>
              <div class="text-small text-muted">Habitability</div>
              <div class="font-bold">{{ habitability() }}%</div>
            </div>
            <div>
              <div class="text-small text-muted">Population</div>
              <div>{{ planet()!.population | number }}</div>
              <div
                [style.color]="
                  projectionDelta() >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                "
                class="text-small"
              >
                {{ projectionDelta() >= 0 ? '+' : '' }}{{ projectionDelta() | number }}
              </div>
            </div>
            <div>
              <div class="text-small text-muted">Mines</div>
              <div class="font-medium">{{ planet()!.mines }}</div>
            </div>
            <div>
              <div class="text-small text-muted">Factories</div>
              <div class="font-medium">{{ planet()!.factories }}</div>
            </div>
          </div>
        </div>

        <div class="card" style="flex:1;min-width:280px">
          <h3
            style="margin-bottom:var(--space-md);padding-bottom:var(--space-sm);border-bottom:1px solid var(--color-border)"
          >
            Resources
          </h3>
          <div
            style="background:var(--color-bg-tertiary);padding:var(--space-lg);border-radius:var(--radius-sm);margin-bottom:var(--space-md);text-align:center"
          >
            <div class="text-small text-muted">Available Resources</div>
            <div class="font-bold" style="font-size:var(--font-size-xl);color:var(--color-primary)">
              {{ planet()!.resources }}
            </div>
            <div class="text-xs text-muted">
              +{{ resourcesPerTurn() }}/turn
            </div>
          </div>
          <div
            style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);text-align:center"
          >
            <div
              style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)"
            >
              <div class="font-bold" style="color:var(--color-iron)">Iron</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">
                {{ planet()!.surfaceMinerals.iron }}
              </div>
              <div class="text-xs text-muted">{{ planet()!.mineralConcentrations.iron }}%</div>
            </div>
            <div
              style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)"
            >
              <div class="font-bold" style="color:var(--color-boranium)">Boranium</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">
                {{ planet()!.surfaceMinerals.boranium }}
              </div>
              <div class="text-xs text-muted">{{ planet()!.mineralConcentrations.boranium }}%</div>
            </div>
            <div
              style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)"
            >
              <div class="font-bold" style="color:var(--color-germanium)">Germanium</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">
                {{ planet()!.surfaceMinerals.germanium }}
              </div>
              <div class="text-xs text-muted">{{ planet()!.mineralConcentrations.germanium }}%</div>
            </div>
          </div>
        </div>
      </section>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-xl) 0" />
      <section *ngIf="planet()!.ownerId === gs.player()?.id">
        <h3 style="margin-bottom:var(--space-lg)">Build Queue</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-md)"
          >
            <button
              (click)="queue('mine')"
              [disabled]="!canAfford('mine')"
              class="btn-dark"
              style="display:flex;flex-direction:column;gap:var(--space-xs);align-items:center"
            >
              <div class="font-bold">Mine</div>
              <div class="text-xs" style="opacity:0.8">5 R</div>
            </button>
            <button
              (click)="queue('factory')"
              [disabled]="!canAfford('factory')"
              class="btn-dark"
              style="display:flex;flex-direction:column;gap:var(--space-xs);align-items:center"
            >
              <div class="font-bold">Factory</div>
              <div class="text-xs" style="opacity:0.8">10 R, 4 Ge</div>
            </button>
            <button
              (click)="queue('defense')"
              [disabled]="!canAfford('defense')"
              class="btn-dark"
              style="display:flex;flex-direction:column;gap:var(--space-xs);align-items:center"
            >
              <div class="font-bold">Defense</div>
              <div class="text-xs" style="opacity:0.8">15 R, 2 Fe, 2 Bo</div>
            </button>
            <button
              (click)="queue('terraform')"
              [disabled]="!canAfford('terraform')"
              class="btn-dark"
              style="display:flex;flex-direction:column;gap:var(--space-xs);align-items:center"
            >
              <div class="font-bold">Terraform</div>
              <div class="text-xs" style="opacity:0.8">25 R, 5 Ge</div>
            </button>
          </div>

          <div
            style="background:var(--color-primary-light);padding:var(--space-lg);border-radius:var(--radius-md);border:1px solid var(--color-primary)"
          >
            <div
              class="font-bold"
              style="color:var(--color-primary-dark);margin-bottom:var(--space-md)"
            >
              Ship Construction
            </div>
            <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
              <app-ship-selector
                [options]="shipOptions()"
                [selectedShip]="selectedShipOption()"
                (shipSelected)="onShipSelected($event)"
                style="flex-grow:1;min-width:200px"
              ></app-ship-selector>
              <button
                (click)="queue('ship')"
                [disabled]="!canAfford('ship')"
                class="btn-primary"
                style="white-space:nowrap"
              >
                Build Ship
              </button>
            </div>
          </div>
        </div>
        <div
          *ngIf="(planet()!.buildQueue?.length ?? 0) > 0"
          style="background:var(--color-bg-primary);border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;margin-top:var(--space-lg)"
        >
          <div
            *ngFor="let it of planet()!.buildQueue ?? []; let i = index"
            style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-lg);border-bottom:1px solid var(--color-border-light)"
            [style.background]="i === 0 ? 'var(--color-success-light)' : 'var(--color-bg-primary)'"
          >
            <div style="font-weight:500">
              <span class="text-small text-muted" style="display:inline-block;width:24px">{{
                i + 1
              }}</span>
              <span style="color:var(--color-text-primary)">{{ it.project | titlecase }}</span>
              <span
                *ngIf="it.project === 'ship' && it.shipDesignId"
                class="text-small text-muted"
                style="margin-left:var(--space-xs)"
                >({{ it.shipDesignId }})</span
              >
              <span
                *ngIf="queueColor(it, i) === 'var(--color-danger)'"
                class="text-xs"
                style="margin-left:var(--space-sm);color:var(--color-danger)"
                >⚠ Cannot afford</span
              >
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-md)">
              <span
                class="text-small font-medium"
                style="font-family:monospace;background:var(--color-bg-tertiary);padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);color:var(--color-text-primary)"
                >{{ it.cost.resources }}R</span
              >
              <button
                (click)="remove(i)"
                class="btn-icon btn-small"
                style="background:var(--color-danger-light);color:var(--color-danger);font-size:var(--font-size-xl)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </section>

      <section *ngIf="planet()!.ownerId !== gs.player()?.id">
        <h3 style="margin-bottom:var(--space-lg)">Colonization</h3>

        <!-- In Orbit -->
        <div *ngIf="colonizersInOrbit().length > 0">
          <div
            class="text-small font-bold"
            style="color:var(--color-text-primary);margin-bottom:var(--space-sm)"
          >
            In Orbit
          </div>
          <div
            *ngFor="let f of colonizersInOrbit()"
            style="display:flex;justify-content:space-between;align-items:center;background:var(--color-success-light);padding:var(--space-lg);border-radius:var(--radius-md);margin-bottom:var(--space-md);border:1px solid var(--color-success)"
          >
            <div>
              <div class="font-bold">Fleet {{ f.id }}</div>
              <div class="text-small" style="color:var(--color-success)">Ready to Colonize</div>
            </div>
            <button (click)="colonizeNow(f.id)" class="btn-success">Colonize Now</button>
          </div>
        </div>

        <!-- En Route -->
        <div *ngIf="colonizersEnRoute().length > 0" style="margin-top:var(--space-md)">
          <div
            class="text-small font-bold"
            style="color:var(--color-text-primary);margin-bottom:var(--space-sm)"
          >
            En Route
          </div>
          <div
            *ngFor="let f of colonizersEnRoute()"
            style="display:flex;justify-content:space-between;align-items:center;background:var(--color-bg-tertiary);padding:var(--space-lg);border-radius:var(--radius-md);margin-bottom:var(--space-md);border:1px solid var(--color-border)"
          >
            <div>
              <div class="font-bold">Fleet {{ f.id }}</div>
              <div class="text-small text-muted">{{ getFleetInfo(f) }}</div>
            </div>
            <div class="text-small font-bold" style="color:var(--color-primary)">
              Arriving in {{ getEta(f) }} turns
            </div>
          </div>
        </div>

        <!-- Available Elsewhere -->
        <div style="margin-top:var(--space-md)">
          <div
            class="text-small font-bold"
            style="color:var(--color-text-primary);margin-bottom:var(--space-sm)"
          >
            Available Ships
          </div>
          <div *ngIf="colonizersIdle().length > 0; else noIdle">
            <div
              *ngFor="let f of colonizersIdle()"
              style="display:flex;justify-content:space-between;align-items:center;background:var(--color-bg-primary);padding:var(--space-lg);border-radius:var(--radius-md);margin-bottom:var(--space-md);border:1px solid var(--color-border-light)"
            >
              <div>
                <div class="font-bold">Fleet {{ f.id }}</div>
                <div class="text-small text-muted">Idle at {{ getFleetLocationName(f) }}</div>
              </div>
              <button (click)="sendColonizer(f.id)" class="btn-primary-outline">
                Auto Colonize
              </button>
            </div>
          </div>
          <ng-template #noIdle>
            <div class="text-small text-muted" style="font-style:italic">
              No idle colony ships available.
            </div>
          </ng-template>
        </div>
      </section>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-xl) 0" />
      <section>
        <button (click)="endTurn()" class="btn-success">End Turn ▶</button>
      </section>
    </main>
    <ng-template #missing>
      <main style="padding:var(--space-lg)">
        <h2>Planet not found</h2>
      </main>
    </ng-template>
  `,
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
    return (
      this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === this.planetId) || null
    );
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

  projectionDelta = computed(() => {
    const p = this.planet();
    if (!p) return 0;
    const habPct = this.habitability();
    if (habPct <= 0) {
      const lossRate = Math.min(0.15, Math.abs(habPct / 100) * 0.15);
      return -Math.ceil(p.population * lossRate);
    } else {
      const growthRate = (Math.max(0, habPct) / 100) * 0.1;
      // Note: accessing private/internal method of gs.economy...
      // Better to duplicate logic or expose it properly.
      // But for now, we can't access gs['economy'] easily if it's private.
      // Wait, in previous code it was `this.gs['economy']`.
      // I should inject EconomyService or move logic.
      // I'll stick to simple calculation here for UI.
      const current = p.population;
      const max = p.maxPopulation;
      if (current >= max) return 0;
      const growth = Math.floor(current * growthRate * (1 - current / max));
      return growth;
    }
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
        f.location.planetId === p.id,
    );
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
    });
  });

  colonizersIdle = computed(() => {
    const game = this.gs.game();
    const p = this.planet();
    if (!game || !p) return [];
    return game.fleets.filter((f) => {
      if (f.ownerId !== game.humanPlayer.id) return false;
      if (!f.ships.some((s) => s.designId === 'settler')) return false;

      if (f.location.type === 'orbit' && f.location.planetId === p.id) return false;

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
    });
  });

  shipOptions = computed(() => {
    const game = this.gs.game();
    if (!game) return [];

    const shipDesigns = ['scout', 'frigate', 'destroyer', 'freighter', 'super_freighter', 'tanker', 'settler'];

    return shipDesigns.map(designId => {
      const design = COMPILED_DESIGNS[designId];
      const cost = this.getShipCost(designId);

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
      const canAfford = planet ? (
        planet.resources >= cost.resources &&
        planet.surfaceMinerals.iron >= (cost.iron ?? 0) &&
        planet.surfaceMinerals.boranium >= (cost.boranium ?? 0) &&
        planet.surfaceMinerals.germanium >= (cost.germanium ?? 0)
      ) : false;

      return {
        design,
        cost,
        shipType,
        canAfford,
      } as ShipOption;
    });
  });

  selectedShipOption = computed(() => {
    return this.shipOptions().find(opt => opt.design.id === this.selectedDesign()) || null;
  });

  selectedDesign = signal('scout');
  shipyardDesign = 'scout';
  shipyardLimit = 0;

  getEta(fleet: any): number {
    const p = this.planet();
    if (!p) return 0;
    const star = this.gs.stars().find((s) => s.planets.some((pl) => pl.id === p.id));
    if (!star) return 0;

    let fx = 0,
      fy = 0;
    if (fleet.location.type === 'orbit') {
      const fStar = this.gs
        .stars()
        .find((s) => s.planets.some((pl) => pl.id === fleet.location.planetId));
      if (fStar) {
        fx = fStar.position.x;
        fy = fStar.position.y;
      }
    } else {
      fx = fleet.location.x;
      fy = fleet.location.y;
    }
    const dist = Math.hypot(star.position.x - fx, star.position.y - fy);
    if (dist === 0) return 0;

    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const speed = Math.max(1, maxWarp * 20);
    return Math.ceil(dist / speed);
  }

  getFleetInfo(fleet: any): string {
    const colonists = fleet.cargo.colonists;
    const ships = fleet.ships.reduce((acc: number, s: any) => acc + s.count, 0);
    return `${colonists} Colonists, ${ships} Ships`;
  }

  getFleetLocationName(fleet: any): string {
    if (fleet.location.type === 'orbit') {
      const p = this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === fleet.location.planetId);
      return p ? p.name : 'Unknown Orbit';
    }
    return 'Deep Space';
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

  canAfford(project: 'mine' | 'factory' | 'defense' | 'terraform' | 'ship'): boolean {
    const planet = this.planet();
    if (!planet) return false;
    if (project === 'ship') {
      const cost = this.getShipCost(this.selectedDesign());
      return (
        planet.resources >= cost.resources &&
        planet.surfaceMinerals.iron >= (cost.iron ?? 0) &&
        planet.surfaceMinerals.boranium >= (cost.boranium ?? 0) &&
        planet.surfaceMinerals.germanium >= (cost.germanium ?? 0)
      );
    }
    switch (project) {
      case 'mine':
        return planet.resources >= 5;
      case 'factory':
        return planet.resources >= 10 && planet.surfaceMinerals.germanium >= 4;
      case 'defense':
        return planet.resources >= 15 && planet.surfaceMinerals.iron >= 2 && planet.surfaceMinerals.boranium >= 2;
      case 'terraform':
        return planet.resources >= 25 && planet.surfaceMinerals.germanium >= 5;
      default:
        return false;
    }
  }

  queue(project: 'mine' | 'factory' | 'defense' | 'terraform' | 'ship') {
    const p = this.planet();
    if (!p) return;
    let item =
      project === 'mine'
        ? { project, cost: { resources: 5 } }
        : project === 'factory'
          ? { project, cost: { resources: 10, germanium: 4 } }
          : project === 'defense'
            ? { project, cost: { resources: 15, iron: 2, boranium: 2 } }
            : project === 'terraform'
              ? { project, cost: { resources: 25, germanium: 5 } }
              : ({
                  project: 'ship',
                  cost: this.getShipCost(this.selectedDesign()),
                  shipDesignId: this.selectedDesign(),
              } as any);
    const ok = this.gs.addToBuildQueue(p.id, item);
    if (!ok) {
      alert('Insufficient stockpile for this project');
    }
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

  onDesignChange(event: Event) {
    this.selectedDesign.set((event.target as HTMLSelectElement).value);
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

  queueColor(item: any, index: number): string {
    if (index === 0) return 'inherit';
    const planet = this.planet();
    if (!planet) return 'inherit';
    const neededR = item.cost?.resources ?? 0;
    const neededFe = item.cost?.iron ?? 0;
    const neededBo = item.cost?.boranium ?? 0;
    const neededGe = item.cost?.germanium ?? 0;
    const haveR = planet.resources;
    const haveFe = planet.surfaceMinerals.iron;
    const haveBo = planet.surfaceMinerals.boranium;
    const haveGe = planet.surfaceMinerals.germanium;
    const cannot =
      haveR < neededR || haveFe < neededFe || haveBo < neededBo || haveGe < neededGe;
    return cannot ? 'var(--color-danger)' : 'inherit';
  }

  private getShipCost(designId: string): {
    resources: number;
    iron?: number;
    boranium?: number;
    germanium?: number;
  } {
    switch (designId) {
      case 'scout':
        return { resources: 20, iron: 5 };
      case 'frigate':
        return { resources: 40, iron: 10, boranium: 5 };
      case 'destroyer':
        return { resources: 60, iron: 15, boranium: 10, germanium: 5 };
      case 'freighter':
        return { resources: 35, iron: 8, boranium: 5, germanium: 3 };
      case 'super_freighter':
        return { resources: 60, iron: 15, boranium: 8, germanium: 6 };
      case 'tanker':
        return { resources: 30, iron: 6, boranium: 6, germanium: 2 };
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
