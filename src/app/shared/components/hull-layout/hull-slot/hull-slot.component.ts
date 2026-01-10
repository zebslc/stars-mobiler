import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridSlot } from '../hull-layout.types';

@Component({
  selector: 'app-hull-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="slot"
      [class.empty]="!componentData"
      [class.selected]="selected"
      [class.show-clear]="showClear"
      [class.non-editable]="!editable || !slot.editable"
      (click)="editable && slot.editable && onSlotClick()"
      (mouseenter)="editable && slot.editable && onSlotHover()"
      (mouseleave)="editable && slot.editable && onSlotLeave()"
      (touchstart)="editable && slot.editable && onTouchStart($event)"
      (touchend)="editable && slot.editable && onTouchEnd($event)"
    >
      @if (componentData) {
        <div class="installed-component">
          <div
            class="tech-icon-bg tech-icon"
            [style.background-image]="
              'url(/assets/tech-icons/' + (componentData.component.img || 'placeholder') + '.png)'
            "
            [title]="componentData.component.name"
            (click)="onComponentInfoClick($event)"
          ></div>
          @if (maxCount > 1) {
            <div class="slot-controls-overlay">
              @if (editable && slot.editable && zoom >= 1) {
                <div class="qty-controls">
                  <button
                    class="qty-button remove"
                    (click)="onRemoveComponent($event)"
                    [disabled]="componentData.count <= 1"
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <button
                    class="qty-button add"
                    (click)="onIncrementComponent($event)"
                    [disabled]="componentData.count >= maxCount"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              }
              <div class="component-count">{{ componentData.count }}/{{ maxCount }}</div>
            </div>
          }
          @if (editable && slot.editable) {
            <button
              class="clear-button"
              (click)="onClearSlot($event)"
              [title]="'Clear ' + componentData.component.name"
            >
              ×
            </button>
          }
        </div>
      } @else {
        @if (!slot.editable || !editable) {
          <div class="non-editable-content">
            <div class="slot-type-icon">
              {{ getSlotTypeDisplay(slot.slotDef.Allowed) }}
            </div>
            @if (slot.capacity) {
              @if (slot.capacity === 'Unlimited') {
                <div class="capacity-display">Unlimited</div>
              } @else {
                <div class="capacity-display">{{ slot.capacity }}kt</div>
              }
            }
          </div>
        } @else {
          <div class="empty-slot-content">
            <div class="slot-type-icon">
              {{ getSlotTypeDisplay(slot.slotDef.Allowed) }}
            </div>
          </div>
          @if (maxCount > 1) {
            <div class="component-count">0/{{ maxCount }}</div>
          }
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: clamp(40px, 8vw, 72px);
        min-width: clamp(40px, 8vw, 72px);
      }

      .slot {
        background: #333;
        border: 1px solid #555;
        border-radius: 4px;
        position: relative;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        container-type: size;
        width: 100%;
        height: 100%;
      }

      .slot:hover {
        background: #444;
        border-color: #777;
      }

      .slot.selected {
        background: rgba(79, 195, 247, 0.1);
        border-color: #4fc3f7;
        box-shadow: 0 0 10px rgba(79, 195, 247, 0.2);
      }

      .slot.empty {
        opacity: 0.7;
      }

      .slot.non-editable {
        background: repeating-linear-gradient(45deg, #333, #333 10px, #444 10px, #444 20px);
        cursor: default;
        border-color: #555;
      }

      .slot.non-editable:hover {
        background: repeating-linear-gradient(45deg, #333, #333 10px, #444 10px, #444 20px);
        border-color: #555;
      }

      .non-editable-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 2cqmin;
      }

      .slot.non-editable .slot-type-icon {
        color: rgba(255, 255, 255, 0.7);
      }

      .capacity-display {
        font-weight: bold;
        color: #333;
        font-size: 15cqmin;
        background: rgba(255, 255, 255, 0.8);
        padding: 2cqmin 4cqmin;
        border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        white-space: nowrap;
        max-width: 95%;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .empty-slot-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        width: 100%;
        height: 100%;
      }

      .slot-type-icon {
        font-size: 40cqmin;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1;
      }

      .slot.empty .component-count {
        position: absolute;
        bottom: 2cqmin;
        right: 2cqmin;
        font-size: 12cqmin;
        padding: 1cqmin 3cqmin;
        background: rgba(0, 0, 0, 0.6);
        border: none;
        color: rgba(255, 255, 255, 0.9);
      }

      .installed-component {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .tech-icon-bg {
        width: 100%;
        height: 100%;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        opacity: 1;
      }

      .tech-icon-bg.tech-icon {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        background-size: contain !important;
      }

      .slot-controls-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 1cqmin;
        pointer-events: none;
        z-index: 2;
        height: auto;
      }
      .component-count {
        pointer-events: auto;
        background: rgba(0, 0, 0, 0.8);
        color: #4fc3f7;
        font-size: 12cqmin;
        font-weight: bold;
        padding: 1cqmin 3cqmin;
        border-radius: 4px;
        border: 1px solid rgba(79, 195, 247, 0.3);
        text-align: right;
        flex-shrink: 0;
        line-height: normal;
      }
      .qty-controls {
        pointer-events: auto;
        display: flex;
        gap: 1cqmin;
        align-items: flex-end;
        height: auto;
      }
      .qty-button {
        width: 22cqmin !important;
        height: 22cqmin !important;
        min-width: 22cqmin !important;
        min-height: 22cqmin !important;
        max-width: 22cqmin !important;
        max-height: 22cqmin !important;
        flex: 0 0 22cqmin !important;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 14cqmin;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        appearance: none;
      }
      .qty-button.add {
        border-color: #4caf50;
      }
      .qty-button.remove {
        border-color: #f44336;
      }
      .qty-button:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .clear-button {
        position: absolute;
        top: 2cqmin;
        right: 2cqmin;
        width: 22cqmin !important;
        height: 22cqmin !important;
        min-width: 22cqmin !important;
        min-height: 22cqmin !important;
        max-width: 22cqmin !important;
        max-height: 22cqmin !important;
        border: none;
        border-radius: 50%;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        font-size: 14cqmin;
        font-weight: 600;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 3;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        appearance: none;
      }
      .clear-button:hover {
        background: #f44336;
      }
      .slot:hover .clear-button {
        opacity: 1;
      }
      .slot.show-clear .clear-button {
        opacity: 1;
      }
    `,
  ],
})
export class HullSlotComponent implements OnChanges {
  @Input({ required: true }) slot!: GridSlot;
  @Input() componentData: { component: any; count: number } | null | undefined = null;
  @Input() maxCount: number = 1;
  @Input() editable: boolean = false;
  @Input() selected: boolean = false;
  @Input() showClear: boolean = false;
  @Input() zoom: number = 1;

  @Output() slotClick = new EventEmitter<void>();
  @Output() slotHover = new EventEmitter<void>();
  @Output() slotLeave = new EventEmitter<void>();
  @Output() componentRemove = new EventEmitter<Event>();
  @Output() componentIncrement = new EventEmitter<Event>();
  @Output() slotClear = new EventEmitter<Event>();
  @Output() slotTouchStart = new EventEmitter<TouchEvent>();
  @Output() slotTouchEnd = new EventEmitter<TouchEvent>();
  @Output() componentInfoClick = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['componentData']) {
      const data = changes['componentData'].currentValue;
      if (this.slot?.id === 'SA1' || this.slot?.id === 'SA2') {
        // Filter to reduce noise
        console.log(
          `HullSlot ${this.slot?.id} componentData changed:`,
          data ? `${data.component.name} (x${data.count})` : 'null',
        );
      }
    }
  }

  onSlotClick() {
    this.slotClick.emit();
  }

  onSlotHover() {
    this.slotHover.emit();
  }

  onSlotLeave() {
    this.slotLeave.emit();
  }

  onRemoveComponent(event: Event) {
    this.componentRemove.emit(event);
  }

  onIncrementComponent(event: Event) {
    this.componentIncrement.emit(event);
  }

  onClearSlot(event: Event) {
    this.slotClear.emit(event);
  }

  onTouchStart(event: TouchEvent) {
    this.slotTouchStart.emit(event);
  }

  onComponentInfoClick(event: Event) {
    event.stopPropagation();
    this.componentInfoClick.emit();
  }

  onTouchEnd(event: TouchEvent) {
    this.slotTouchEnd.emit(event);
  }

  getSlotTypeDisplay(allowedTypes: string[]): string {
    const typeMap: Record<string, string> = {
      engine: '⚙️',
      weapon: '🗡️',
      shield: '☔',
      armor: '🛡️',
      electronics: '📡',
      elect: '📡',
      computer: '📡',
      scanner: '🔭',
      mech: '⚙️',
      mechanical: '⚙️',
      general: '🛠️',
      bomb: '💣',
      mining: '⛏️',
      mine: '🔆',
      cargo: '📦',
      dock: '⚓',
      orb: '🛞',
      orbital: '🛞',
    };

    let icons = '';
    // Use a Set to avoid duplicate icons if multiple types map to the same icon
    const addedIcons = new Set<string>();

    for (const t of allowedTypes) {
      const key = t.toLowerCase();
      let icon = '';

      if (key.includes('orbital')) {
        icon = typeMap['orb'];
      } else if (typeMap[key]) {
        icon = typeMap[key];
      }

      if (icon && !addedIcons.has(icon)) {
        icons += icon;
        addedIcons.add(icon);
      }
    }

    return icons || '⚡';
  }
}
