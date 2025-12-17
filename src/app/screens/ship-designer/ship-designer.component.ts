import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { GameStateService } from '../../services/game-state.service';
import { HULLS, Hull } from '../../data/hulls.data';
import { Component as ShipComponent } from '../../data/components.data';
import { MiniaturizedComponent } from '../../utils/miniaturization.util';

@Component({
  selector: 'app-ship-designer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ship-designer.component.html',
  styleUrl: './ship-designer.component.css',
})
export class ShipDesignerComponent implements OnInit {
  constructor(
    private designer: ShipDesignerService,
    private gameState: GameStateService,
    private router: Router
  ) {}

  private selectedSlotId = signal<string | null>(null);

  get design() { return this.designer.currentDesign; }
  get hull() { return this.designer.currentHull; }
  get stats() { return this.designer.compiledStats; }
  readonly availableHulls = computed(() => this.designer.getAvailableHulls());

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

  readonly currentComponent = computed(() => {
    const design = this.design();
    const slotId = this.selectedSlotId();
    if (!design || !slotId) return null;

    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.componentId || null;
  });

  readonly hullSelectOpen = signal(false);
  readonly componentSelectOpen = signal(false);
  readonly designNameEditing = signal(false);

  ngOnInit() {
    // Set player tech levels for miniaturization
    const player = this.gameState.player();
    if (player) {
      this.designer.setTechLevels(player.techLevels);
    }

    // If no design is loaded, start with a Scout hull
    if (!this.design()) {
      this.selectHull('scout');
    }
  }

  selectHull(hullId: string) {
    const player = this.gameState.player();
    const turn = this.gameState.turn();
    if (!player) return;

    this.designer.startNewDesign(hullId, player.id, turn);
    this.hullSelectOpen.set(false);
  }

  selectSlot(slotId: string) {
    this.selectedSlotId.set(slotId);
    this.componentSelectOpen.set(true);
  }

  installComponent(componentId: string) {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    const success = this.designer.installComponent(slotId, componentId);
    if (success) {
      this.componentSelectOpen.set(false);
      this.selectedSlotId.set(null);
    }
  }

  removeComponent() {
    const slotId = this.selectedSlotId();
    if (!slotId) return;

    this.designer.removeComponent(slotId);
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
    alert(`Design "${design.name}" saved!`);
  }

  cancelDesign() {
    this.designer.clearDesign();
    this.router.navigate(['/game']);
  }

  updateDesignName(name: string) {
    if (name.trim()) {
      this.designer.setDesignName(name.trim());
    }
    this.designNameEditing.set(false);
  }

  getSlotDisplayName(slotId: string): string {
    return `Slot ${slotId.toUpperCase()}`;
  }

  getComponentInSlot(slotId: string): string | null {
    const design = this.design();
    if (!design) return null;

    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.componentId || null;
  }

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }

  getSlotTypeDisplay(allowedTypes: string[]): string {
    const typeMap: Record<string, string> = {
      engine: '⚙️',
      weapon: '🔫',
      shield: '🛡️',
      electronics: '📡',
      general: '⚪',
      cargo: '📦',
    };
    return allowedTypes.map((t) => typeMap[t] || '?').join('');
  }
}
