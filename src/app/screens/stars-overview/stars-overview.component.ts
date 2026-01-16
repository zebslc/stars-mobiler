import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { TechService } from '../../services/tech/tech.service';
import type { Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { getHull } from '../../utils/data-access.util';
import { StarCardComponent } from './components/star-card.component';
import { LoggingService } from '../../services/core/logging.service';

@Component({
  standalone: true,
  selector: 'app-stars-overview',
  imports: [CommonModule, StarCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="stars-container">
      <div class="header-row">
        <h1 style="margin-bottom:0">Stars</h1>

        <div class="control-group">
          <button [class.active]="filterMode() === 'Normal'" (click)="filterMode.set('Normal')">
            Normal
          </button>
          <button [class.active]="filterMode() === 'Starbase'" (click)="filterMode.set('Starbase')">
            Starbase
          </button>
        </div>
      </div>

      @if (stars().length === 0) {
        <div class="empty-state">
          <p>You don't control any stars yet.</p>
          <p class="text-muted">Explore the galaxy and establish starbases to expand your empire!</p>
        </div>
      }

      <div class="stars-grid">
        @for (star of stars(); track star.id) {
          <app-star-card
            [star]="star"
            [starbase]="starbaseMap().get(star.id) || null"
            (viewStar)="onViewStar(star)"
            (viewOnMap)="onViewOnMap(star)"
          >
          </app-star-card>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .stars-container {
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

      .stars-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-lg);
      }

      @media (max-width: 600px) {
        .stars-container {
          padding: var(--space-md);
        }

        .stars-grid {
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }
      }
    `,
  ],
})
export class StarsOverviewComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private techService = inject(TechService);
  private logging = inject(LoggingService);

  readonly filterMode = signal<'Normal' | 'Starbase'>('Normal');

  readonly starbaseMap = computed(() => {
    const game = this.gs.game();
    const map = new Map<string, { designId: string; name: string; imageClass: string }>();
    if (!game) return map;

    const playerId = this.gs.player()?.id;

    for (const fleet of game.fleets) {
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
          map.set((fleet.location as any).starId, {
            designId: ship.designId,
            name: designName,
            imageClass: this.techService.getHullImageClass(hullName),
          });
          break; // Found starbase for this fleet/star
        }
      }
    }
    return map;
  });

  readonly stars = computed(() => {
    const stars = this.gs.stars();
    const playerId = this.gs.player()?.id;
    const ownedStars = stars.filter((s) => s.ownerId === playerId);

    if (this.filterMode() === 'Starbase') {
      const sbMap = this.starbaseMap();
      return ownedStars.sort((a, b) => {
        const hasA = sbMap.has(a.id) ? 1 : 0;
        const hasB = sbMap.has(b.id) ? 1 : 0;
        return hasB - hasA; // Starbases first
      });
    }

    return ownedStars;
  });

  onViewStar(star: Star) {
    this.router.navigate(['/star', star.id]);
  }

  onViewOnMap(star: Star) {
    this.router.navigate(['/map'], { queryParams: { starId: star.id } });
  }
}
