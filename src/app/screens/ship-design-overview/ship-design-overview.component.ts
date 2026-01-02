import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPILED_DESIGNS } from '../../data/ships.data';
import { GameStateService } from '../../services/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { HULLS, Hull } from '../../data/hulls.data';
import { COMPONENTS } from '../../data/components.data';
import { ComponentAssignment } from '../../models/game.model';
import { HullTemplate, SlotDefinition } from '../../data/tech-atlas.types';

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
    private designer: ShipDesignerService,
  ) {}

  private mode = signal<DesignerMode>('list');
  private selectedSlotId = signal<string | null>(null);

  readonly shipDesigns = Object.values(COMPILED_DESIGNS);
  readonly customDesigns = computed(() => this.gameState.game()?.shipDesigns || []);

  get design() {
    return this.designer.currentDesign;
  }
  get hull() {
    return this.designer.currentHull;
  }
  get stats() {
    return this.designer.compiledStats;
  }
  readonly availableHulls = computed(() => this.designer.getAvailableHulls());

  readonly isDesignerMode = computed(() => this.mode() === 'designer');
  readonly componentSelectOpen = signal(false);

  readonly selectedSlot = computed(() => {
    const slotId = this.selectedSlotId();
    const hull = this.hull();
    if (!slotId || !hull) return null;
    return hull.slots.find((s: any) => s.id === slotId);
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
    
    // Check if there's only one available component for this slot
    const availableComponents = this.designer.getAvailableComponentsForSlot(slotId);
    if (availableComponents.length === 1) {
      // Auto-add the single component and don't open modal
      this.designer.addComponent(slotId, availableComponents[0].id, 1);
      this.selectedSlotId.set(null);
    } else {
      // Open modal for selection
      this.componentSelectOpen.set(true);
    }
  }

  addComponent(componentId: string) {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    const success = this.designer.addComponent(slotId, componentId, 1);
    if (success) {
      // Auto-close if there's only one available component for this slot
      const availableComponents = this.availableComponentsForSlot();
      if (availableComponents.length === 1) {
        this.componentSelectOpen.set(false);
        this.selectedSlotId.set(null);
      }
    }
  }

  // Get component icon - use actual component image from CSS sprite
  getComponentIcon(componentId: string): string {
    const component = COMPONENTS[componentId];
    if (!component || !component.img) return '';

    // Return the CSS class name for the component image
    return component.img;
  }

  // Check if component has an image
  hasComponentImage(componentId: string): boolean {
    const component = COMPONENTS[componentId];
    return !!(component && component.img);
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
      case 'engine':
        return '⚙️';
      case 'weapon':
        return '🔫';
      case 'shield':
        return '🛡️';
      case 'electronics':
        return '📡';
      case 'cargo':
        return '📦';
      default:
        return '⚪';
    }
  }

  getSlotTypeLabel(allowedTypes: string[]): string {
    if (allowedTypes.length === 1) {
      const type = allowedTypes[0];
      switch (type) {
        case 'engine':
          return 'Engine';
        case 'weapon':
          return 'Weapon';
        case 'shield':
          return 'Shield';
        case 'electronics':
          return 'Scanner/Elec';
        case 'cargo':
          return 'Cargo';
        case 'general':
          return 'General';
        default:
          return type;
      }
    }
    return 'Multi-purpose';
  }

  // Parse hull structure and group quarter squares into complete slots
  getSlotGroups(hull: HullTemplate): Array<{
    slotCode: string;
    positions: Array<{ row: number; col: number }>;
    bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number };
    centerRow: number;
    centerCol: number;
    width: number;
    height: number;
  }> {
    const structure = this.getHullStructure(hull);
    const slotMap = new Map<string, Array<{ row: number; col: number }>>();

    // Group all positions by slot code
    structure.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== '.') {
          if (!slotMap.has(cell)) {
            slotMap.set(cell, []);
          }
          slotMap.get(cell)!.push({ row: rowIndex, col: colIndex });
        }
      });
    });

    // Calculate bounds and center for each slot group
    return Array.from(slotMap.entries()).map(([slotCode, positions]) => {
      const minRow = Math.min(...positions.map((p) => p.row));
      const maxRow = Math.max(...positions.map((p) => p.row));
      const minCol = Math.min(...positions.map((p) => p.col));
      const maxCol = Math.max(...positions.map((p) => p.col));

      return {
        slotCode,
        positions,
        bounds: { minRow, maxRow, minCol, maxCol },
        centerRow: minRow + (maxRow - minRow) / 2,
        centerCol: minCol + (maxCol - minCol) / 2,
        width: maxCol - minCol + 1,
        height: maxRow - minRow + 1,
      };
    });
  }

  // Get slot type icon
  getSlotIcon(slotCode: string, hull: HullTemplate): string {
    const slotDef = this.getSlotByCode(hull, slotCode);
    if (!slotDef) return '⚪';

    const allowedTypes = slotDef.Allowed;
    const primary = allowedTypes[0]?.toLowerCase();

    switch (primary) {
      case 'engine':
        return '⚙️';
      case 'weapon':
        return '🔫';
      case 'shield':
        return '🛡️';
      case 'armor':
        return '🛡️';
      case 'scanner':
        return '📡';
      case 'elect':
        return '⚡';
      case 'mech':
        return '🔧';
      case 'cargo':
        return '📦';
      case 'bomb':
        return '💣';
      case 'mining':
        return '⛏️';
      case 'mine':
        return '💥';
      case 'orbital':
        return '🏗️';
      case 'dock':
        return '🚢';
      default:
        return '⚪';
    }
  }

  // Get display name for slot
  getSlotDisplayName(slotCode: string, hull: HullTemplate): string {
    const slotDef = this.getSlotByCode(hull, slotCode);
    if (!slotDef) return slotCode;

    const allowedTypes = slotDef.Allowed;
    if (allowedTypes.length === 1) {
      const type = allowedTypes[0];
      switch (type.toLowerCase()) {
        case 'engine':
          return 'Engine';
        case 'weapon':
          return 'Weapon';
        case 'shield':
          return 'Shield';
        case 'armor':
          return 'Armor';
        case 'scanner':
          return 'Scanner';
        case 'elect':
          return 'Electronics';
        case 'mech':
          return 'Mechanical';
        case 'cargo':
          return 'Cargo';
        case 'bomb':
          return 'Bomb';
        case 'mining':
          return 'Mining';
        case 'mine':
          return 'Mine Layer';
        case 'orbital':
          return 'Orbital';
        case 'dock':
          return 'Dock';
        case 'general purpose':
          return 'General';
        default:
          return type;
      }
    }
    return 'Multi-purpose';
  }

  // Keep the original helper methods for compatibility
  getHullStructure(hull: HullTemplate): string[][] {
    if (!hull.Structure || hull.Structure.length === 0) {
      return [];
    }
    return hull.Structure.map((row: string) => row.split(','));
  }

  getGridDimensions(hull: HullTemplate): { rows: number; cols: number } {
    const structure = this.getHullStructure(hull);
    if (structure.length === 0) return { rows: 0, cols: 0 };
    return {
      rows: structure.length,
      cols: Math.max(...structure.map((row) => row.length)),
    };
  }

  getSlotByCode(hull: HullTemplate, slotCode: string): SlotDefinition | null {
    return hull.Slots.find((slot) => slot.Code === slotCode) || null;
  }

  // Get total component count in slot
  getTotalComponentCount(slotCode: string): number {
    const components = this.getComponentsInSlot(slotCode);
    return components.reduce((total, comp) => total + comp.count, 0);
  }

  // Check if slot has any components
  hasComponentInSlot(slotCode: string): boolean {
    const components = this.getComponentsInSlot(slotCode);
    return components.length > 0;
  }

  // Get first component in slot (for display)
  getFirstComponentInSlot(slotCode: string): ComponentAssignment | null {
    const components = this.getComponentsInSlot(slotCode);
    return components.length > 0 ? components[0] : null;
  }
}
