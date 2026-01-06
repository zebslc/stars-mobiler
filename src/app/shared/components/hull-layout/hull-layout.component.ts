import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull, HullSlot } from '../../../data/hulls.data';
import { ShipDesign } from '../../../models/game.model';
import { getComponent } from '../../../data/components.data';

interface GridSlot {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  slotDef: HullSlot;
  editable: boolean;
  capacity?: number | 'Unlimited';
}

@Component({
  selector: 'app-hull-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hull) {
      <div class="slots-container">
        @if (gridDimensions(); as dims) {
          <div class="slots-grid" [style.--rows]="dims.rows" [style.--cols]="dims.cols">
            @for (slot of positionedSlots(); track slot.id) {
              <div
                class="slot"
                [class.empty]="!getComponentInSlot(slot.id)"
                [class.selected]="selectedSlotId === slot.id"
                [class.show-clear]="showClearButton() === slot.id"
                [class.non-editable]="!editable || !slot.editable"
                [style.grid-area]="slot.row + ' / ' + slot.col + ' / span ' + slot.height + ' / span ' + slot.width"
                (click)="editable && slot.editable && onSlotClick(slot.id)"
                (mouseenter)="editable && slot.editable && onSlotHover(slot.id)"
                (mouseleave)="editable && slot.editable && onSlotLeave()"
                (touchstart)="editable && slot.editable && onTouchStart($event, slot.id)"
                (touchend)="editable && slot.editable && onTouchEnd($event)"
              >
                @if (!slot.editable || !editable) {
                  <div class="non-editable-content">
                    @if (slot.capacity) {
                      @if (slot.capacity === 'Unlimited') {
                        <div class="capacity-display">Unlimited</div>
                      } @else {
                        <div class="capacity-display">{{ slot.capacity }}kt</div>
                      }
                    }
                  </div>
                } @else if (getComponentData(slot.id); as compData) {
                  <div class="installed-component">
                    <div
                      class="tech-icon-bg tech-icon {{
                        compData.component.img || getTechIconClass(compData.component.id)
                      }}"
                      [title]="compData.component.name"
                    ></div>
                    @if (getSlotMaxCount(slot.id) > 1) {
                      <div class="component-count">
                        {{ compData.count }}/{{ getSlotMaxCount(slot.id) }}
                      </div>
                      <div class="qty-controls">
                        <button
                          class="qty-button remove"
                          (click)="removeComponent($event, slot.id)"
                          [disabled]="compData.count <= 1"
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <button
                          class="qty-button add"
                          (click)="incrementComponent($event, slot.id)"
                          [disabled]="!canIncrement(slot.id)"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    }
                    @if (editable) {
                      <button
                        class="clear-button"
                        (click)="clearSlot($event, slot.id)"
                        [title]="'Clear ' + compData.component.name"
                      >
                        ×
                      </button>
                    }
                  </div>
                } @else {
                  <div class="empty-slot-content">
                    <div class="slot-type-icon">
                      {{ getSlotTypeDisplay(slot.slotDef.allowedTypes) }}
                    </div>
                  </div>
                  @if (getSlotMaxCount(slot.id) > 1) {
                    <div class="component-count">0/{{ getSlotMaxCount(slot.id) }}</div>
                  }
                }
              </div>
            }
          </div>
        } @else {
          <div class="no-grid-fallback">No layout structure available for this hull.</div>
        }
      </div>
    }
  `,
  styles: [
    `
      @import url('../../../shared/components/tech-atlas.css');

      .slots-container {
        width: 100%;
      }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(var(--cols), 1fr);
        grid-template-rows: repeat(var(--rows), 1fr);
        gap: 4px;
        width: 100%;
        aspect-ratio: var(--cols) / var(--rows);
        max-width: 100%;
        margin: 0 auto;
      }

      .slot {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        position: relative;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        min-height: clamp(40px, 8vw, 72px);
        min-width: clamp(40px, 8vw, 72px);
      }

      .slot:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
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
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }

      .capacity-display {
        font-weight: bold;
        color: #aaa;
        font-size: 0.9rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.5);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .empty-slot-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0.5;
      }

      .slot-type-icon {
        font-size: 1.5rem;
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
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        opacity: 0.8;
      }

      .tech-icon-bg.tech-icon {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        background-size: contain !important;
      }

      .component-count {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.8);
        color: #4fc3f7;
        font-size: 0.75rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(79, 195, 247, 0.3);
        z-index: 2;
      }
      .qty-controls {
        position: absolute;
        bottom: 4px;
        left: 4px;
        display: flex;
        gap: 4px;
        z-index: 2;
      }
      .qty-button {
        width: 18px;
        height: 18px;
        min-width: 18px;
        min-height: 18px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 12px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        box-sizing: border-box;
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
        top: 4px;
        right: 4px;
        width: 18px;
        height: 18px;
        min-height: 18px;
        border: none;
        border-radius: 50%;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 3;
        padding: 0;
        box-sizing: border-box;
      }
      .clear-button:hover {
        background: #f44336;
        transform: scale(1.1);
      }
      .slot:hover .clear-button {
        opacity: 1;
      }
      .slot.show-clear .clear-button {
        opacity: 1;
      }

      @media (max-width: 480px) {
        .component-count {
          font-size: 0.7rem;
          padding: 1px 4px;
        }
        .qty-button {
          width: 16px;
          height: 16px;
          min-width: 16px;
          min-height: 16px;
          font-size: 11px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullLayoutComponent implements OnChanges {
  @Input({ required: true }) hull: Hull | null = null;
  @Input({ required: true }) design: ShipDesign | null = null;
  @Input() editable: boolean = false;
  @Input() selectedSlotId: string | null = null;

  @Output() slotSelected = new EventEmitter<string>();
  @Output() slotHover = new EventEmitter<any>();
  @Output() componentRemoved = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() componentIncremented = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() slotCleared = new EventEmitter<string>();

  private _hull = signal<Hull | null>(null);
  private _design = signal<ShipDesign | null>(null);

  imageErrors = signal<Set<string>>(new Set());
  showClearButton = signal<string | null>(null);
  longPressTimer: any;

  readonly positionedSlots = computed(() => {
    const hull = this._hull();
    if (!hull || !hull.Structure) return [];
    return this.parseStructure(hull.Structure, hull.slots, hull);
  });

  readonly gridDimensions = computed(() => {
    const hull = this._hull();
    if (!hull || !hull.Structure) return null;
    const rows = hull.Structure.length;
    const cols = hull.Structure[0].split(',').length;
    return { rows, cols };
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hull']) {
      this._hull.set(this.hull);
    }
    if (changes['design']) {
      this._design.set(this.design);
    }
  }

  private parseStructure(structure: string[], slots: HullSlot[], hull: Hull): GridSlot[] {
    const grid = structure.map((row) => row.split(','));
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = new Set<string>();
    const result: GridSlot[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r},${c}`;
        if (visited.has(key)) continue;

        const cell = grid[r][c];
        if (cell === '.') continue;

        let width = 1;
        while (c + width < cols && grid[r][c + width] === cell) {
          width++;
        }

        let height = 1;
        let isRect = true;
        while (r + height < rows) {
          for (let w = 0; w < width; w++) {
            if (grid[r + height][c + w] !== cell) {
              isRect = false;
              break;
            }
          }
          if (!isRect) break;
          height++;
        }

        for (let h = 0; h < height; h++) {
          for (let w = 0; w < width; w++) {
            visited.add(`${r + h},${c + w}`);
          }
        }

        const slotDef = slots.find((s: HullSlot) => s.id === cell);
        if (slotDef) {
          let capacity: number | 'Unlimited' | undefined = undefined;
          if (typeof slotDef.size === 'number') {
            capacity = slotDef.size;
          } else if (
            (cell.startsWith('SD') || cell.toUpperCase().includes('SD')) &&
            hull?.Stats?.DockCapacity === 'Unlimited'
          ) {
            capacity = 'Unlimited';
          }
          result.push({
            id: cell,
            row: r + 1,
            col: c + 1,
            width,
            height,
            slotDef,
            editable: slotDef.editable !== false,
            capacity,
          });
        }
      }
    }
    return result;
  }

  onSlotClick(slotId: string) {
    this.slotSelected.emit(slotId);
  }

  incrementComponent(event: Event, slotId: string) {
    event.stopPropagation();
    const comp = this.getComponentInSlot(slotId);
    if (comp) {
      this.componentIncremented.emit({ slotId, componentId: comp });
    }
  }

  removeComponent(event: Event, slotId: string) {
    event.stopPropagation();
    const comp = this.getComponentInSlot(slotId);
    if (comp) {
      this.componentRemoved.emit({ slotId, componentId: comp });
    }
  }

  getComponentInSlot(slotId: string): string | null {
    const design = this._design();
    if (!design) return null;
    const assignment = design.slots.find((s) => s.slotId === slotId);
    return assignment?.components?.[0]?.componentId || null;
  }

  getComponentData(slotId: string) {
    const design = this._design();
    if (!design) return null;
    const assignment = design.slots.find((s) => s.slotId === slotId);
    if (!assignment || !assignment.components || assignment.components.length === 0) return null;

    const compId = assignment.components[0].componentId;
    const component = getComponent(compId);
    return component ? { component, count: assignment.components[0].count } : null;
  }

  canIncrement(slotId: string): boolean {
    const hull = this._hull();
    const slot = hull?.slots.find((s) => s.id === slotId);
    if (!slot || !slot.max) return false;
    const currentCount = this.getComponentData(slotId)?.count || 0;
    return currentCount < slot.max;
  }

  getSlotTypeDisplay(allowedTypes: string[]): string {
    const typeMap: Record<string, string> = {
      engine: '⚙️',
      weapon: '🗡️',
      shield: '🛡️',
      armor: '🛡️',
      electronics: '📡',
      general: '🛠️',
      bomb: '💣',
      cargo: '📦',
      dock: '⚓',
      orb: '🛰️',
    };
    for (const t of allowedTypes) {
      const key = t.toLowerCase();
      if (key.includes('orbital')) return typeMap['orb'];
      if (typeMap[key]) return typeMap[key];
    }
    return '⚡';
  }

  getTechIconClass(componentId: string): string {
    return componentId.replace(/_/g, '-');
  }

  getSlotMaxCount(slotId: string): number {
    const hull = this._hull();
    const slot = hull?.slots.find((s: any) => s.id === slotId);
    return slot?.max || 1;
  }

  onSlotHover(slotId: string): void {
    const slot = this.positionedSlots().find((s) => s.id === slotId);
    if (!slot) return;
    const compData = this.getComponentData(slotId);
    this.slotHover.emit({
      slotDef: slot.slotDef,
      component: compData?.component,
      capacity: slot.capacity,
      editable: slot.editable && this.editable,
      count: compData?.count || 0,
      name: compData?.component?.name || (slot.editable ? 'Empty Slot' : 'Structural Component'),
    });
    if (this.editable && this.getComponentInSlot(slotId)) {
      this.showClearButton.set(slotId);
    }
  }

  onSlotLeave(): void {
    this.slotHover.emit(null);
    this.showClearButton.set(null);
  }

  onTouchStart(event: TouchEvent, slotId: string): void {
    if (!this.editable || !this.getComponentInSlot(slotId)) return;
    this.longPressTimer = setTimeout(() => {
      this.showClearButton.set(slotId);
    }, 500);
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  clearSlot(event: Event, slotId: string): void {
    event.stopPropagation();
    this.slotCleared.emit(slotId);
    this.showClearButton.set(null);
  }
}
