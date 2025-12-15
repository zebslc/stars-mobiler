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
    <main style="padding:1rem" *ngIf="planet; else missing">
      <header style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button (click)="back()">← Back</button>
          <h2 style="margin:0">{{ planet.name }}</h2>
        </div>
        <small
          >Owner:
          {{
            planet.ownerId === gs.player()?.id ? 'You' : planet.ownerId ? 'Enemy' : 'Unowned'
          }}</small
        >
      </header>
      <section style="display:grid;gap:1rem;margin-top:1rem">
        <div>Habitability: {{ habitability() }}%</div>
        <div>
          Population
          <div style="background:#eee;height:12px;border-radius:6px;overflow:hidden">
            <div
              [style.width.%]="(planet.population / planet.maxPopulation) * 100"
              style="background:#2e86de;height:12px"
            ></div>
          </div>
          <small>{{ planet.population | number }} / {{ planet.maxPopulation | number }}</small>
        </div>
        <div>
          Production
          <div>Factories: {{ planet.factories }} → {{ resourcesPerTurn }} resources/turn</div>
        </div>
        <div>Mines: {{ planet.mines }}</div>
        <div>
          Minerals (surface)
          <div>
            Fe {{ planet.surfaceMinerals.iron }} • Bo {{ planet.surfaceMinerals.boranium }} • Ge
            {{ planet.surfaceMinerals.germanium }}
          </div>
        </div>
        <div>
          Concentrations
          <div style="display:grid;gap:0.25rem">
            <div>
              Fe {{ planet.mineralConcentrations.iron }}%
              <div style="background:#eee;height:8px">
                <div
                  [style.width.%]="planet.mineralConcentrations.iron"
                  style="background:#636e72;height:8px"
                ></div>
              </div>
            </div>
            <div>
              Bo {{ planet.mineralConcentrations.boranium }}%
              <div style="background:#eee;height:8px">
                <div
                  [style.width.%]="planet.mineralConcentrations.boranium"
                  style="background:#6ab04c;height:8px"
                ></div>
              </div>
            </div>
            <div>
              Ge {{ planet.mineralConcentrations.germanium }}%
              <div style="background:#eee;height:8px">
                <div
                  [style.width.%]="planet.mineralConcentrations.germanium"
                  style="background:#f9ca24;height:8px"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <hr />
      <section style="display:grid;gap:0.5rem">
        <h3>Build Queue</h3>
        <div>
          <button (click)="queue('mine')" [disabled]="!canAfford('mine')">+ Mine (5 R)</button>
          <button (click)="queue('factory')" [disabled]="!canAfford('factory')">
            + Factory (10 R, 4 Ge)
          </button>
          <button (click)="queue('defense')" [disabled]="!canAfford('defense')">
            + Defense (15 R, 2 Fe, 2 Bo)
          </button>
          <button (click)="queue('terraform')" [disabled]="!canAfford('terraform')">
            + Terraform (25 R, 5 Ge)
          </button>
          <span style="display:inline-flex;gap:0.25rem;align-items:center;margin-left:0.5rem">
            Ship:
            <select [value]="selectedDesign" (change)="onDesignChange($event)">
              <option value="scout">Scout</option>
              <option value="frigate">Frigate</option>
              <option value="destroyer">Destroyer</option>
            </select>
            <button (click)="queue('ship')" [disabled]="!canAfford('ship')">+ Build Ship</button>
          </span>
        </div>
        <ul>
          <li *ngFor="let it of planet.buildQueue ?? []; let i = index">
            {{ it.project }} — cost {{ it.cost.resources }} R
            <button (click)="remove(i)">×</button>
          </li>
        </ul>
        <div>
          Governor:
          <select [value]="planet.governor?.type ?? 'manual'" (change)="onGovernorType($event)">
            <option value="manual">Manual</option>
            <option value="balanced">Balanced</option>
            <option value="mining">Mining</option>
            <option value="industrial">Industrial</option>
            <option value="military">Military</option>
            <option value="shipyard">Shipyard</option>
          </select>
          <span
            *ngIf="planet.governor?.type === 'shipyard'"
            style="display:inline-flex;gap:0.25rem;align-items:center;margin-left:0.5rem"
          >
            Design:
            <select [value]="shipyardDesign" (change)="onShipyardDesignChange($event)">
              <option value="scout">Scout</option>
              <option value="frigate">Frigate</option>
              <option value="destroyer">Destroyer</option>
            </select>
            Limit:
            <input
              type="number"
              [value]="shipyardLimit"
              (input)="onShipyardLimit($event)"
              style="width:4rem"
            />
          </span>
        </div>
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
              : ({ project: 'ship', cost: this.getShipCost(this.selectedDesign) } as any);
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
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
