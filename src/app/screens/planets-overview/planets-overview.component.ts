import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Planet } from '../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-planets-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:var(--space-lg);max-width:1400px;margin:0 auto">
      <h1 style="margin-bottom:var(--space-lg)">Planets</h1>

      <div *ngIf="planets().length === 0" class="empty-state">
        <p>You don't own any planets yet.</p>
        <p class="text-muted">Explore the galaxy and colonize planets to expand your empire!</p>
      </div>

      <div class="planets-grid">
        <div *ngFor="let planet of planets()" class="planet-card">
          <div class="planet-header">
            <h3>{{ planet.name }}</h3>
            <button (click)="jumpToPlanet(planet)" class="btn-small">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 8 12 12 16"/>
                <line x1="16" y1="12" x2="8" y2="12"/>
              </svg>
              View on Map
            </button>
          </div>

          <div class="planet-stats">
            <div class="stat-row">
              <span class="stat-label">Resources:</span>
              <span class="stat-value" style="color:var(--color-primary)">{{ planet.resources }}R</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Minerals:</span>
              <span class="stat-value">
                {{ planet.surfaceMinerals.iron }}Fe
                {{ planet.surfaceMinerals.boranium }}Bo
                {{ planet.surfaceMinerals.germanium }}Ge
              </span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Population:</span>
              <span class="stat-value">{{ planet.population | number }} / {{ (planet.maxPopulation / 1000000).toFixed(1) }}M</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Habitability:</span>
              <span class="stat-value" [style.color]="habitabilityColor(planet)">{{ habitability(planet) }}%</span>
            </div>
          </div>

          <div class="planet-production">
            <div class="production-row">
              <span class="text-small text-muted">Mines:</span>
              <span class="text-small">{{ planet.mines }}</span>
            </div>
            <div class="production-row">
              <span class="text-small text-muted">Factories:</span>
              <span class="text-small">{{ planet.factories }}</span>
            </div>
            <div class="production-row">
              <span class="text-small text-muted">Defenses:</span>
              <span class="text-small">{{ planet.defenses }}</span>
            </div>
          </div>

          <div *ngIf="buildQueue(planet).length > 0" class="build-queue">
            <div class="queue-header">Build Queue:</div>
            <div *ngFor="let item of buildQueue(planet).slice(0, 3); let i = index" class="queue-item">
              <span class="queue-index">{{ i + 1 }}.</span>
              <span class="queue-project">{{ item.project | titlecase }}</span>
              <span class="queue-cost text-xs text-muted">{{ item.cost.resources }}R</span>
            </div>
            <div *ngIf="buildQueue(planet).length > 3" class="text-xs text-muted" style="padding-left:var(--space-sm)">
              +{{ buildQueue(planet).length - 3 }} more
            </div>
          </div>

          <div *ngIf="buildQueue(planet).length === 0" class="text-small text-muted" style="padding:var(--space-md)">
            No items in build queue
          </div>

          <div class="research-section">
            <div class="text-small text-muted">Research Allocation: <span class="coming-soon">Coming Soon</span></div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: var(--space-xl);
      color: var(--color-text-muted);
    }

    .planets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-lg);
    }

    .planet-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .planet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--space-sm);
      border-bottom: 1px solid var(--color-border);
    }

    .planet-header h3 {
      margin: 0;
      font-size: var(--font-size-lg);
    }

    .btn-small {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: var(--font-size-sm);
    }

    .planet-stats {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .stat-value {
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .planet-production {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-sm);
      padding: var(--space-sm);
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-sm);
    }

    .production-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .build-queue {
      background: var(--color-bg-tertiary);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
    }

    .queue-header {
      font-weight: 600;
      margin-bottom: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    .queue-item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-xs) 0;
      font-size: var(--font-size-sm);
    }

    .queue-index {
      color: var(--color-text-muted);
      min-width: 20px;
    }

    .queue-project {
      flex: 1;
    }

    .queue-cost {
      margin-left: auto;
    }

    .research-section {
      padding-top: var(--space-sm);
      border-top: 1px solid var(--color-border);
    }

    .coming-soon {
      color: var(--color-warning);
      font-weight: 600;
    }
  `]
})
export class PlanetsOverviewComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);

  planets = computed(() => {
    const stars = this.gs.stars();
    const playerId = this.gs.player()?.id;
    return stars
      .flatMap(s => s.planets)
      .filter(p => p.ownerId === playerId);
  });

  buildQueue(planet: Planet) {
    return planet.buildQueue || [];
  }

  habitability(planet: Planet): number {
    return this.gs.habitabilityFor(planet.id);
  }

  habitabilityColor(planet: Planet): string {
    const hab = this.habitability(planet);
    return hab > 0 ? '#27ae60' : '#c0392b';
  }

  jumpToPlanet(planet: Planet) {
    this.router.navigate(['/planet', planet.id]);
  }
}
