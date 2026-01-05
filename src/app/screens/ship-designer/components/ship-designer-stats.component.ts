import { Component, Input, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CompiledShipStats } from '../../../models/ship-design.model';
import { Hull } from '../../../data/hulls.data';
import { TechStatsComponent } from '../../../shared/components/tech-stats/tech-stats.component';

@Component({
  selector: 'app-ship-designer-stats',
  standalone: true,
  imports: [CommonModule, TechStatsComponent],
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
          <div class="stat">
            <span class="label">Max Fuel:</span>
            <span class="value">{{ hull.fuelCapacity }}mg</span>
          </div>
          <div class="stat">
            <span class="label">Armor:</span>
            <span class="value">{{ hull.armor }}</span>
          </div>
          @if (hull.Stats?.Initiative) {
            <div class="stat">
              <span class="label">Initiative:</span>
              <span class="value">{{ hull.Stats.Initiative }}</span>
            </div>
          }
        </div>
      }
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

      <div class="stat-group">
        <h4>🔫 Combat</h4>
        <div class="stat">
          <span class="label">Firepower:</span>
          <span class="value">{{ stats.firepower }}</span>
        </div>
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
        <div class="stat">
          <span class="label">Cargo:</span>
          <span class="value">{{ stats.cargoCapacity }}kt</span>
        </div>
        <div class="stat">
          <span class="label">Scan Range:</span>
          <span class="value">{{ stats.scanRange }}ly</span>
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
          <span class="value">{{ formatCost(stats.cost) }}</span>
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
        border: 1px solid rgba(100, 150, 255, 0.4);
        background: rgba(255, 255, 255, 0.06);
        color: #e6f2ff;
        border-radius: 4px;
        cursor: pointer;
      }
      .tab.active {
        background: rgba(100, 150, 255, 0.25);
        border-color: rgba(100, 150, 255, 0.7);
        color: #ffffff;
      }
      .stat-group {
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .stat-group h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #a5c7ff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
      }
      .label {
        color: #c0c8d8;
      }
      .value {
        font-weight: 500;
        color: #ffffff;
      }
      .validation-errors {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(244, 67, 54, 0.08);
        border: 1px solid rgba(244, 67, 54, 0.35);
        border-radius: 4px;
        color: #ff9999;
      }
      .validation-success {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(76, 175, 80, 0.08);
        border: 1px solid rgba(76, 175, 80, 0.35);
        border-radius: 4px;
        text-align: center;
        color: #9be59b;
      }
      .error {
        color: #ff8a80;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }
      .description {
        font-size: 0.9rem;
        color: #cfd8dc;
        font-style: italic;
        margin-top: 1rem;
        padding: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
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

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }

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
