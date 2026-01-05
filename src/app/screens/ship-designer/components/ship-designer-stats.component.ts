import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CompiledShipStats } from '../../../models/ship-design.model';

@Component({
  selector: 'app-ship-designer-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (stats) {
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
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerStatsComponent {
  @Input({ required: true }) stats: CompiledShipStats | null = null;

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }
}
