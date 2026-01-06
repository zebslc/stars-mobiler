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
import { getHull } from '../../data/hulls.data';
import { STARBASE_HULLS } from '../../data/hulls/starbases.data';
import { ResourceCostComponent } from '../../shared/components/resource-cost/resource-cost.component';
import { ResearchUnlockDetailsComponent } from '../../shared/components/research-unlock-details/research-unlock-details.component';

@Component({
  selector: 'app-ship-designer',
  standalone: true,
  imports: [
    CommonModule,
    ShipDesignerStatsComponent,
    ShipDesignerSlotsComponent,
    ShipDesignerHullSelectorComponent,
    ShipDesignerComponentSelectorComponent,
    ResourceCostComponent,
    ResearchUnlockDetailsComponent,
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
  readonly previewHullName = signal<string | null>(null);
  readonly previewComponentName = signal<string | null>(null);

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
  readonly hoveredItem = signal<any>(null);

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

    // Get current component count in this slot to preserve it during replacement
    const design = this.design();
    const currentSlot = design?.slots.find((s) => s.slotId === slotId);
    let count = 1;

    if (currentSlot && currentSlot.components.length > 0) {
      // Sum all counts (usually just one component type)
      count = currentSlot.components.reduce((sum, c) => sum + c.count, 0);
    }

    // Use setSlotComponent to replace existing component while preserving count
    const success = this.designer.setSlotComponent(slotId, componentId, count);
    if (success) {
      this.componentSelectOpen.set(false);
      this.selectedSlotId.set(null);
    }
  }

  onComponentRemoved(event: { slotId: string; componentId: string }) {
    this.designer.removeComponent(event.slotId, event.componentId);
  }

  onComponentIncremented(event: { slotId: string; componentId: string }) {
    this.designer.addComponent(event.slotId, event.componentId, 1);
  }

  onSlotCleared(slotId: string) {
    this.designer.clearSlot(slotId);
  }

  onSlotHover(item: any) {
    this.hoveredItem.set(item);
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
    const currentHull = this.hull();

    if (!design || !stats || !currentHull) return;

    if (!stats.isValid) {
      alert('Design is invalid:\n' + stats.validationErrors.join('\n'));
      return;
    }

    // Check design limits
    const existingDesigns = this.gameState.getPlayerShipDesigns();
    const isUpdate = existingDesigns.some((d) => d.id === design.id);

    if (!isUpdate) {
      const isStarbase = STARBASE_HULLS.some((h) => h.Name === currentHull.name);

      const starbaseDesigns = existingDesigns.filter((d) => {
        const h = getHull(d.hullId);
        return h && STARBASE_HULLS.some((sh) => sh.Name === h.name);
      });

      const shipDesigns = existingDesigns.filter((d) => {
        const h = getHull(d.hullId);
        return h && !STARBASE_HULLS.some((sh) => sh.Name === h.name);
      });

      if (isStarbase) {
        if (starbaseDesigns.length >= 10) {
          alert(
            'You have reached the maximum of 10 starbase designs. You must delete an existing design before you can create a new one.',
          );
          return;
        }
      } else {
        if (shipDesigns.length >= 16) {
          alert(
            'You have reached the maximum of 16 ship designs. You must delete an existing design before you can create a new one.',
          );
          return;
        }
      }
    }

    this.gameState.saveShipDesign(design);
    this.save.emit();
  }

  cancelDesign() {
    this.designer.clearDesign();
    this.cancel.emit();
  }

  onHullIconError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/tech-icons/hull-scout.png';
  }

  updateDesignName(name: string) {
    // Sanitize: allow only safe characters, max 50 chars
    // Remove HTML tags and dangerous characters
    const sanitized = name
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 50);

    if (sanitized) {
      this.designer.setDesignName(sanitized);
    }
    this.designNameEditing.set(false);
  }
}
