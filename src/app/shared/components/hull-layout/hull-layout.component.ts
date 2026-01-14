import {
  Component,
  Output,
  EventEmitter,
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
import { SlotTouchEvent } from './hull-slot.types';
import { PanZoomDirective, PanEvent, PanZoomEvent } from '../../directives';
import { LoggingService } from '../../../services/core/logging.service';

@Component({
  selector: 'app-hull-layout',
  standalone: true,
  imports: [CommonModule, HullSlotComponent, PanZoomDirective],
  template: `
    @if (hull()) {
      <div
        class="slots-container interactive-canvas"
        appPanZoom
        [enablePan]="true"
        [enableZoom]="true"
        (pan)="onPan($event)"
        (zoom)="onZoom($event)"
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
  
  // Pan/zoom state - now managed by PanZoomDirective
  zoom = signal(1);
  offsetX = signal(0);
  offsetY = signal(0);

  constructor(
    private cdr: ChangeDetectorRef,
    private logging: LoggingService,
  ) {
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

    this.logging.debug('HullLayout design slots', {
      slotCount: design.slots.length,
    });

    for (const slot of design.slots) {
      if (slot.components && slot.components.length > 0) {
        const c = slot.components[0];
        const comp = getComponent(c.componentId);
        if (comp) {
          map.set(slot.slotId, { component: comp, count: c.count });
        } else {
          this.logging.error('HullLayout component not found', {
            componentId: c.componentId,
          });
        }
      }
    }
    this.logging.debug('HullLayout slotComponents keys', {
      keys: Array.from(map.keys()),
    });
    return map;
  });

  readonly positionedSlots = computed(() => {
    const hull = this.hull();
    if (!hull || !hull.Structure) return [];
    const slots = this.parseStructure(hull.Structure, hull.Slots, hull);
    this.logging.debug('HullLayout positioned slot ids', {
      slotIds: slots.map((s) => s.id),
    });
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

  onPan(event: PanEvent) {
    const dx = event.delta.x;
    const dy = event.delta.y;
    this.offsetX.set(this.offsetX() + dx);
    this.offsetY.set(this.offsetY() + dy);
  }

  onZoom(event: PanZoomEvent) {
    if (event.scale) {
      const newZoom = Math.min(3, Math.max(0.5, event.scale));
      this.zoom.set(newZoom);
    }
  }

  private parseStructure(
    structure: string[],
    slots: SlotDefinition[],
    hull: HullTemplate,
  ): GridSlot[] {
    const grid = this.convertStructureToGrid(structure);
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

        const dimensions = this.calculateSlotDimensions(grid, r, c, cell);
        this.markVisitedCells(visited, r, c, dimensions.width, dimensions.height);

        const slotDef = slots.find((s: SlotDefinition) => s.Code === cell);
        if (slotDef) {
          const gridSlot = this.createGridSlot(
            cell,
            r + 1, // Convert to 1-based
            c + 1, // Convert to 1-based
            dimensions.width,
            dimensions.height,
            slotDef,
            hull,
          );
          result.push(gridSlot);
        }
      }
    }
    return result;
  }

  private convertStructureToGrid(structure: string[]): string[][] {
    return structure.map((row) => row.split(','));
  }

  private calculateSlotDimensions(
    grid: string[][],
    startRow: number,
    startCol: number,
    cellValue: string,
  ): { width: number; height: number } {
    const rows = grid.length;
    const cols = grid[0].length;

    // Calculate width
    let width = 1;
    while (startCol + width < cols && grid[startRow][startCol + width] === cellValue) {
      width++;
    }

    // Calculate height
    let height = 1;
    let isRect = true;
    while (startRow + height < rows) {
      for (let w = 0; w < width; w++) {
        if (grid[startRow + height][startCol + w] !== cellValue) {
          isRect = false;
          break;
        }
      }
      if (!isRect) break;
      height++;
    }

    return { width, height };
  }

  private markVisitedCells(
    visited: Set<string>,
    startRow: number,
    startCol: number,
    width: number,
    height: number,
  ): void {
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        visited.add(`${startRow + h},${startCol + w}`);
      }
    }
  }

  private calculateSlotCapacity(
    cellValue: string,
    slotDef: SlotDefinition,
    hull: HullTemplate,
  ): number | 'Unlimited' | undefined {
    if (typeof slotDef.Size === 'number') {
      return slotDef.Size;
    }

    if (
      (cellValue.startsWith('SD') || cellValue.toUpperCase().includes('SD')) &&
      hull?.Stats?.DockCapacity === 'Unlimited'
    ) {
      return 'Unlimited';
    }

    return undefined;
  }

  private createGridSlot(
    cellValue: string,
    row: number,
    col: number,
    width: number,
    height: number,
    slotDef: SlotDefinition,
    hull: HullTemplate,
  ): GridSlot {
    const capacity = this.calculateSlotCapacity(cellValue, slotDef, hull);

    return {
      id: cellValue,
      row,
      col,
      width,
      height,
      slotDef,
      editable: slotDef.Editable !== false,
      capacity,
    };
  }

  onSlotClick(slotId: string) {
    this.slotSelected.emit(slotId);
  }

  incrementComponent(event: any, slotId: string) {
    if (event instanceof Event) {
      event.stopPropagation();
    }
    const comp = this.getComponentInSlot(slotId);
    if (comp) {
      this.componentIncremented.emit({ slotId, componentId: comp });
    }
  }

  removeComponent(event: any, slotId: string) {
    if (event instanceof Event) {
      event.stopPropagation();
    }
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

  onTouchStart(event: SlotTouchEvent, slotId: string): void {
    if (!this.editable() || !this.getComponentInSlot(slotId)) return;
    this.longPressTimer = setTimeout(() => {
      this.showClearButton.set(slotId);
    }, 500);
  }

  onTouchEnd(_event: SlotTouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  clearSlot(event: any, slotId: string): void {
    if (event instanceof Event) {
      event.stopPropagation();
    }
    this.slotCleared.emit(slotId);
    this.showClearButton.set(null);
  }

  onComponentInfoClick(slotId: string) {
    this.componentInfoClick.emit(slotId);
  }
}
