import { Component, Input, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CompiledShipStats } from '../../../models/game.model';
import { Hull } from '../../../data/hulls.data';
import { TechStatsComponent } from '../../../shared/components/tech-stats/tech-stats.component';
import { ResourceCostComponent } from '../../../shared/components/resource-cost/resource-cost.component';

@Component({
  selector: 'app-ship-designer-stats',
  standalone: true,
  imports: [CommonModule, TechStatsComponent, ResourceCostComponent],
  template: `
    <div class="tabs">
      <button class="tab" [class.active]="selectedTab() === 'summary'" (click)="setTab('summary')">
        Summary
      </button>
      <button class="tab" [class.active]="selectedTab() === 'details'" (click)="setTab('details')">
        Details
      </button>
    </div>

    @if (selectedTab() === 'summary' && stats) {
      <h3>Ship Statistics</h3>
      @if (hull) {
        <div class="stat-group">
          <h4>Base</h4>
          <div class="stat">
            <span class="label">Hull Mass:</span>
            <span class="value">{{ hull.mass }}kt</span>
          </div>
          @if (!stats.isStarbase) {
            <div class="stat">
              <span class="label">Max Fuel:</span>
              <span class="value">{{ hull.fuelCapacity }}mg</span>
            </div>
          }
          <div class="stat">
            <span class="label">Armor:</span>
            <span class="value">{{ hull.armor }}</span>
          </div>
          @if (hull.Stats.Initiative) {
            <div class="stat">
              <span class="label">Initiative:</span>
              <span class="value">{{ hull.Stats.Initiative }}</span>
            </div>
          }
        </div>
      }
      @if (!stats.isStarbase) {
        <div class="stat-group">
          <h4>⚡ Movement</h4>
          <div class="stat">
            <span class="label">Warp Speed:</span>
            <span class="value">{{ stats.warpSpeed }}</span>
          </div>
          <div class="stat">
            <span class="label">Fuel Capacity:</span>
            <span class="value">{{ stats.fuelCapacity }}mg</span>
          </div>
          <div class="stat">
            <span class="label">Fuel Efficiency:</span>
            <span class="value">
              {{ stats.isRamscoop ? 'Ramscoop' : (stats.fuelEfficiency ?? '—') }}
            </span>
          </div>
          <div class="stat">
            <span class="label">Ideal Warp:</span>
            <span class="value">{{ stats.idealWarp }}</span>
          </div>
        </div>
      }

      <div class="stat-group">
        <h4>🔫 Combat</h4>
        <div class="stat">
          <span class="label">Firepower:</span>
          <span class="value">{{ stats.firepower }}</span>
        </div>
        @if (stats.maxWeaponRange > 0) {
          <div class="stat">
            <span class="label">Max Range:</span>
            <span class="value">{{ stats.maxWeaponRange }}</span>
          </div>
        }
        @if (stats.bombing.kill > 0 || stats.bombing.destroy > 0) {
          <div class="stat">
            <span class="label">Bombing:</span>
            <span class="value">{{ stats.bombing.kill }}% / {{ stats.bombing.destroy }}%</span>
          </div>
        }
        <div class="stat">
          <span class="label">Armor:</span>
          <span class="value">{{ stats.armor }}</span>
        </div>
        <div class="stat">
          <span class="label">Shields:</span>
          <span class="value">{{ stats.shields }}</span>
        </div>
        <div class="stat">
          <span class="label">Accuracy:</span>
          <span class="value">{{ stats.accuracy }}%</span>
        </div>
        <div class="stat">
          <span class="label">Initiative:</span>
          <span class="value">{{ stats.initiative }}</span>
        </div>
      </div>

      <div class="stat-group">
        <h4>🔧 Utility</h4>
        @if (!stats.isStarbase) {
          <div class="stat">
            <span class="label">Cargo:</span>
            <span class="value">{{ stats.cargoCapacity }}kt</span>
          </div>
        }
        <div class="stat">
          <span class="label">Scan Range:</span>
          <span class="value">{{ stats.scanRange }}ly</span>
        </div>
        <div class="stat">
          <span class="label">Pen Scan:</span>
          <span class="value">{{ stats.penScanRange }}ly</span>
        </div>
        @if (stats.canDetectCloaked) {
          <div class="stat">
            <span class="label">Cloak Detection:</span>
            <span class="value">Yes</span>
          </div>
        }
      </div>

      <div class="stat-group">
        <h4>💰 Cost</h4>
        <div class="stat">
          <span class="label">Total Mass:</span>
          <span class="value">{{ stats.mass }}kt</span>
        </div>
        <div class="stat-full">
          <span class="label">Build Cost:</span>
          <app-resource-cost [cost]="stats.cost"></app-resource-cost>
        </div>
      </div>

      @if (!stats.isValid) {
        <div class="validation-errors">
          <h4>❌ Errors</h4>
          @for (error of stats.validationErrors; track error) {
            <div class="error">{{ error }}</div>
          }
        </div>
      } @else {
        <div class="validation-success">
          <h4>✅ Design Valid</h4>
        </div>
      }
    } @else if (selectedTab() === 'details') {
      <div class="component-details">
        <h3>{{ hoveredItem?.name || hoveredItem?.component?.name || 'Hover a component' }}</h3>
        @if (hoveredItem?.component; as comp) {
          <app-tech-stats [component]="comp" [count]="hoveredItem?.count || 1"></app-tech-stats>
          <div class="description">
            {{ comp.description }}
          </div>
        } @else {
          <div class="stat-group">
            <h4>Slot Info</h4>
            @if (hoveredItem?.slotDef) {
              <div class="stat">
                <span class="label">Allowed:</span>
                <span class="value">{{ hoveredItem.slotDef.allowedTypes.join(', ') }}</span>
              </div>
            }
            @if (hoveredItem?.capacity) {
              <div class="stat">
                <span class="label">Capacity:</span>
                @if (hoveredItem.capacity === 'Unlimited') {
                  <span class="value">Unlimited</span>
                } @else {
                  <span class="value">{{ hoveredItem.capacity }}kt</span>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .tab {
        padding: 0.25rem 0.75rem;
        font-size: 0.9rem;
        border: 1px solid var(--color-border, #ddd);
        background: var(--color-bg-secondary, #f5f5f5);
        color: var(--color-text-main, #333);
        border-radius: 4px;
        cursor: pointer;
      }
      .tab.active {
        background: var(--color-primary, #2196f3);
        border-color: var(--color-primary, #2196f3);
        color: white;
      }
      .stat-group {
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: var(--color-bg-secondary, #f5f5f5);
        border-radius: 4px;
        border: 1px solid var(--color-border, #ddd);
      }
      .stat-group h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: var(--color-primary, #2196f3);
        border-bottom: 1px solid var(--color-border, #ddd);
        padding-bottom: 0.25rem;
      }
      .stat {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
      }
      .stat-full {
        margin-top: 0.25rem;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .label {
        color: var(--color-text-muted, #666);
      }
      .value {
        font-weight: 500;
        color: var(--color-text-main, #333);
      }
      .validation-errors {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.35);
        border-radius: 4px;
        color: #d32f2f;
      }
      .validation-success {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.35);
        border-radius: 4px;
        text-align: center;
        color: #388e3c;
      }
      .error {
        color: #d32f2f;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }
      .description {
        font-size: 0.9rem;
        color: var(--color-text-muted, #666);
        font-style: italic;
        margin-top: 1rem;
        padding: 0.5rem;
        border-top: 1px solid var(--color-border, #ddd);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerStatsComponent {
  @Input({ required: true }) stats: CompiledShipStats | null = null;
  @Input() hoveredItem: any = null;
  @Input() hull: Hull | null = null;
  selectedTab = signal<'summary' | 'details'>('summary');

  get hoveredComponent() {
    return this.hoveredItem?.component;
  }

  setTab(tab: 'summary' | 'details') {
    this.selectedTab.set(tab);
  }

  multiplyCost(cost: { ironium?: number; boranium?: number; germanium?: number }, count: number) {
    return {
      ironium: (cost.ironium || 0) * count || undefined,
      boranium: (cost.boranium || 0) * count || undefined,
      germanium: (cost.germanium || 0) * count || undefined,
    };
  }
}
