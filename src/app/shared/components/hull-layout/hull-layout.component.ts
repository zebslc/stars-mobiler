import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HullTemplate, SlotDefinition } from '../../../data/tech-atlas.types';
import { ShipDesign } from '../../../models/game.model';
import { getComponent } from '../../../utils/data-access.util';
import { GridSlot } from './hull-layout.types';
import { HullSlotComponent } from './hull-slot/hull-slot.component';

@Component({
  selector: 'app-hull-layout',
  standalone: true,
  imports: [CommonModule, HullSlotComponent],
  template: `
    @if (hull()) {
      <div
        class="slots-container interactive-canvas"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerUp($event)"
        (touchmove)="onTouchMove($event)"
        (wheel)="onWheel($event)"
      >
        @if (gridDimensions(); as dims) {
          <div
            class="slots-grid"
            [style.--rows]="dims.rows"
            [style.--cols]="dims.cols"
            [style.transform]="transform()"
            [style.transformOrigin]="'center center'"
          >
            @for (slot of positionedSlots(); track slot.id) {
              <app-hull-slot
                [slot]="slot"
                [style.grid-area]="
                  slot.row + ' / ' + slot.col + ' / span ' + slot.height + ' / span ' + slot.width
                "
                [componentData]="slotComponents().get(slot.id)"
                [maxCount]="getSlotMaxCount(slot.id)"
                [editable]="editable()"
                [selected]="selectedSlotId() === slot.id"
                [showClear]="showClearButton() === slot.id"
                [zoom]="zoom()"
                (slotClick)="onSlotClick(slot.id)"
                (slotHover)="onSlotHover(slot.id)"
                (slotLeave)="onSlotLeave()"
                (componentRemove)="removeComponent($event, slot.id)"
                (componentIncrement)="incrementComponent($event, slot.id)"
                (slotClear)="clearSlot($event, slot.id)"
                (slotTouchStart)="onTouchStart($event, slot.id)"
                (slotTouchEnd)="onTouchEnd($event)"
                (componentInfoClick)="onComponentInfoClick(slot.id)"
              ></app-hull-slot>
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
        overflow: hidden;
      }

      .interactive-canvas {
        touch-action: none;
        user-select: none;
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
        background-color: #f5f5f5;
        background-image:
          linear-gradient(
            45deg,
            #e0e0e0 25%,
            transparent 25%,
            transparent 75%,
            #e0e0e0 75%,
            #e0e0e0
          ),
          linear-gradient(
            45deg,
            #e0e0e0 25%,
            transparent 25%,
            transparent 75%,
            #e0e0e0 75%,
            #e0e0e0
          );
        background-size: 20px 20px;
        background-position:
          0 0,
          10px 10px;
        border-radius: 4px;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class HullLayoutComponent {
  readonly hull = input.required<HullTemplate | null>();
  readonly design = input.required<ShipDesign | null>();
  readonly editable = input(false);
  readonly selectedSlotId = input<string | null>(null);

  @Output() slotSelected = new EventEmitter<string>();
  @Output() slotHover = new EventEmitter<any>();
  @Output() componentRemoved = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() componentIncremented = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() slotCleared = new EventEmitter<string>();
  @Output() componentInfoClick = new EventEmitter<string>();

  imageErrors = signal<Set<string>>(new Set());
  showClearButton = signal<string | null>(null);
  longPressTimer: any;
  private isPanning = signal(false);
  private hasPanned = false;
  private panButton = 1; // middle mouse
  private lastPointerX = 0;
  private lastPointerY = 0;
  private activePointers = new Map<number, { x: number; y: number }>();
  private initialPinchDistance = 0;
  private initialScale = 1;
  zoom = signal(1);
  offsetX = signal(0);
  offsetY = signal(0);

  constructor(private cdr: ChangeDetectorRef) {
    // Reset zoom and pan when hull changes
    effect(() => {
      this.hull(); // Register dependency
      this.zoom.set(1);
      this.offsetX.set(0);
      this.offsetY.set(0);
    });

    // Mark for check when design changes
    effect(() => {
      this.design(); // Register dependency
      this.cdr.markForCheck();
    });
  }

  readonly slotComponents = computed(() => {
    const design = this.design();
    if (!design) return new Map<string, { component: any; count: number }>();

    const map = new Map<string, { component: any; count: number }>();

    console.log(`HullLayout: design has ${design.slots.length} slots`);

    for (const slot of design.slots) {
      if (slot.components && slot.components.length > 0) {
        const c = slot.components[0];
        const comp = getComponent(c.componentId);
        if (comp) {
          map.set(slot.slotId, { component: comp, count: c.count });
        } else {
          console.error(`HullLayout: Component ${c.componentId} not found!`);
        }
      }
    }
    console.log('Computed slotComponents keys:', Array.from(map.keys()));
    return map;
  });

  readonly positionedSlots = computed(() => {
    const hull = this.hull();
    if (!hull || !hull.Structure) return [];
    const slots = this.parseStructure(hull.Structure, hull.Slots, hull);
    console.log(
      'Positioned slots IDs:',
      slots.map((s) => s.id),
    );
    return slots;
  });

  readonly gridDimensions = computed(() => {
    const hull = this.hull();
    if (!hull || !hull.Structure) return null;
    const rows = hull.Structure.length;
    const cols = hull.Structure[0].split(',').length;
    return { rows, cols };
  });

  transform() {
    return `translate(${this.offsetX()}px, ${this.offsetY()}px) scale(${this.zoom()})`;
  }

  onPointerDown(event: PointerEvent) {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const isPanStart =
      (event.pointerType === 'mouse' && (event.button === 0 || event.button === this.panButton)) ||
      event.pointerType === 'touch' ||
      event.pointerType === 'pen';

    if (isPanStart) {
      this.isPanning.set(true);
      this.hasPanned = false;
      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
    }

    if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      this.initialPinchDistance = Math.hypot(dx, dy);
      this.initialScale = this.zoom();
    }
  }

  onPointerMove(event: PointerEvent) {
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.activePointers.size === 2) {
      const pts = Array.from(this.activePointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      if (this.initialPinchDistance > 0) {
        const scale = this.initialScale * (dist / this.initialPinchDistance);
        this.zoom.set(Math.min(3, Math.max(0.5, scale)));
        event.preventDefault();
      }
      return;
    }
    if (this.isPanning()) {
      const dx = event.clientX - this.lastPointerX;
      const dy = event.clientY - this.lastPointerY;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.hasPanned = true;
      }

      this.lastPointerX = event.clientX;
      this.lastPointerY = event.clientY;
      this.offsetX.set(this.offsetX() + dx);
      this.offsetY.set(this.offsetY() + dy);
      event.preventDefault();
    }
  }

  onPointerUp(event: PointerEvent) {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size < 2) {
      this.initialPinchDistance = 0;
    }

    if (this.activePointers.size === 1 && this.isPanning()) {
      const remaining = this.activePointers.values().next().value;
      if (remaining) {
        this.lastPointerX = remaining.x;
        this.lastPointerY = remaining.y;
      }
    }

    const isPanEnd =
      (event.pointerType === 'mouse' && (event.button === 0 || event.button === this.panButton)) ||
      (event.pointerType !== 'mouse' && this.activePointers.size === 0);

    if (isPanEnd) {
      this.isPanning.set(false);
    }
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = -event.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const currentZoom = this.zoom();
    const newZoom = Math.min(3, Math.max(0.5, currentZoom * zoomFactor));
    this.zoom.set(newZoom);
  }

  onTouchMove(_event: TouchEvent) {
    if (_event.touches.length >= 2) {
      _event.preventDefault();
    }
  }

  private parseStructure(structure: string[], slots: SlotDefinition[], hull: HullTemplate): GridSlot[] {
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

        const slotDef = slots.find((s: SlotDefinition) => s.Code === cell);
        if (slotDef) {
          let capacity: number | 'Unlimited' | undefined = undefined;
          if (typeof slotDef.Size === 'number') {
            capacity = slotDef.Size;
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
            editable: slotDef.Editable !== false,
            capacity,
          });
        }
      }
    }
    return result;
  }

  onSlotClick(slotId: string) {
    if (this.hasPanned) return;
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
    const data = this.slotComponents().get(slotId);
    return data ? data.component.id : null;
  }

  getComponentData(slotId: string) {
    return this.slotComponents().get(slotId) || null;
  }

  canIncrement(slotId: string): boolean {
    const hull = this.hull();
    const slot = hull?.Slots.find((s: any) => s.Code === slotId);
    if (!slot || !slot.Max) return false;
    const currentCount = this.slotComponents().get(slotId)?.count || 0;
    return currentCount < slot.Max;
  }

  getSlotMaxCount(slotId: string): number {
    const hull = this.hull();
    const slot = hull?.Slots.find((s: any) => s.Code === slotId);
    return slot?.Max || 1;
  }

  onSlotHover(slotId: string): void {
    const slot = this.positionedSlots().find((s) => s.id === slotId);
    if (!slot) return;
    const compData = this.getComponentData(slotId);
    this.slotHover.emit({
      slotDef: slot.slotDef,
      component: compData?.component,
      capacity: slot.capacity,
      editable: slot.editable && this.editable(),
      count: compData?.count || 0,
      name: compData?.component?.name || (slot.editable ? 'Empty Slot' : 'Structural Component'),
    });
    if (this.editable() && this.getComponentInSlot(slotId)) {
      this.showClearButton.set(slotId);
    }
  }

  onSlotLeave(): void {
    this.slotHover.emit(null);
    this.showClearButton.set(null);
  }

  onTouchStart(_event: TouchEvent, slotId: string): void {
    if (!this.editable() || !this.getComponentInSlot(slotId)) return;
    this.longPressTimer = setTimeout(() => {
      this.showClearButton.set(slotId);
    }, 500);
  }

  onTouchEnd(_event: TouchEvent): void {
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

  onComponentInfoClick(slotId: string) {
    this.componentInfoClick.emit(slotId);
  }
}
