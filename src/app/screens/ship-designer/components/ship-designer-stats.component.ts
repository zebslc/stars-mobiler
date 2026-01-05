import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CompiledShipStats } from '../../../models/ship-design.model';

@Component({
  selector: 'app-ship-designer-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hoveredItem) {
      <div class="component-details">
        <h3>{{ hoveredItem.name || hoveredItem.component?.name || 'Empty Slot' }}</h3>

        @if (hoveredItem.component; as comp) {
          <div class="stat-group">
            <h4>Stats</h4>
            @if (comp.cost) {
              <div class="stat-full">
                <span class="label">Cost:</span>
                <span class="value">{{ formatCost(comp.cost) }}</span>
              </div>
            }
            @if (comp.mass) {
              <div class="stat">
                <span class="label">Mass:</span>
                <span class="value">{{ comp.mass }}kt</span>
              </div>
            }
            @if (comp.armor) {
              <div class="stat">
                <span class="label">Armor:</span>
                <span class="value">{{ comp.armor }}</span>
              </div>
            }
            @if (comp.shield) {
              <div class="stat">
                <span class="label">Shield:</span>
                <span class="value">{{ comp.shield }}</span>
              </div>
            }
            @if (comp.power) {
              <div class="stat">
                <span class="label">Power:</span>
                <span class="value">{{ comp.power }}</span>
              </div>
            }
            @if (comp.damage) {
              <div class="stat">
                <span class="label">Damage:</span>
                <span class="value">{{ comp.damage }}</span>
              </div>
            }
            @if (comp.accuracy) {
              <div class="stat">
                <span class="label">Accuracy:</span>
                <span class="value">{{ comp.accuracy }}%</span>
              </div>
            }
            @if (comp.initiative) {
              <div class="stat">
                <span class="label">Initiative:</span>
                <span class="value">{{ comp.initiative }}</span>
              </div>
            }
            @if (comp.range) {
              <div class="stat">
                <span class="label">Range:</span>
                <span class="value">{{ comp.range }}</span>
              </div>
            }
          </div>
          <div class="description">
            {{ comp.description }}
          </div>
        } @else if (hoveredItem.slotDef) {
          <div class="stat-group">
            <h4>Slot Info</h4>
            <div class="stat">
              <span class="label">Allowed:</span>
              <span class="value">{{ hoveredItem.slotDef.allowedTypes.join(', ') }}</span>
            </div>
            @if (hoveredItem.capacity) {
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
    } @else if (stats) {
      <h3>Ship Statistics</h3>

      <!-- Movement Stats -->
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
            {{ stats.fuelEfficiency === 0 ? 'Ramscoop' : stats.fuelEfficiency }}
          </span>
        </div>
        <div class="stat">
          <span class="label">Ideal Warp:</span>
          <span class="value">{{ stats.idealWarp }}</span>
        </div>
      </div>

      <!-- Combat Stats -->
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

      <!-- Utility Stats -->
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

      <!-- Mass and Cost -->
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

      <!-- Validation -->
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
    }
  `,
  styles: [
    `
      .stat-group {
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 4px;
      }
      .stat-group h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #34495e;
        border-bottom: 1px solid #ddd;
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
        color: #7f8c8d;
      }
      .value {
        font-weight: 500;
        color: #2c3e50;
      }
      .validation-errors {
        margin-top: 1rem;
        padding: 1rem;
        background: #fee;
        border: 1px solid #fcc;
        border-radius: 4px;
      }
      .validation-success {
        margin-top: 1rem;
        padding: 1rem;
        background: #efe;
        border: 1px solid #cfc;
        border-radius: 4px;
        text-align: center;
        color: #27ae60;
      }
      .error {
        color: #c0392b;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
      }
      .description {
        font-size: 0.9rem;
        color: #aaa;
        font-style: italic;
        margin-top: 1rem;
        padding: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerStatsComponent {
  @Input({ required: true }) stats: CompiledShipStats | null = null;
  @Input() hoveredItem: any = null;

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
}
