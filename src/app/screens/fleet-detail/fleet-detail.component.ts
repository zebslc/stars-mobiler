import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { ToastService } from '../../services/toast.service';
import { Fleet, Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { StarSelectorComponent, StarOption } from '../../components/star-selector.component';
import { TechService } from '../../services/tech.service';

@Component({
  standalone: true,
  selector: 'app-fleet-detail',
  imports: [CommonModule, StarSelectorComponent],
  template: `
    <main style="padding:var(--space-lg)" *ngIf="fleet(); else missing">
      <header
        class="card-header"
        style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-lg);flex-wrap:wrap;margin-bottom:var(--space-lg)"
      >
        <div style="display:flex;gap:var(--space-md);align-items:center">
          <button
            (click)="back()"
            class="btn-small"
            style="background:rgba(255,255,255,0.2);color:#fff;border:none"
          >
            ← Back
          </button>
          <h2>Fleet</h2>
        </div>
        <div class="text-small" style="opacity:0.9">
          Owner: {{ fleet()!.ownerId === gs.player()?.id ? 'You' : 'Enemy' }}
        </div>
      </header>
      <section class="card" style="display:grid;gap:var(--space-md)">
        <div>
          <div class="text-small text-muted">Location</div>
          <div class="font-medium">
            <span *ngIf="fleet()!.location.type === 'orbit'"
              >Orbiting planet {{ fleet()!.location.planetId }}</span
            >
            <span *ngIf="fleet()!.location.type === 'space'"
              >In space ({{ fleet()!.location.x | number: '1.0-0' }},
              {{ fleet()!.location.y | number: '1.0-0' }})</span
            >
          </div>
        </div>
        <div>
          <div class="text-small text-muted">Fuel & Range</div>
          <div class="font-medium">
            {{ fleet()!.fuel | number: '1.0-0' }} fuel • {{ rangeLy() | number: '1.0-0' }} ly range
          </div>
        </div>
        <div>
          <div class="text-small text-muted">Ships</div>
          <div
            style="display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-xs)"
          >
            <div
              *ngFor="let s of fleet()!.ships"
              style="display:flex;align-items:center;gap:var(--space-sm);background:var(--color-bg-tertiary);padding:var(--space-sm);border-radius:var(--radius-sm)"
            >
              <span
                class="tech-icon"
                [ngClass]="getHullImageClass(s.designId)"
                style="flex-shrink:0"
              ></span>
              <span class="font-medium" style="flex:1">{{ getDesignName(s.designId) }}</span>
              <span class="text-muted">×{{ s.count }}</span>
            </div>
          </div>
        </div>
      </section>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-xl) 0" />
      <section class="card">
        <h3 style="margin-bottom:var(--space-lg)">Orders</h3>
        <div style="display:grid;gap:var(--space-lg)">
          <div>
            <label>Move to star</label>
            <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
              <app-star-selector
                [options]="starOptions()"
                [selectedStar]="selectedStarOption()"
                (starSelected)="onStarSelected($event)"
                style="flex-grow:1;min-width:200px"
              ></app-star-selector>
              <button (click)="move()" class="btn-primary" [disabled]="!selectedStarOption()">
                Set Move Order
              </button>
            </div>
            <label
              style="display:flex;gap:var(--space-sm);align-items:center;margin-top:var(--space-md);cursor:pointer"
            >
              <input type="checkbox" [checked]="showAll" (change)="onShowAll($event)" />
              <span class="text-small">Show all systems (including out of range)</span>
            </label>
          </div>
          <div>
            <button (click)="colonize()" [disabled]="!canColonize()" class="btn-success">
              Colonize Current Planet
            </button>
          </div>
        </div>
      </section>
      <hr style="border:none;border-top:1px solid var(--color-border);margin:var(--space-xl) 0" />
      <section class="card">
        <h3 style="margin-bottom:var(--space-lg)">Cargo</h3>
        <div style="display:grid;gap:var(--space-md)">
          <div>
            <div class="text-small text-muted">Capacity</div>
            <div class="font-medium">{{ cargoUsed() }} / {{ cargoCapacity() }} kT</div>
          </div>
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:var(--space-md)"
          >
            <div>
              <div class="text-small text-muted">Resources</div>
              <div class="font-medium">{{ fleet()!.cargo.resources }} R</div>
            </div>
            <div>
              <div class="text-small text-muted">Iron</div>
              <div class="font-medium">{{ fleet()!.cargo.minerals.iron }} kT</div>
            </div>
            <div>
              <div class="text-small text-muted">Boranium</div>
              <div class="font-medium">{{ fleet()!.cargo.minerals.boranium }} kT</div>
            </div>
            <div>
              <div class="text-small text-muted">Germanium</div>
              <div class="font-medium">{{ fleet()!.cargo.minerals.germanium }} kT</div>
            </div>
            <div>
              <div class="text-small text-muted">Colonists</div>
              <div class="font-medium">{{ fleet()!.cargo.colonists | number }}</div>
            </div>
          </div>
          <div
            *ngIf="fleet()!.location.type === 'orbit'"
            style="background:var(--color-bg-secondary);padding:var(--space-lg);border-radius:var(--radius-md);margin-top:var(--space-md)"
          >
            <div class="font-bold" style="margin-bottom:var(--space-md)">Transfer Cargo</div>
            <div
              style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:var(--space-md);margin-bottom:var(--space-md)"
            >
              <div>
                <label>Resources (R)</label>
                <input type="number" min="0" placeholder="0" #res />
              </div>
              <div>
                <label>Iron (kT)</label>
                <input type="number" min="0" placeholder="0" #fe />
              </div>
              <div>
                <label>Boranium (kT)</label>
                <input type="number" min="0" placeholder="0" #bo />
              </div>
              <div>
                <label>Germanium (kT)</label>
                <input type="number" min="0" placeholder="0" #ge />
              </div>
              <div>
                <label>Colonists</label>
                <input type="number" min="0" placeholder="0" #col />
              </div>
            </div>
            <div
              style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:var(--space-md)"
            >
              <button
                (click)="load(res.value, fe.value, bo.value, ge.value, col.value)"
                class="btn-primary"
              >
                Load
              </button>
              <button
                (click)="unload(res.value, fe.value, bo.value, ge.value, col.value)"
                class="btn-primary"
              >
                Unload
              </button>
              <button (click)="loadFill()" class="btn-success">Load to Fill</button>
              <button (click)="unloadAll()" class="btn-danger">Unload All</button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <ng-template #missing>
      <main style="padding:var(--space-lg)">
        <h2>Fleet not found</h2>
      </main>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly gs = inject(GameStateService);
  private toast = inject(ToastService);
  private techService = inject(TechService);

  private fleetId = this.route.snapshot.paramMap.get('id');

  fleet = computed(() => {
    this.gs.turn(); // Dependency on turn
    const f = this.gs.game()?.fleets.find((fl) => fl.id === this.fleetId) ?? null;
    return f ? { ...f } : null; // Shallow copy for change detection
  });

  stars = computed(() => this.gs.stars());
  selectedStarId = signal('');
  showAll = false;

  rangeLy = computed(() => {
    const f = this.fleet();
    if (!f) return 0;
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of f.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass +=
      f.cargo.minerals.iron +
      f.cargo.minerals.boranium +
      f.cargo.minerals.germanium +
      f.cargo.colonists;
    totalMass = Math.max(1, totalMass);
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = worstEfficiency / 100;
    const perLy =
      worstEfficiency === 0 ? 0 : Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
    return perLy === 0 ? 1000 : f.fuel / perLy;
  });

  constructor() {
    if (this.gs.stars().length) this.selectedStarId.set(this.gs.stars()[0].id);
  }

  ngOnInit() {
    if (!this.fleet()) {
      this.toast.error(`Fleet does not exist`);
      this.router.navigateByUrl('/map');
    }
  }

  starOptions = computed(() => {
    const visibleStars = this.visibleStars();
    const playerId = this.gs.player()?.id;
    const f = this.fleet();
    if (!f) return [];

    return visibleStars
      .map((star) => {
        const planet = star.planets[0];
        const isHome = planet?.ownerId === playerId;
        const isEnemy = planet?.ownerId && planet.ownerId !== playerId;
        const isUnoccupied = !planet?.ownerId;
        const habitability = planet ? this.gs.habitabilityFor(planet.id) : 0;

        const fleetPos = this.getFleetPosition();
        const distance = Math.hypot(star.position.x - fleetPos.x, star.position.y - fleetPos.y);
        const turnsAway = this.calculateTurns(distance);
        const isInRange = distance <= this.rangeLy();

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

  selectedStarOption = computed(() => {
    return this.starOptions().find((opt) => opt.star.id === this.selectedStarId()) || null;
  });

  private getFleetPosition(): { x: number; y: number } {
    const f = this.fleet();
    if (!f) return { x: 0, y: 0 };
    if (f.location.type === 'orbit') {
      const orbitLocation = f.location as { type: 'orbit'; planetId: string };
      const star = this.stars().find((s) => s.planets.some((p) => p.id === orbitLocation.planetId));
      return star ? star.position : { x: 0, y: 0 };
    }
    const spaceLocation = f.location as { type: 'space'; x: number; y: number };
    return { x: spaceLocation.x, y: spaceLocation.y };
  }

  private calculateTurns(distance: number): number {
    const f = this.fleet();
    if (!f || distance === 0) return 0;
    let maxWarp = Infinity;
    for (const s of f.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const speed = Math.max(1, maxWarp * 20);
    return Math.ceil(distance / speed);
  }

  onStarSelected(option: StarOption) {
    this.selectedStarId.set(option.star.id);
  }

  getDesignName(id: string) {
    return getDesign(id).name;
  }

  /**
   * Map design name to hull name from tech-atlas.data
   */
  getHullNameFromDesign(designId: string): string {
    const design = getDesign(designId);
    const name = design.name;

    // Map compiled design names to hull names
    const nameMap: Record<string, string> = {
      Scout: 'Scout',
      Frigate: 'Frigate',
      Destroyer: 'Destroyer',
      'Small Freighter': 'Small Freighter',
      'Super Freighter': 'Super Freighter',
      'Fuel Transport': 'Fuel Transport',
      'Colony Ship': 'Colony Ship',
      Starbase: 'Orbital Fort',
    };

    return nameMap[name] || 'Scout'; // Default to Scout if not found
  }

  /**
   * Get CSS class for hull image
   */
  getHullImageClass(designId: string): string {
    const hullName = this.getHullNameFromDesign(designId);
    return this.techService.getHullImageClass(hullName);
  }

  move() {
    const f = this.fleet();
    if (!f) return;
    const selectedOption = this.selectedStarOption();
    if (!selectedOption) return;
    this.gs.issueFleetOrder(f.id, { type: 'move', destination: selectedOption.star.position });
    this.router.navigateByUrl('/map');
  }

  canColonize(): boolean {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return false;
    const hasColony = f.ships.some((s) => getDesign(s.designId).colonyModule && s.count > 0);
    return hasColony;
  }

  colonize() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const planetId = f.location.planetId;
    const hab = this.gs.habitabilityFor(planetId);
    if (hab <= 0) {
      const ok = confirm(
        'Warning: This world is inhospitable. Colonists will die each turn. Proceed?',
      );
      if (!ok) return;
    }
    const pid = this.gs.colonizeNow(f.id);
    if (pid) {
      this.router.navigateByUrl(`/planet/${pid}`);
    } else {
      this.gs.issueFleetOrder(f.id, { type: 'colonize', planetId });
      this.router.navigateByUrl('/map');
    }
  }

  back() {
    history.back();
  }

  visibleStars(): Star[] {
    const f = this.fleet();
    if (this.showAll || !f) return this.stars();
    let curr: { x: number; y: number } | undefined;
    if (f.location.type === 'orbit') {
      const planetId = (f.location as { type: 'orbit'; planetId: string }).planetId;
      const star = this.gs.stars().find((s) => s.planets.some((p) => p.id === planetId));
      curr = star?.position;
    } else {
      const loc = f.location as { type: 'space'; x: number; y: number };
      curr = { x: loc.x, y: loc.y };
    }
    if (!curr) return this.stars();
    return this.stars().filter((s) => {
      const dist = Math.hypot(s.position.x - curr!.x, s.position.y - curr!.y);
      return dist <= this.rangeLy();
    });
  }
  onShowAll(event: Event) {
    this.showAll = (event.target as HTMLInputElement).checked;
  }

  cargoCapacity(): number {
    const f = this.fleet();
    if (!f) return 0;
    return f.ships.reduce((sum, s) => sum + getDesign(s.designId).cargoCapacity * s.count, 0);
  }
  cargoUsed(): number {
    const f = this.fleet();
    if (!f) return 0;
    const resourcesUsed = f.cargo.resources;
    const m = f.cargo.minerals;
    const mineralsUsed = m.iron + m.boranium + m.germanium;
    const colonistUsed = Math.floor(f.cargo.colonists / 1000);
    return resourcesUsed + mineralsUsed + colonistUsed;
  }
  load(res: string, fe: string, bo: string, ge: string, col: string) {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.loadCargo(f.id, pid, {
      resources: res ? Number(res) : undefined,
      iron: fe ? Number(fe) : undefined,
      boranium: bo ? Number(bo) : undefined,
      germanium: ge ? Number(ge) : undefined,
      colonists: col ? Number(col) : undefined,
    });
  }
  unload(res: string, fe: string, bo: string, ge: string, col: string) {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.unloadCargo(f.id, pid, {
      resources: res ? Number(res) : undefined,
      iron: fe ? Number(fe) : undefined,
      boranium: bo ? Number(bo) : undefined,
      germanium: ge ? Number(ge) : undefined,
      colonists: col ? Number(col) : undefined,
    });
  }
  loadFill() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.loadCargo(f.id, pid, {
      resources: 'fill',
      iron: 'fill',
      boranium: 'fill',
      germanium: 'fill',
      colonists: 'fill',
    });
  }
  unloadAll() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.unloadCargo(f.id, pid, {
      resources: 'all',
      iron: 'all',
      boranium: 'all',
      germanium: 'all',
      colonists: 'all',
    });
  }
}
