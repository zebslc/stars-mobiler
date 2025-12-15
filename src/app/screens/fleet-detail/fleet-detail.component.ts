import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
          <span *ngIf="fleet.location.type === 'orbit'"
            >Orbiting planet {{ fleet.location.planetId }}</span
          >
          <span *ngIf="fleet.location.type === 'space'"
            >In space ({{ fleet.location.x | number: '1.0-0' }},
            {{ fleet.location.y | number: '1.0-0' }})</span
          >
        </div>
        <div>
          Fuel: {{ fleet.fuel | number: '1.0-0' }} • Range: {{ rangeLy | number: '1.0-0' }} ly
        </div>
        <div>
          Ships:
          <ul>
            <li *ngFor="let s of fleet.ships">{{ getDesignName(s.designId) }} ×{{ s.count }}</li>
          </ul>
        </div>
      </section>
      <hr />
      <section style="display:grid;gap:0.5rem">
        <h3>Orders</h3>
        <div>
          <label>Move to star:</label>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <select [value]="selectedStarId" (change)="onStarChange($event)">
              <option *ngFor="let st of visibleStars()" [value]="st.id">{{ st.name }}</option>
            </select>
            <label style="display:flex;gap:0.25rem;align-items:center">
              <input type="checkbox" [checked]="showAll" (change)="onShowAll($event)" />
              Show all systems
            </label>
            <button (click)="move()">Set Move</button>
          </div>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly gs = inject(GameStateService);
  fleet: Fleet | null = null;
  stars: Star[] = [];
  selectedStarId = '';
  showAll = false;
  rangeLy = 0;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const f = this.gs.game()?.fleets.find((fl) => fl.id === id) ?? null;
    this.fleet = f;
    this.stars = this.gs.stars();
    if (this.stars.length) this.selectedStarId = this.stars[0].id;
    this.computeRange();
  }

  getDesignName(id: string) {
    return getDesign(id).name;
  }

  onStarChange(event: Event) {
    this.selectedStarId = (event.target as HTMLSelectElement).value;
  }

  move() {
    if (!this.fleet) return;
    const star = this.stars.find((s) => s.id === this.selectedStarId);
    if (!star) return;
    this.gs.issueFleetOrder(this.fleet.id, { type: 'move', destination: star.position });
    this.router.navigateByUrl('/map');
  }

  canColonize(): boolean {
    if (!this.fleet || this.fleet.location.type !== 'orbit') return false;
    const hasColony = this.fleet.ships.some(
      (s) => getDesign(s.designId).colonyModule && s.count > 0,
    );
    return hasColony;
  }

  colonize() {
    if (!this.fleet || this.fleet.location.type !== 'orbit') return;
    const pid = this.gs.colonizeNow(this.fleet.id);
    if (pid) {
      this.router.navigateByUrl(`/planet/${pid}`);
    } else {
      // Fallback to scheduled colonize if immediate failed
      this.gs.issueFleetOrder(this.fleet.id, {
        type: 'colonize',
        planetId: this.fleet.location.planetId,
      });
      this.router.navigateByUrl('/map');
    }
  }

  back() {
    history.back();
  }

  computeRange() {
    if (!this.fleet) return;
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of this.fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass +=
      this.fleet.cargo.minerals.iron +
      this.fleet.cargo.minerals.boranium +
      this.fleet.cargo.minerals.germanium +
      this.fleet.cargo.colonists;
    totalMass = Math.max(1, totalMass);
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = worstEfficiency / 100;
    const perLy =
      worstEfficiency === 0 ? 0 : Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
    this.rangeLy = perLy === 0 ? 1000 : this.fleet.fuel / perLy;
  }

  visibleStars(): Star[] {
    if (this.showAll || !this.fleet) return this.stars;
    let curr: { x: number; y: number } | undefined;
    if (this.fleet.location.type === 'orbit') {
      const planetId = (this.fleet.location as { type: 'orbit'; planetId: string }).planetId;
      const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === planetId));
      curr = star?.position;
    } else {
      const loc = this.fleet.location as { type: 'space'; x: number; y: number };
      curr = { x: loc.x, y: loc.y };
    }
    if (!curr) return this.stars;
    return this.stars.filter((s) => {
      const dist = Math.hypot(s.position.x - curr.x, s.position.y - curr.y);
      return dist <= this.rangeLy;
    });
  }
  onShowAll(event: Event) {
    this.showAll = (event.target as HTMLInputElement).checked;
  }
}
