import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fleet, Star } from '../../../../models/game.model';

export interface OrbitTransferState {
  resources: number;
  ironium: number;
  boranium: number;
  germanium: number;
  colonists: number;
}

export interface CargoTransferRequest {
  load: Partial<OrbitTransferState>;
  unload: Partial<OrbitTransferState>;
}

@Component({
  selector: 'app-fleet-cargo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <h3 style="margin-bottom:var(--space-lg)">Cargo</h3>
      <div style="display:grid;gap:var(--space-md)">
        <div>
          <div class="text-small text-muted">Capacity</div>
          <div class="font-medium">{{ projectedCargoUsed() }} / {{ cargoCapacity }} kT</div>
        </div>
        <div
          style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:var(--space-md)"
        >
          <div>
            <div class="text-small text-muted">Resources</div>
            <div class="font-medium">{{ orbitTransferState.resources }} R</div>
          </div>
          <div>
            <div class="text-small text-muted">Ironium</div>
            <div class="font-medium">{{ orbitTransferState.ironium }} kT</div>
          </div>
          <div>
            <div class="text-small text-muted">Boranium</div>
            <div class="font-medium">{{ orbitTransferState.boranium }} kT</div>
          </div>
          <div>
            <div class="text-small text-muted">Germanium</div>
            <div class="font-medium">{{ orbitTransferState.germanium }} kT</div>
          </div>
          <div>
            <div class="text-small text-muted">Colonists</div>
            <div class="font-medium">{{ orbitTransferState.colonists | number }}</div>
          </div>
        </div>
        @if (fleet.location.type === 'orbit') {
          <div style="background:var(--color-bg-secondary);padding:var(--space-lg);border-radius:var(--radius-md);margin-top:var(--space-md)">
          <div class="font-bold" style="margin-bottom:var(--space-md)">Transfer Cargo</div>
          <div style="display:grid; gap:var(--space-md); margin-bottom:var(--space-md)">
            <!-- Resources -->
            <div class="transfer-slider-row">
              <div class="slider-header">
                <span class="label">Resources</span>
              </div>
              <div class="slider-container">
                <span class="text-xs text-muted"
                  >Surf: {{ getProjectedSurface('resources') }}</span
                >
                <input
                  type="range"
                  [(ngModel)]="orbitTransferState.resources"
                  min="0"
                  [max]="getMaxFleet('resources')"
                  style="accent-color: var(--color-warning); flex: 1"
                />
                <span class="text-xs text-muted">Fleet: {{ orbitTransferState.resources }}</span>
              </div>
            </div>

            <!-- Ironium -->
            <div class="transfer-slider-row">
              <div class="slider-header">
                <span class="label">Ironium</span>
              </div>
              <div class="slider-container">
                <span class="text-xs text-muted">Surf: {{ getProjectedSurface('ironium') }}</span>
                <input
                  type="range"
                  [(ngModel)]="orbitTransferState.ironium"
                  min="0"
                  [max]="getMaxFleet('ironium')"
                  style="accent-color: var(--color-ironium); flex: 1"
                />
                <span class="text-xs text-muted">Fleet: {{ orbitTransferState.ironium }}</span>
              </div>
            </div>

            <!-- Boranium -->
            <div class="transfer-slider-row">
              <div class="slider-header">
                <span class="label">Boranium</span>
              </div>
              <div class="slider-container">
                <span class="text-xs text-muted">Surf: {{ getProjectedSurface('boranium') }}</span>
                <input
                  type="range"
                  [(ngModel)]="orbitTransferState.boranium"
                  min="0"
                  [max]="getMaxFleet('boranium')"
                  style="accent-color: var(--color-boranium); flex: 1"
                />
                <span class="text-xs text-muted">Fleet: {{ orbitTransferState.boranium }}</span>
              </div>
            </div>

            <!-- Germanium -->
            <div class="transfer-slider-row">
              <div class="slider-header">
                <span class="label">Germanium</span>
              </div>
              <div class="slider-container">
                <span class="text-xs text-muted">Surf: {{ getProjectedSurface('germanium') }}</span>
                <input
                  type="range"
                  [(ngModel)]="orbitTransferState.germanium"
                  min="0"
                  [max]="getMaxFleet('germanium')"
                  style="accent-color: var(--color-germanium); flex: 1"
                />
                <span class="text-xs text-muted">Fleet: {{ orbitTransferState.germanium }}</span>
              </div>
            </div>

            <!-- Colonists -->
            <div class="transfer-slider-row">
              <div class="slider-header">
                <span class="label">Colonists</span>
              </div>
              <div class="slider-container">
                <span class="text-xs text-muted"
                  >Surf: {{ getProjectedSurface('colonists') | number }}</span
                >
                <input
                  type="range"
                  [(ngModel)]="orbitTransferState.colonists"
                  min="0"
                  [max]="getMaxFleet('colonists')"
                  style="flex: 1"
                />
                <span class="text-xs text-muted"
                  >Fleet: {{ orbitTransferState.colonists | number }}</span
                >
              </div>
            </div>
          </div>
          <div
            style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:var(--space-md)"
          >
            <button (click)="commitTransfer()" class="btn-primary" style="grid-column: 1 / -1">
              Transfer Cargo
            </button>
            <button (click)="loadFill.emit()" class="btn-success">Load to Fill</button>
            <button (click)="unloadAll.emit()" class="btn-danger">Unload All</button>
          </div>
        </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .transfer-slider-row {
        background: rgba(255, 255, 255, 0.03);
        padding: var(--space-sm);
        border-radius: var(--radius-sm);
        min-width: 0;
        overflow: hidden;
      }
      .slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-xs);
      }
      .slider-container {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        min-width: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetCargoComponent implements OnChanges {
  @Input({ required: true }) fleet!: Fleet;
  @Input() star: Star | null = null;
  @Input() cargoCapacity: number = 0;

  @Output() transferCargo = new EventEmitter<CargoTransferRequest>();
  @Output() loadFill = new EventEmitter<void>();
  @Output() unloadAll = new EventEmitter<void>();

  orbitTransferState: OrbitTransferState = {
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0,
    colonists: 0,
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fleet'] && this.fleet) {
      // Re-initialize only if the fleet reference changes significantly,
      // but we want to preserve user edits if just polling updates?
      // For now, let's sync with fleet to ensure fresh data.
      // If the user is dragging a slider and an update comes in, this might jump.
      // But typically updates happen on turn or specific actions.
      this.orbitTransferState = {
        resources: this.fleet.cargo.resources,
        ironium: this.fleet.cargo.minerals.ironium,
        boranium: this.fleet.cargo.minerals.boranium,
        germanium: this.fleet.cargo.minerals.germanium,
        colonists: this.fleet.cargo.colonists,
      };
    }
  }

  getTotalAvailable(
    type: 'resources' | 'ironium' | 'boranium' | 'germanium' | 'colonists',
  ): number {
    if (!this.fleet) return 0;
    const f = this.fleet;
    const p = this.star;

    const fleetVal =
      type === 'colonists'
        ? f.cargo.colonists
        : type === 'resources'
          ? f.cargo.resources
          : f.cargo.minerals[type];
    const surfVal =
      type === 'colonists'
        ? p?.population || 0
        : type === 'resources'
          ? p?.resources || 0
          : p?.surfaceMinerals[type] || 0;

    return fleetVal + surfVal;
  }

  getProjectedSurface(
    type: 'resources' | 'ironium' | 'boranium' | 'germanium' | 'colonists',
  ): number {
    return this.getTotalAvailable(type) - this.orbitTransferState[type];
  }

  projectedCargoUsed(): number {
    if (!this.fleet) return 0;
    const state = this.orbitTransferState;
    const resources = state.resources;
    const minerals = state.ironium + state.boranium + state.germanium;
    const colonists = Math.floor(state.colonists / 1000);
    return resources + minerals + colonists;
  }

  getMaxFleet(type: 'resources' | 'ironium' | 'boranium' | 'germanium' | 'colonists'): number {
    const totalAvail = this.getTotalAvailable(type);
    const capacity = this.cargoCapacity;
    const currentUsed = this.projectedCargoUsed();

    const currentTypeSpace =
      type === 'colonists'
        ? Math.floor(this.orbitTransferState[type] / 1000)
        : this.orbitTransferState[type];
    const freeSpace = capacity - (currentUsed - currentTypeSpace);

    let maxCapacityAllowed = 0;
    if (type === 'colonists') {
      const otherStuff = currentUsed - Math.floor(this.orbitTransferState.colonists / 1000);
      maxCapacityAllowed = Math.max(0, (capacity - otherStuff) * 1000 + 999);
    } else {
      maxCapacityAllowed = Math.max(0, freeSpace);
    }

    return Math.min(totalAvail, maxCapacityAllowed);
  }

  commitTransfer() {
    const f = this.fleet;
    if (!f) return;

    const loadPayload: any = { resources: undefined };
    const unloadPayload: any = { resources: undefined };
    let hasLoad = false;
    let hasUnload = false;

    const types = ['resources', 'ironium', 'boranium', 'germanium', 'colonists'] as const;
    types.forEach((t) => {
      const current =
        t === 'colonists'
          ? f.cargo.colonists
          : t === 'resources'
            ? f.cargo.resources
            : f.cargo.minerals[t];
      const target = this.orbitTransferState[t];
      const delta = target - current;

      if (delta > 0) {
        loadPayload[t] = delta;
        hasLoad = true;
      } else if (delta < 0) {
        unloadPayload[t] = -delta;
        hasUnload = true;
      }
    });

    this.transferCargo.emit({ load: hasLoad ? loadPayload : {}, unload: hasUnload ? unloadPayload : {} });
  }
}
