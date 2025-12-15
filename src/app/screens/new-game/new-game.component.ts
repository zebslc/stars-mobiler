import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { SPECIES } from '../../data/species.data';

@Component({
  standalone: true,
  selector: 'app-new-game',
  template: `
    <main style="padding:1rem; display:grid; gap:1rem">
      <h2>New Game</h2>
      <label>Seed
        <input type="number" [value]="seed" (input)="onSeedInput($event)" />
      </label>
      <label>Galaxy Size
        <select [value]="size" (change)="onSizeChange($event)">
          <option value="small">Small (16)</option>
          <option value="medium">Medium (24)</option>
          <option value="large">Large (36)</option>
        </select>
      </label>
      <label>Species
        <select [value]="speciesId" (change)="onSpeciesChange($event)">
          <option *ngFor="let s of species" [value]="s.id">{{ s.name }}</option>
        </select>
      </label>
      <button (click)="start()">Start Game</button>
    </main>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewGameComponent {
  seed = Math.floor(Math.random() * 100000);
  size: 'small' | 'medium' | 'large' = 'small';
  speciesId = SPECIES[0].id;
  species = SPECIES;

  constructor(private gs: GameStateService, private router: Router) {}

  onSeedInput(event: Event) {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.seed = Number.isFinite(val) ? val : this.seed;
  }
  onSizeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as 'small' | 'medium' | 'large';
    this.size = val;
  }
  onSpeciesChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.speciesId = val;
  }
  start() {
    this.gs.newGame({
      seed: this.seed,
      galaxySize: this.size,
      aiCount: 1,
      aiDifficulty: 'medium',
      speciesId: this.speciesId
    });
    this.router.navigateByUrl('/map');
  }
}
