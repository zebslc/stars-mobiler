import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull } from '../../../data/hulls.data';
import { ShipDesign } from '../../../models/game.model';
import { getComponent } from '../../../data/components.data';
import { HullLayoutComponent } from '../../../shared/components/hull-layout/hull-layout.component';

interface GridSlot {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  slotDef: any; // HullSlot
  editable: boolean;
  capacity?: number | 'Unlimited';
}

@Component({
  selector: 'app-ship-designer-slots',
  standalone: true,
  imports: [CommonModule, HullLayoutComponent],
  template: `
    @if (hull) {
      <div class="design-panel">
        <div class="hull-info">
          <h3>{{ hull.name }}</h3>
          <div class="hull-stats">
            <div class="stat">
              <span class="label">Mass:</span>
              <span class="value">{{ hull.mass }}kt</span>
            </div>
            <div class="stat">
              <span class="label">Fuel:</span>
              <span class="value">{{ hull.fuelCapacity }}mg</span>
            </div>
            <div class="stat">
              <span class="label">Armor:</span>
              <span class="value">{{ hull.armor }}</span>
            </div>
            <div class="stat">
              <span class="label">Tech:</span>
              <span class="value">Con {{ hull.techRequired?.construction || 0 }}</span>
            </div>
          </div>
          <div class="hull-cost">Cost: {{ formatCost(hull.baseCost) }}</div>
        </div>

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
          ></app-hull-layout>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @import url('../../../shared/components/tech-atlas.css');

      .design-panel {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 1rem;
      }

      .hull-info {
        margin-bottom: 1rem;
      }

      .hull-info h3 {
        margin: 0 0 0.5rem 0;
        color: #4fc3f7;
      }

      .hull-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
      }

      .stat {
        display: flex;
        gap: 0.5rem;
      }

      .stat .label {
        color: #aaa;
      }

      .stat .value {
        font-weight: bold;
        color: #fff;
      }

      .hull-cost {
        font-size: 0.9rem;
        color: #aaa;
      }

      .slots-container h4 {
        margin: 0 0 1rem 0;
        color: #fff;
        font-size: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerSlotsComponent implements OnChanges {
  @Input({ required: true }) hull: Hull | null = null;
  @Input({ required: true }) design: ShipDesign | null = null;
  @Input() selectedSlotId: string | null = null;
  @Output() slotSelected = new EventEmitter<string>();
  @Output() slotHover = new EventEmitter<any>();
  @Output() componentRemoved = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() componentIncremented = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() slotCleared = new EventEmitter<string>();

  private _hull = signal<Hull | null>(null);
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

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }
}
