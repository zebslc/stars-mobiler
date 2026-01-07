import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Planet } from '../../models/game.model';
import { PlanetCardComponent } from './components/planet-card.component';

@Component({
  standalone: true,
  selector: 'app-planets-overview',
  imports: [CommonModule, PlanetCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="planets-container">
      <h1 style="margin-bottom:var(--space-lg)">Planets</h1>

      @if (planets().length === 0) {
        <div class="empty-state">
          <p>You don't own any planets yet.</p>
          <p class="text-muted">Explore the galaxy and colonize planets to expand your empire!</p>
        </div>
      }

      <div class="planets-grid">
        @for (planet of planets(); track planet.id) {
          <app-planet-card
            [planet]="planet"
            (viewPlanet)="onViewPlanet(planet)"
            (viewOnMap)="onViewOnMap(planet)"
          >
          </app-planet-card>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .planets-container {
        padding: var(--space-lg);
        max-width: 1400px;
        margin: 0 auto;
      }

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

      @media (max-width: 600px) {
        .planets-container {
          padding: var(--space-md);
        }

        .planets-grid {
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }
      }
    `,
  ],
})
export class PlanetsOverviewComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);

  planets = computed(() => {
    const stars = this.gs.stars();
    const playerId = this.gs.player()?.id;
    return stars.flatMap((s) => s.planets).filter((p) => p.ownerId === playerId);
  });

  onViewPlanet(planet: Planet) {
    this.router.navigate(['/planet', planet.id]);
  }

  onViewOnMap(planet: Planet) {
    this.router.navigate(['/map'], { queryParams: { planetId: planet.id } });
  }
}

