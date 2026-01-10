import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { TechService } from '../../services/tech.service';
import { Planet } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { getHull } from '../../utils/data-access.util';
import { PlanetCardComponent } from './components/planet-card.component';

@Component({
  standalone: true,
  selector: 'app-planets-overview',
  imports: [CommonModule, PlanetCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="planets-container">
      <div class="header-row">
        <h1 style="margin-bottom:0">Planets</h1>

        <div class="control-group">
          <button [class.active]="filterMode() === 'Normal'" (click)="filterMode.set('Normal')">
            Normal
          </button>
          <button [class.active]="filterMode() === 'Starbase'" (click)="filterMode.set('Starbase')">
            Starbase
          </button>
        </div>
      </div>

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
            [starbase]="starbaseMap().get(planet.id) || null"
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

      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-lg);
        flex-wrap: wrap;
        gap: var(--space-md);
      }

      .control-group {
        display: flex;
        background: var(--color-bg-secondary);
        border-radius: var(--radius-md);
        padding: 4px;
        gap: 4px;
      }

      .control-group button {
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--font-size-sm);
        font-weight: 500;
        transition: all 0.2s;
      }

      .control-group button:hover {
        color: var(--color-text);
        background: rgba(255, 255, 255, 0.05);
      }

      .control-group button.active {
        background: var(--color-primary);
        color: white;
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
  private techService = inject(TechService);

  filterMode = signal<'Normal' | 'Starbase'>('Normal');

  starbaseMap = computed(() => {
    const game = this.gs.game();
    const map = new Map<string, { designId: string; name: string; imageClass: string }>();
    if (!game) return map;

    const playerId = this.gs.player()?.id;

    for (const fleet of game.fleets) {
      // Debug logging for starbase detection
      if (fleet.location.type === 'orbit') {
        const planetId = (fleet.location as any).planetId;
        const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
        if (planet?.name === 'Home') {
          console.log('Checking fleet at Home:', fleet);
          console.log('Ships:', fleet.ships);
        }
      }

      if (fleet.ownerId !== playerId) continue;
      if (fleet.location.type !== 'orbit') continue;

      // Check if starbase
      for (const ship of fleet.ships) {
        // Try dynamic designs first
        const dynamicDesign = game.shipDesigns.find((d) => d.id === ship.designId);
        let isStarbase = false;
        let designName = '';
        let hullName = '';

        if (dynamicDesign) {
          const hull = getHull(dynamicDesign.hullId);
          if (hull) {
            isStarbase =
              hull.isStarbase ||
              hull.type === 'starbase' ||
              [
                'Orbital Fort',
                'Space Dock',
                'Space Station',
                'Ultra Station',
                'Death Star',
                'Starbase',
              ].includes(hull.Name);
            designName = dynamicDesign.name;
            hullName = hull.Name;
          }
        } else {
          // Predefined
          const design = getDesign(ship.designId);
          if (design) {
            isStarbase = design.isStarbase || false;
            designName = design.name;
            hullName = design.hullName;
          }
        }

        if (isStarbase) {
          map.set((fleet.location as any).planetId, {
            designId: ship.designId,
            name: designName,
            imageClass: this.techService.getHullImageClass(hullName),
          });
          break; // Found starbase for this fleet/planet
        }
      }
    }
    return map;
  });

  planets = computed(() => {
    const stars = this.gs.stars();
    const playerId = this.gs.player()?.id;
    const allPlanets = stars.flatMap((s) => s.planets).filter((p) => p.ownerId === playerId);

    if (this.filterMode() === 'Starbase') {
      const sbMap = this.starbaseMap();
      return allPlanets.sort((a, b) => {
        const hasA = sbMap.has(a.id) ? 1 : 0;
        const hasB = sbMap.has(b.id) ? 1 : 0;
        return hasB - hasA; // Starbases first
      });
    }

    return allPlanets;
  });

  onViewPlanet(planet: Planet) {
    this.router.navigate(['/planet', planet.id]);
  }

  onViewOnMap(planet: Planet) {
    this.router.navigate(['/map'], { queryParams: { planetId: planet.id } });
  }
}
