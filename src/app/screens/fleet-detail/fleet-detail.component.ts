import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Fleet, Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-fleet-detail',
  imports: [CommonModule],
  template: `
    <main style="padding:1rem" *ngIf="fleet; else missing">
      <header style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button (click)="back()">← Back</button>
          <h2 style="margin:0">Fleet</h2>
        </div>
        <small>Owner: {{ fleet.ownerId === gs.player()?.id ? 'You' : 'Enemy' }}</small>
      </header>
      <section style="display:grid;gap:0.75rem;margin-top:1rem">
        <div>
          Location:
          <span *ngIf="fleet.location.type === 'orbit'">Orbiting planet {{ fleet.location.planetId }}</span>
          <span *ngIf="fleet.location.type === 'space'">In space ({{ fleet.location.x | number:'1.0-0' }}, {{ fleet.location.y | number:'1.0-0' }})</span>
        </div>
        <div>
          Fuel: {{ fleet.fuel | number:'1.0-0' }}
        </div>
        <div>
          Ships:
          <ul>
            <li *ngFor="let s of fleet.ships">
              {{ getDesignName(s.designId) }} ×{{ s.count }}
            </li>
          </ul>
        </div>
      </section>
      <hr />
      <section style="display:grid;gap:0.5rem">
        <h3>Orders</h3>
        <div>
          <label>Move to star:
            <select [value]="selectedStarId" (change)="onStarChange($event)">
              <option *ngFor="let st of stars" [value]="st.id">{{ st.name }}</option>
            </select>
            <button (click)="move()">Set Move</button>
          </label>
        </div>
        <div>
          <button (click)="colonize()" [disabled]="!canColonize()">Colonize current planet</button>
        </div>
      </section>
    </main>
    <ng-template #missing>
      <main style="padding:1rem">
        <h2>Fleet not found</h2>
      </main>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FleetDetailComponent {
  private route = inject(ActivatedRoute);
  readonly gs = inject(GameStateService);
  fleet: Fleet | null = null;
  stars: Star[] = [];
  selectedStarId = '';

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const f = this.gs.game()?.fleets.find(fl => fl.id === id) ?? null;
    this.fleet = f;
    this.stars = this.gs.stars();
    if (this.stars.length) this.selectedStarId = this.stars[0].id;
  }

  getDesignName(id: string) {
    return getDesign(id).name;
  }

  onStarChange(event: Event) {
    this.selectedStarId = (event.target as HTMLSelectElement).value;
  }

  move() {
    if (!this.fleet) return;
    const star = this.stars.find(s => s.id === this.selectedStarId);
    if (!star) return;
    this.gs.issueFleetOrder(this.fleet.id, { type: 'move', destination: star.position });
  }

  canColonize(): boolean {
    if (!this.fleet || this.fleet.location.type !== 'orbit') return false;
    const hasColony = this.fleet.ships.some(s => getDesign(s.designId).colonyModule && s.count > 0);
    return hasColony;
  }

  colonize() {
    if (!this.fleet || this.fleet.location.type !== 'orbit') return;
    this.gs.issueFleetOrder(this.fleet.id, { type: 'colonize', planetId: this.fleet.location.planetId });
  }

  back() {
    history.back();
  }
}

