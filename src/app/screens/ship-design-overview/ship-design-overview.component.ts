import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { ShipDesignerComponent } from '../ship-designer/ship-designer.component';
import type {
  ShipDesignDisplay} from '../../components/ship-design-item/ship-design-item.component';
import {
  ShipDesignItemComponent
} from '../../components/ship-design-item/ship-design-item.component';
import { getHull } from '../../utils/data-access.util';
import { compileShipStats } from '../../models/ship-design.model';
import type { ShipDesign } from '../../models/game.model';
import { HullPreviewModalComponent } from '../../shared/components/hull-preview-modal.component';
import type {
  FilterItem} from '../../shared/components/filter-ribbon/filter-ribbon.component';
import {
  FilterRibbonComponent
} from '../../shared/components/filter-ribbon/filter-ribbon.component';
import { SHIP_ROLE_CONFIG, getDisplayCategory } from '../../shared/constants/ship-roles.const';

type DesignerMode = 'list' | 'designer';
type DesignTab = 'starbases' | 'ships';

const MAX_SHIP_DESIGNS = 16;
const MAX_STARBASE_DESIGNS = 10;

@Component({
  standalone: true,
  selector: 'app-ship-design-overview',
  imports: [
    CommonModule,
    ShipDesignerComponent,
    ShipDesignItemComponent,
    HullPreviewModalComponent,
    FilterRibbonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ship-design-overview.component.html',
  styleUrls: ['./ship-design-overview.component.css'],
})
export class ShipDesignOverviewComponent {
  private gameState = inject(GameStateService);
  private designer = inject(ShipDesignerService);

  private readonly mode = signal<DesignerMode>('list');
  readonly isDesignerMode = computed(() => this.mode() === 'designer');

  readonly activeTab = signal<DesignTab>('ships');
  readonly selectedCategories = signal<Set<string>>(new Set());
  readonly designerHullFilter = signal<DesignTab>('ships');
  readonly openHullSelectorOnStart = signal(false);

  readonly techLevels = computed(
    () =>
      this.gameState.player()?.techLevels || {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      },
  );

  readonly compiledDesigns = computed(() => {
    const designs = this.gameState.game()?.shipDesigns || [];
    const techLevels = this.techLevels();

    return designs
      .map((design) => {
        const hull = getHull(design.hullId);
        if (!hull) return null;

        const stats = compileShipStats(hull, design.slots, techLevels);
        return { design, hull, stats };
      })
      .filter(Boolean);
  });

  readonly availableCategories = computed(() => {
    const hulls = this.designer.getAvailableHulls();
    const categories = new Set<string>();

    hulls.forEach((hull) => {
      // Skip starbases if we are not in starbase tab logic (but here we want all non-starbase categories)
      if (hull.isStarbase || hull.type === 'starbase') return;

      let type: string = hull.type || 'warship';
      type = getDisplayCategory(type);
      categories.add(type);
    });

    return Array.from(categories)
      .map((type) => ({
        type,
        config: SHIP_ROLE_CONFIG[type] || { label: type, icon: '❓' },
      }))
      .sort((a, b) => a.config.label.localeCompare(b.config.label));
  });

  readonly ribbonItems = computed<Array<FilterItem<string>>>(() => {
    return this.availableCategories().map((cat) => ({
      label: cat.config.label,
      icon: cat.config.icon,
      value: cat.type,
      color: cat.config.color,
    }));
  });

  constructor() {
    effect(() => {
      const categories = this.availableCategories().map((item) => item.type);
      const hasSelection = untracked(() => this.selectedCategories().size > 0);
      if (categories.length === 0 || hasSelection) return;
      this.selectedCategories.set(new Set(categories));
    });
  }

  readonly designDisplays = computed(() => {
    const compiledDesigns = this.compiledDesigns();
    const tab = this.activeTab();
    const categories = this.selectedCategories();

    return compiledDesigns
      .map((compiled) => {
        if (!compiled) return null;

        const { design, hull, stats } = compiled;
        const isStarbase = hull.isStarbase || hull.type === 'starbase';
        const rawType = hull.type || 'warship';
        const type = getDisplayCategory(rawType);

        // Filter by tab
        if (tab === 'starbases' && !isStarbase) return null;
        if (tab === 'ships' && isStarbase) return null;

        // Filter by category (only for ships tab)
        if (tab === 'ships') {
          if (!categories.has(type)) return null;
        }

        return {
          id: design.id,
          name: design.name,
          hullId: design.hullId,
          hullName: hull.Name,
          stats: stats,
        } as ShipDesignDisplay;
      })
      .filter((d): d is ShipDesignDisplay => d !== null);
  });

  readonly shipDesignCount = computed(() => {
    const designs = this.gameState.game()?.shipDesigns || [];
    return designs.filter((d) => {
      const hull = getHull(d.hullId);
      return hull && !hull.isStarbase && hull.type !== 'starbase';
    }).length;
  });

  readonly starbaseDesignCount = computed(() => {
    const designs = this.gameState.game()?.shipDesigns || [];
    return designs.filter((d) => {
      const hull = getHull(d.hullId);
      return hull && (hull.isStarbase || hull.type === 'starbase');
    }).length;
  });

  canCreateNew(tab?: DesignTab): boolean {
    const targetTab = tab || this.activeTab();
    if (targetTab === 'starbases') {
      return this.starbaseDesignCount() < MAX_STARBASE_DESIGNS;
    } else {
      return this.shipDesignCount() < MAX_SHIP_DESIGNS;
    }
  }

  limitMessage(tab?: DesignTab): string {
    const targetTab = tab || this.activeTab();
    const canCreate = this.canCreateNew(targetTab);
    if (canCreate) return '';

    if (targetTab === 'starbases') {
      return `Maximum number of starbase designs (${MAX_STARBASE_DESIGNS}) reached`;
    } else {
      return `Maximum number of ship designs (${MAX_SHIP_DESIGNS}) reached`;
    }
  }

  readonly previewOpen = signal(false);
  readonly previewTitle = signal<string>('');
  readonly previewHull = signal<any>(null);
  readonly previewStats = signal<any>(null);
  readonly previewDesign = signal<ShipDesign | null>(null);

  setTab(tab: DesignTab) {
    this.activeTab.set(tab);
  }

  startNewDesignFromTab(tab: DesignTab) {
    this.activeTab.set(tab);
    this.designerHullFilter.set(tab);
    this.openHullSelectorOnStart.set(true);
    this.startNewDesign();
  }

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

  startNewDesign(hullId?: string) {
    if (!this.canCreateNew(this.activeTab())) return;

    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    this.designerHullFilter.set(this.activeTab());

    // Get available hulls filtered by current tab
    const availableHulls = this.designer.getAvailableHulls().filter((h) => {
      const isStarbase = h.isStarbase || h.type === 'starbase';
      if (this.activeTab() === 'starbases') return isStarbase;
      return !isStarbase;
    });

    // If no hullId provided, use the first available hull from the filtered list
    const defaultHullId =
      hullId || (availableHulls.length > 0 ? availableHulls[0].Name : 'Small Freighter');

    this.designer.setTechLevels(player.techLevels);
    this.designer.startNewDesign(defaultHullId, player.id, turn);
    this.mode.set('designer');
  }

  onDesignSaved() {
    const design = this.designer.currentDesign();
    if (design) {
      this.gameState.saveShipDesign(design);
    }
    this.mode.set('list');
    this.openHullSelectorOnStart.set(false);
    this.designer.clearDesign();
  }

  onDesignCanceled() {
    this.mode.set('list');
    this.openHullSelectorOnStart.set(false);
    this.designer.clearDesign();
  }

  onEditDesign(designId: string) {
    const designs = this.gameState.game()?.shipDesigns || [];
    const design = designs.find((d) => d.id === designId);
    if (design) {
      const hull = getHull(design.hullId);
      if (hull) {
        const isStarbase = hull.isStarbase || hull.type === 'starbase';
        this.designerHullFilter.set(isStarbase ? 'starbases' : 'ships');
      }
      this.openHullSelectorOnStart.set(false);
      const player = this.gameState.player();
      if (player) {
        this.designer.setTechLevels(player.techLevels);
        this.designer.loadDesign(design);
        this.mode.set('designer');
      }
    }
  }

  onDeleteDesign(designId: string) {
    if (confirm('Are you sure you want to delete this design?')) {
      this.gameState.deleteShipDesign(designId);
    }
  }

  onCloneDesign(designId: string) {
    if (!this.canCreateNew(this.activeTab())) {
      alert('Maximum number of designs reached.');
      return;
    }

    const designs = this.gameState.game()?.shipDesigns || [];
    const design = designs.find((d) => d.id === designId);
    if (design) {
      const newDesign: ShipDesign = {
        ...design,
        id: `design-${Date.now()}`,
        name: `${design.name} Copy`,
        slots: design.slots.map((slot) => ({
          ...slot,
          components: slot.components ? slot.components.map((c) => ({ ...c })) : [],
        })),
      };
      this.gameState.saveShipDesign(newDesign);
    }
  }

  onPreviewDesign(designId: string) {
    const design = this.designDisplays().find((d) => d.id === designId);
    const rawDesign = this.gameState.game()?.shipDesigns.find((d) => d.id === designId);

    if (design) {
      const hull = getHull(design.hullId);
      this.previewHull.set(hull || null);
      this.previewStats.set(design.stats);
      this.previewDesign.set(rawDesign || null);
      this.previewTitle.set(`${design.name} — ${hull?.Name || design.hullId}`);
      this.previewOpen.set(true);
    }
  }

  getShipCount(designId: string): number {
    const fleets = this.gameState.game()?.fleets || [];
    let count = 0;
    for (const fleet of fleets) {
      for (const stack of fleet.ships) {
        if (stack.designId === designId) {
          count += stack.count;
        }
      }
    }
    return count;
  }
}
