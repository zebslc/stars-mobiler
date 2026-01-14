import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Star, Fleet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game/game-state.service';
import { getDesign } from '../../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-planet-colonization',
  imports: [CommonModule],
  template: `
    <h3 class="section-title">Colonization</h3>

    <!-- In Orbit -->
    @if (colonizersInOrbit().length > 0) {
      <div class="fleet-group">
        <div class="group-label">
          In Orbit
        </div>
        @for (f of colonizersInOrbit(); track f.id) {
          <div class="fleet-card in-orbit">
            <div class="info">
              <div class="name">Fleet {{ f.id }}</div>
              <div class="text-small status">Ready to Colonize</div>
            </div>
            <button (click)="colonizeNow.emit(f.id)" class="btn-success">Colonize Now</button>
          </div>
        }
      </div>
    }

    <!-- En Route -->
    @if (colonizersEnRoute().length > 0) {
      <div class="fleet-group">
        <div class="group-label">
          En Route
        </div>
        @for (f of colonizersEnRoute(); track f.id) {
          <div class="fleet-card en-route">
            <div class="info">
              <div class="name">Fleet {{ f.id }}</div>
              <div class="details">{{ getFleetInfo(f) }}</div>
            </div>
            <div class="eta">
              Arriving in {{ getEta(f) }} turns
            </div>
          </div>
        }
      </div>
    }

    <!-- Available Elsewhere -->
    <div class="fleet-group">
      <div class="group-label">
        Available Ships
      </div>
      @if (colonizersIdle().length > 0) {
        <div>
          @for (f of colonizersIdle(); track f.id) {
            <div class="fleet-card idle">
              <div class="info">
                <div class="name">Fleet {{ f.id }}</div>
                <div class="details">Idle at {{ getFleetLocationName(f) }}</div>
              </div>
              <button (click)="sendColonizer.emit(f.id)" class="btn-primary-outline">
                Auto Colonize
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          No idle colony ships available.
        </div>
      }
    </div>
  `,
  styleUrl: './planet-colonization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetColonizationComponent {
  gs = inject(GameStateService);

  planet = input.required<Star>();
  colonizersInOrbit = input.required<Fleet[]>();
  colonizersEnRoute = input.required<Fleet[]>();
  colonizersIdle = input.required<Fleet[]>();

  colonizeNow = output<string>();
  sendColonizer = output<string>();

  getEta(fleet: Fleet): number {
    const star = this.planet();
    if (!star) return 0;

    let fx = 0,
      fy = 0;
    if (fleet.location.type === 'orbit') {
      const fStar = this.gs
        .stars()
        .find((s) => s.id === (fleet.location as any).starId);
      if (fStar) {
        fx = fStar.position.x;
        fy = fStar.position.y;
      }
    } else {
      fx = (fleet.location as any).x;
      fy = (fleet.location as any).y;
    }
    const dist = Math.hypot(star.position.x - fx, star.position.y - fy);
    if (dist === 0) return 0;

    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      if (d) {
        maxWarp = Math.min(maxWarp, d.warpSpeed);
      }
    }
    const speed = Math.max(1, maxWarp * 20);
    return Math.ceil(dist / speed);
  }

  getFleetInfo(fleet: Fleet): string {
    const colonists = fleet.cargo.colonists;
    const ships = fleet.ships.reduce((acc: number, s: any) => acc + s.count, 0);
    return `${colonists} Colonists, ${ships} Ships`;
  }

  getFleetLocationName(fleet: Fleet): string {
    if (fleet.location.type === 'orbit') {
      const star = this.gs.stars().find((s) => s.id === (fleet.location as any).starId);
      return star ? star.name : 'Unknown Orbit';
    }
    return 'Deep Space';
  }
}
