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

type DesignerMode = 'list' | 'designer';
const MAX_DESIGNS = 16;

@Component({
  standalone: true,
  selector: 'app-ship-design-overview',
  imports: [CommonModule, ShipDesignerComponent, ShipDesignItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ship-design-overview.component.html',
  styleUrls: ['./ship-design-overview.component.css'],
})
export class ShipDesignOverviewComponent {
  private gameState = inject(GameStateService);
  private designer = inject(ShipDesignerService);

  private mode = signal<DesignerMode>('list');
  readonly isDesignerMode = computed(() => this.mode() === 'designer');

  readonly techLevels = computed(() => this.gameState.player()?.techLevels || { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 });

  readonly miniaturizedComponents = computed(() => {
      return Object.values(COMPONENTS).map((comp) => miniaturizeComponent(comp, this.techLevels()));
  });

  readonly designDisplays = computed(() => {
      const designs = this.gameState.game()?.shipDesigns || [];
      const miniComps = this.miniaturizedComponents();

      return designs.map(d => {
          const hull = getHull(d.hullId);
          if (!hull) return null;
          const stats = compileShipStats(hull, d.slots, miniComps);
          return {
              id: d.id,
              name: d.name,
              hullId: d.hullId,
              hullName: hull.Name,
              stats: stats
          } as ShipDesignDisplay;
      }).filter((d): d is ShipDesignDisplay => d !== null);
  });

  readonly canCreateNew = computed(() => this.designDisplays().length < MAX_DESIGNS);

  startNewDesign(hullId?: string) {
    if (!this.canCreateNew()) return;
    
    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    // If no hullId provided, use the first available hull
    const availableHulls = this.designer.getAvailableHulls();
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
    this.designer.clearDesign();
  }

  onDesignCanceled() {
    this.mode.set('list');
    this.designer.clearDesign();
  }

  onEditDesign(designId: string) {
      const designs = this.gameState.game()?.shipDesigns || [];
      const design = designs.find(d => d.id === designId);
      if (design) {
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
      if (!this.canCreateNew()) {
          alert('Maximum number of designs reached.');
          return;
      }

      const designs = this.gameState.game()?.shipDesigns || [];
      const design = designs.find(d => d.id === designId);
      if (design) {
          const newDesign: ShipDesign = {
              ...design,
              id: `design-${Date.now()}`,
              name: `${design.name} Copy`
          };
          this.gameState.saveShipDesign(newDesign);
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
