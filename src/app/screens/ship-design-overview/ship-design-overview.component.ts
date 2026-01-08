import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { ShipDesignerComponent } from '../ship-designer/ship-designer.component';
import { ShipDesignItemComponent, ShipDesignDisplay } from '../../components/ship-design-item/ship-design-item.component';
import { COMPONENTS } from '../../data/components.data';
import { miniaturizeComponent } from '../../utils/miniaturization.util';
import { getHull } from '../../data/hulls.data';
import { compileShipStats } from '../../models/ship-design.model';
import { ShipDesign } from '../../models/game.model';
import { HullPreviewModalComponent } from '../../shared/components/hull-preview-modal.component';

type DesignerMode = 'list' | 'designer';
type DesignTab = 'starbases' | 'ships';
type HullCategory = 'Warship' | 'Freighter' | 'Utility' | 'Starbase';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ship-design-overview.component.html',
  styleUrls: ['./ship-design-overview.component.css'],
})
export class ShipDesignOverviewComponent {
  private gameState = inject(GameStateService);
  private designer = inject(ShipDesignerService);

  private mode = signal<DesignerMode>('list');
  readonly isDesignerMode = computed(() => this.mode() === 'designer');

  readonly activeTab = signal<DesignTab>('ships');
  readonly selectedCategories = signal<Set<string>>(new Set(['Warship', 'Freighter', 'Utility']));
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

  readonly miniaturizedComponents = computed(() => {
    return Object.values(COMPONENTS).map((comp) => miniaturizeComponent(comp, this.techLevels()));
  });

  private getHullCategory(hull: any): HullCategory {
    if (hull.isStarbase || hull.type === 'starbase') return 'Starbase';
    if (hull.type === 'freighter') return 'Freighter';
    if (hull.type === 'utility' || hull.type === 'colonizer' || hull.type === 'miner')
      return 'Utility';
    return 'Warship';
  }

  readonly designDisplays = computed(() => {
    const designs = this.gameState.game()?.shipDesigns || [];
    const miniComps = this.miniaturizedComponents();
    const tab = this.activeTab();
    const categories = this.selectedCategories();

    return designs
      .map((d) => {
        const hull = getHull(d.hullId);
        if (!hull) return null;

        const category = this.getHullCategory(hull);

        // Filter by tab
        if (tab === 'starbases' && category !== 'Starbase') return null;
        if (tab === 'ships' && category === 'Starbase') return null;

        // Filter by category (only for ships tab)
        if (tab === 'ships' && !categories.has(category)) return null;

        const stats = compileShipStats(hull, d.slots, miniComps);
        return {
          id: d.id,
          name: d.name,
          hullId: d.hullId,
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

  toggleCategory(category: string) {
    const current = new Set(this.selectedCategories());
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    this.selectedCategories.set(current);
  }

  startNewDesign(hullId?: string) {
    if (!this.canCreateNew(this.activeTab())) return;

    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    this.designerHullFilter.set(this.activeTab());

    // Get available hulls filtered by current tab
    const availableHulls = this.designer.getAvailableHulls().filter((h) => {
      const category = this.getHullCategory(h);
      if (this.activeTab() === 'starbases') return category === 'Starbase';
      return category !== 'Starbase';
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
        const category = this.getHullCategory(hull);
        this.designerHullFilter.set(category === 'Starbase' ? 'starbases' : 'ships');
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
      this.previewTitle.set(`${design.name} — ${hull?.name || design.hullId}`);
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
