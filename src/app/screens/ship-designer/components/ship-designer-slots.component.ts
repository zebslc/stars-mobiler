import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HullTemplate } from '../../../data/tech-atlas.types';
import { ShipDesign } from '../../../models/game.model';
import { getComponent } from '../../../utils/data-access.util';
import { HullLayoutComponent } from '../../../shared/components/hull-layout/hull-layout.component';

@Component({
  selector: 'app-ship-designer-slots',
  standalone: true,
  imports: [CommonModule, HullLayoutComponent],
  template: `
    @if (hull) {
      <div class="design-panel">
        <div class="slots-container">
          <h4>Component Slots</h4>
          <app-hull-layout
            [hull]="hull"
            [design]="design"
            [editable]="true"
            [selectedSlotId]="selectedSlotId"
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
export class ShipDesignerSlotsComponent implements OnChanges {
  @Input({ required: true }) hull: HullTemplate | null = null;
  @Input({ required: true }) design: ShipDesign | null = null;
  @Input() selectedSlotId: string | null = null;
  @Output() slotSelected = new EventEmitter<string>();
  @Output() slotHover = new EventEmitter<any>();
  @Output() componentRemoved = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() componentIncremented = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() slotCleared = new EventEmitter<string>();
  @Output() componentInfoClick = new EventEmitter<string>();

  private _hull = signal<HullTemplate | null>(null);
  private _design = signal<ShipDesign | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hull']) {
      this._hull.set(this.hull);
    }
    if (changes['design']) {
      this._design.set(this.design);
    }
  }

  onSlotClick(slotId: string) {
    this.slotSelected.emit(slotId);
  }

  onSlotHover(event: any) {
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
