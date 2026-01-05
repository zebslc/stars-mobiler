import { Component, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPILED_DESIGNS } from '../../data/ships.data';
import { GameStateService } from '../../services/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { ShipDesignerComponent } from '../ship-designer/ship-designer.component';

type DesignerMode = 'list' | 'designer';

@Component({
  standalone: true,
  selector: 'app-ship-design-overview',
  imports: [CommonModule, ShipDesignerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ship-design-overview.component.html',
  styleUrls: ['./ship-design-overview.component.css'],
})
export class ShipDesignOverviewComponent {
  private gameState = inject(GameStateService);
  private designer = inject(ShipDesignerService);

  private mode = signal<DesignerMode>('list');
  readonly isDesignerMode = computed(() => this.mode() === 'designer');

  readonly shipDesigns = Object.values(COMPILED_DESIGNS);
  readonly customDesigns = computed(() => this.gameState.game()?.shipDesigns || []);

  startNewDesign(hullId?: string) {
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
    this.mode.set('list');
    this.designer.clearDesign();
  }

  onDesignCanceled() {
    this.mode.set('list');
    this.designer.clearDesign();
  }

  formatType(design: any): string {
    if (design.colonyModule) return 'Colony Ship';
    if (design.cargoCapacity > 0) return 'Freighter';
    if (design.firepower > 0) return 'Warship';
    if (design.warpSpeed === 0) return 'Starbase';
    return 'Scout';
  }
}
