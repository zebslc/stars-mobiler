import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Fleet, ShipDesign } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';
import { TechService } from '../../../services/tech.service';
import { getDesign } from '../../../data/ships.data';
import { Hull, getHull } from '../../../data/hulls.data';
import { COMPONENTS } from '../../../data/components.data';
import { compileShipStats } from '../../../models/ship-design.model';
import { miniaturizeComponent } from '../../../utils/miniaturization.util';
import { HullPreviewModalComponent } from '../../../shared/components/hull-preview-modal.component';

@Component({
  selector: 'app-fleet-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, HullPreviewModalComponent],
  template: `
    <div class="fleet-card">
      <div class="fleet-header">
        <div class="fleet-title">
          <h3>{{ fleet.name || 'Fleet ' + fleet.id.slice(-4) }}</h3>
          <span class="fleet-status" [class]="'status-' + status().type">
            {{ status().label }}
          </span>
        </div>
        <button (click)="onJumpToFleet()" class="btn-small">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 8 8 12 12 16" />
            <line x1="16" y1="12" x2="8" y2="12" />
          </svg>
          View on Map
        </button>
      </div>

      <div class="fleet-composition">
        <div class="composition-header">Ships:</div>
        <div class="ships-list">
          @for (ship of fleet.ships; track ship.designId) {
            <div class="ship-row" (click)="openPreview(ship.designId)" title="View hull layout">
              <span class="ship-icon tech-icon" [ngClass]="getHullImageClass(ship.designId)"></span>
              <span class="ship-count">{{ ship.count }}x</span>
              <span class="ship-name">{{ getDesignName(ship.designId) }}</span>
              @if (ship.damage > 0) {
                <span class="ship-damage">{{ ship.damage }}% dmg</span>
              }
            </div>
          }
        </div>
      </div>

      <div class="fleet-stats">
        <div class="stat-row">
          <span class="stat-label">Location:</span>
          <span class="stat-value">{{ location() }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Fuel:</span>
          <span class="stat-value" [style.color]="fuelColor()">
            {{ fleet.fuel | number: '1.0-0' }} / {{ maxFuel() | number: '1.0-0' }}
          </span>
        </div>
        @if (cargo() > 0) {
          <div class="stat-row">
            <span class="stat-label">Cargo:</span>
            <span class="stat-value">{{ cargo() }} / {{ cargoCapacity() }} kT</span>
          </div>
        }
      </div>

      @if (orders().length > 0) {
        <div class="fleet-orders">
          <div class="orders-header">Orders:</div>
          @for (order of orders(); track $index) {
            <div class="order-item">
              <span class="order-index">{{ $index + 1 }}.</span>
              <span class="order-text">{{ formatOrder(order) }}</span>
            </div>
          }
        </div>
      } @else {
        <div class="text-small text-muted" style="padding:var(--space-md)">
          No orders - fleet is idle
        </div>
      }

      <div class="future-features">
        <div class="text-xs text-muted">
          Advanced Orders: <span class="coming-soon">Coming Soon</span>
        </div>
        <div class="text-xs text-muted" style="margin-top:4px">
          (Patrol, Auto Cargo, Refuel Missions)
        </div>
      </div>
    </div>

    @if (previewOpen()) {
      <app-hull-preview-modal
        [hull]="previewHull()"
        [design]="previewDesign()"
        [title]="previewTitle()"
        [stats]="previewStats()"
        (close)="previewOpen.set(false)"
      ></app-hull-preview-modal>
    }
  `,
  styles: [
    `
      .fleet-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .fleet-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--color-border);
      }

      .fleet-title {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .fleet-title h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      .fleet-status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }

      .status-idle {
        background: #95a5a6;
        color: white;
      }

      .status-moving {
        background: #3498db;
        color: white;
      }

      .status-colonizing {
        background: #2ecc71;
        color: white;
      }

      .btn-small {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        font-size: var(--font-size-sm);
        white-space: nowrap;
        cursor: pointer;
      }

      .fleet-composition {
        background: var(--color-bg-tertiary);
        padding: var(--space-md);
        border-radius: var(--radius-sm);
      }

      .composition-header {
        font-weight: 600;
        margin-bottom: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .ships-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .ship-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .ship-icon {
        flex-shrink: 0;
      }

      .ship-count {
        color: var(--color-text-muted);
        min-width: 30px;
      }

      .ship-name {
        flex: 1;
      }

      .ship-damage {
        color: var(--color-danger);
        font-size: var(--font-size-xs);
      }

      .fleet-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat-label {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .stat-value {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .fleet-orders {
        background: var(--color-bg-tertiary);
        padding: var(--space-md);
        border-radius: var(--radius-sm);
      }

      .orders-header {
        font-weight: 600;
        margin-bottom: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .order-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        padding: var(--space-xs) 0;
        font-size: var(--font-size-sm);
      }

      .order-index {
        color: var(--color-text-muted);
        min-width: 20px;
      }

      .order-text {
        flex: 1;
      }

      .future-features {
        padding-top: var(--space-sm);
        border-top: 1px solid var(--color-border);
      }

      .coming-soon {
        color: var(--color-warning);
        font-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetCardComponent {
  @Input({ required: true }) fleet!: Fleet;
  @Output() jumpToFleet = new EventEmitter<void>();

  private gs = inject(GameStateService);
  private techService = inject(TechService);
  previewOpen = signal(false);
  previewHull = signal<Hull | null>(null);
  previewDesign = signal<ShipDesign | null>(null);
  previewTitle = signal<string>('');
  previewStats = signal<any>(null);

  orders = computed(() => this.fleet.orders || []);

  status = computed(() => {
    if (this.orders().length === 0) {
      return { type: 'idle', label: 'Idle' };
    }
    const firstOrder = this.orders()[0];
    if (firstOrder.type === 'colonize') {
      return { type: 'colonizing', label: 'Colonizing' };
    }
    if (firstOrder.type === 'move') {
      return { type: 'moving', label: 'Moving' };
    }
    return { type: 'idle', label: 'Idle' };
  });

  location = computed(() => {
    if (this.fleet.location.type === 'orbit') {
      const location = this.fleet.location as { type: 'orbit'; planetId: string };
      const planet = this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === location.planetId);
      return planet ? `Orbiting ${planet.name}` : 'In orbit';
    }
    const location = this.fleet.location as { type: 'space'; x: number; y: number };
    return `Space (${location.x.toFixed(0)}, ${location.y.toFixed(0)})`;
  });

  maxFuel = computed(() => {
    return this.fleet.ships.reduce((sum, s) => {
      const design = getDesign(s.designId);
      return sum + design.fuelCapacity * s.count;
    }, 0);
  });

  fuelColor = computed(() => {
    const max = this.maxFuel();
    const percent = max > 0 ? (this.fleet.fuel / max) * 100 : 100;
    if (percent < 20) return '#c0392b';
    if (percent < 50) return '#f39c12';
    return '#27ae60';
  });

  cargo = computed(() => {
    const r = this.fleet.cargo.resources;
    const m = this.fleet.cargo.minerals;
    const minerals = m.ironium + m.boranium + m.germanium;
    const colonists = Math.floor(this.fleet.cargo.colonists / 1000);
    return r + minerals + colonists;
  });

  cargoCapacity = computed(() => {
    return this.fleet.ships.reduce((sum, s) => {
      const design = getDesign(s.designId);
      return sum + design.cargoCapacity * s.count;
    }, 0);
  });

  getDesignName(designId: string): string {
    const design = getDesign(designId);
    return design.name || designId;
  }

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

  getHullImageClass(designId: string): string {
    const hullName = this.getHullNameFromDesign(designId);
    return this.techService.getHullImageClass(hullName);
  }

  openPreview(designId: string): void {
    const compiled = getDesign(designId);
    const hull = getHull(compiled.hullId);

    // Try to find the actual ship design for slot layout
    const playerDesigns = this.gs.getPlayerShipDesigns();
    const realDesign = playerDesigns.find((d) => d.id === designId);

    this.previewHull.set(hull || null);
    this.previewDesign.set(realDesign || null);
    this.previewTitle.set(compiled.name);

    if (realDesign && hull) {
      const player = this.gs.player();
      const techLevels = player?.techLevels || {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      };
      const miniaturizedComponents = Object.values(COMPONENTS).map((comp) =>
        miniaturizeComponent(comp, techLevels),
      );
      const stats = compileShipStats(hull, realDesign.slots, miniaturizedComponents);
      this.previewStats.set(stats);
    } else {
      this.previewStats.set(compiled || null);
    }

    this.previewOpen.set(true);
  }

  formatOrder(order: any): string {
    if (order.type === 'move') {
      return `Move to (${order.destination.x.toFixed(0)}, ${order.destination.y.toFixed(0)})`;
    }
    if (order.type === 'colonize') {
      const planet = this.gs
        .stars()
        .flatMap((s) => s.planets)
        .find((p) => p.id === order.planetId);
      return `Colonize ${planet?.name || 'planet'}`;
    }
    return order.type;
  }

  onJumpToFleet() {
    this.jumpToFleet.emit();
  }
}
