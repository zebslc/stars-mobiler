import { Component, Input, ChangeDetectionStrategy, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentStats } from '../../../data/tech-atlas.types';
import { FuelUsageGraphComponent } from '../fuel-usage-graph/fuel-usage-graph.component';

@Component({
  selector: 'app-tech-stats',
  standalone: true,
  imports: [CommonModule, FuelUsageGraphComponent],
  template: `
    <div class="tech-stats-container">
      <!-- Primary Stats Grid -->
      <div class="stats-grid">
        <!-- Warp / Movement -->
        @if (stats().warp) {
          <div class="stat-item">
            <span class="label">Speed:</span>
            <span class="value">Warp {{ stats().warp }}</span>
          </div>
        }
        @if (stats().fuelEff) {
          <div class="stat-item">
            <span class="label">Efficiency:</span>
            <span class="value">{{ stats().fuelEff }}mg/ly</span>
          </div>
        }

        <!-- Combat: Weapons -->
        @if (stats().power) {
          <div class="stat-item highlight">
            <span class="label">Damage:</span>
            <span class="value">{{ getTotal(stats().power) }}</span>
            @if (countSig() > 1) {
              <span class="per-unit">({{ stats().power }})</span>
            }
          </div>
        }
        @if (stats().range) {
          <div class="stat-item">
            <span class="label">Range:</span>
            <span class="value">{{ stats().range }}</span>
          </div>
        }
        @if (stats().accuracy) {
          <div class="stat-item">
            <span class="label">Accuracy:</span>
            <span class="value">{{ stats().accuracy }}%</span>
          </div>
        }
        @if (stats().initiative) {
          <div class="stat-item">
            <span class="label">Initiative:</span>
            <span class="value">{{ stats().initiative }}</span>
          </div>
        }

        <!-- Defense: Shields/Armor -->
        @if (stats().shield) {
          <div class="stat-item highlight">
            <span class="label">Shields:</span>
            <span class="value">{{ getTotal(stats().shield) }}</span>
            @if (countSig() > 1) {
              <span class="per-unit">({{ stats().shield }})</span>
            }
          </div>
        }
        @if (stats().armor) {
          <div class="stat-item">
            <span class="label">Armor:</span>
            <span class="value">{{ getTotal(stats().armor) }}</span>
            @if (countSig() > 1) {
              <span class="per-unit">({{ stats().armor }})</span>
            }
          </div>
        }
        @if (stats().defense) {
          <div class="stat-item">
            <span class="label">Defense:</span>
            <span class="value">{{ getTotal(stats().defense) }}%</span>
          </div>
        }

        <!-- Utility / Electronics -->
        @if (stats().cloak) {
          <div class="stat-item">
            <span class="label">Cloak:</span>
            <span class="value">{{ stats().cloak }}%</span>
          </div>
        }
        @if (stats().scan) {
          <div class="stat-item">
            <span class="label">Scan:</span>
            <span class="value">{{ getTotal(stats().scan) }}</span>
          </div>
        }
        @if (stats().pen) {
          <div class="stat-item">
            <span class="label">Pen. Scan:</span>
            <span class="value">{{ getTotal(stats().pen) }}</span>
          </div>
        }
        @if (stats().jamming) {
          <div class="stat-item">
            <span class="label">Jamming:</span>
            <span class="value">{{ getTotal(stats().jamming) }}</span>
          </div>
        }
        @if (stats().energyBonus) {
          <div class="stat-item">
            <span class="label">Capacitor:</span>
            <span class="value">+{{ getTotal(stats().energyBonus) }}</span>
          </div>
        }
        @if (stats().energyGen) {
          <div class="stat-item">
            <span class="label">Generation:</span>
            <span class="value">{{ getTotal(stats().energyGen) }}</span>
          </div>
        }

        <!-- Capacity -->
        @if (stats().cap) {
          <div class="stat-item">
            <span class="label">Capacity:</span>
            <span class="value">{{ getTotal(stats().cap) }}kT</span>
          </div>
        }

        <!-- Terraforming / Mining -->
        @if (stats().terraform) {
          <div class="stat-item">
            <span class="label">Terraform:</span>
            <span class="value">±{{ getTotal(stats().terraform) }}%</span>
          </div>
        }
        @if (stats().mining) {
          <div class="stat-item">
            <span class="label">Mining:</span>
            <span class="value">{{ getTotal(stats().mining) }}</span>
          </div>
        }
        @if (stats().mines) {
          <div class="stat-item">
            <span class="label">Minelayer:</span>
            <span class="value">{{ getTotal(stats().mines) }}</span>
          </div>
        }

        <!-- Bombs -->
        @if (stats().kill) {
          <div class="stat-item">
            <span class="label">Kill:</span>
            <span class="value">{{ getTotal(stats().kill) }}%</span>
          </div>
        }
        @if (stats().struct) {
          <div class="stat-item">
            <span class="label">Structure:</span>
            <span class="value">{{ getTotal(stats().struct) }}</span>
          </div>
        }

        <!-- Mass Drivers -->
        @if (stats().driverSpeed) {
          <div class="stat-item">
            <span class="label">Speed:</span>
            <span class="value">Warp {{ stats().driverSpeed }}</span>
          </div>
        }
      </div>

      <!-- Fuel Usage Graph -->
      @if (fuelUsageInfo(); as info) {
        <app-fuel-usage-graph
          [fuelUsage]="info.fuelUsage"
          [maxWarp]="info.maxWarp"
        ></app-fuel-usage-graph>
      }

      <!-- Meta Stats (Cost, Mass, etc from Input, not just internal stats) -->
      <div class="meta-stats">
        <div class="meta-item mass">
          <span class="label">Mass:</span>
          <span class="value">{{ getTotal(component.mass) }}kt</span>
        </div>

        <div class="meta-item cost">
          <span class="label">Cost:</span>
          <span class="value">
            @if (component.cost.iron) {
              {{ getTotal(component.cost.iron) }} Fe,
            }
            @if (component.cost.bor) {
              {{ getTotal(component.cost.bor) }} Bo,
            }
            @if (component.cost.germ) {
              {{ getTotal(component.cost.germ) }} Ge,
            }
            {{ getTotal(component.cost.res) }} Res
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tech-stats-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.25rem 1rem;
      }

      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        padding: 2px 0;
      }

      .stat-item.highlight .value {
        color: #4fc3f7;
        font-weight: 600;
      }

      .label {
        color: #888;
        margin-right: 0.5rem;
      }

      .value {
        color: #eee;
      }

      .per-unit {
        color: #666;
        font-size: 0.8em;
        margin-left: 4px;
      }

      .meta-stats {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.85rem;
      }

      .meta-item {
        display: flex;
        gap: 0.5rem;
      }

      .meta-item.cost .value {
        color: #ffd700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechStatsComponent implements OnChanges {
  @Input({ required: true }) component!: ComponentStats;
  @Input() count = 1;

  readonly componentSig = signal<ComponentStats | null>(null);
  readonly countSig = signal(1);

  readonly stats = computed(() => this.componentSig()?.stats || {});

  readonly fuelUsageInfo = computed(() => {
    const stats = this.stats();
    if (!stats.fuelUsage) return null;

    // Just return the raw usage and maxWarp, the component handles the rest
    return {
      fuelUsage: stats.fuelUsage,
      maxWarp: stats.maxWarp || 10,
    };
  });

  // Removed graphPaths computed as it is now in the component

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['component']) {
      this.componentSig.set(this.component);
    }
    if (changes['count']) {
      this.countSig.set(this.count);
    }
  }

  getTotal(value: number | undefined): number {
    if (value === undefined) return 0;
    // Handle floating point errors
    const total = value * this.countSig();
    return Math.round(total * 100) / 100;
  }

  formatCost(cost: any): string {
    const parts = [];
    if (cost.iron) parts.push(`${this.getTotal(cost.iron)} Fe`);
    if (cost.bor) parts.push(`${this.getTotal(cost.bor)} Bo`);
    if (cost.germ) parts.push(`${this.getTotal(cost.germ)} Ge`);
    if (cost.res) parts.push(`${this.getTotal(cost.res)} Res`);
    return parts.join(', ');
  }
}
