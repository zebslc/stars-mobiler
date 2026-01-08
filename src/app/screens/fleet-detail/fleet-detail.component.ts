import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { ToastService } from '../../services/toast.service';
import { Fleet, Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { StarSelectorComponent, StarOption } from '../../components/star-selector.component';
import { TechService } from '../../services/tech.service';
import { DesignPreviewButtonComponent } from '../../shared/components/design-preview-button.component';

@Component({
  standalone: true,
  selector: 'app-fleet-detail',
  imports: [CommonModule, StarSelectorComponent, FormsModule, DesignPreviewButtonComponent],
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
          <h2>{{ fleet()!.name || 'Fleet' }}</h2>
        </div>
        <div class="text-small" style="opacity:0.9">
          Owner: {{ fleet()!.ownerId === gs.player()?.id ? 'You' : 'Enemy' }}
        </div>
      </header>

      <!-- Transfer Overlay -->
      <div *ngIf="transferTarget()" class="transfer-overlay">
        <div class="card transfer-modal">
          <h3>
            {{ transferMode === 'split' ? 'Split Fleet' : 'Transfer to ' + transferTarget()?.name }}
          </h3>

          <div
            *ngIf="transferMode === 'split'"
            style="display:flex;gap:var(--space-md);margin-bottom:var(--space-md)"
          >
            <button
              class="btn-small"
              [class.btn-primary]="splitMode === 'custom'"
              (click)="setSplitMode('custom')"
            >
              Custom Split
            </button>
            <button
              class="btn-small"
              [class.btn-primary]="splitMode === 'separate'"
              (click)="setSplitMode('separate')"
            >
              Separate All
            </button>
          </div>

          <div class="transfer-grid" *ngIf="transferMode === 'transfer' || splitMode === 'custom'">
            <!-- Ships -->
            <div class="transfer-section">
              <h4>Ships</h4>
              <div *ngFor="let item of transferState.ships" class="transfer-row">
                <app-design-preview-button
                  [designId]="item.designId"
                  buttonClass="transfer-ship-btn"
                  title="View hull layout"
                >
                  <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                    {{ getDesignName(item.designId) }} ({{ item.damage || 0 }}% dmg)
                  </span>
                </app-design-preview-button>
                <span class="text-muted" style="white-space:nowrap">Max: {{ item.max }}</span>
                <input
                  type="number"
                  [(ngModel)]="item.count"
                  min="0"
                  [max]="item.max"
                  class="qty-input"
                />
              </div>
            </div>

            <!-- Cargo -->
            <div class="transfer-section" *ngIf="transferMode === 'transfer'">
              <h4>Cargo & Fuel</h4>
              <div class="transfer-row">
                <span>Fuel</span>
                <span class="text-muted">Max: {{ fleet()!.fuel | number: '1.0-0' }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.fuel"
                  min="0"
                  [max]="fleet()!.fuel"
                  class="qty-input"
                />
              </div>
              <div class="transfer-row">
                <span>Resources</span>
                <span class="text-muted">Max: {{ fleet()!.cargo.resources }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.resources"
                  min="0"
                  [max]="fleet()!.cargo.resources"
                  class="qty-input"
                />
              </div>
              <div class="transfer-row">
                <span>Ironium</span>
                <span class="text-muted">Max: {{ fleet()!.cargo.minerals.ironium }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.ironium"
                  min="0"
                  [max]="fleet()!.cargo.minerals.ironium"
                  class="qty-input"
                />
              </div>
              <div class="transfer-row">
                <span>Boranium</span>
                <span class="text-muted">Max: {{ fleet()!.cargo.minerals.boranium }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.boranium"
                  min="0"
                  [max]="fleet()!.cargo.minerals.boranium"
                  class="qty-input"
                />
              </div>
              <div class="transfer-row">
                <span>Germanium</span>
                <span class="text-muted">Max: {{ fleet()!.cargo.minerals.germanium }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.germanium"
                  min="0"
                  [max]="fleet()!.cargo.minerals.germanium"
                  class="qty-input"
                />
              </div>
              <div class="transfer-row">
                <span>Colonists</span>
                <span class="text-muted">Max: {{ fleet()!.cargo.colonists }}</span>
                <input
                  type="number"
                  [(ngModel)]="transferState.colonists"
                  min="0"
                  [max]="fleet()!.cargo.colonists"
                  class="qty-input"
                />
              </div>
            </div>
          </div>

          <div
            *ngIf="transferMode === 'split' && splitMode === 'separate'"
            style="padding:var(--space-lg);text-align:center"
          >
            <p>Separate this fleet into {{ totalShipCount() }} individual fleets?</p>
          </div>

          <div class="transfer-actions">
            <button (click)="cancelTransfer()" class="btn-secondary">Cancel</button>
            <button (click)="confirmTransfer()" class="btn-primary">
              {{
                transferMode === 'split'
                  ? splitMode === 'separate'
                    ? 'Separate All'
                    : 'Split Fleet'
                  : 'Transfer'
              }}
            </button>
          </div>
        </div>
      </div>

      <section class="card" style="display:grid;gap:var(--space-md)">
        <div>
          <div class="text-small text-muted">Location</div>
          <div class="font-medium">
            <span *ngIf="fleet()!.location.type === 'orbit'"
              >Orbiting planet {{ $any(fleet()!.location).planetId }}</span
            >
            <span *ngIf="fleet()!.location.type === 'space'"
              >In space ({{ $any(fleet()!.location).x | number: '1.0-0' }},
              {{ $any(fleet()!.location).y | number: '1.0-0' }})</span
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
            <app-design-preview-button
              *ngFor="let s of fleet()!.ships"
              [designId]="s.designId"
              buttonClass="ship-row"
              title="View hull layout"
            >
              <span class="ship-count" style="margin-right:8px">{{ s.count }}x</span>
              <span class="ship-name" style="flex:1">{{ getDesignName(s.designId) }}</span>
              <span *ngIf="s.damage" class="ship-damage" style="color:var(--color-danger)"
                >{{ s.damage }}% dmg</span
              >
            </app-design-preview-button>
          </div>
        </div>

        <!-- Fleet Actions -->
        <div style="display:flex; gap:var(--space-sm); margin-top:var(--space-sm)">
          <button (click)="startSplit()" class="btn-secondary" *ngIf="totalShipCount() > 1">
            Split Fleet
          </button>
        </div>
      </section>

      <!-- Other Fleets Section -->
      <section *ngIf="otherFleets().length > 0" class="card" style="margin-top:var(--space-xl)">
        <h3 style="margin-bottom:var(--space-md)">Other Fleets Here</h3>
        <div style="display:grid; gap:var(--space-sm)">
          <div
            *ngFor="let f of otherFleets()"
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
              <div class="text-small text-muted">Ironium</div>
              <div class="font-medium">{{ fleet()!.cargo.minerals.ironium }} kT</div>
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
                <label>Ironium (kT)</label>
                <input type="number" min="0" placeholder="0" #ironium />
              </div>
              <div>
                <label>Boranium (kT)</label>
                <input type="number" min="0" placeholder="0" #boranium />
              </div>
              <div>
                <label>Germanium (kT)</label>
                <input type="number" min="0" placeholder="0" #germanium />
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
                (click)="load(res.value, ironium.value, boranium.value, germanium.value, col.value)"
                class="btn-primary"
              >
                Load
              </button>
              <button
                (click)="
                  unload(res.value, ironium.value, boranium.value, germanium.value, col.value)
                "
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
      .transfer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--space-lg);
      }
      .transfer-modal {
        background: var(--color-bg-primary);
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        /* Ensure it doesn't overflow horizontally on small screens */
        box-sizing: border-box;
      }
      .transfer-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-lg);
        margin: var(--space-md) 0;
      }
      .transfer-section {
        background: var(--color-bg-secondary);
        padding: var(--space-md);
        border-radius: var(--radius-md);
        /* Prevent section from forcing width */
        min-width: 0;
      }
      .transfer-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
        min-width: 0; /* Important for flex child truncation */
      }
      /* Custom button class for the transfer row to behave like a flex item but look clean */
      :host ::ng-deep .transfer-ship-btn {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        padding: 4px;
        color: var(--color-text);
        text-align: left;
        cursor: pointer;
        min-width: 0; /* Allow text truncation */
        overflow: hidden; /* Ensure content doesn't spill out */
      }
      :host ::ng-deep .transfer-ship-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-sm);
      }
      .qty-input {
        width: 60px; /* Reduced width to save space */
        padding: 4px;
        flex-shrink: 0; /* Prevent input from shrinking */
      }
      .transfer-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-md);
        margin-top: var(--space-lg);
      }
      @media (max-width: 700px) {
        .transfer-grid {
          grid-template-columns: 1fr;
        }
      }
      .ship-count {
        color: var(--color-text-muted);
        min-width: 30px;
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
    `,
  ],
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

  otherFleets = computed(() => {
    const f = this.fleet();
    const game = this.gs.game();
    if (!f || !game) return [];

    return game.fleets.filter(
      (other) => other.id !== f.id && other.ownerId === f.ownerId && this.isSameLocation(f, other),
    );
  });

  // Transfer State
  transferTarget = signal<Fleet | { name: string; id: 'new' } | null>(null);
  transferMode: 'split' | 'transfer' = 'transfer';
  splitMode: 'custom' | 'separate' = 'custom';
  transferState = {
    ships: [] as { designId: string; damage: number; count: number; max: number }[],
    fuel: 0,
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0,
    colonists: 0,
  };

  isSameLocation(f1: Fleet, f2: Fleet): boolean {
    if (f1.location.type !== f2.location.type) return false;
    if (f1.location.type === 'orbit') {
      return (f1.location as any).planetId === (f2.location as any).planetId;
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

  private getShipDesign(designId: string): any {
    const game = this.gs.game();
    const dynamicDesign = game?.shipDesigns.find((d) => d.id === designId);
    if (dynamicDesign?.spec) {
      return {
        ...dynamicDesign.spec,
        colonyModule: dynamicDesign.spec.hasColonyModule,
        fuelEfficiency: dynamicDesign.spec.fuelEfficiency ?? 100,
      };
    }
    return getDesign(designId);
  }

  startSplit() {
    const f = this.fleet();
    if (!f) return;
    this.transferMode = 'split';
    this.splitMode = 'custom';
    this.transferTarget.set({ name: 'New Fleet', id: 'new' });
    this.initTransferState(f);
  }

  setSplitMode(mode: 'custom' | 'separate') {
    this.splitMode = mode;
  }

  startTransfer(target: Fleet) {
    const f = this.fleet();
    if (!f) return;
    this.transferMode = 'transfer';
    this.transferTarget.set(target);
    this.initTransferState(f);
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

  initTransferState(f: Fleet) {
    this.transferState = {
      ships: f.ships.map((s) => ({
        designId: s.designId,
        damage: s.damage || 0,
        count: 0,
        max: s.count,
      })),
      fuel: 0,
      resources: 0,
      ironium: 0,
      boranium: 0,
      germanium: 0,
      colonists: 0,
    };
  }

  cancelTransfer() {
    this.transferTarget.set(null);
  }

  confirmTransfer() {
    const target = this.transferTarget();
    const f = this.fleet();
    if (!target || !f) return;

    if (this.transferMode === 'split') {
      if (this.splitMode === 'separate') {
        this.gs.separateFleet(f.id);
        this.toast.success('Fleet separated');
        this.transferTarget.set(null);
        return;
      }

      // Custom Split
      const spec = {
        ships: this.transferState.ships
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
        ships: this.transferState.ships
          .filter((s) => s.count > 0)
          .map((s) => ({ designId: s.designId, count: s.count, damage: s.damage })),
        fuel: this.transferState.fuel,
        cargo: {
          resources: this.transferState.resources,
          ironium: this.transferState.ironium,
          boranium: this.transferState.boranium,
          germanium: this.transferState.germanium,
          colonists: this.transferState.colonists,
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
    return f.ships.reduce(
      (sum, s) => sum + this.getShipDesign(s.designId).cargoCapacity * s.count,
      0,
    );
  }
  cargoUsed(): number {
    const f = this.fleet();
    if (!f) return 0;
    const resourcesUsed = f.cargo.resources;
    const m = f.cargo.minerals;
    const mineralsUsed = m.ironium + m.boranium + m.germanium;
    const colonistUsed = Math.floor(f.cargo.colonists / 1000);
    return resourcesUsed + mineralsUsed + colonistUsed;
  }
  load(res: string, ironium: string, boranium: string, germanium: string, col: string) {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.loadCargo(f.id, pid, {
      resources: res ? Number(res) : undefined,
      ironium: ironium ? Number(ironium) : undefined,
      boranium: boranium ? Number(boranium) : undefined,
      germanium: germanium ? Number(germanium) : undefined,
      colonists: col ? Number(col) : undefined,
    });
  }
  unload(res: string, ironium: string, boranium: string, germanium: string, col: string) {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.unloadCargo(f.id, pid, {
      resources: res ? Number(res) : undefined,
      ironium: ironium ? Number(ironium) : undefined,
      boranium: boranium ? Number(boranium) : undefined,
      germanium: germanium ? Number(germanium) : undefined,
      colonists: col ? Number(col) : undefined,
    });
  }
  loadFill() {
    const f = this.fleet();
    if (!f || f.location.type !== 'orbit') return;
    const pid = f.location.planetId;
    this.gs.loadCargo(f.id, pid, {
      resources: 'fill',
      ironium: 'fill',
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
      ironium: 'all',
      boranium: 'all',
      germanium: 'all',
      colonists: 'all',
    });
  }
}
