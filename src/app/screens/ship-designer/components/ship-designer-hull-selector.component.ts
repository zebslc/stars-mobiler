import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TouchClickDirective } from '../../../shared/directives';
import { HullTemplate } from '../../../data/tech-atlas.types';
import {
  FilterRibbonComponent,
  FilterItem,
} from '../../../shared/components/filter-ribbon/filter-ribbon.component';
import {
  ResourceCostComponent,
  Cost,
} from '../../../shared/components/resource-cost/resource-cost.component';
import { SHIP_ROLE_CONFIG, getDisplayCategory } from '../../../shared/constants/ship-roles.const';

@Component({
  selector: 'app-ship-designer-hull-selector',
  standalone: true,
  imports: [CommonModule, TouchClickDirective, ResourceCostComponent, FilterRibbonComponent],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Select Hull</h3>

          <app-filter-ribbon
            [items]="ribbonItems()"
            [selected]="selectedCategories()"
            [showAll]="true"
            [emptyMeansAll]="false"
            (select)="toggleCategory($event)"
          ></app-filter-ribbon>
        </div>

        <div class="modal-body">
          <div class="hull-list">
            @for (hull of filteredHulls(); track hull.id || hull.Name) {
              <div
                class="hull-option"
                [class.selected]="selectedHullId() === (hull.id || hull.Name)"
                appTouchClick
                (touchClick)="onSelect(hull.id || hull.Name)"
                (click)="onSelect(hull.id || hull.Name)"
                (dblclick)="onConfirm()"
              >
                <div class="hull-icon">
                  <img
                    [src]="getHullImagePath(hull)"
                    [alt]="hull.Name"
                    (error)="onImageError($event)"
                    (click)="$event.stopPropagation(); onPreview(hull)"
                  />
                </div>
                <div class="hull-details">
                  <div class="header-row">
                    <div class="hull-name">{{ hull.Name }}</div>
                    <div class="hull-role">{{ hull.role }}</div>
                  </div>

                  <div class="hull-stats-grid">
                    <div class="stat-row">
                      <span
                        >Mass: <strong>{{ hull.Stats.Mass }}kt</strong></span
                      >
                      <span class="divider">•</span>
                      <span
                        >Fuel: <strong>{{ hull.Stats['Max Fuel'] }}mg</strong></span
                      >
                      <span class="divider">•</span>
                      <span
                        >Armor: <strong>{{ hull.Stats.Armor }}</strong></span
                      >
                      <span class="divider">•</span>
                      <span
                        >Init: <strong>{{ hull.Stats.Initiative }}</strong></span
                      >
                      @if (hull.Stats.Cargo) {
                        <span class="divider">•</span>
                        <span
                          >Freight: <strong>{{ hull.Stats.Cargo }}kt</strong></span
                        >
                      }
                    </div>

                    <div class="stat-row">
                      <span class="label">Slots:</span>
                      <span class="value slot-summary">{{ getSlotSummary(hull) }}</span>
                    </div>

                    <div class="stat-row cost-row">
                      <span class="label">Cost:</span>
                      <app-resource-cost
                        [cost]="getHullCost(hull)"
                        [inline]="true"
                      ></app-resource-cost>
                    </div>

                    <div class="stat-row tech-row">
                      <span class="label">Tech:</span>
                      <span class="value">Con {{ hull.techReq?.Construction || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }
            @if (filteredHulls().length === 0) {
              <div class="no-hulls">No hulls found for this category.</div>
            }
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-text" appTouchClick (touchClick)="onClose()" (click)="onClose()">Close</button>
          <button class="btn-primary" [disabled]="!selectedHullId()" appTouchClick (touchClick)="onConfirm()" (click)="onConfirm()">
            Choose
          </button>
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
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      .modal-content {
        background: var(--color-bg-main, #fff);
        border: 1px solid var(--color-border, #ddd);
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        height: 80vh;
        max-height: 800px;
        box-shadow: var(--shadow-lg);
        color: var(--color-text-main, #333);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        padding: 1.5rem 1.5rem 0 1.5rem;
        flex-shrink: 0;
        background: var(--color-bg-main, #fff);
        z-index: 1;
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 0 1.5rem 1.5rem 1.5rem;
      }

      .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--color-border, #ddd);
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        background: var(--color-bg-secondary, #f9f9f9);
        flex-shrink: 0;
      }

      h3 {
        margin-top: 0;
        color: var(--color-primary, #2e86de);
        margin-bottom: 1rem;
      }

      /* Hull List */
      .hull-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0.75rem;
      }

      .hull-option {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        text-align: left;
        gap: 0.75rem;
        background: var(--color-bg-primary, #fff);
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        padding: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
        overflow: hidden;
        position: relative;
      }

      .hull-option:hover {
        background: var(--color-bg-tertiary, #f5f5f5);
        border-color: var(--color-primary, #2e86de);
      }

      .hull-option.selected {
        background: var(--color-primary-light, #e3f2fd);
        border-color: var(--color-primary, #2e86de);
        box-shadow: 0 0 0 1px var(--color-primary, #2e86de);
      }

      .hull-icon {
        width: 48px;
        height: 48px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 0.25rem;
      }

      .hull-icon img {
        max-width: 100%;
        max-height: 100%;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .hull-icon img:hover {
        opacity: 0.8;
      }

      .hull-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .header-row {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
      }

      .hull-name {
        font-weight: bold;
        color: var(--color-primary, #2e86de);
        font-size: 1rem;
      }

      .hull-role {
        font-size: 0.75rem;
        color: var(--color-text-secondary, #555);
        background: rgba(0, 0, 0, 0.05);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .hull-stats-grid {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.85rem;
      }

      .stat-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.35rem;
        color: var(--color-text-secondary, #555);
        line-height: 1.3;
      }

      .stat-row strong {
        color: var(--color-text-main, #333);
        font-weight: 600;
      }

      .divider {
        color: var(--color-border, #ccc);
        font-size: 0.7rem;
      }

      .label {
        color: var(--color-text-secondary, #777);
        min-width: 35px;
      }

      .slot-summary {
        font-family: monospace;
        font-size: 0.8rem;
        color: var(--color-text-main, #333);
      }

      .cost-row {
        margin-top: 0.1rem;
      }

      .no-hulls {
        grid-column: 1 / -1;
        text-align: center;
        color: var(--color-text-muted, #7f8c8d);
        padding: 2rem;
        font-style: italic;
      }

      .btn-primary {
        background: var(--color-primary, #2e86de);
        color: var(--color-text-inverse, #fff);
        border: none;
        padding: 0.5rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }

      .btn-primary:disabled {
        background: #ccc;
        cursor: not-allowed;
        opacity: 0.7;
      }

      .btn-text {
        background: transparent;
        border: 1px solid transparent;
        color: var(--color-text-secondary, #555);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
      }

      .btn-text:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerHullSelectorComponent {
  private hullsSig = signal<HullTemplate[]>([]);
  @Input({ required: true }) set hulls(value: HullTemplate[]) {
    this.hullsSig.set(value);
  }

  @Output() hullSelected = new EventEmitter<string>();
  @Output() previewHull = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  readonly selectedCategories = signal<Set<string>>(new Set());
  readonly selectedHullId = signal<string | null>(null);

  readonly availableCategories = computed(() => {
    const hulls = this.hullsSig();
    const categories = new Set<string>();

    hulls.forEach((hull) => {
      const type = hull.type || 'warship';
      categories.add(getDisplayCategory(type));
    });

    return Array.from(categories)
      .map((type) => ({
        type,
        config: SHIP_ROLE_CONFIG[type] || { label: type, icon: '❓' },
      }))
      .sort((a, b) => a.config.label.localeCompare(b.config.label));
  });

  readonly ribbonItems = computed(() => {
    return this.availableCategories().map((cat) => ({
      label: cat.config.label,
      icon: cat.config.icon,
      value: cat.type,
      color: cat.config.color,
    }));
  });

  constructor() {
    effect(
      () => {
        const all = this.availableCategories().map((c) => c.type);
        const currentSize = untracked(() => this.selectedCategories().size);
        if (all.length > 0 && currentSize === 0) {
          this.selectedCategories.set(new Set(all));
        }
      },

    );
  }

  readonly filteredHulls = computed(() => {
    const all = this.hullsSig();
    const categories = this.selectedCategories();
    // if (categories.size === 0) return all; // No longer needed as we init with all, and empty means none

    return all.filter((h) => categories.has(getDisplayCategory(h.type || 'warship')));
  });

  toggleCategory(category: string | null) {
    const current = new Set(this.selectedCategories());
    const all = this.availableCategories().map((c) => c.type);

    if (category === null) {
      // Toggle All
      const isAllSelected = all.every((c) => current.has(c));
      if (isAllSelected) {
        this.selectedCategories.set(new Set()); // Select None
      } else {
        this.selectedCategories.set(new Set(all)); // Select All
      }
    } else {
      if (current.has(category)) {
        current.delete(category);
      } else {
        current.add(category);
      }
      this.selectedCategories.set(current);
    }
  }

  onSelect(hullId: string) {
    this.selectedHullId.set(hullId);
  }

  onConfirm() {
    const id = this.selectedHullId();
    if (id) {
      this.hullSelected.emit(id);
    }
  }

  onPreview(hull: HullTemplate) {
    this.previewHull.emit(hull.Name);
  }

  onClose() {
    this.close.emit();
  }

  getHullCost(hull: HullTemplate): Cost {
    if (!hull.Cost) return {};
    return {
      ironium: hull.Cost.Ironium,
      boranium: hull.Cost.Boranium,
      germanium: hull.Cost.Germanium,
      resources: hull.Cost.Resources,
    };
  }

  getSlotSummary(hull: HullTemplate): string {
    if (!hull.Slots || hull.Slots.length === 0) return 'None';

    const groups = new Map<string, number>();

    for (const slot of hull.Slots) {
      // Exclude Cargo slots as they are covered by stats, unless it's a specific mechanic
      if (
        slot.Allowed.length === 1 &&
        (slot.Allowed[0] === 'Cargo' || slot.Allowed[0] === 'Fuel')
      ) {
        continue;
      }

      const types = [...slot.Allowed].sort().join('/');
      const count = slot.Max ?? 1;
      groups.set(types, (groups.get(types) || 0) + count);
    }

    if (groups.size === 0) return 'None';

    const parts: string[] = [];
    groups.forEach((count, type) => {
      parts.push(`${count}x ${type}`);
    });

    return parts.join(', ');
  }

  getHullImagePath(hull: HullTemplate): string {
    if (hull.id) {
      return `/assets/tech-icons/${hull.id}.png`;
    }
    // Fallback based on name if no id property
    const name = hull.Name.toLowerCase();
    if (name.includes('scout')) return '/assets/tech-icons/hull-scout.png';
    if (name.includes('freighter')) {
      if (name.includes('small')) return '/assets/tech-icons/hull-freight-s.png';
      if (name.includes('medium')) return '/assets/tech-icons/hull-freight-m.png';
      if (name.includes('large')) return '/assets/tech-icons/hull-freight-l.png';
      return '/assets/tech-icons/hull-freight-s.png';
    }
    if (name.includes('colony')) return '/assets/tech-icons/hull-colony.png';
    return '/assets/tech-icons/hull-scout.png';
  }

  onImageError(event: any) {
    event.target.src = '/assets/tech-icons/hull-scout.png';
  }
}
