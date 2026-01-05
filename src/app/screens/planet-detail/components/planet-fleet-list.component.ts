import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fleet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';
import { getDesign } from '../../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-planet-fleet-list',
  imports: [CommonModule],
  template: `
    <div class="fleets-container">
      @if (fleets().length > 0) {
        @for (fleet of fleets(); track fleet.id) {
          <div class="fleet-card">
            <div class="fleet-header">
              <span class="fleet-name">Fleet {{ fleet.id }}</span>
              <span class="fleet-owner" [class.me]="fleet.ownerId === gs.player()?.id">
                {{ fleet.ownerId === gs.player()?.id ? 'Me' : 'Enemy' }}
              </span>
            </div>
            
            <div class="fleet-details">
              <div class="ship-count">
                {{ getShipCount(fleet) }} Ships
              </div>
              @if (hasColonyShip(fleet)) {
                <div class="badge colony">Colony Ship</div>
              }
              @if (hasCargo(fleet)) {
                <div class="badge cargo">Cargo</div>
              }
              @if (hasWeapons(fleet)) {
                <div class="badge attack">Armed</div>
              }
            </div>
            
            <div class="fleet-cargo">
              @if (fleet.cargo.colonists > 0) {
                <span class="cargo-item">{{ fleet.cargo.colonists }} Colonists</span>
              }
            </div>

            <!-- Actions -->
            @if (canColonize(fleet)) {
              <button (click)="colonize.emit(fleet.id)" class="btn-action">
                Colonize Planet
              </button>
            }
          </div>
        }
      } @else {
        <div class="empty-state">
          No ships in orbit.
        </div>
      }
    </div>
  `,
  styleUrl: './planet-fleet-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetFleetListComponent {
  gs = inject(GameStateService);
  
  fleets = input.required<Fleet[]>();
  planetOwnerId = input<string | null>(null);
  
  colonize = output<string>();

  getShipCount(fleet: Fleet): number {
    return fleet.ships.reduce((acc, s) => acc + s.count, 0);
  }

  hasColonyShip(fleet: Fleet): boolean {
    return fleet.ships.some(s => {
      const d = getDesign(s.designId);
      return !!d?.colonyModule;
    });
  }

  hasCargo(fleet: Fleet): boolean {
    return fleet.ships.some(s => {
      const d = getDesign(s.designId);
      return (d?.cargoCapacity ?? 0) > 0;
    });
  }

  hasWeapons(fleet: Fleet): boolean {
    return fleet.ships.some(s => {
      const d = getDesign(s.designId);
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
