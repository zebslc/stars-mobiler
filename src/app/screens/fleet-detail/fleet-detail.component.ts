import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { ToastService } from '../../services/core/toast.service';
import { Fleet, Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { getHull } from '../../utils/data-access.util';
import { compileShipStats } from '../../models/ship-design.model';
import { StarOption } from '../../components/star-selector.component';
import { DesignPreviewButtonComponent } from '../../shared/components/design-preview-button.component';
import { ShipStatsRowComponent } from '../../shared/components/ship-stats-row/ship-stats-row.component';
import {
  FleetTransferComponent,
  TransferState,
} from './components/fleet-transfer/fleet-transfer.component';
import {
  FleetCargoComponent,
  CargoTransferRequest,
} from './components/fleet-cargo/fleet-cargo.component';

@Component({
  standalone: true,
  selector: 'app-fleet-detail',
  imports: [
    CommonModule,
    DesignPreviewButtonComponent,
    ShipStatsRowComponent,
    FleetTransferComponent,
  ],
  template: `
    @if (fleet()) {
      <main style="padding:var(--space-lg)">
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
            <h2>{{ fleet()!.name || 'Fleet' }}</h2>
          </div>
          <div class="text-small" style="opacity:0.9">
            Owner: {{ fleet()!.ownerId === gs.player()?.id ? 'You' : 'Enemy' }}
          </div>
        </header>

        <!-- Transfer Overlay -->
        @if (transferTarget()) {
          <app-fleet-transfer
            [fleet]="fleet()!"
            [targetName]="getTransferTargetName()"
            [transferMode]="transferMode"
            [splitMode]="splitMode"
            [designNameResolver]="getDesignNameBound"
            (cancel)="cancelTransfer()"
            (confirm)="onTransferConfirm($event)"
            (splitModeChange)="setSplitMode($event)"
          ></app-fleet-transfer>
        }

        <section class="card" style="display:grid;gap:var(--space-md)">
        <div>
          <div class="text-small text-muted">Location</div>
          <div class="font-medium">
            @if (fleet()!.location.type === 'orbit') {
              <span>Orbiting planet {{ $any(fleet()!.location).planetId }}</span>
            }
            @if (fleet()!.location.type === 'space') {
              <span>In space ({{ $any(fleet()!.location).x | number: '1.0-0' }},
              {{ $any(fleet()!.location).y | number: '1.0-0' }})</span>
            }
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
            @for (s of fleet()!.ships; track s.designId) {
              <app-design-preview-button
                [designId]="s.designId"
                buttonClass="ship-row"
                title="View hull layout"
              >
              <span class="ship-count" style="margin-right:4px">{{ s.count }}x</span>
              <span class="ship-name" style="margin-right: 8px; flex: initial">{{
                getDesignName(s.designId)
              }}</span>

              <app-ship-stats-row [stats]="getShipDesign(s.designId)"></app-ship-stats-row>

              <span style="flex: 1"></span>

              @if (s.damage) {
                <span class="ship-damage" style="color:var(--color-danger)"
                  >{{ s.damage }}% dmg</span
                >
              }
            </app-design-preview-button>
            }
          </div>
        </div>

        <!-- Fleet Actions -->
        <div style="display:flex; gap:var(--space-sm); margin-top:var(--space-sm)">
          @if (totalShipCount() > 1) {
            <button (click)="startSplit()" class="btn-secondary">
              Split Fleet
            </button>
          }
        </div>
      </section>

      <!-- Other Fleets Section -->
      @if (otherFleets().length > 0) {
        <section class="card" style="margin-top:var(--space-xl)">
          <h3 style="margin-bottom:var(--space-md)">Other Fleets Here</h3>
          <div style="display:grid; gap:var(--space-sm)">
            @for (f of otherFleets(); track f.id) {
              <div
                style="display:flex; justify-content:space-between; align-items:center; background:var(--color-bg-tertiary); padding:var(--space-md); border-radius:var(--radius-sm)"
              >
                <div>
                  <div class="font-medium">{{ f.name }}</div>
                  <div class="text-small text-muted">{{ f.ships.length }} ship stacks</div>
                </div>
                <div style="display:flex; gap:var(--space-xs)">
                  <button (click)="startTransfer(f)" class="btn-small">Transfer</button>
                  <button (click)="mergeInto(f)" class="btn-small btn-warning">Merge Into</button>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </main>
    } @else {
      <main style="padding:var(--space-lg)">
        <h2>Fleet not found</h2>
      </main>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      main {
        flex: 1;
        overflow-y: auto;
      }
      .ship-count {
        color: var(--color-text-muted);
        min-width: 20px;
        flex-shrink: 0;
      }
      .ship-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }
      .ship-damage {
        color: var(--color-danger);
        font-size: var(--font-size-xs);
        flex-shrink: 0;
      }
      ::ng-deep .ship-row {
        display: flex;
        align-items: center;
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly gs = inject(GameStateService);
  private toast = inject(ToastService);

  private fleetId = this.route.snapshot.paramMap.get('id');

  fleet = computed(() => {
    this.gs.turn(); // Dependency on turn
    const f = this.gs.game()?.fleets.find((fl) => fl.id === this.fleetId) ?? null;
    return f ? { ...f } : null; // Shallow copy for change detection
  });

  otherFleets = computed(() => {
    const f = this.fleet();
    const game = this.gs.game();
    if (!f || !game) return [];

    return game.fleets.filter(
      (other) =>
        other.id !== f.id &&
        other.ownerId === f.ownerId &&
        this.isSameLocation(f, other) &&
        !this.isFleetStarbase(other),
    );
  });

  isFleetStarbase(f: Fleet): boolean {
    return f.ships.some((s) => {
      const d = this.getShipDesign(s.designId);
      return !!d.isStarbase;
    });
  }

  starOnSurface = computed(() => {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return null;
    const starId = (f.location as { starId: string }).starId;
    return this.gs.starIndex().get(starId) || null;
  });

  // Transfer State
  transferTarget = signal<Fleet | { name: string; id: 'new' } | null>(null);
  transferMode: 'split' | 'transfer' = 'transfer';
  splitMode: 'custom' | 'separate' = 'custom';

  getDesignNameBound = this.getDesignName.bind(this);

  getTransferTargetName(): string | undefined {
    const target = this.transferTarget();
    return target ? target.name : undefined;
  }

  onCargoTransfer(request: CargoTransferRequest) {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const starId = f.location.starId;

    if (Object.keys(request.load).length > 0) {
      this.gs.loadCargo(f.id, starId, request.load);
    }
    if (Object.keys(request.unload).length > 0) {
      this.gs.unloadCargo(f.id, starId, request.unload);
    }

    if (Object.keys(request.load).length > 0 || Object.keys(request.unload).length > 0) {
      this.toast.success('Cargo transferred');
    }
  }

  isSameLocation(f1: Fleet, f2: Fleet): boolean {
    if (f1.location.type !== f2.location.type) return false;
    if (f1.location.type === 'orbit') {
      return (f1.location as { starId: string }).starId === (f2.location as { starId: string }).starId;
    }
    return (
      (f1.location as any).x === (f2.location as any).x &&
      (f1.location as any).y === (f2.location as any).y
    );
  }

  totalShipCount = computed(() => {
    const f = this.fleet();
    if (!f) return 0;
    return f.ships.reduce((acc, s) => acc + s.count, 0);
  });

  getDesignName(designId: string): string {
    const d = this.getShipDesign(designId);
    return d?.name || 'Unknown Design';
  }

  public getShipDesign(designId: string): any {
    const game = this.gs.game();
    const dynamicDesign = game?.shipDesigns.find((d) => d.id === designId);

    if (dynamicDesign) {
      if (dynamicDesign.spec) {
        return {
          ...dynamicDesign.spec,
          name: dynamicDesign.name,
          colonyModule: dynamicDesign.spec.hasColonyModule,
          fuelEfficiency: dynamicDesign.spec.fuelEfficiency ?? 100,
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
        };
        const stats = compileShipStats(hull, dynamicDesign.slots, techLevels);
        return {
          ...stats,
          name: dynamicDesign.name,
          colonyModule: stats.hasColonyModule,
          fuelEfficiency: stats.fuelEfficiency ?? 100,
        };
      }
    }
    return getDesign(designId);
  }

  startSplit() {
    const f = this.fleet();
    if (!f) return;
    this.transferMode = 'split';
    this.splitMode = 'custom';
    this.transferTarget.set({ name: 'New Fleet', id: 'new' });
  }

  setSplitMode(mode: 'custom' | 'separate') {
    this.splitMode = mode;
  }

  startTransfer(target: Fleet) {
    const f = this.fleet();
    if (!f) return;
    this.transferMode = 'transfer';
    this.transferTarget.set(target);
  }

  mergeInto(target: Fleet) {
    const f = this.fleet();
    if (!f) return;
    if (confirm(`Merge ${f.name} into ${target.name}?`)) {
      this.gs.mergeFleets(f.id, target.id);
      this.toast.success('Fleets merged');
      this.router.navigateByUrl('/map');
    }
  }

  cancelTransfer() {
    this.transferTarget.set(null);
  }

  onTransferConfirm(event: {
    mode: 'split' | 'transfer';
    splitMode: 'custom' | 'separate';
    state: TransferState;
  }) {
    const target = this.transferTarget();
    const f = this.fleet();
    if (!target || !f) return;

    if (event.mode === 'split') {
      if (event.splitMode === 'separate') {
        this.gs.separateFleet(f.id);
        this.toast.success('Fleet separated');
        this.transferTarget.set(null);
        return;
      }

      // Custom Split
      const spec = {
        ships: event.state.ships
          .filter((s) => s.count > 0)
          .map((s) => ({ designId: s.designId, count: s.count, damage: s.damage })),
        fuel: 0,
        cargo: { resources: 0, ironium: 0, boranium: 0, germanium: 0, colonists: 0 },
      };

      if (spec.ships.length === 0) {
        this.toast.error('Select ships to split');
        return;
      }

      const newId = this.gs.splitFleet(f.id, spec);
      if (newId) {
        this.toast.success('Fleet split created');
        this.transferTarget.set(null);
      }
    } else {
      // Transfer
      const spec = {
        ships: event.state.ships
          .filter((s) => s.count > 0)
          .map((s) => ({ designId: s.designId, count: s.count, damage: s.damage })),
        fuel: event.state.fuel,
        cargo: {
          resources: event.state.resources,
          ironium: event.state.ironium,
          boranium: event.state.boranium,
          germanium: event.state.germanium,
          colonists: event.state.colonists,
        },
      };

      if (target && 'id' in target && target.id !== 'new') {
        this.gs.transferFleetCargo(f.id, target.id, spec);
        this.toast.success('Transfer complete');
        this.transferTarget.set(null);
      }
    }
  }

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
      const d = this.getShipDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass +=
      f.cargo.minerals.ironium +
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
        const isHome = star.ownerId === playerId;
        const isEnemy = star.ownerId && star.ownerId !== playerId;
        const isUnoccupied = !star.ownerId;
        const habitability = this.gs.habitabilityFor(star.id);

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
      const orbitLocation = f.location as { type: 'orbit'; starId: string };
      const star = this.stars().find((s) => s.id === orbitLocation.starId);
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
      const d = this.getShipDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const speed = Math.max(1, maxWarp * 20);
    return Math.ceil(distance / speed);
  }

  onStarSelected(option: StarOption) {
    this.selectedStarId.set(option.star.id);
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
    const hasColony = f.ships.some(
      (s) => this.getShipDesign(s.designId).colonyModule && s.count > 0,
    );
    return hasColony;
  }

  colonize() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const starId = f.location.starId;
    const hab = this.gs.habitabilityFor(starId);
    if (hab <= 0) {
      const ok = confirm(
        'Warning: This world is inhospitable. Colonists will die each turn. Proceed?',
      );
      if (!ok) return;
    }
    const sid = this.gs.colonizeNow(f.id);
    if (sid) {
      this.router.navigateByUrl(`/planet/${sid}`);
    } else {
      this.gs.issueFleetOrder(f.id, { type: 'colonize', starId });
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
      const starId = (f.location as { type: 'orbit'; starId: string }).starId;
      const star = this.gs.stars().find((s) => s.id === starId);
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

  cargoCapacity(): number {
    const f = this.fleet();
    if (!f) return 0;
    return f.ships.reduce(
      (sum, s) => sum + this.getShipDesign(s.designId).cargoCapacity * s.count,
      0,
    );
  }

  loadFill() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const starId = f.location.starId;
    this.gs.loadCargo(f.id, starId, {
      resources: undefined,
      ironium: 'fill',
      boranium: 'fill',
      germanium: 'fill',
      colonists: 'fill',
    });
  }

  unloadAll() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const starId = f.location.starId;
    this.gs.unloadCargo(f.id, starId, {
      resources: undefined,
      ironium: 'all',
      boranium: 'all',
      germanium: 'all',
      colonists: 'all',
    });
  }
}
