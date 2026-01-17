import type {
  OnInit} from '@angular/core';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';
import { ToastService } from '../../services/core/toast.service';
import { ShipDesignResolverService } from '../../services/ship-design';
import { FleetMathService } from '../../services/fleet/fleet-math.service';
import type { Fleet, Star } from '../../models/game.model';
import type { CompiledDesign } from '../../services/data/ship-design-registry.service';
import type { StarOption } from '../../components/star-selector.component';
import { DesignPreviewButtonComponent } from '../../shared/components/design-preview-button.component';
import { ShipStatsRowComponent } from '../../shared/components/ship-stats-row/ship-stats-row.component';
import type { TransferState } from './components/fleet-transfer/fleet-transfer.component';
import { FleetTransferComponent } from './components/fleet-transfer/fleet-transfer.component';
import type { CargoTransferRequest } from './components/fleet-cargo/fleet-cargo.component';
import { FleetCargoComponent } from './components/fleet-cargo/fleet-cargo.component';
import { FleetTransferService } from '../../services/fleet/fleet-transfer.service';
import { DestinationSelectorComponent } from './components/destination-selector/destination-selector.component';

@Component({
  standalone: true,
  selector: 'app-fleet-detail',
  imports: [
    CommonModule,
    DesignPreviewButtonComponent,
    ShipStatsRowComponent,
    FleetTransferComponent,
    DestinationSelectorComponent,
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
                <span>Orbiting planet {{ $any(fleet()!.location).starId }}</span>
              }
              @if (fleet()!.location.type === 'space') {
                <span
                  >In space ({{ $any(fleet()!.location).x | number: '1.0-0' }},
                  {{ $any(fleet()!.location).y | number: '1.0-0' }})</span
                >
              }
            </div>
          </div>
          <div>
            <div class="text-small text-muted">Fuel & Range</div>
            <div class="font-medium">
              {{ fleet()!.fuel | number: '1.0-0' }} fuel • {{ rangeLy() | number: '1.0-0' }} ly
              range
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
              <button (click)="startSplit()" class="btn-secondary">Split Fleet</button>
            }
          </div>
          <app-destination-selector
            [fleet]="fleet()!"
            [stars]="stars()"
            (move)="onDestinationMove($event)"
          ></app-destination-selector>
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
  private toast = inject(ToastService);
  private shipDesignResolver = inject(ShipDesignResolverService);
  private fleetMath = inject(FleetMathService);
  private fleetTransfer = inject(FleetTransferService);
  readonly gs = inject(GameStateService);

  private fleetId = this.route.snapshot.paramMap.get('id');

  readonly fleet = computed(() => {
    this.gs.turn(); // Dependency on turn
    const f = this.gs.game()?.fleets.find((fl) => fl.id === this.fleetId) ?? null;
    return f ? { ...f } : null; // Shallow copy for change detection
  });

  readonly otherFleets = computed(() => {
    const f = this.fleet();
    const game = this.gs.game();
    if (!f || !game) return [];

    return game.fleets.filter(
      (other) =>
        other.id !== f.id &&
        other.ownerId === f.ownerId &&
        this.fleetMath.isSameLocation(f, other) &&
        !this.isFleetStarbase(other),
    );
  });

  isFleetStarbase(f: Fleet): boolean {
    return f.ships.some((s) => {
      const d = this.fleetMath.getShipDesign(s.designId);
      return !!d.isStarbase;
    });
  }

  readonly starOnSurface = computed(() => {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return null;
    const starId = (f.location as { starId: string }).starId;
    return this.gs.starIndex().get(starId) || null;
  });

  // Transfer State
  readonly transferTarget = signal<Fleet | { name: string; id: 'new' } | null>(null);
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

  readonly totalShipCount = computed(() => {
    const f = this.fleet();
    return this.fleetMath.totalShipCount(f);
  });

  getDesignName(designId: string): string {
    const d = this.fleetMath.getShipDesign(designId);
    return d?.name || 'Unknown Design';
  }

  public getShipDesign(designId: string): CompiledDesign {
    return this.fleetMath.getShipDesign(designId);
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
      this.fleetTransfer.mergeFleets(f.id, target.id);
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
    const result = this.fleetTransfer.applyTransfer(f.id, target, event);
    if (!result.success) {
      if (event.mode === 'split' && event.splitMode === 'custom') {
        this.toast.error('Select ships to split');
      }
      return;
    }
    if (result.kind === 'split-separate') {
      this.toast.success('Fleet separated');
      this.transferTarget.set(null);
    } else if (result.kind === 'split-custom') {
      this.toast.success('Fleet split created');
      this.transferTarget.set(null);
    } else if (result.kind === 'transfer') {
      this.toast.success('Transfer complete');
      this.transferTarget.set(null);
    }
  }

  readonly stars = computed(() => this.gs.stars());
  readonly rangeLy = computed(() => this.fleetMath.rangeLy(this.fleet()));

  ngOnInit() {
    if (!this.fleet()) {
      this.toast.error(`Fleet does not exist`);
      this.router.navigateByUrl('/map');
    }
  }



  onDestinationMove(star: Star) {
    const f = this.fleet();
    if (!f) return;
    this.gs.issueFleetOrder(f.id, { type: 'move', destination: star.position });
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
      this.router.navigateByUrl(`/star/${sid}`);
    } else {
      this.gs.issueFleetOrder(f.id, { type: 'colonize', starId });
      this.router.navigateByUrl('/map');
    }
  }

  back() {
    history.back();
  }

  cargoCapacity(): number {
    return this.fleetMath.cargoCapacity(this.fleet());
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
