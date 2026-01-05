import {
  Component,
  OnInit,
  computed,
  signal,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { GameStateService } from '../../services/game-state.service';
import { ShipDesignerStatsComponent } from './components/ship-designer-stats.component';
import { ShipDesignerSlotsComponent } from './components/ship-designer-slots.component';
import { ShipDesignerHullSelectorComponent } from './components/ship-designer-hull-selector.component';
import { ShipDesignerComponentSelectorComponent } from './components/ship-designer-component-selector.component';

@Component({
  selector: 'app-ship-designer',
  standalone: true,
  imports: [
    CommonModule,
    ShipDesignerStatsComponent,
    ShipDesignerSlotsComponent,
    ShipDesignerHullSelectorComponent,
    ShipDesignerComponentSelectorComponent,
  ],
  templateUrl: './ship-designer.component.html',
  styleUrl: './ship-designer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerComponent implements OnInit {
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private designer = inject(ShipDesignerService);
  private gameState = inject(GameStateService);
  private router = inject(Router);

  readonly selectedSlotId = signal<string | null>(null);

  readonly design = computed(() => this.designer.currentDesign() ?? null);
  readonly hull = computed(() => this.designer.currentHull() ?? null);
  readonly stats = computed(() => this.designer.compiledStats() ?? null);

  readonly availableHulls = computed(() => this.designer.getAvailableHulls());

  readonly selectedSlot = computed(() => {
    const slotId = this.selectedSlotId();
    const hull = this.hull();
    if (!slotId || !hull) return null;
    return hull.slots.find((s) => s.id === slotId) || null;
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
    return assignment?.components?.[0]?.componentId || null;
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
    const componentId = this.currentComponent();
    if (!slotId || !componentId) return;

    this.designer.removeComponent(slotId, componentId);
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
    this.save.emit();
  }

  cancelDesign() {
    this.designer.clearDesign();
    this.cancel.emit();
  }

  updateDesignName(name: string) {
    if (name.trim()) {
      this.designer.setDesignName(name.trim());
    }
    this.designNameEditing.set(false);
  }
}
