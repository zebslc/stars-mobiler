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
        <small>Owner: {{ planet.ownerId === gs.player()?.id ? 'You' : (planet.ownerId ? 'Enemy' : 'Unowned') }}</small>
      </header>
      <section style="display:grid;gap:1rem;margin-top:1rem">
        <div>
          Habitability: {{ habitability() }}%
        </div>
        <div>
          Population: {{ planet.population | number }} / {{ planet.maxPopulation | number }}
        </div>
        <div>
          Factories: {{ planet.factories }} → Resources/turn: {{ resourcesPerTurn }}
        </div>
        <div>
          Mines: {{ planet.mines }}
        </div>
        <div>
          Minerals (surface): Fe {{ planet.surfaceMinerals.iron }} • Bo {{ planet.surfaceMinerals.boranium }} • Ge {{ planet.surfaceMinerals.germanium }}
        </div>
        <div>
          Concentrations: Fe {{ planet.mineralConcentrations.iron }}% • Bo {{ planet.mineralConcentrations.boranium }}% • Ge {{ planet.mineralConcentrations.germanium }}%
        </div>
      </section>
      <hr />
      <section style="display:grid;gap:0.5rem">
        <h3>Build Queue</h3>
        <div>
          <button (click)="queue('mine')" [disabled]="!canAfford('mine')">+ Mine (5 R)</button>
          <button (click)="queue('factory')" [disabled]="!canAfford('factory')">+ Factory (10 R, 4 Ge)</button>
          <button (click)="queue('defense')" [disabled]="!canAfford('defense')">+ Defense (15 R, 2 Fe, 2 Bo)</button>
          <button (click)="queue('terraform')" [disabled]="!canAfford('terraform')">+ Terraform (25 R, 5 Ge)</button>
        </div>
        <ul>
          <li *ngFor="let it of (planet.buildQueue ?? [])">
            {{ it.project }} — cost {{ it.cost.resources }} R
          </li>
        </ul>
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanetDetailComponent {
  private route = inject(ActivatedRoute);
  readonly gs = inject(GameStateService);
  private hab = inject(HabitabilityService);
  planet: Planet | null = null;
  resourcesPerTurn = 0;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const planet = this.gs.stars().flatMap(s => s.planets).find(p => p.id === id);
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

  canAfford(project: 'mine' | 'factory' | 'defense' | 'terraform'): boolean {
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

  queue(project: 'mine' | 'factory' | 'defense' | 'terraform') {
    if (!this.planet) return;
    const item =
      project === 'mine'
        ? { project, cost: { resources: 5 } }
        : project === 'factory'
        ? { project, cost: { resources: 10, germanium: 4 } }
        : project === 'defense'
        ? { project, cost: { resources: 15, iron: 2, boranium: 2 } }
        : { project, cost: { resources: 25, germanium: 5 } };
    const ok = this.gs.addToBuildQueue(this.planet.id, item);
    if (!ok) {
      alert('Insufficient stockpile for this project');
    } else {
      // Update derived display
      const planet = this.gs.stars().flatMap(s => s.planets).find(p => p.id === this.planet!.id)!;
      this.planet = planet;
      const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
      this.resourcesPerTurn = operableFactories;
    }
  }

  endTurn() {
    this.gs.endTurn();
    if (this.planet) {
      const planet = this.gs.stars().flatMap(s => s.planets).find(p => p.id === this.planet!.id)!;
      this.planet = planet;
      const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
      this.resourcesPerTurn = operableFactories;
    }
  }

  back() {
    history.back();
  }
}
