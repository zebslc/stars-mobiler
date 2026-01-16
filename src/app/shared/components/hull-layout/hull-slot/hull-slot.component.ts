import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { GridSlot } from '../hull-layout.types';
import type { HullSlotComponentData, ComponentActionEvent, SlotTouchEvent } from '../hull-slot.types';
import { HullSlotOperationsService } from '../../../../services/ship-design/hull-slot-operations.service';
import type { TouchClickEvent } from '../../../directives';
import { TouchClickDirective } from '../../../directives';
import { LoggingService } from '../../../../services/core/logging.service';

@Component({
  selector: 'app-hull-slot',
  standalone: true,
  imports: [CommonModule, TouchClickDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let slotInfo = slot();
    @let component = componentData();
    @let maxInstall = maxCount();
    @let isEditable = editable();
    @let isSelected = selected();
    @let shouldShowClear = showClear();
    @let zoomLevel = zoom();
    <div
      class="slot"
      [class.empty]="!component"
      [class.selected]="isSelected"
      [class.show-clear]="shouldShowClear"
      [class.non-editable]="!isEditable || !slotInfo.editable"
      appTouchClick
      (touchClick)="onSlotClick($event)"
      (mouseenter)="isEditable && slotInfo.editable && onSlotHover()"
      (mouseleave)="isEditable && slotInfo.editable && onSlotLeave()"
    >
      @if (component) {
        <div class="installed-component">
          <div
            class="tech-icon-bg tech-icon"
            [style.background-image]="
              'url(/assets/tech-icons/' + (component.component.id || 'placeholder') + '.png)'
            "
            [title]="component.component.name"
            appTouchClick
            (touchClick)="onComponentInfoClick($event)"
          ></div>
          @if (maxInstall > 1) {
            <div class="slot-controls-overlay">
              @if (isEditable && slotInfo.editable && zoomLevel >= 1) {
                <div class="qty-controls">
                  <button
                    class="qty-button remove"
                    appTouchClick
                    (touchClick)="onRemoveComponent($event)"
                    [disabled]="component.count <= 1"
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <button
                    class="qty-button add"
                    appTouchClick
                    (touchClick)="onIncrementComponent($event)"
                    [disabled]="component.count >= maxInstall"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              }
              <div class="component-count">{{ component.count }}/{{ maxInstall }}</div>
            </div>
          }
          @if (isEditable && slotInfo.editable) {
            <button
              class="clear-button"
              appTouchClick
              (touchClick)="onClearSlot($event)"
              [title]="'Clear ' + component.component.name"
            >
              ×
            </button>
          }
        </div>
      } @else {
        @if (!slotInfo.editable || !isEditable) {
          <div class="non-editable-content">
            <div class="slot-type-icon">
              {{ getSlotTypeDisplay(slotInfo.slotDef.Allowed) }}
            </div>
            @if (slotInfo.capacity) {
              @if (slotInfo.capacity === 'Unlimited') {
                <div class="capacity-display">Unlimited</div>
              } @else {
                <div class="capacity-display">{{ slotInfo.capacity }}kt</div>
              }
            }
          </div>
        } @else {
          <div class="empty-slot-content">
            <div class="slot-type-icon">
              {{ getSlotTypeDisplay(slotInfo.slotDef.Allowed) }}
            </div>
          </div>
          @if (maxInstall > 1) {
            <div class="component-count">0/{{ maxInstall }}</div>
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
export class HullSlotComponent {
  readonly slot = input.required<GridSlot>();
  readonly componentData = input<HullSlotComponentData | null | undefined>(null);
  readonly maxCount = input(1);
  readonly editable = input(false);
  readonly selected = input(false);
  readonly showClear = input(false);
  readonly zoom = input(1);

  readonly slotClick = output<void>();
  readonly slotHover = output<void>();
  readonly slotLeave = output<void>();
  readonly componentAction = output<ComponentActionEvent>();
  readonly componentRemove = output<ComponentActionEvent>();
  readonly componentIncrement = output<ComponentActionEvent>();
  readonly slotClear = output<ComponentActionEvent>();
  readonly componentInfoClick = output<ComponentActionEvent>();
  readonly slotTouchStart = output<SlotTouchEvent>();
  readonly slotTouchEnd = output<SlotTouchEvent>();

  constructor(
    private hullSlotOperationsService: HullSlotOperationsService,
    private logging: LoggingService,
  ) {}

  onSlotClick(event?: TouchClickEvent) {
    this.logging.debug('HullSlot slot clicked', {
      slotId: this.slot().id,
      event,
    });
    if (!this.editable() || !this.slot().editable) return;
    this.slotClick.emit();
  }

  onSlotHover() {
    this.slotHover.emit();
  }

  onSlotLeave() {
    this.slotLeave.emit();
  }

  onRemoveComponent(event: TouchClickEvent | Event) {
    const componentData = this.componentData();
    if (!componentData) return;

    const originalEvent = 'originalEvent' in event ? event.originalEvent : event;
    const actionEvent: ComponentActionEvent = {
      slotId: this.slot().id,
      componentId: componentData.component.id,
      action: 'decrement',
      originalEvent: originalEvent,
    };
    this.componentAction.emit(actionEvent);
    this.componentRemove.emit(actionEvent);
  }

  onIncrementComponent(event: TouchClickEvent | Event) {
    const componentData = this.componentData();
    if (!componentData) return;

    const originalEvent = 'originalEvent' in event ? event.originalEvent : event;
    const actionEvent: ComponentActionEvent = {
      slotId: this.slot().id,
      componentId: componentData.component.id,
      action: 'increment',
      originalEvent: originalEvent,
    };
    this.componentAction.emit(actionEvent);
    this.componentIncrement.emit(actionEvent);
  }

  onClearSlot(event: TouchClickEvent | Event) {
    const componentData = this.componentData();
    if (!componentData) return;

    const originalEvent = 'originalEvent' in event ? event.originalEvent : event;
    const actionEvent: ComponentActionEvent = {
      slotId: this.slot().id,
      componentId: componentData.component.id,
      action: 'clear',
      originalEvent: originalEvent,
    };
    this.componentAction.emit(actionEvent);
    this.slotClear.emit(actionEvent);
  }



  onComponentInfoClick(event: TouchClickEvent | Event) {
    const originalEvent = 'originalEvent' in event ? event.originalEvent : event;
    originalEvent.stopPropagation();
    const componentData = this.componentData();
    if (!componentData) return;

    const actionEvent: ComponentActionEvent = {
      slotId: this.slot().id,
      componentId: componentData.component.id,
      action: 'info',
      originalEvent: originalEvent,
    };
    this.componentAction.emit(actionEvent);
    this.componentInfoClick.emit(actionEvent);
  }

  getSlotTypeDisplay(allowedTypes: Array<string>): string {
    // Delegate to the operations service for business logic
    return this.hullSlotOperationsService.getSlotTypeDisplay(allowedTypes);
  }
}
