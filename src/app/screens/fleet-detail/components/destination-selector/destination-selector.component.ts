import { Component, ChangeDetectionStrategy, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Fleet, Star } from '../../../../models/game.model';
import type { StarOption } from '../../../../components/star-selector.component';
import { GameStateService } from '../../../../services/game/game-state.service';
import { FleetMathService } from '../../../../services/fleet/fleet-math.service';

@Component({
  selector: 'app-destination-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card" style="margin-top: var(--space-md)">
      <h3 style="margin-bottom: var(--space-sm)">Destination</h3>
      <div style="display:flex; gap: var(--space-sm); align-items: center; flex-wrap: wrap">
        <select [value]="selectedStarId()" (change)="onSelectedId($any($event.target).value)">
          <option value="">Select a star…</option>
          @for (opt of starOptions(); track opt.star.id) {
            <option [value]="opt.star.id" [disabled]="!opt.isInRange">
              {{ opt.star.name }}
              — {{ opt.distance | number: '1.0-0' }}ly
              — {{ opt.turnsAway }} turns
              — {{ opt.isHome ? 'Home' : opt.isEnemy ? 'Enemy' : 'Unoccupied' }}
            </option>
          }
        </select>
        <button class="btn-primary" (click)="onMove()" [disabled]="!selectedStarOption()">Move</button>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationSelectorComponent {
  readonly fleet = input.required<Fleet>();
  readonly stars = input.required<Array<Star>>();

  readonly move = output<Star>();

  private gs = inject(GameStateService);
  private fleetMath = inject(FleetMathService);

  readonly selectedStarId = signal('');

  readonly starOptions = computed(() => {
    const fleet = this.getFleet();
    const stars = this.stars();
    if (!fleet || !stars) return [];

    const playerId = this.gs.player()?.id;
    const visibleStars = this.visibleStars(fleet, stars);

    return visibleStars
      .map((star) => {
        const isHome = star.ownerId === playerId;
        const isEnemy = star.ownerId && star.ownerId !== playerId;
        const isUnoccupied = !star.ownerId;
        const habitability = this.gs.habitabilityFor(star.id);

        const fleetPos = this.getFleetPosition(fleet, stars);
        const distance = Math.hypot(star.position.x - fleetPos.x, star.position.y - fleetPos.y);
        const turnsAway = this.fleetMath.calculateTurns(fleet, distance);
        const isInRange = distance <= this.fleetMath.rangeLy(fleet);

        return {
          star,
          isHome,
          isEnemy,
          isUnoccupied,
          habitability,
          turnsAway,
          isInRange,
          distance,
        } as StarOption;
      })
      .sort((a, b) => a.star.name.localeCompare(b.star.name));
  });

  readonly selectedStarOption = computed(() => {
    return this.starOptions().find((opt) => opt.star.id === this.selectedStarId()) || null;
  });

  onSelectedId(id: string) {
    this.selectedStarId.set(id);
  }

  onMove() {
    const opt = this.selectedStarOption();
    if (!opt) return;
    this.move.emit(opt.star);
  }

  private visibleStars(fleet: Fleet, stars: Array<Star>): Array<Star> {
    let curr: { x: number; y: number } | undefined;
    if (fleet.location.type === 'orbit') {
      const starId = (fleet.location as { type: 'orbit'; starId: string }).starId;
      const star = stars.find((s) => s.id === starId);
      curr = star?.position;
    } else {
      const loc = fleet.location as { type: 'space'; x: number; y: number };
      curr = { x: loc.x, y: loc.y };
    }
    if (!curr) return stars;
    return stars.filter((s) => {
      const dist = Math.hypot(s.position.x - curr!.x, s.position.y - curr!.y);
      return dist <= this.fleetMath.rangeLy(fleet);
    });
  }

  private getFleetPosition(fleet: Fleet, stars: Array<Star>): { x: number; y: number } {
    if (fleet.location.type === 'orbit') {
      const orbitLocation = fleet.location as { type: 'orbit'; starId: string };
      const star = stars.find((s) => s.id === orbitLocation.starId);
      return star ? star.position : { x: 0, y: 0 };
    }
    const spaceLocation = fleet.location as { type: 'space'; x: number; y: number };
    return { x: spaceLocation.x, y: spaceLocation.y };
  }

  private getFleet(): Fleet | null {
    try {
      return this.fleet();
    } catch {
      return null;
    }
  }
}
