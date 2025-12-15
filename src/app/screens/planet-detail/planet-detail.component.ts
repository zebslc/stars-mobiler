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
    <main *ngIf="planet; else missing" style="padding:1rem">
      <header
        style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem;background:#1a1a2e;padding:1rem;color:#fff;border-radius:4px"
      >
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;gap:0.5rem;align-items:center">
            <button
              (click)="back()"
              style="background:rgba(255,255,255,0.2);color:#fff;border:none;padding:0.25rem 0.5rem;border-radius:4px;cursor:pointer"
            >
              ← Back
            </button>
            <h2 style="margin:0;font-size:1.4rem">{{ planet.name }}</h2>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.8rem;opacity:0.8">Owner</div>
            <div style="font-weight:bold">
              {{
                planet.ownerId === gs.player()?.id ? 'You' : planet.ownerId ? 'Enemy' : 'Unowned'
              }}
            </div>
          </div>
        </div>

        <div
          style="display:flex;gap:0.5rem;align-items:center;background:rgba(255,255,255,0.1);padding:0.5rem;border-radius:4px;margin-top:0.25rem"
        >
          <label style="font-weight:bold;font-size:0.9rem;white-space:nowrap">Governor:</label>
          <select
            [value]="planet.governor?.type ?? 'manual'"
            (change)="onGovernorType($event)"
            style="background:rgba(0,0,0,0.3);color:#fff;border:1px solid rgba(255,255,255,0.3);padding:0.25rem;border-radius:2px;flex-grow:1;font-size:0.9rem"
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
          style="display:flex;gap:0.5rem;align-items:center;background:rgba(46, 134, 222, 0.2);padding:0.5rem;border-radius:4px;font-size:0.85rem"
        >
          <div style="flex-grow:1">
            <label style="display:block;opacity:0.8;margin-bottom:0.1rem">Auto-Design</label>
            <select
              [value]="shipyardDesign"
              (change)="onShipyardDesignChange($event)"
              style="width:100%;background:rgba(0,0,0,0.3);color:#fff;border:none;padding:0.1rem"
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
          <div style="width:60px">
            <label style="display:block;opacity:0.8;margin-bottom:0.1rem">Limit</label>
            <input
              type="number"
              [value]="shipyardLimit"
              (input)="onShipyardLimit($event)"
              style="width:100%;background:rgba(0,0,0,0.3);color:#fff;border:none;padding:0.1rem"
              placeholder="∞"
            />
          </div>
        </div>
      </header>
      <section style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;font-size:0.9em">
        <div style="flex:1;min-width:280px;background:#f9f9f9;padding:0.75rem;border-radius:4px">
          <h3
            style="margin:0 0 0.5rem 0;font-size:1em;border-bottom:1px solid #ddd;padding-bottom:0.25rem"
          >
            Vital Statistics
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
            <div>
              <div style="color:#666">Habitability</div>
              <div style="font-weight:bold">{{ habitability() }}%</div>
            </div>
            <div>
              <div style="color:#666">Population</div>
              <div>{{ planet.population | number }}</div>
              <div
                [style.color]="projectionDelta() >= 0 ? '#2ecc71' : '#e74c3c'"
                style="font-size:0.85em"
              >
                {{ projectionDelta() >= 0 ? '+' : '' }}{{ projectionDelta() | number }}
              </div>
            </div>
            <div>
              <div style="color:#666">Mines</div>
              <div>{{ planet.mines }}</div>
            </div>
            <div>
              <div style="color:#666">Factories</div>
              <div>{{ planet.factories }}</div>
            </div>
          </div>
        </div>

        <div style="flex:1;min-width:280px;background:#f9f9f9;padding:0.75rem;border-radius:4px">
          <h3
            style="margin:0 0 0.5rem 0;font-size:1em;border-bottom:1px solid #ddd;padding-bottom:0.25rem"
          >
            Resources
          </h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem;text-align:center">
            <div style="background:#e0e0e0;padding:0.25rem;border-radius:2px">
              <div style="font-weight:bold;color:#2c3e50">Iron</div>
              <div style="font-size:1.1em">{{ planet.surfaceMinerals.iron }}</div>
              <div style="font-size:0.75em;color:#666">
                {{ planet.mineralConcentrations.iron }}%
              </div>
            </div>
            <div style="background:#e0e0e0;padding:0.25rem;border-radius:2px">
              <div style="font-weight:bold;color:#27ae60">Boranium</div>
              <div style="font-size:1.1em">{{ planet.surfaceMinerals.boranium }}</div>
              <div style="font-size:0.75em;color:#666">
                {{ planet.mineralConcentrations.boranium }}%
              </div>
            </div>
            <div style="background:#e0e0e0;padding:0.25rem;border-radius:2px">
              <div style="font-weight:bold;color:#f39c12">Germanium</div>
              <div style="font-size:1.1em">{{ planet.surfaceMinerals.germanium }}</div>
              <div style="font-size:0.75em;color:#666">
                {{ planet.mineralConcentrations.germanium }}%
              </div>
            </div>
          </div>
          <div style="margin-top:0.5rem;text-align:center;font-size:0.9em;color:#555">
            Producing <span style="font-weight:bold">{{ resourcesPerTurn }}</span> resources / turn
          </div>
        </div>
      </section>
      <hr />
      <section style="display:grid;gap:0.5rem">
        <h3>Build Queue</h3>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;width:100%">
            <button
              (click)="queue('mine')"
              [disabled]="!canAfford('mine')"
              style="padding:0.75rem;min-width:60px;flex:1;background:#2c3e50;color:#fff;border:none;border-radius:4px;cursor:pointer;opacity:1"
              [style.opacity]="canAfford('mine') ? 1 : 0.5"
            >
              <div style="font-weight:bold;font-size:0.9rem">Mine</div>
              <div style="font-size:0.75em;opacity:0.8;margin-top:0.1rem">5 R</div>
            </button>
            <button
              (click)="queue('factory')"
              [disabled]="!canAfford('factory')"
              style="padding:0.75rem;min-width:60px;flex:1;background:#2c3e50;color:#fff;border:none;border-radius:4px;cursor:pointer"
              [style.opacity]="canAfford('factory') ? 1 : 0.5"
            >
              <div style="font-weight:bold;font-size:0.9rem">Factory</div>
              <div style="font-size:0.75em;opacity:0.8;margin-top:0.1rem">10 R, 4 Ge</div>
            </button>
            <button
              (click)="queue('defense')"
              [disabled]="!canAfford('defense')"
              style="padding:0.75rem;min-width:60px;flex:1;background:#2c3e50;color:#fff;border:none;border-radius:4px;cursor:pointer"
              [style.opacity]="canAfford('defense') ? 1 : 0.5"
            >
              <div style="font-weight:bold;font-size:0.9rem">Defense</div>
              <div style="font-size:0.75em;opacity:0.8;margin-top:0.1rem">15 R, 2 Fe, 2 Bo</div>
            </button>
            <button
              (click)="queue('terraform')"
              [disabled]="!canAfford('terraform')"
              style="padding:0.75rem;min-width:60px;flex:1;background:#2c3e50;color:#fff;border:none;border-radius:4px;cursor:pointer"
              [style.opacity]="canAfford('terraform') ? 1 : 0.5"
            >
              <div style="font-weight:bold;font-size:0.9rem">Terraform</div>
              <div style="font-size:0.75em;opacity:0.8;margin-top:0.1rem">25 R, 5 Ge</div>
            </button>
          </div>

          <div
            style="display:flex;flex-direction:column;gap:0.5rem;width:100%;background:#e3f2fd;padding:0.75rem;border-radius:4px;border:1px solid #90caf9"
          >
            <span style="font-weight:bold;color:#1565c0;font-size:0.9rem">Ship Construction</span>
            <div style="display:flex;gap:0.5rem">
              <select
                [value]="selectedDesign"
                (change)="onDesignChange($event)"
                style="flex-grow:1;padding:0.5rem;min-height:44px;font-size:0.95rem;width:0;border:1px solid #90caf9;border-radius:4px;background:#fff"
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
                style="padding:0.5rem 1rem;min-height:44px;font-weight:bold;white-space:nowrap;background:#1565c0;color:#fff;border:none;border-radius:4px;cursor:pointer"
                [style.opacity]="canAfford('ship') ? 1 : 0.5"
              >
                Build
              </button>
            </div>
          </div>
        </div>
        <div
          *ngIf="(planet.buildQueue?.length ?? 0) > 0"
          style="background:#fff;border:1px solid #ddd;border-radius:4px;overflow:hidden;margin-top:0.5rem"
        >
          <div
            *ngFor="let it of planet.buildQueue ?? []; let i = index"
            style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-bottom:1px solid #eee"
            [style.background]="i === 0 ? '#f0fff4' : '#fff'"
          >
            <div [style.color]="queueColor(it, i)" style="font-weight:500;font-size:0.95rem">
              <span style="display:inline-block;width:20px;color:#999;font-size:0.8em">{{
                i + 1
              }}</span>
              {{ it.project | titlecase }}
              <span
                *ngIf="it.project === 'ship' && it.shipDesignId"
                style="color:#666;font-size:0.9em"
                >({{ it.shipDesignId }})</span
              >
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <span
                style="font-size:0.85em;color:#666;font-family:monospace;background:#f5f5f5;padding:2px 6px;border-radius:3px"
                >{{ it.cost.resources }}R</span
              >
              <button
                (click)="remove(i)"
                style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#ffebee;color:#c0392b;border:none;border-radius:4px;font-size:1.2rem;cursor:pointer"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <!-- Governor moved to header -->
      </section>
      <hr />
      <section>
        <button (click)="endTurn()">End Turn ▶</button>
      </section>
    </main>
    <ng-template #missing>
      <main style="padding:1rem">
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
    // Green: first item will be built next turn
    if (index === 0) return '#2ecc71';
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
    return cannot ? '#e74c3c' : 'inherit';
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
