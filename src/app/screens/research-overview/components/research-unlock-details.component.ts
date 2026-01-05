import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechService } from '../../../services/tech.service';
import { GameStateService } from '../../../services/game-state.service';
import { HullTemplate, ComponentStats, TechRequirement, TECH_ATLAS } from '../../../data/tech-atlas.data';
import { TechField } from '../../../data/tech-tree.data';

@Component({
  selector: 'app-research-unlock-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content modal-small" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="tech-icon large" [ngClass]="iconClass()"></div>
            <h3>{{ unlockName }}</h3>
          </div>
          <button class="modal-close" (click)="onClose()">✕</button>
        </div>
        <div class="modal-body">
          @if (details(); as details) {
            <div class="tech-details-grid">
              <div class="description-row">
                <p>{{ details.description }}</p>
              </div>

              <div class="detail-row">
                <span class="label">Role/Type:</span>
                <span class="value">{{ techType() }}</span>
              </div>

              <div class="detail-row">
                <span class="label">Cost:</span>
                <span class="value">{{ techCost() }}</span>
              </div>

              @if (techMass(); as mass) {
                <div class="detail-row">
                  <span class="label">Mass:</span>
                  <span class="value">{{ mass }} kT</span>
                </div>
              }

              <div class="detail-section">
                <h4>Stats</h4>
                @for (stat of techStats(); track stat.key) {
                  <div class="detail-row">
                    <span class="label">{{ stat.key }}:</span>
                    <span class="value">{{ stat.value }}</span>
                  </div>
                }
              </div>

              <div class="detail-section">
                <h4>Requirements</h4>
                @for (req of techRequirements(); track req.field) {
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
  styles: [`
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchUnlockDetailsComponent {
  @Input({ required: true }) unlockName!: string;
  @Output() close = new EventEmitter<void>();

  private techService = inject(TechService);

  details = computed(() => {
    const name = this.unlockName;
    const hull = this.techService.getHullByName(name);
    if (hull) return hull;
    return this.techService.getComponentByName(name);
  });

  iconClass = computed(() => {
    const d = this.details();
    return d?.img ?? '';
  });

  techType = computed(() => {
    const d = this.details();
    if (!d) return '';
    
    if ('role' in d) {
      return `Hull - ${(d as HullTemplate).role}`;
    }
    const comp = d as ComponentStats;
    // Find category - simpler way since we have techService
    const cats = this.techService.getComponentCategories();
    const category = cats.find((cat) => cat.items.some(i => i.name === comp.name));
    return category ? `${category.category} Component` : 'Component';
  });

  techCost = computed(() => {
    const d = this.details();
    if (!d) return '';

    const parts: string[] = [];
    if ('Cost' in d) {
      // Hull uses PascalCase
      const hull = d as HullTemplate;
      const c = hull.Cost;
      if (c.Resources) parts.push(`${c.Resources} Res`);
      if (c.Ironium) parts.push(`${c.Ironium} Fe`);
      if (c.Boranium) parts.push(`${c.Boranium} Bo`);
      if (c.Germanium) parts.push(`${c.Germanium} Ge`);
    } else {
      // Component uses lowercase
      const comp = d as ComponentStats;
      const c = comp.cost;
      if (c.res) parts.push(`${c.res} Res`);
      if (c.iron) parts.push(`${c.iron} Fe`);
      if (c.bor) parts.push(`${c.bor} Bo`);
      if (c.germ) parts.push(`${c.germ} Ge`);
    }
    return parts.length > 0 ? parts.join(', ') : 'Free';
  });

  techMass = computed(() => {
    const d = this.details();
    if (!d) return null;
    if ('Stats' in d) {
      return (d as HullTemplate).Stats.Mass;
    }
    return (d as ComponentStats).mass ?? null;
  });

  techStats = computed(() => {
    const d = this.details();
    if (!d) return [];

    const stats: { key: string; value: string }[] = [];
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
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        stats.push({ key: formattedKey, value: value.toString() });
      });
    }
    return stats;
  });

  techRequirements = computed(() => {
    const d = this.details();
    if (!d) return [];

    const reqs: { field: string; level: number }[] = [];
    let techReq: TechRequirement | undefined;
    
    if ('techReq' in d) {
      techReq = (d as HullTemplate).techReq;
    } else if ('tech' in d) {
      techReq = (d as ComponentStats).tech;
    }

    if (techReq) {
      Object.entries(techReq).forEach(([field, level]) => {
        reqs.push({ field, level: Number(level) });
      });
    }
    return reqs;
  });

  unlockDescription = computed(() => {
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
    return (
      descriptions[this.unlockName] ??
      `${this.unlockName} - Technology from the Stars! universe. This component will be available once this tech level is reached.`
    );
  });

  onClose() {
    this.close.emit();
  }
}
