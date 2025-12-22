import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPILED_DESIGNS } from '../../data/ships.data';
import { GameStateService } from '../../services/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { HULLS, Hull } from '../../data/hulls.data';
import { COMPONENTS } from '../../data/components.data';
import { ComponentAssignment } from '../../models/game.model';

type DesignerMode = 'list' | 'designer';

@Component({
  standalone: true,
  selector: 'app-ship-design-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ship-design-overview.component.html',
  styleUrls: ['./ship-design-overview.component.css'],
})
export class ShipDesignOverviewComponent {
  constructor(
    private gameState: GameStateService,
    private designer: ShipDesignerService
  ) {}

  private mode = signal<DesignerMode>('list');
  private selectedSlotId = signal<string | null>(null);

  readonly shipDesigns = Object.values(COMPILED_DESIGNS);
  readonly customDesigns = computed(() => this.gameState.game()?.shipDesigns || []);

  get design() { return this.designer.currentDesign; }
  get hull() { return this.designer.currentHull; }
  get stats() { return this.designer.compiledStats; }
  readonly availableHulls = computed(() => this.designer.getAvailableHulls());

  readonly isDesignerMode = computed(() => this.mode() === 'designer');
  readonly componentSelectOpen = signal(false);

  readonly selectedSlot = computed(() => {
    const slotId = this.selectedSlotId();
    const hull = this.hull();
    if (!slotId || !hull) return null;
    return hull.slots.find((s) => s.id === slotId);
  });

  readonly availableComponentsForSlot = computed(() => {
    const slotId = this.selectedSlotId();
    if (!slotId) return [];
    return this.designer.getAvailableComponentsForSlot(slotId);
  });

  readonly currentComponentsInSlot = computed(() => {
    const design = this.design();
    const slotId = this.selectedSlotId();
    if (!design || !slotId) return [];
    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.components || [];
  });

  startNewDesign(hullId: string = 'scout') {
    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    this.designer.setTechLevels(player.techLevels);
    this.designer.startNewDesign(hullId, player.id, turn);
    this.mode.set('designer');
  }

  selectHull(hullId: string) {
    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    this.designer.startNewDesign(hullId, player.id, turn);
  }

  selectSlot(slotId: string) {
    this.selectedSlotId.set(slotId);
    this.componentSelectOpen.set(true);
  }

  addComponent(componentId: string) {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    this.designer.addComponent(slotId, componentId, 1);
    // Don't close modal - allow adding more
  }

  removeComponentFromSlot(componentId: string) {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    this.designer.removeComponent(slotId, componentId);
  }

  clearSlot() {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    this.designer.clearSlot(slotId);
    this.componentSelectOpen.set(false);
    this.selectedSlotId.set(null);
  }

  saveDesign() {
    const design = this.designer.getCurrentDesign();
    const stats = this.stats();

    if (!design || !stats) return;

    if (!stats.isValid) {
      alert('Design is invalid:\n' + stats.validationErrors.join('\n'));
      return;
    }

    this.gameState.saveShipDesign(design);
    this.mode.set('list');
    this.designer.clearDesign();
  }

  cancelDesign() {
    this.designer.clearDesign();
    this.mode.set('list');
  }

  updateDesignName(name: string) {
    if (name.trim()) {
      this.designer.setDesignName(name.trim());
    }
  }

  getComponentsInSlot(slotId: string): ComponentAssignment[] {
    const design = this.design();
    if (!design) return [];
    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.components || [];
  }

  getComponentName(componentId: string): string {
    const component = COMPONENTS[componentId];
    return component ? component.name : 'Empty';
  }

  getSlotSummary(slotId: string): string {
    const components = this.getComponentsInSlot(slotId);
    if (components.length === 0) return 'Empty';
    if (components.length === 1 && components[0].count === 1) {
      return this.getComponentName(components[0].componentId);
    }
    return `${components.length} types`;
  }

  getComponentCount(slotId: string, componentId: string): number {
    const components = this.getComponentsInSlot(slotId);
    const comp = components.find((c) => c.componentId === componentId);
    return comp?.count || 0;
  }

  formatType(design: any): string {
    if (design.colonyModule) return 'Colony Ship';
    if (design.cargoCapacity > 0) return 'Freighter';
    if (design.firepower > 0) return 'Warship';
    if (design.warpSpeed === 0) return 'Starbase';
    return 'Scout';
  }

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium}kt Iron`);
    if (cost.boranium) parts.push(`${cost.boranium}kt Bor`);
    if (cost.germanium) parts.push(`${cost.germanium}kt Germ`);
    return parts.join(', ');
  }

  getSlotTypeIcon(allowedTypes: string[]): string {
    const primary = allowedTypes[0];
    switch (primary) {
      case 'engine': return '⚙️';
      case 'weapon': return '🔫';
      case 'shield': return '🛡️';
      case 'electronics': return '📡';
      case 'cargo': return '📦';
      default: return '⚪';
    }
  }

  getSlotTypeLabel(allowedTypes: string[]): string {
    if (allowedTypes.length === 1) {
      const type = allowedTypes[0];
      switch (type) {
        case 'engine': return 'Engine';
        case 'weapon': return 'Weapon';
        case 'shield': return 'Shield';
        case 'electronics': return 'Scanner/Elec';
        case 'cargo': return 'Cargo';
        case 'general': return 'General';
        default: return type;
      }
    }
    return 'Multi-purpose';
  }

  // Parse hull visual grid for display
  getHullLayout(hull: Hull): string[][] {
    const lines = (hull.visualGrid || '').split('\n');
    return lines.map(line => line.split(''));
  }
}
