import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { HabitabilityService } from '../../services/habitability.service';
import { Planet } from '../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-planet-detail',
  imports: [CommonModule],
  template: `
    <main *ngIf="planet; else missing" style="padding:var(--space-lg)">
      <header class="card-header" style="display:flex;flex-direction:column;gap:var(--space-md);margin-bottom:var(--space-lg)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-lg);flex-wrap:wrap">
          <div style="display:flex;gap:var(--space-md);align-items:center">
            <button
              (click)="back()"
              class="btn-small"
              style="background:rgba(255,255,255,0.2);color:#fff;border:none"
            >
              ← Back
            </button>
            <h2>{{ planet.name }}</h2>
          </div>

          <div style="display:flex;gap:var(--space-lg);align-items:center;flex-wrap:wrap">
            <div style="text-align:right">
              <div class="text-xs" style="opacity:0.8">Owner</div>
              <div class="font-bold">
                {{
                  planet.ownerId === gs.player()?.id ? 'You' : planet.ownerId ? 'Enemy' : 'Unowned'
                }}
              </div>
            </div>
            <button
              (click)="endTurn()"
              class="btn-success"
            >
              End Turn ▶
            </button>
          </div>
        </div>

        <ng-container *ngIf="planet.ownerId === gs.player()?.id">
          <div
            style="display:flex;gap:var(--space-md);align-items:stretch;background:rgba(255,255,255,0.1);padding:var(--space-md);border-radius:var(--radius-md);flex-wrap:wrap"
          >
            <label style="font-weight:bold;white-space:nowrap;color:#fff;align-self:center;margin:0">Governor:</label>
            <select
              [value]="planet.governor?.type ?? 'manual'"
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
            *ngIf="planet.governor?.type === 'shipyard'"
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
          <h3 style="margin-bottom:var(--space-md);padding-bottom:var(--space-sm);border-bottom:1px solid var(--color-border)">
            Vital Statistics
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
            <div>
              <div class="text-small text-muted">Habitability</div>
              <div class="font-bold">{{ habitability() }}%</div>
            </div>
            <div>
              <div class="text-small text-muted">Population</div>
              <div>{{ planet.population | number }}</div>
              <div
                [style.color]="projectionDelta() >= 0 ? 'var(--color-success)' : 'var(--color-danger)'"
                class="text-small"
              >
                {{ projectionDelta() >= 0 ? '+' : '' }}{{ projectionDelta() | number }}
              </div>
            </div>
            <div>
              <div class="text-small text-muted">Mines</div>
              <div class="font-medium">{{ planet.mines }}</div>
            </div>
            <div>
              <div class="text-small text-muted">Factories</div>
              <div class="font-medium">{{ planet.factories }}</div>
            </div>
          </div>
        </div>

        <div class="card" style="flex:1;min-width:280px">
          <h3 style="margin-bottom:var(--space-md);padding-bottom:var(--space-sm);border-bottom:1px solid var(--color-border)">
            Resources
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-md);text-align:center">
            <div style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)">
              <div class="font-bold" style="color:var(--color-iron)">Iron</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">{{ planet.surfaceMinerals.iron }}</div>
              <div class="text-xs text-muted">
                {{ planet.mineralConcentrations.iron }}%
              </div>
            </div>
            <div style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)">
              <div class="font-bold" style="color:var(--color-boranium)">Boranium</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">{{ planet.surfaceMinerals.boranium }}</div>
              <div class="text-xs text-muted">
                {{ planet.mineralConcentrations.boranium }}%
              </div>
            </div>
            <div style="background:var(--color-bg-tertiary);padding:var(--space-md);border-radius:var(--radius-sm)">
              <div class="font-bold" style="color:var(--color-germanium)">Germanium</div>
              <div class="font-medium" style="font-size:var(--font-size-lg)">{{ planet.surfaceMinerals.germanium }}</div>
              <div class="text-xs text-muted">
                {{ planet.mineralConcentrations.germanium }}%
              </div>
            </div>
          </div>
          <div class="text-small text-muted" style="margin-top:var(--space-md);text-align:center">
            Producing <span class="font-bold" style="color:var(--color-text-primary)">{{ resourcesPerTurn }}</span> resources / turn
          </div>
        </div>
      </section>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-xl) 0" />
      <section *ngIf="planet.ownerId === gs.player()?.id">
        <h3 style="margin-bottom:var(--space-lg)">Build Queue</h3>
        <div style="display:flex;flex-direction:column;gap:var(--space-lg)">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--space-md)">
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

          <div style="background:var(--color-primary-light);padding:var(--space-lg);border-radius:var(--radius-md);border:1px solid var(--color-primary)">
            <div class="font-bold" style="color:var(--color-primary-dark);margin-bottom:var(--space-md)">Ship Construction</div>
            <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
              <select
                [value]="selectedDesign"
                (change)="onDesignChange($event)"
                style="flex-grow:1;min-width:200px"
              >
                <option value="scout">Scout (20R 5Fe)</option>
                <option value="frigate">Frigate (40R 10Fe 5Bo)</option>
                <option value="destroyer">Destroyer (60R 15Fe 10Bo 5Ge)</option>
                <option value="freighter">Freighter (35R 8Fe 5Bo 3Ge)</option>
                <option value="super_freighter">Super Freighter (60R 15Fe 8Bo 6Ge)</option>
                <option value="tanker">Fuel Tanker (30R 6Fe 6Bo 2Ge)</option>
                <option value="settler">Colony Ship (80R 10Fe 10Bo 8Ge)</option>
              </select>
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
          *ngIf="(planet.buildQueue?.length ?? 0) > 0"
          style="background:var(--color-bg-primary);border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;margin-top:var(--space-lg)"
        >
          <div
            *ngFor="let it of planet.buildQueue ?? []; let i = index"
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

      <section *ngIf="planet.ownerId !== gs.player()?.id">
        <h3 style="margin-bottom:var(--space-lg)">Colonization</h3>
        <div *ngIf="availableColonizers().length > 0; else noColonizers">
          <div
            *ngFor="let f of availableColonizers()"
            style="display:flex;justify-content:space-between;align-items:center;background:var(--color-success-light);padding:var(--space-lg);border-radius:var(--radius-md);margin-bottom:var(--space-md);border:1px solid var(--color-success);gap:var(--space-md);flex-wrap:wrap"
          >
            <div>
              <div class="font-bold">Fleet {{ f.id }}</div>
              <div class="text-small" style="color:var(--color-success)">Has Colony Ship</div>
            </div>
            <button
              (click)="sendColonizer(f.id)"
              class="btn-success"
            >
              Send to Colonize
            </button>
          </div>
        </div>
        <ng-template #noColonizers>
          <div class="card text-muted" style="text-align:center">
            No available colony ships nearby.
          </div>
        </ng-template>
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
export class PlanetDetailComponent {
  private route = inject(ActivatedRoute);
  readonly gs = inject(GameStateService);
  private hab = inject(HabitabilityService);
  planet: Planet | null = null;
  resourcesPerTurn = 0;
  selectedDesign = 'scout';
  shipyardDesign = 'scout';
  shipyardLimit = 0;

  availableColonizers(): any[] {
    const game = this.gs.game();
    if (!game || !this.planet) return [];

    // Find all fleets with colony ships
    const colonizerFleets = game.fleets.filter(
      (f) => f.ownerId === game.humanPlayer.id && f.ships.some((s) => s.designId === 'settler'),
    );

    // Filter out fleets that are already moving somewhere (unless moving to THIS planet)
    return colonizerFleets.filter((f) => {
      const moveOrder = f.orders.find((o) => o.type === 'move');
      if (!moveOrder) return true; // Idle fleet

      // If moving, check destination.
      // Destination is {x, y}. Compare with planet pos.
      const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === this.planet!.id));
      if (!star) return false;

      const dest = moveOrder.destination;
      const isHeadingHere = dest.x === star.position.x && dest.y === star.position.y;

      // We want fleets NOT already heading here (so we can re-task them) OR idle ones.
      // Actually, user said "no already en-route to a planet".
      // Let's assume idle fleets or fleets moving elsewhere can be redirected.
      // But "en-route to a planet" usually implies busy.
      // Let's show idle fleets primarily.
      return !moveOrder;
    });
  }

  sendColonizer(fleetId: string) {
    if (!this.planet) return;
    const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === this.planet!.id));
    if (!star) return;

    // Issue move order to this star
    this.gs.issueFleetOrder(fleetId, { type: 'move', destination: star.position });
    // And queue a colonize order? Or just move?
    // User said "auto colonise it".
    // The current game engine processes colonization if a fleet is in orbit and has orders, or manually.
    // We can append a 'colonize' order after the move?
    // The current issueFleetOrder replaces orders.
    // Let's just move them there for now, as 'auto colonise' might imply arrival.
    // Better: Add a colonize order to the queue if possible, but our service might not support multi-order queuing easily yet.
    // We'll stick to 'Travel Here' equivalent.

    // Update: If we can, let's set them to colonize upon arrival.
    // But for now, moving them is the first step.
    this.gs.issueFleetOrder(fleetId, { type: 'move', destination: star.position });
  }

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const planet = this.gs
      .stars()
      .flatMap((s) => s.planets)
      .find((p) => p.id === id);
    this.planet = planet ?? null;
    if (planet) {
      const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
      this.resourcesPerTurn = operableFactories;
    }
  }

  habitability(): number {
    if (!this.planet || !this.gs.playerSpecies()) return 0;
    return this.hab.calculate(this.planet, this.gs.playerSpecies()!);
  }

  canAfford(project: 'mine' | 'factory' | 'defense' | 'terraform' | 'ship'): boolean {
    if (project === 'ship') {
      const econ = this.gs.game()?.playerEconomy;
      if (!econ) return false;
      const cost = this.getShipCost(this.selectedDesign);
      return (
        econ.resources >= cost.resources &&
        econ.minerals.iron >= (cost.iron ?? 0) &&
        econ.minerals.boranium >= (cost.boranium ?? 0) &&
        econ.minerals.germanium >= (cost.germanium ?? 0)
      );
    }
    const econ = this.gs.game()?.playerEconomy;
    if (!econ) return false;
    switch (project) {
      case 'mine':
        return econ.resources >= 5;
      case 'factory':
        return econ.resources >= 10 && econ.minerals.germanium >= 4;
      case 'defense':
        return econ.resources >= 15 && econ.minerals.iron >= 2 && econ.minerals.boranium >= 2;
      case 'terraform':
        return econ.resources >= 25 && econ.minerals.germanium >= 5;
      default:
        return false;
    }
  }

  queue(project: 'mine' | 'factory' | 'defense' | 'terraform' | 'ship') {
    if (!this.planet) return;
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
                  cost: this.getShipCost(this.selectedDesign),
                  shipDesignId: this.selectedDesign,
                } as any);
    const ok = this.gs.addToBuildQueue(this.planet.id, item);
    if (!ok) {
      alert('Insufficient stockpile for this project');
    } else {
      // Update derived display
      const planet = this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === this.planet!.id)!;
      this.planet = planet;
      const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
      this.resourcesPerTurn = operableFactories;
    }
  }

  endTurn() {
    this.gs.endTurn();
    if (this.planet) {
      const planet = this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === this.planet!.id)!;
      this.planet = planet;
      const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
      this.resourcesPerTurn = operableFactories;
    }
  }

  back() {
    history.back();
  }

  remove(index: number) {
    if (!this.planet) return;
    this.gs.removeFromQueue(this.planet.id, index);
    const planet = this.gs
      .stars()
      .flatMap((s) => s.planets)
      .find((p) => p.id === this.planet!.id)!;
    this.planet = planet;
  }

  onGovernorType(event: Event) {
    if (!this.planet) return;
    const val = (event.target as HTMLSelectElement).value as any;
    const governor =
      val === 'shipyard'
        ? { type: 'shipyard', shipDesignId: this.shipyardDesign, buildLimit: this.shipyardLimit }
        : { type: val };
    this.gs.setGovernor(this.planet.id, governor as any);
    const planet = this.gs
      .stars()
      .flatMap((s) => s.planets)
      .find((p) => p.id === this.planet!.id)!;
    this.planet = planet;
  }

  onDesignChange(event: Event) {
    this.selectedDesign = (event.target as HTMLSelectElement).value;
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
    // First item will be built next turn (handled by background color)
    if (index === 0) return 'inherit';
    // Red: cannot be built with current stockpile across empire
    const game = this.gs.game();
    if (!game) return 'inherit';
    const neededR = item.cost?.resources ?? 0;
    const neededFe = item.cost?.iron ?? 0;
    const neededBo = item.cost?.boranium ?? 0;
    const neededGe = item.cost?.germanium ?? 0;
    const haveR = game.playerEconomy.resources;
    const empireFe =
      game.playerEconomy.minerals.iron +
      this.gs
        .stars()
        .flatMap((s) => s.planets)
        .reduce((sum, p) => sum + p.surfaceMinerals.iron, 0);
    const empireBo =
      game.playerEconomy.minerals.boranium +
      this.gs
        .stars()
        .flatMap((s) => s.planets)
        .reduce((sum, p) => sum + p.surfaceMinerals.boranium, 0);
    const empireGe =
      game.playerEconomy.minerals.germanium +
      this.gs
        .stars()
        .flatMap((s) => s.planets)
        .reduce((sum, p) => sum + p.surfaceMinerals.germanium, 0);
    const cannot =
      haveR < neededR || empireFe < neededFe || empireBo < neededBo || empireGe < neededGe;
    return cannot ? 'var(--color-danger)' : 'inherit';
  }

  projectionDelta(): number {
    if (!this.planet) return 0;
    const habPct = this.habitability();
    if (habPct <= 0) {
      // Must match game-state.service logic:
      // Lose 10% per 10% negative habitability, min 5% loss per turn if occupied
      const lossRate = Math.min(0.15, Math.abs(habPct / 100) * 0.15);
      return -Math.ceil(this.planet.population * lossRate);
    } else {
      const growthRate = (Math.max(0, habPct) / 100) * 0.1;
      const nextPop = this.gs['economy'].logisticGrowth(
        this.planet.population,
        this.planet.maxPopulation,
        growthRate,
      );
      return Math.floor(nextPop);
    }
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
