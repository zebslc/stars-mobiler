import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull } from '../../../data/hulls.data';
import { ShipDesign } from '../../../models/game.model';

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
          <div class="hull-cost">
            Cost: {{ formatCost(hull.baseCost) }}
          </div>
        </div>

        <!-- Slot Grid -->
        <div class="slots-container">
          <h4>Component Slots</h4>
          <div class="slots-grid">
            @for (slot of hull.slots; track slot.id) {
              <div
                class="slot"
                [class.empty]="!getComponentInSlot(slot.id)"
                [class.selected]="selectedSlotId === slot.id"
                (click)="onSlotClick(slot.id)"
              >
                <div class="slot-type">
                  {{ getSlotTypeDisplay(slot.allowedTypes) }}
                </div>
                <div class="slot-id">{{ getSlotDisplayName(slot.id) }}</div>
                @if (getComponentInSlot(slot.id); as compId) {
                  <div class="slot-component">Installed</div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
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
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.5rem;
    }

    .slot {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.5rem;
      cursor: pointer;
      text-align: center;
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

    .slot-type {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    .slot-id {
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
    }

    .slot-component {
      font-size: 0.7rem;
      color: #4fc3f7;
      margin-top: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerSlotsComponent {
  @Input({ required: true }) hull: Hull | null = null;
  @Input({ required: true }) design: ShipDesign | null = null;
  @Input() selectedSlotId: string | null = null;
  @Output() slotSelected = new EventEmitter<string>();

  onSlotClick(slotId: string) {
    this.slotSelected.emit(slotId);
  }

  getSlotDisplayName(slotId: string): string {
    return `Slot ${slotId.toUpperCase()}`;
  }

  getComponentInSlot(slotId: string): string | null {
    if (!this.design) return null;
    const assignment = this.design.slots.find((s) => s.slotId === slotId);
    return assignment?.components?.[0]?.componentId || null;
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
      electronics: '📡',
      general: '🛠️',
      bomb: '💣',
      cargo: '📦',
    };
    return allowedTypes.map((t) => typeMap[t] || '?').join('');
  }
}
