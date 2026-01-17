import {
  Component,
  output,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HullTemplate, SlotDefinition, ComponentStats } from '../../../data/tech-atlas.types';
import type { ShipDesign } from '../../../models/game.model';
import { getComponent } from '../../../utils/data-access.util';
import { HullLayoutComponent } from '../../../shared/components/hull-layout/hull-layout.component';

interface SlotHoverPayload {
  slotId: string;
  slotDef: SlotDefinition;
  component?: ComponentStats;
  capacity?: number | 'Unlimited';
  editable: boolean;
  count: number;
  name: string;
}

@Component({
  selector: 'app-ship-designer-slots',
  standalone: true,
  imports: [CommonModule, HullLayoutComponent],
  template: `
    @if (hull()) {
      <div class="design-panel">
        <div class="slots-container">
          <h4>Component Slots</h4>
          <app-hull-layout
            [hull]="hull()"
            [design]="design()"
            [editable]="true"
            [selectedSlotId]="selectedSlotId()"
            (slotSelected)="onSlotClick($event)"
            (slotHover)="onSlotHover($event)"
            (componentRemoved)="onComponentRemovedEvent($event)"
            (componentIncremented)="onComponentIncrementedEvent($event)"
            (slotCleared)="onSlotClearedEvent($event)"
            (componentInfoClick)="componentInfoClick.emit($event)"
          ></app-hull-layout>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @import url('../../../shared/components/tech-atlas.css');

      .design-panel {
        background: var(--color-bg-secondary, #f5f5f5);
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        padding: 1rem;
        color: var(--color-text-main, #333);
      }

      .slots-container h4 {
        margin: 0 0 1rem 0;
        color: var(--color-text-main, #333);
        font-size: 1rem;
      }
    `,
  ],
})
export class ShipDesignerSlotsComponent {
  readonly hull = input.required<HullTemplate | null>();
  readonly design = input.required<ShipDesign | null>();
  readonly selectedSlotId = input<string | null>(null);

  readonly slotSelected = output<string>();
  readonly slotHover = output<SlotHoverPayload | null>();
  readonly componentRemoved = output<{ slotId: string; componentId: string }>();
  readonly componentIncremented = output<{ slotId: string; componentId: string }>();
  readonly slotCleared = output<string>();
  readonly componentInfoClick = output<string>();

  onSlotClick(slotId: string) {
    this.slotSelected.emit(slotId);
  }

  onSlotHover(event: SlotHoverPayload | null) {
    this.slotHover.emit(event);
  }

  onComponentRemovedEvent(event: { slotId: string; componentId: string }) {
    this.componentRemoved.emit(event);
  }

  onComponentIncrementedEvent(event: { slotId: string; componentId: string }) {
    this.componentIncremented.emit(event);
  }

  onSlotClearedEvent(slotId: string) {
    this.slotCleared.emit(slotId);
  }

  onComponentInfoClick(slotId: string) {
    this.componentInfoClick.emit(slotId);
  }
}
