import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Fleet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';
import { getDesign } from '../../../data/ships.data';
import { getHull, getAllComponents } from '../../../utils/data-access.util';
import { compileShipStats } from '../../../models/ship-design.model';
import { miniaturizeComponent } from '../../../utils/miniaturization.util';
import { FleetCardComponent } from '../../fleets-overview/components/fleet-card.component';

@Component({
  standalone: true,
  selector: 'app-planet-fleet-list',
  imports: [CommonModule, FleetCardComponent],
  template: `
    <div class="fleets-container">
      @if (fleets().length > 0) {
        @for (fleet of fleets(); track fleet.id) {
          <app-fleet-card
            [fleet]="fleet"
            (jumpToFleet)="onJumpToFleet(fleet)"
            (viewDetails)="onViewDetails(fleet)"
          >
            @if (canColonize(fleet)) {
              <div footer-actions>
                <button (click)="colonize.emit(fleet.id)" class="btn-action">
                  Colonize Planet
                </button>
              </div>
            }
          </app-fleet-card>
        }
      } @else {
        <div class="empty-state">No ships in orbit.</div>
      }
    </div>
  `,
  styleUrl: './planet-fleet-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetFleetListComponent {
  gs = inject(GameStateService);
  private router = inject(Router);

  fleets = input.required<Fleet[]>();
  planetOwnerId = input<string | null>(null);

  colonize = output<string>();

  onJumpToFleet(fleet: Fleet) {
    this.router.navigate(['/map'], { queryParams: { fleetId: fleet.id } });
  }

  onViewDetails(fleet: Fleet) {
    this.router.navigate(['/fleet', fleet.id]);
  }

  getShipCount(fleet: Fleet): number {
    return fleet.ships.reduce((acc, s) => acc + s.count, 0);
  }

  private getShipDesign(designId: string): any {
    const game = this.gs.game();
    const dynamicDesign = game?.shipDesigns.find((d) => d.id === designId);

    if (dynamicDesign) {
      if (dynamicDesign.spec) {
        return {
          ...dynamicDesign.spec,
          colonyModule: dynamicDesign.spec.hasColonyModule,
        };
      }

      // Fallback: Compile stats on the fly
      const hull = getHull(dynamicDesign.hullId);
      if (hull) {
        const player = this.gs.player();
        const techLevels = player?.techLevels || {
          Energy: 0,
          Kinetics: 0,
          Propulsion: 0,
          Construction: 0,
          Electronics: 0,
          Biotechnology: 0,
        };
        const miniaturizedComponents = getAllComponents().map((comp) =>
          miniaturizeComponent(comp, techLevels),
        );
        const stats = compileShipStats(hull, dynamicDesign.slots, miniaturizedComponents);
        return {
          ...stats,
          colonyModule: stats.hasColonyModule,
        };
      }
    }
    return getDesign(designId);
  }

  hasColonyShip(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.getShipDesign(s.designId);
      return !!d?.colonyModule;
    });
  }

  hasCargo(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.getShipDesign(s.designId);
      return (d?.cargoCapacity ?? 0) > 0;
    });
  }

  hasWeapons(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.getShipDesign(s.designId);
      return (d?.firepower ?? 0) > 0;
    });
  }

  canColonize(fleet: Fleet): boolean {
    if (fleet.ownerId !== this.gs.player()?.id) return false;
    if (!this.hasColonyShip(fleet)) return false;
    // Can only colonize if planet is unowned (null)
    return !this.planetOwnerId();
  }
}
