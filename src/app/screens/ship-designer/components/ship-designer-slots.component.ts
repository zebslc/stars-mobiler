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

interface GridSlot {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  slotDef: any; // HullSlot
}

@Component({
  selector: 'app-ship-designer-slots',
  standalone: true,
  imports: [CommonModule],
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

        <!-- Slot Grid -->
        <div class="slots-container">
          <h4>Component Slots</h4>
          @if (gridDimensions(); as dims) {
            <div class="slots-grid" [style.--rows]="dims.rows" [style.--cols]="dims.cols">
              @for (slot of positionedSlots(); track slot.id) {
                <div
                  class="slot"
                  [class.empty]="!getComponentInSlot(slot.id)"
                  [class.selected]="selectedSlotId === slot.id"
                  [style.grid-area]="
                    slot.row + ' / ' + slot.col + ' / span ' + slot.height + ' / span ' + slot.width
                  "
                  (click)="onSlotClick(slot.id)"
                >
                  @if (getComponentData(slot.id); as compData) {
                    <!-- Installed Component -->
                    <div class="installed-component">
                      <div class="comp-icon-wrapper">
                        <!-- Use component image if available, else fallback -->
                        <div class="comp-icon" [title]="compData.component.name">
                          {{ compData.component.name.substring(0, 2) }}
                        </div>
                        @if (compData.count > 1) {
                          <div class="comp-count">{{ compData.count }}</div>
                        }
                      </div>

                      <div class="slot-actions">
                        @if (canIncrement(slot.id)) {
                          <button
                            class="btn-mini btn-add"
                            (click)="incrementComponent($event, slot.id)"
                          >
                            +
                          </button>
                        }
                        <button
                          class="btn-mini btn-remove"
                          (click)="removeComponent($event, slot.id)"
                        >
                          ×
                        </button>
                      </div>

                      <div class="comp-name">{{ compData.component.name }}</div>
                    </div>
                  } @else {
                    <!-- Empty Slot -->
                    <div class="empty-slot-content">
                      <div class="slot-type-icon">
                        {{ getSlotTypeDisplay(slot.slotDef.allowedTypes) }}
                      </div>
                      <!-- Internal ID is hidden or subtle as per user request -->
                      <!-- <div class="slot-id">{{ slot.id }}</div> -->
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div class="no-grid-fallback">No layout structure available for this hull.</div>
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .design-panel {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 1rem;
      }

      .hull-info {
        margin-bottom: 2rem;
      }

      .hull-info h3 {
        margin: 0 0 1rem 0;
        color: #4fc3f7;
      }

      .hull-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .stat {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }

      .label {
        color: #888;
      }

      .value {
        color: #fff;
      }

      .hull-cost {
        font-size: 0.9rem;
        color: #aaa;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .slots-container h4 {
        margin: 0 0 1rem 0;
        color: #fff;
        font-size: 1rem;
      }

      .slots-grid {
        display: grid;
        grid-template-columns: repeat(var(--cols), 1fr);
        grid-template-rows: repeat(var(--rows), 1fr);
        gap: 4px;
        width: 100%;
        aspect-ratio: var(--cols) / var(--rows);
        max-width: 600px;
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .comp-icon-wrapper {
        position: relative;
        margin-bottom: 0.25rem;
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
      }

      .comp-icon {
        /* Removed/Legacy */
        display: none;
      }

      .comp-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .type-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        opacity: 0.7;
      }

      .comp-fallback {
        width: 32px;
        height: 32px;
        background: #333;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: #fff;
      }

      .comp-fallback.hidden {
        display: none;
      }

      .comp-count {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: #4caf50;
        color: white;
        font-size: 0.7rem;
        padding: 1px 4px;
        border-radius: 4px;
        font-weight: bold;
      }

      .comp-name {
        font-size: 0.7rem;
        color: #4fc3f7;
        text-align: center;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 2px;
      }

      /* Slot Actions (Remove / Add) */
      .slot-actions {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.2s;
        background: rgba(0, 0, 0, 0.7);
        padding: 2px;
        border-bottom-left-radius: 4px;
      }

      .slot:hover .slot-actions {
        opacity: 1;
      }

      .btn-mini {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .btn-add {
        background: #4caf50;
      }

      .btn-add:hover {
        background: #66bb6a;
      }

      .btn-remove {
        background: #f44336;
      }

      .btn-remove:hover {
        background: #ef5350;
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
  @Output() componentRemoved = new EventEmitter<{ slotId: string; componentId: string }>();
  @Output() componentIncremented = new EventEmitter<{ slotId: string; componentId: string }>();

  imageErrors = signal<Set<string>>(new Set());
  longPressTimer: any;

  // Computes the grid layout from the hull structure
  readonly positionedSlots = computed(() => {
    const hull = this.hull;
    if (!hull || !hull.Structure) return [];

    return this.parseStructure(hull.Structure, hull.slots);
  });

  readonly gridDimensions = computed(() => {
    const hull = this.hull;
    if (!hull || !hull.Structure) return null;

    // Assume all rows have same length, but check just in case
    const rows = hull.Structure.length;
    // Structure strings are comma separated: ".,.,W1,W1"
    const cols = hull.Structure[0].split(',').length;

    return { rows, cols };
  });

  ngOnChanges(changes: SimpleChanges): void {
    // React to changes if needed
  }

  private parseStructure(structure: string[], slots: any[]): GridSlot[] {
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
        if (cell === '.') continue; // Empty space

        // Found a new slot area
        // Determine width
        let width = 1;
        while (c + width < cols && grid[r][c + width] === cell) {
          width++;
        }

        // Determine height
        let height = 1;
        let isRect = true;
        while (r + height < rows) {
          // Check if the next row has the same width of same cell
          for (let w = 0; w < width; w++) {
            if (grid[r + height][c + w] !== cell) {
              isRect = false;
              break;
            }
          }
          if (!isRect) break;
          height++;
        }

        // Mark as visited
        for (let h = 0; h < height; h++) {
          for (let w = 0; w < width; w++) {
            visited.add(`${r + h},${c + w}`);
          }
        }

        const slotDef = slots.find((s) => s.id === cell);
        if (slotDef) {
          result.push({
            id: cell,
            row: r + 1, // CSS Grid is 1-based
            col: c + 1,
            width,
            height,
            slotDef,
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
    if (!this.design) return null;
    const assignment = this.design.slots.find((s) => s.slotId === slotId);
    return assignment?.components?.[0]?.componentId || null;
  }

  getComponentData(slotId: string) {
    if (!this.design) return null;
    const assignment = this.design.slots.find((s) => s.slotId === slotId);
    if (!assignment || !assignment.components || assignment.components.length === 0) return null;

    const compId = assignment.components[0].componentId;
    const component = getComponent(compId);

    return component ? { component, count: assignment.components[0].count } : null;
  }

  canIncrement(slotId: string): boolean {
    const slot = this.hull?.slots.find((s) => s.id === slotId);
    if (!slot || !slot.max) return false;

    const currentCount = this.getComponentData(slotId)?.count || 0;
    return currentCount < slot.max;
  }

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
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
    // Prioritize specific icons if multiple allowed
    for (const t of allowedTypes) {
      const key = t.toLowerCase();
      // Handle special mapping if needed, e.g. "Orbital" -> orb
      if (key.includes('orbital')) return typeMap['orb'];
      if (typeMap[key]) return typeMap[key];
    }
    return '⚡';
  }
}
