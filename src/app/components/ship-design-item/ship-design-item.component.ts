import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResourceCostComponent } from '../../shared/components/resource-cost/resource-cost.component';
import { ShipStatsRowComponent } from '../../shared/components/ship-stats-row/ship-stats-row.component';
import type { CompiledShipStats} from '../../models/game.model';
import { ShipDesign } from '../../models/game.model';
import { getHull } from '../../utils/data-access.util';
import { GameStateService } from '../../services/game/game-state.service';
import { getDesign } from '../../data/ships.data';

export interface ShipDesignDisplay {
  id: string;
  name: string;
  hullId: string;
  stats: CompiledShipStats;
}

@Component({
  selector: 'app-ship-design-item',
  standalone: true,
  imports: [CommonModule, FormsModule, ResourceCostComponent, ShipStatsRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="design-card"
      [class.mode-list]="mode() === 'list'"
      [class.mode-selector]="mode() === 'selector'"
    >
      <div class="design-header">
        <div class="icon-container" (click)="preview.emit(design().id)" title="Preview hull template">
          <img
            [src]="hullIcon"
            [alt]="design().hullId"
            class="hull-icon"
            (error)="onImageError($event)"
          />
        </div>
        <div class="header-info">
          <h3>{{ design().name }}</h3>
          <span class="design-type">{{ hullName }}</span>
        </div>
        @if (count() !== undefined) {
          <div class="ship-count" title="Ships in service">
            <span class="count-badge">{{ count() }}</span>
          </div>
        }
      </div>

      <div class="design-stats">
        @if (mode() === 'list') {
          <app-ship-stats-row [stats]="design().stats"></app-ship-stats-row>
        } @else {
          @if (!design().stats.isStarbase) {
            <div class="stat-row" title="Mass">
              <span class="stat-icon">⚖️</span>
              <span>{{ design().stats.mass }}kt</span>
            </div>
          }
          <div class="stat-row" title="Armor">
            <span class="stat-icon">🛡️</span>
            <span>{{ design().stats.armor }}dp</span>
          </div>
          @if (design().stats.shields > 0) {
            <div class="stat-row" title="Shields">
              <span class="stat-icon">🔵</span>
              <span>{{ design().stats.shields }}dp</span>
            </div>
          }
          @if (design().stats.firepower > 0) {
            <div class="stat-row" title="Firepower">
              <span class="stat-icon">⚔️</span>
              <span>{{ design().stats.firepower }}</span>
            </div>
          }
          @if (!design().stats.isStarbase) {
            <div class="stat-row" title="Speed">
              <span class="stat-icon">🚀</span>
              <span>W{{ design().stats.warpSpeed }}</span>
            </div>
          }
          @if (design().stats.initiative > 0) {
            <div class="stat-row" title="Initiative">
              <span class="stat-icon">⏱️</span>
              <span>{{ design().stats.initiative }}</span>
            </div>
          }
          @if (design().stats.scanRange > 0) {
            <div class="stat-row" title="Scan Range">
              <span class="stat-icon">📡</span>
              <span>{{ design().stats.scanRange }}ly</span>
            </div>
          }
          @if (design().stats.penScanRange > 0) {
            <div class="stat-row" title="Penetrating Scan Range">
              <span class="stat-icon">👁️</span>
              <span>{{ design().stats.penScanRange }}ly</span>
            </div>
          }
          @if (design().stats.fuelCapacity > 0) {
            <div class="stat-row" title="Fuel">
              <span class="stat-icon">⛽</span>
              <span>{{ design().stats.fuelCapacity }}mg</span>
            </div>
          }
          @if (design().stats.cargoCapacity > 0) {
            <div class="stat-row" title="Cargo">
              <span class="stat-icon">📦</span>
              <span>{{ design().stats.cargoCapacity }}kt</span>
            </div>
          }
          @if (design().stats.colonistCapacity > 0) {
            <div class="stat-row" title="Colonists">
              <span class="stat-icon">👥</span>
              <span>{{ design().stats.colonistCapacity }}</span>
            </div>
          }
          <div class="stat-row full-width" title="Cost">
            <span class="stat-icon">💰</span>
            <app-resource-cost [cost]="design().stats.cost" [inline]="true"></app-resource-cost>
          </div>
        }
      </div>

      @if (mode() === 'card') {
        <div class="build-controls">
          <select
            [ngModel]="selectedStarId()"
            (ngModelChange)="selectedStarId.set($event)"
            class="star-select"
          >
            <option value="" disabled selected>Build at...</option>
            @for (star of capableStars(); track star.id) {
              <option [value]="star.id">{{ star.name }}</option>
            }
            @if (capableStars().length === 0) {
              <option value="" disabled>No Capable Docks</option>
            }
          </select>
          <button
            type="button"
            class="btn-small btn-build"
            [disabled]="!selectedStarId()"
            (click)="addToQueue()"
          >
            Add
          </button>
        </div>

        <div class="design-actions">
          @if (!count()) {
            <button type="button" class="btn-small" (click)="edit.emit(design().id)">Edit</button>
          }
          <button type="button" class="btn-small" (click)="clone.emit(design().id)">Clone</button>
          <button type="button" class="btn-small btn-danger" (click)="delete.emit(design().id)">
            Delete
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .design-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
        box-shadow: var(--shadow-sm);
      }

      .design-card.mode-selector {
        padding: var(--space-sm);
        gap: var(--space-sm);
        border: none;
        background: transparent;
        box-shadow: none;
      }

      .design-header {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .icon-container {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.05);
        border-radius: var(--radius-md);
      }

      .hull-icon {
        max-width: 100%;
        max-height: 100%;
      }

      .header-info {
        flex: 1;
      }

      h3 {
        margin: 0;
        font-size: var(--font-size-lg);
        color: var(--color-text-primary);
      }

      .design-type {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .ship-count {
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
        border-radius: 12px;
        padding: 2px 8px;
        font-size: var(--font-size-xs);
        font-weight: bold;
      }

      .design-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }

      .mode-selector .design-stats {
        grid-template-columns: repeat(4, 1fr);
      }

      .stat-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .stat-row.full-width {
        grid-column: 1 / -1;
      }

      .stat-icon {
        width: 1.2em;
        text-align: center;
      }

      .design-actions {
        display: flex;
        gap: var(--space-sm);
        margin-top: var(--space-sm);
        padding-top: 0;
        border-top: none;
      }

      .build-controls {
        display: flex;
        gap: var(--space-sm);
        margin-top: auto;
        padding-top: var(--space-md);
        border-top: 1px solid var(--color-border);
      }

      .star-select {
        flex: 1;
        padding: var(--space-xs);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border);
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        max-width: 100%;
      }

      .btn-build {
        flex: 0 0 auto;
        background: var(--color-primary);
        color: white;
        border: none;
      }
      .btn-build:hover {
        background: var(--color-primary-dark);
      }
      .btn-build:disabled {
        background: var(--color-bg-tertiary);
        color: var(--color-text-tertiary);
        cursor: not-allowed;
      }

      .btn-small {
        flex: 1;
        padding: var(--space-xs) var(--space-sm);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        cursor: pointer;
        font-size: var(--font-size-sm);
      }

      .btn-small:hover {
        background: var(--color-bg-secondary);
        border-color: var(--color-primary);
      }

      .btn-danger {
        color: var(--color-danger);
        border-color: var(--color-danger);
        background: transparent;
      }

      .btn-danger:hover {
        background: var(--color-danger-light);
      }
    `,
  ],
})
export class ShipDesignItemComponent {
  readonly design = input.required<ShipDesignDisplay>();
  readonly count = input<number | undefined>();
  readonly mode = input<'card' | 'list' | 'selector'>('card');

  readonly edit = output<string>();
  readonly delete = output<string>();
  readonly clone = output<string>();
  readonly preview = output<string>();

  private gameState = inject(GameStateService);
  readonly selectedStarId = signal<string>('');

  readonly capableStars = computed(() => {
    const game = this.gameState.game();
    if (!game) return [];

    const designMass = this.design().stats.mass;
    const player = game.humanPlayer;

    // Find stars owned by player
    const ownedStars = game.stars.filter((s) => s.ownerId === player.id);

    return ownedStars
      .filter((star) => {
        // Check for starbase in orbit
        const orbitFleets = game.fleets.filter(
          (f) =>
            f.ownerId === player.id &&
            f.location.type === 'orbit' &&
            (f.location as { starId: string }).starId === star.id,
        );

        // Find if any fleet has a starbase
        const hasCapableStarbase = orbitFleets.some((fleet) => {
          return fleet.ships.some((ship) => {
            let shipDesign = game.shipDesigns.find((d) => d.id === ship.designId);

            if (!shipDesign) {
              const legacy = getDesign(ship.designId);
              if (legacy) {
                shipDesign = { hullId: legacy.hullId } as any;
              }
            }

            if (!shipDesign) return false;

            const hull = getHull(shipDesign.hullId);
            if (!hull) return false;

            if (!hull.Stats?.CanBuildShips) return false;

            const capacity = hull.Stats.DockCapacity;
            if (capacity === 'Unlimited') return true;
            if (typeof capacity === 'number' && capacity >= designMass) return true;

            return false;
          });
        });

        return hasCapableStarbase;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  addToQueue() {
    const starId = this.selectedStarId();
    if (!starId) return;

    this.gameState.addToBuildQueue(starId, {
      project: 'ship',
      cost: this.design().stats.cost,
      shipDesignId: this.design().id,
      count: 1,
    });

    this.selectedStarId.set('');
  }

  get hullName(): string {
    const hull = getHull(this.design().hullId);
    return hull ? hull.Name : this.design().hullId;
  }

  get hullIcon(): string {
    const hull = getHull(this.design().hullId);
    if (hull && hull.id) {
      return `/assets/tech-icons/${hull.id}.png`;
    }

    // Fallback mapping based on known file names
    const name = this.hullName.toLowerCase();
    if (name.includes('scout')) return '/assets/tech-icons/hull-scout.png';
    if (name.includes('destroyer')) return '/assets/tech-icons/hull-destroyer.png';
    if (name.includes('cruiser') && !name.includes('battle'))
      return '/assets/tech-icons/hull-cruiser.png';
    if (name.includes('battle cruiser')) return '/assets/tech-icons/hull-battle-cruiser.png';
    if (name.includes('battleship')) return '/assets/tech-icons/hull-battleship.png';
    if (name.includes('colony')) return '/assets/tech-icons/hull-colony.png';
    if (name.includes('freighter')) {
      if (name.includes('small')) return '/assets/tech-icons/hull-freight-s.png';
      if (name.includes('medium')) return '/assets/tech-icons/hull-freight-m.png';
      if (name.includes('large')) return '/assets/tech-icons/hull-freight-l.png';
      if (name.includes('super')) return '/assets/tech-icons/hull-freight-super.png';
      return '/assets/tech-icons/hull-freight-s.png';
    }
    if (name.includes('miner')) return '/assets/tech-icons/hull-miner.png';
    // Fallback
    return '/assets/tech-icons/hull-scout.png';
  }

  onImageError(event: any) {
    event.target.src = '/assets/tech-icons/hull-scout.png';
  }
}
