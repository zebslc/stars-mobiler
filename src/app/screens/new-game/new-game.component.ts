import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { SPECIES } from '../../data/species.data';

@Component({
  standalone: true,
  selector: 'app-new-game',
  template: `
    <main style="padding:var(--space-lg); min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      <div class="card" style="max-width:500px; width:100%; box-shadow:var(--shadow-lg)">
        <h2 style="margin-bottom:var(--space-xl); text-align:center; color:var(--color-primary)">New Game</h2>
        <div style="display:grid; gap:var(--space-xl)">
          <div>
            <label>Galaxy Seed</label>
            <input type="number" [value]="seed" (input)="onSeedInput($event)" style="width:100%" />
            <div class="text-xs text-muted" style="margin-top:var(--space-xs)">Random number that determines galaxy generation</div>
          </div>
          <div>
            <label>Galaxy Size</label>
            <select [value]="size" (change)="onSizeChange($event)" style="width:100%">
              <option value="small">Small (16 star systems)</option>
              <option value="medium">Medium (24 star systems)</option>
              <option value="large">Large (36 star systems)</option>
            </select>
            <div class="text-xs text-muted" style="margin-top:var(--space-xs)">More stars means longer gameplay</div>
          </div>
          <div>
            <label>Your Species</label>
            <select [value]="speciesId" (change)="onSpeciesChange($event)" style="width:100%">
              <option *ngFor="let s of species" [value]="s.id">{{ s.name }}</option>
            </select>
            <div class="text-xs text-muted" style="margin-top:var(--space-xs)">Each species has unique habitat preferences</div>
          </div>
          <button (click)="start()" class="btn-primary" style="padding:var(--space-lg); font-size:var(--font-size-lg)">Start Game</button>
        </div>
      </div>
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
