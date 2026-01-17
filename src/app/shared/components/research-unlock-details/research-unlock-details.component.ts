import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechService } from '../../../services/tech/tech.service';
import { GameStateService } from '../../../services/game/game-state.service';
import type { HullTemplate, ComponentStats, TechRequirement } from '../../../data/tech-atlas.types';
import { TechField } from '../../../data/tech-tree.data';
import { FuelUsageGraphComponent } from '../fuel-usage-graph/fuel-usage-graph.component';
import { HullLayoutComponent } from '../hull-layout/hull-layout.component';
import type {
  Cost} from '../resource-cost/resource-cost.component';
import {
  ResourceCostComponent
} from '../resource-cost/resource-cost.component';
import { DataAccessService } from '../../../services/data/data-access.service';
import { TouchClickDirective, ClickOutsideDirective } from '../../directives';

@Component({
  selector: 'app-research-unlock-details',
  standalone: true,
  imports: [CommonModule, FuelUsageGraphComponent, HullLayoutComponent, ResourceCostComponent, TouchClickDirective, ClickOutsideDirective],
  template: `
    <div class="modal-overlay">
      <div class="modal-content modal-small" appClickOutside (clickOutside)="onClose()" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-group">
            <div
              class="tech-icon large"
              [style.background-image]="
                'url(/assets/tech-icons/' + (details()?.id || 'placeholder') + '.png)'
              "
            ></div>
            <h3>{{ displayName() }}</h3>
          </div>
          <button class="modal-close" appTouchClick (touchClick)="onClose()">✕</button>
        </div>
        <div class="modal-body">
          @if (details(); as details) {
            <div class="tech-details-grid">
              <div class="description-row">
                <p>{{ details.description }}</p>
              </div>

              @if (hullData(); as hull) {
                <div class="hull-preview-section">
                  <app-hull-layout [hull]="hull" [design]="null"></app-hull-layout>
                </div>
              }

              <div class="detail-row">
                <span class="label">Role/Type:</span>

                <span class="value">{{ techType() }}</span>
              </div>

              <div class="detail-row">
                <span class="label">Cost:</span>
                @if (costData(); as cost) {
                  <app-resource-cost [cost]="cost" [inline]="true"></app-resource-cost>
                } @else {
                  <span class="value">Free</span>
                }
              </div>

              @if (techMass(); as mass) {
                <div class="detail-row">
                  <span class="label">Mass:</span>
                  <span class="value">{{ mass }} kT</span>
                </div>
              }

              <div class="detail-section">
                <h4>Stats</h4>
                @for (stat of techStats(); track $index) {
                  <div class="detail-row">
                    <span class="label">{{ stat.key }}:</span>
                    <span class="value">{{ stat.value }}</span>
                  </div>
                }
              </div>

              @if (fuelUsageInfo(); as info) {
                <div class="detail-section">
                  <app-fuel-usage-graph
                    [fuelUsage]="info.fuelUsage"
                    [maxWarp]="info.maxWarp"
                  ></app-fuel-usage-graph>
                </div>
              }

              <div class="detail-section">
                <h4>Requirements</h4>
                @for (req of techRequirements(); track $index) {
                  <div class="detail-row">
                    <span class="label">{{ req.field }}:</span>
                    <span class="value">Level {{ req.level }}</span>
                  </div>
                }
              </div>
            </div>
          } @else {
            <p>{{ unlockDescription() }}</p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--space-lg);
      }

      .modal-content {
        background: var(--color-bg-primary);
        border-radius: var(--radius-lg);
        max-width: 800px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .modal-small {
        max-width: 500px;
      }

      .modal-header {
        padding: var(--space-lg);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--color-text-muted);
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
      }

      .modal-close:hover {
        background: var(--color-bg-secondary);
      }

      .modal-body {
        padding: var(--space-lg);
        overflow-y: auto;
      }

      .modal-title-group {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .tech-icon.large {
        width: 64px;
        height: 64px;
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        background-color: #000;
        background-size: 64px 64px !important;
      }

      .tech-details-grid {
        display: grid;
        gap: var(--space-sm);
      }

      .description-row {
        padding: 4px 0;
        margin-bottom: var(--space-sm);
        font-style: italic;
        color: var(--color-text-muted);
        border-bottom: 1px solid var(--color-border);
        white-space: normal;
        overflow-wrap: break-word;
      }

      .description-row p {
        margin: 0;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-border);
        padding: 4px 0;
      }

      .detail-section {
        margin-top: var(--space-md);
      }

      .detail-section h4 {
        margin: 0 0 var(--space-sm) 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .label {
        color: var(--color-text-muted);
      }

      .value {
        font-weight: 600;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchUnlockDetailsComponent {
  readonly unlockName = input.required<string>();
  readonly close = output<void>();

  private techService = inject(TechService);
  private readonly dataAccess = inject(DataAccessService);

  readonly details = computed(() => {
    const name = this.unlockName();
    const hull = this.techService.getHullByName(name);
    if (hull) return hull;
    return this.techService.getComponentByName(name) || this.techService.getComponentById(name);
  });

  readonly displayName = computed(() => {
    const d = this.details();
    if (!d) return this.unlockName();
    return 'Name' in d ? (d as HullTemplate).Name : (d as ComponentStats).name;
  });

  readonly hullData = computed(() => {
    const d = this.details();
    if (!d || !('Slots' in d)) return null;
    return this.dataAccess.getHull(this.unlockName());
  });

  readonly techType = computed(() => {
    const d = this.details();
    if (!d) return '';

    if ('role' in d) {
      return `Hull - ${(d as HullTemplate).role}`;
    }
    const comp = d as ComponentStats;
    // Find category - simpler way since we have techService
    const cats = this.techService.getComponentCategories();
    const category = cats.find((cat) => cat.items.some((i) => i.name === comp.name));
    return category ? `${category.category} Component` : 'Component';
  });

  readonly costData = computed<Cost | null>(() => {
    const d = this.details();
    if (!d) return null;

    if ('Cost' in d) {
      const hull = d as HullTemplate;
      const c = hull.Cost;
      return {
        ironium: c.Ironium,
        boranium: c.Boranium,
        germanium: c.Germanium,
        resources: c.Resources,
      };
    } else {
      const comp = d as ComponentStats;
      const c = comp.cost;
      return {
        ironium: c.ironium,
        boranium: c.boranium,
        germanium: c.germanium,
        resources: c.resources,
      };
    }
  });

  readonly techMass = computed(() => {
    const d = this.details();
    if (!d) return null;
    if ('Stats' in d) {
      return (d as HullTemplate).Stats.Mass;
    }
    return (d as ComponentStats).mass ?? null;
  });

  readonly techStats = computed(() => {
    const d = this.details();
    if (!d) return [];

    const stats: Array<{ key: string; value: string }> = [];
    if ('Slots' in d) {
      const hull = d as HullTemplate;
      stats.push({
        key: 'Slots',
        value: `${hull.Slots.length} total`,
      });
      if (hull.note) {
        stats.push({ key: 'Note', value: hull.note });
      }
    } else {
      const comp = d as ComponentStats;
      Object.entries(comp.stats).forEach(([key, value]) => {
        if (value === undefined) return;
        if (key === 'fuelUsage') return; // Skip fuel usage as it has its own graph
        if (key === 'pen' && Number(value) === 0) return; // Skip zero penetration

        let displayValue = value.toString();

        // Format values based on stat type
        if (['kill', 'terraform', 'defense'].includes(key)) {
          displayValue = `${value}%`;
        } else if (
          [
            'accuracy',
            'cloak',
            'unarmedCloak',
            'jamming',
            'stealth',
            'energyBonus',
            'detection',
            'deflectedShieldDamageReduction',
          ].includes(key)
        ) {
          const numValue = Number(value);
          // Handle floating point errors but keep decimals if present (e.g. 12.5)
          const percent = Math.round(numValue * 10000) / 100;
          displayValue = `${percent}%`;
        } else if (key === 'dampening') {
          displayValue = `${value} sq`;
        } else if (key === 'pen') {
          const dist = comp.stats.enemyFleetScanDistance || comp.stats.scan;
          if (comp.type === 'Scanner' && dist) {
            const numValue = Number(value);
            const percent = Math.round((numValue / dist) * 10000) / 100;
            displayValue = `${value} ly (${percent}%)`;
          } else {
            displayValue = `${value} ly`;
          }
        } else if (key === 'planetScanDistance') {
          if (Number(value) === 0) {
            displayValue = 'Orbit only';
          } else {
            displayValue = `${value} ly`;
          }
        } else if (['scan', 'enemyFleetScanDistance'].includes(key)) {
          displayValue = `${value} ly`;
        } else if (['cap', 'gateMass'].includes(key)) {
          displayValue = `${value} kT`;
        } else if (key === 'fuelEff') {
          displayValue = `${value} mg/ly`;
        }

        let formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        if (key === 'pen') {
          formattedKey = 'Enemy Cloak Penetration';
        }
        stats.push({ key: formattedKey, value: displayValue });
      });
    }
    return stats;
  });

  readonly fuelUsageInfo = computed(() => {
    const d = this.details();
    if (!d || 'Slots' in d) return null;
    const comp = d as ComponentStats;
    if (!comp.stats.fuelUsage) return null;

    return {
      fuelUsage: comp.stats.fuelUsage,
      maxWarp: comp.stats.maxWarp || 10,
    };
  });

  readonly techRequirements = computed(() => {
    const d = this.details();
    if (!d) return [];

    const reqs: Array<{ field: string; level: number }> = [];
    let techReq: TechRequirement | undefined;

    if ('techReq' in d) {
      techReq = (d as HullTemplate).techReq;
    } else if ('tech' in d) {
      techReq = (d as ComponentStats).tech;
    }

    if (techReq) {
      Object.entries(techReq).forEach(([field, level]) => {
        const lvl = Number(level);
        if (lvl > 0) {
          reqs.push({ field, level: lvl });
        }
      });
    }
    return reqs;
  });

  readonly unlockDescription = computed(() => {
    // Fallback if details not found
    const descriptions: Record<string, string> = {
      'Quick Jumper 5':
        'Basic warp engine with Warp 5 capability. Mass: 25kT, Fuel efficiency: 100%',
      'Scout Hull': 'Small, fast reconnaissance vessel. 2 general slots, low armor.',
      'Bat Scanner': 'Basic scanner with 50 ly range. Can detect normal-cloaked ships.',
      'Basic Shields': 'Provides 25 DP of shield protection. Absorbs beam weapon damage.',
      'Alpha Torpedo': 'Basic torpedo launcher. Range: 4, Damage: 5, Accuracy: 75%',
      'Total Terraform ±3': 'Allows terraforming of all environmental factors by ±3%',
    };
    const name = this.displayName();
    return (
      descriptions[this.unlockName()] ??
      descriptions[name] ??
      `${name} - Technology from the Stars! universe. This component will be available once this tech level is reached.`
    );
  });

  onClose() {
    this.close.emit();
  }
}
