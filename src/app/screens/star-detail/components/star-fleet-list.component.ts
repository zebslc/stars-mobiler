import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { Fleet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game/game-state.service';
import { ShipDesignResolverService } from '../../../services/ship-design';
import { FleetCardComponent } from '../../fleets-overview/components/fleet-card.component';

@Component({
  standalone: true,
  selector: 'app-star-fleet-list',
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
                  Colonize Star
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
  styleUrl: './star-fleet-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarFleetListComponent {
  gs = inject(GameStateService);
  private router = inject(Router);
  private shipDesignResolver = inject(ShipDesignResolverService);

  readonly fleets = input.required<Array<Fleet>>();
  readonly starOwnerId = input<string | null>(null);

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

  hasColonyShip(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.shipDesignResolver.resolve(s.designId, this.gs.game());
      return !!d?.colonyModule;
    });
  }

  hasCargo(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.shipDesignResolver.resolve(s.designId, this.gs.game());
      return (d?.cargoCapacity ?? 0) > 0;
    });
  }

  hasWeapons(fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = this.shipDesignResolver.resolve(s.designId, this.gs.game());
      return (d?.firepower ?? 0) > 0;
    });
  }

  canColonize(fleet: Fleet): boolean {
    if (fleet.ownerId !== this.gs.player()?.id) return false;
    if (!this.hasColonyShip(fleet)) return false;
    return !this.starOwnerId();
  }
}
