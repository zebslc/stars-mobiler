import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ComponentStats } from '../../../data/tech-atlas.types';
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
            @if (count() > 1) {
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
            <span class="value">{{ getTotal(stats().accuracy! * 100) }}%</span>
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
            @if (count() > 1) {
              <span class="per-unit">({{ stats().shield }})</span>
            }
          </div>
        }
        @if (stats().armor) {
          <div class="stat-item">
            <span class="label">Armor:</span>
            <span class="value">{{ getTotal(stats().armor) }}</span>
            @if (count() > 1) {
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
            <span class="value">{{ getTotal(stats().cloak! * 100) }}%</span>
          </div>
        }
        @if (stats().unarmedCloak) {
          <div class="stat-item">
            <span class="label">Cloak (Unarmed):</span>
            <span class="value">{{ getTotal(stats().unarmedCloak! * 100) }}%</span>
          </div>
        }
        @if (stats().scan) {
          <div class="stat-item">
            <span class="label">Scan:</span>
            <span class="value">{{ getTotal(stats().scan) }} ly</span>
          </div>
        }
        @if (stats().enemyFleetScanDistance) {
          <div class="stat-item">
            <span class="label">Fleet Scan:</span>
            <span class="value">{{ getTotal(stats().enemyFleetScanDistance) }} ly</span>
          </div>
        }
        @if (stats().planetScanDistance !== undefined) {
          <div class="stat-item">
            <span class="label">Planet Scan:</span>
            <span class="value">{{
              stats().planetScanDistance === 0
                ? 'Orbit'
                : stats().planetScanDistance === -1
                  ? 'None'
                  : getTotal(stats().planetScanDistance) + ' ly'
            }}</span>
          </div>
        }
        @if (stats().pen) {
          <div class="stat-item">
            <span class="label">Penetration. Scan:</span>
            <span class="value">{{ getTotal(stats().pen) }} ly</span>
          </div>
        }
        @if (stats().jamming) {
          <div class="stat-item">
            <span class="label">Jamming:</span>
            <span class="value">{{ getTotal(stats().jamming) }}</span>
          </div>
        }
        @if (stats().cargoSteal) {
          <div class="stat-item highlight">
            <span class="label">Ability:</span>
            <span class="value">Steal Cargo</span>
          </div>
        }
        @if (stats().energyBonus) {
          <div class="stat-item">
            <span class="label">Capacitor:</span>
            <span class="value">+{{ getTotal(stats().energyBonus! * 100) }}%</span>
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
        @if (stats().noDefenceColonistKill) {
          <div class="stat-item">
            <span class="label">Smart Kill:</span>
            <span class="value">{{ getTotal(stats().noDefenceColonistKill) }}</span>
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
          <span class="value">{{ getTotal(component().mass) }}kt</span>
        </div>

        <div class="meta-item cost">
          <span class="label">Cost:</span>
          <span class="value">
            @if (component().cost.ironium) {
              {{ getTotal(component().cost.ironium) }} Fe,
            }
            @if (component().cost.boranium) {
              {{ getTotal(component().cost.boranium) }} Bo,
            }
            @if (component().cost.germanium) {
              {{ getTotal(component().cost.germanium) }} Ge,
            }
            {{ getTotal(component().cost.resources) }} Res
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
export class TechStatsComponent {
  readonly component = input.required<ComponentStats>();
  readonly count = input(1);

  readonly stats = computed(() => this.component().stats || {});

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

  getTotal(value: number | undefined): number {
    if (value === undefined) return 0;
    // Handle floating point errors
    const total = value * this.count();
    return Math.round(total * 100) / 100;
  }
}
