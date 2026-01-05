import { Component, Input, ChangeDetectionStrategy, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentStats } from '../../../data/tech-atlas.types';

@Component({
  selector: 'app-tech-stats',
  standalone: true,
  imports: [CommonModule],
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

        <!-- Combat: Defense -->
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
          <div class="stat-item highlight">
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
            <span class="value">{{ getTotal(stats().defense) }}</span>
          </div>
        }

        <!-- Utility / Electronics -->
        @if (stats().cloak) {
          <div class="stat-item">
            <span class="label">Cloak:</span>
            <span class="value">{{ getTotal(stats().cloak) }}</span>
          </div>
        }
        @if (stats().scan) {
          <div class="stat-item">
            <span class="label">Scan:</span>
            <span class="value">{{ getTotal(stats().scan) }}</span>
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

        <!-- Terraforming -->
        @if (stats().terraform) {
          <div class="stat-item">
            <span class="label">Terraform:</span>
            <span class="value">±{{ getTotal(stats().terraform) }}</span>
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
            <span class="label">Struct:</span>
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
        <div class="fuel-graph-container">
          <div class="graph-title">Fuel Usage vs. Warp Speed</div>
          <svg viewBox="0 0 280 120" class="fuel-graph">
            <!-- Grid Lines -->
            <line x1="30" y1="20" x2="30" y2="100" stroke="#444" stroke-width="1" />
            <line x1="30" y1="100" x2="270" y2="100" stroke="#444" stroke-width="1" />

            <!-- Path -->
            <polyline [attr.points]="graphPath()" fill="none" stroke="#4fc3f7" stroke-width="2" />

            <!-- X Axis Labels -->
            @for (warp of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; track warp) {
              <text
                [attr.x]="30 + (warp - 1) * ((280 - 40) / 9)"
                y="115"
                fill="#888"
                font-size="8"
                text-anchor="middle"
              >
                {{ warp }}
              </text>
            }

            <!-- Y Axis Labels -->
            <text x="25" y="100" fill="#888" font-size="8" text-anchor="end">0</text>
            <text x="25" y="25" fill="#888" font-size="8" text-anchor="end">
              {{ info.maxUsage }}
            </text>

            <!-- Units -->
            <text x="150" y="10" fill="#888" font-size="8" text-anchor="middle">mg/ly</text>
          </svg>
        </div>
      }

      <!-- Cost & Mass Row -->
      <div class="meta-stats">
        <div class="meta-item">
          <span class="label">Mass:</span>
          <span class="value">{{ getTotal(componentSig()?.mass || 0) }}kt</span>
        </div>
        @if (componentSig()?.cost; as cost) {
          <div class="meta-item cost">
            <span class="label">Cost:</span>
            <span class="value">{{ formatCost(cost) }}</span>
          </div>
        }
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

      .fuel-graph-container {
        margin-top: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        padding: 0.5rem;
      }

      .graph-title {
        font-size: 0.8rem;
        color: #888;
        text-align: center;
        margin-bottom: 0.25rem;
      }

      .fuel-graph {
        width: 100%;
        height: auto;
        max-height: 120px;
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

    const data = [];
    let maxUsage = 0;

    // Standard Warp 1-10
    for (let i = 1; i <= 10; i++) {
      // Map index to key
      const key = `warp${i}` as keyof typeof stats.fuelUsage;
      const usage = stats.fuelUsage[key] ?? 0;
      data.push({ warp: i, usage });
      if (usage > maxUsage) maxUsage = usage;
    }

    return { data, maxUsage };
  });

  readonly graphPath = computed(() => {
    const info = this.fuelUsageInfo();
    if (!info || info.maxUsage === 0) return '';

    const { data, maxUsage } = info;
    const width = 280; // viewBox width
    const height = 120; // viewBox height
    const paddingX = 30;
    const paddingY = 20;
    const graphWidth = width - paddingX - 10;
    const graphHeight = height - paddingY * 2;

    const xScale = graphWidth / 9; // 10 points = 9 intervals
    const yScale = graphHeight / maxUsage;

    return data
      .map((d) => {
        const x = paddingX + (d.warp - 1) * xScale;
        const y = height - paddingY - d.usage * yScale;
        return `${x},${y}`;
      })
      .join(' ');
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      this.componentSig.set(this.component);
    }
    if (changes['count']) {
      this.countSig.set(this.count);
    }
  }

  getTotal(value: number | undefined): number {
    if (value === undefined) return 0;
    // Round to 1 decimal place if needed
    return Math.round(value * this.countSig() * 10) / 10;
  }

  formatCost(cost: any): string {
    const parts: string[] = [];
    // Multiply costs by count
    const c = this.countSig();
    if (cost.iron) parts.push(`${cost.iron * c} Fe`);
    if (cost.bor) parts.push(`${cost.bor * c} B`);
    if (cost.germ) parts.push(`${cost.germ * c} Ge`);
    if (cost.ironium) parts.push(`${cost.ironium * c} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium * c} B`);
    if (cost.germanium) parts.push(`${cost.germanium * c} Ge`);

    // Handle resources/credits if present (legacy vs new)
    if (cost.res) parts.push(`${cost.res * c} Res`);

    return parts.join(', ');
  }
}
