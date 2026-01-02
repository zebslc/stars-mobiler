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
    // Don't allow selection of non-editable slots
    if (!this.isSlotEditable(slotId)) {
      return;
    }

    this.selectedSlotId.set(slotId);

    // Check if there's only one available component for this slot
    const availableComponents = this.designer.getAvailableComponentsForSlot(slotId);
    const slotDef = this.getSlotByCode(this.hull()!, slotId);

    if (availableComponents.length === 1 && slotDef?.Max === 1) {
      // Auto-add the single component with quantity 1 and don't open modal
      this.designer.setSlotComponent(slotId, availableComponents[0].id, 1);
      this.selectedSlotId.set(null);
    } else {
      // Open modal for selection
      this.componentSelectOpen.set(true);
    }
  }

  // Check if a slot is editable
  isSlotEditable(slotCode: string): boolean {
    const hull = this.hull();
    if (!hull) return false;
    const slotDef = this.getSlotByCode(hull, slotCode);
    return slotDef?.Editable !== false; // Default to true if not specified
  }

  // Get built-in capacity for non-editable slots
  getBuiltinSlotCapacity(slotCode: string): number {
    const hull = this.hull();
    if (!hull) return 0;
    const slotDef = this.getSlotByCode(hull, slotCode);
    const size = slotDef?.Size;
    return typeof size === 'number' ? size : 0;
  }

  addComponent(componentId: string) {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    const slotDef = this.getSlotByCode(this.hull()!, slotId);
    if (!slotDef) return;

    // Set the component with the max quantity (user can adjust later)
    const quantity = slotDef.Max || 1;
    const success = this.designer.setSlotComponent(slotId, componentId, quantity);

    if (success) {
      // Auto-close if max is 1, otherwise keep open for quantity adjustment
      if (slotDef.Max === 1) {
        this.componentSelectOpen.set(false);
        this.selectedSlotId.set(null);
      }
    }
  }

  // Set component quantity for a slot (replaces any existing component)
  setComponentQuantity(slotId: string, componentId: string, quantity: number) {
    this.designer.setSlotComponent(slotId, componentId, quantity);
  }

  // Remove component from slot entirely
  removeComponent(slotId: string) {
    this.designer.clearSlot(slotId);
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

  // Get the single component in a slot (since each slot can only have one component type)
  getSlotComponent(slotId: string): ComponentAssignment | null {
    const design = this.design();
    if (!design) return null;
    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.components?.[0] || null;
  }

  // Check if slot has any components
  hasComponentInSlot(slotId: string): boolean {
    const component = this.getSlotComponent(slotId);
    return component !== null;
  }

  // Get component count in slot
  getSlotComponentCount(slotId: string): number {
    const component = this.getSlotComponent(slotId);
    return component?.count || 0;
  }

  getComponentName(componentId: string): string {
    const component = COMPONENTS[componentId];
    return component ? component.name : 'Empty';
  }

  // Get component description
  getComponentDescription(componentId: string): string {
    const component = COMPONENTS[componentId];
    return component?.description || '';
  }

  // Get component stats summary
  getComponentStats(componentId: string): string {
    const component = COMPONENTS[componentId];
    if (!component || !component.stats) return '';

    const stats: string[] = [];
    const s = component.stats;

    // Shields
    if (s.shield) stats.push(`${s.shield}dp shield protection`);

    // Armor
    if (s.armor) stats.push(`${s.armor}dp armor protection`);

    // Weapons
    if (s.power) stats.push(`${s.power} damage`);
    if (s.range) stats.push(`Range ${s.range}`);
    if (s.accuracy) stats.push(`${s.accuracy}% accuracy`);

    // Engines
    if (s.warp) stats.push(`Warp ${s.warp} capable`);
    if (s.fuelEff !== undefined) {
      if (s.fuelEff === 0) stats.push('Ramscoop drive');
      else stats.push(`${s.fuelEff}mg/ly fuel consumption`);
    }

    // Scanners
    if (s.scan) stats.push(`${s.scan}ly scan range`);

    // Cargo
    if (s.cap) stats.push(`${s.cap}kt capacity`);

    // Mining
    if (s.mining) stats.push(`${s.mining}kt/year mining rate`);

    // Other
    if (s.initiative) stats.push(`+${s.initiative} initiative bonus`);
    if (s.jamming) stats.push(`${s.jamming}% jamming`);
    if (s.cloak) stats.push(`${s.cloak}% cloaking`);

    return stats.join(', ');
  }

  // Legacy compatibility methods (updated to work with single-component-per-slot)
  getTotalComponentCount(slotCode: string): number {
    return this.getSlotComponentCount(slotCode);
  }

  getFirstComponentInSlot(slotCode: string): ComponentAssignment | null {
    return this.getSlotComponent(slotCode);
  }

  // Get hull icon CSS class from data
  getHullIcon(hullName: string): string {
    const hull = this.hull();
    if (hull && hull.img) {
      return hull.img;
    }

    // Fallback to name-based mapping if no img field
    const hullIconMap: { [key: string]: string } = {
      Scout: 'hull-scout',
      Frigate: 'hull-frigate',
      Destroyer: 'hull-destroyer',
      Cruiser: 'hull-cruiser',
      'Battle Cruiser': 'hull-battle-cruiser',
      Battleship: 'hull-battleship',
      Dreadnought: 'hull-dreadnought',
    };

    return hullIconMap[hullName] || 'hull-scout';
  }

  // Check if hull has an image
  hasHullImage(hullName: string): boolean {
    const hull = this.hull();
    if (hull && hull.img) {
      return true;
    }

    // Fallback check
    const hullIconMap: { [key: string]: string } = {
      Scout: 'hull-scout',
      Frigate: 'hull-frigate',
      Destroyer: 'hull-destroyer',
      Cruiser: 'hull-cruiser',
      'Battle Cruiser': 'hull-battle-cruiser',
      Battleship: 'hull-battleship',
      Dreadnought: 'hull-dreadnought',
    };

    return !!hullIconMap[hullName];
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

  // Format component cost from MiniaturizedComponent
  formatComponentCost(component: any): string {
    if (!component || !component.cost) return '';
    const parts: string[] = [];
    if (component.cost.iron) parts.push(`${component.cost.iron}kt Iron`);
    if (component.cost.bor) parts.push(`${component.cost.bor}kt Bor`);
    if (component.cost.germ) parts.push(`${component.cost.germ}kt Germ`);
    if (component.cost.res) parts.push(`${component.cost.res} Res`);
    return parts.join(', ');
  }

  // Get component by ID (for detailed display)
  getComponentById(componentId: string): any {
    const miniComponents = this.designer.miniaturizedComponents();
    return COMPONENTS[componentId] || miniComponents.find((c: any) => c.id === componentId);
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
      case 'bomb':
        return '💣';
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
      case 'general purpose':
        return '⚪';
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

  // Get maximum capacity for a slot
  getSlotMaxCapacity(slotCode: string): number {
    const hull = this.hull();
    if (!hull) return 0;
    const slotDef = this.getSlotByCode(hull, slotCode);
    return slotDef?.Max || 1;
  }

  // Get hull description from data
  getHullDescription(hullName: string): string {
    const hull = this.hull();
    if (hull && hull.description) {
      return hull.description;
    }

    // If no description in data, return a generic message
    return 'Versatile spacecraft design';
  }
}
