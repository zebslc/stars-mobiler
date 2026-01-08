import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Fleet } from '../../models/game.model';
import { FleetCardComponent } from './components/fleet-card.component';
import { getDesign } from '../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-fleets-overview',
  imports: [CommonModule, FleetCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:var(--space-lg);max-width:1400px;margin:0 auto">
      <h1 style="margin-bottom:var(--space-lg)">Fleets</h1>

      @if (fleets().length === 0) {
        <div class="empty-state">
          <p>You don't have any fleets yet.</p>
          <p class="text-muted">Build ships at your planets to create fleets!</p>
        </div>
      }

      <div class="fleets-grid">
        @for (fleet of fleets(); track fleet.id) {
          <app-fleet-card [fleet]="fleet" (jumpToFleet)="jumpToFleet(fleet)"> </app-fleet-card>
        }
      </div>
    </main>
  `,
  styles: [
    `
      .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--color-text-muted);
      }

      .fleets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--space-lg);
      }
    `,
  ],
})
export class FleetsOverviewComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);

  fleets = computed(() => {
    const game = this.gs.game();
    const allFleets = game?.fleets || [];
    const playerId = this.gs.player()?.id;

    if (!game || !playerId) return [];

    const starbaseIds = new Set<string>();

    // Check player designs
    game.shipDesigns.forEach((d) => {
      if (d.spec?.isStarbase) {
        starbaseIds.add(d.id);
      }
    });

    return allFleets.filter((f) => {
      if (f.ownerId !== playerId) return false;

      // Check if fleet contains any starbase
      const hasStarbase = f.ships.some((s) => {
        if (starbaseIds.has(s.designId)) return true;

        // Check static data as fallback
        const staticDesign = getDesign(s.designId);
        return !!staticDesign.isStarbase;
      });

      return !hasStarbase;
    });
  });

  jumpToFleet(fleet: Fleet) {
    this.router.navigate(['/fleet', fleet.id]);
  }
}
