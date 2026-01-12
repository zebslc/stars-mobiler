import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { SPECIES } from '../../data/species.data';

@Component({
  standalone: true,
  selector: 'app-new-game',
  template: `
    <main class="new-game-container">
      <div class="card setup-card">
        <h2 class="title">New Game</h2>
        <div class="form-grid">
          <div>
            <label>Galaxy Seed</label>
            <input type="number" [value]="seed()" (input)="onSeedInput($event)" class="form-input" />
            <div class="helper-text">Random number that determines galaxy generation</div>
          </div>
          <div>
            <label>Galaxy Size</label>
            <select [value]="size()" (change)="onSizeChange($event)" class="form-input">
              <option value="small">Small (16 star systems)</option>
              <option value="medium">Medium (24 star systems)</option>
              <option value="large">Large (36 star systems)</option>
            </select>
            <div class="helper-text">More stars means longer gameplay</div>
          </div>
          <div>
            <label>Your Species</label>
            <select [value]="speciesId()" (change)="onSpeciesChange($event)" class="form-input">
              @for (s of species; track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
            <div class="helper-text">Each species has unique traits and abilities</div>
          </div>

          @if (selectedSpecies(); as spec) {
            <div class="species-traits">
              <h3 class="trait-section-title">Racial Traits</h3>

              @if (spec.primaryTraits && spec.primaryTraits.length > 0) {
                <div class="trait-category">
                  <div class="trait-category-label">Primary Trait</div>
                  @for (trait of spec.primaryTraits; track trait) {
                    <div class="trait-badge primary">{{ trait }}</div>
                  }
                </div>
              }

              @if (spec.lesserTraits && spec.lesserTraits.length > 0) {
                <div class="trait-category">
                  <div class="trait-category-label">Lesser Traits</div>
                  <div class="trait-list">
                    @for (trait of spec.lesserTraits; track trait) {
                      <div class="trait-badge lesser">{{ trait }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
          <button (click)="start()" class="btn-primary start-button">Start Game</button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .new-game-container {
      padding: var(--space-lg);
      height: 100%;
      overflow-y: auto;
      display: flex;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .setup-card {
      margin: auto;
      max-width: 500px;
      width: 100%;
      box-shadow: var(--shadow-lg);
    }

    .title {
      margin-bottom: var(--space-xl);
      text-align: center;
      color: var(--color-primary);
    }

    .form-grid {
      display: grid;
      gap: var(--space-xl);
    }

    .form-input {
      width: 100%;
    }

    .helper-text {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-xs);
    }

    .start-button {
      padding: var(--space-lg);
      font-size: var(--font-size-lg);
    }

    .species-traits {
      background: var(--color-bg-secondary, #f9f9f9);
      border: 1px solid var(--color-border, #ddd);
      border-radius: var(--radius-md, 8px);
      padding: var(--space-lg);
    }

    .trait-section-title {
      margin: 0 0 var(--space-md) 0;
      font-size: var(--font-size-md);
      color: var(--color-primary);
    }

    .trait-category {
      margin-bottom: var(--space-md);
    }

    .trait-category:last-child {
      margin-bottom: 0;
    }

    .trait-category-label {
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xs);
      letter-spacing: 0.5px;
    }

    .trait-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
    }

    .trait-badge {
      display: inline-block;
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--font-size-xs);
      font-weight: 500;
    }

    .trait-badge.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
    }

    .trait-badge.lesser {
      background: var(--color-bg-tertiary, #e0e0e0);
      color: var(--color-text-main, #333);
    }
  `],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewGameComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);

  seed = signal(Math.floor(Math.random() * 100000));
  size = signal<'small' | 'medium' | 'large'>('small');
  speciesId = signal(SPECIES[0].id);

  readonly species = SPECIES;
  readonly selectedSpecies = computed(() =>
    SPECIES.find(s => s.id === this.speciesId())
  );

  onSeedInput(event: Event) {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(val)) {
      this.seed.set(val);
    }
  }

  onSizeChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as 'small' | 'medium' | 'large';
    this.size.set(val);
  }

  onSpeciesChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.speciesId.set(val);
  }

  start() {
    this.gs.newGame({
      seed: this.seed(),
      galaxySize: this.size(),
      aiCount: 1,
      aiDifficulty: 'medium',
      speciesId: this.speciesId()
    });
    this.router.navigateByUrl('/map');
  }
}
