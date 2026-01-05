import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiniaturizedComponent } from '../../../utils/miniaturization.util';
import { HullSlot } from '../../../data/hulls.data';

@Component({
  selector: 'app-ship-designer-component-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>
          Select Component for {{ getSlotDisplayName(selectedSlotId!) }}
          @if (selectedSlot) {
            {{ getSlotTypeDisplay(selectedSlot.allowedTypes) }}
          }
        </h3>

        @if (currentComponentId) {
          <div class="current-component">
            <strong>Currently installed</strong>
            <button (click)="onRemove()" class="btn-danger">Remove Component</button>
          </div>
        }

        <div class="component-list">
          @for (component of components; track component.id) {
            <div
              class="component-option"
              [class.selected]="currentComponentId === component.id"
              (click)="onSelect(component.id)"
            >
              <div class="component-icon">
                <img 
                  [src]="getComponentImagePath(component)" 
                  [alt]="component.name"
                  (error)="onImageError($event)"
                />
              </div>
              <div class="component-details">
                <div class="component-name">{{ component.name }}</div>
                <div class="component-mass">
                  Mass: {{ component.mass }}kt
                  @if (component.miniaturizationLevel > 0) {
                    <span class="miniaturized">
                      ({{ ((component.baseMass - component.mass) / component.baseMass * 100).toFixed(0) }}% smaller)
                    </span>
                  }
                </div>
                <div class="component-cost">Cost: {{ formatCost(component.cost) }}</div>
              </div>
            </div>
          }
        </div>
        <button (click)="onClose()" class="btn-text">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: #1a1a2e;
      border: 1px solid #4fc3f7;
      border-radius: 8px;
      padding: 1.5rem;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }

    h3 {
      margin-top: 0;
      color: #4fc3f7;
      border-bottom: 1px solid rgba(79, 195, 247, 0.3);
      padding-bottom: 0.5rem;
    }

    .current-component {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .btn-danger {
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid #f44336;
      color: #f44336;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: rgba(244, 67, 54, 0.3);
    }

    .component-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .component-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .component-option:hover {
      background: rgba(79, 195, 247, 0.1);
      border-color: #4fc3f7;
    }

    .component-option.selected {
      background: rgba(79, 195, 247, 0.2);
      border-color: #4fc3f7;
    }

    .component-icon {
      width: 48px;
      height: 48px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .component-icon img {
      max-width: 100%;
      max-height: 100%;
    }

    .component-details {
      flex: 1;
    }

    .component-name {
      font-weight: bold;
      color: #fff;
    }

    .component-mass, .component-cost {
      font-size: 0.8rem;
      color: #aaa;
    }

    .miniaturized {
      color: #4caf50;
      margin-left: 0.5rem;
    }

    .btn-text {
      background: none;
      border: none;
      color: #aaa;
      cursor: pointer;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      transition: color 0.2s;
      float: right;
    }

    .btn-text:hover {
      color: #fff;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerComponentSelectorComponent {
  @Input({ required: true }) components: MiniaturizedComponent[] = [];
  @Input({ required: true }) selectedSlotId: string | null = null;
  @Input({ required: true }) selectedSlot: HullSlot | null = null;
  @Input() currentComponentId: string | null = null;

  @Output() componentSelected = new EventEmitter<string>();
  @Output() componentRemoved = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onSelect(componentId: string) {
    this.componentSelected.emit(componentId);
  }

  onRemove() {
    this.componentRemoved.emit();
  }

  onClose() {
    this.close.emit();
  }

  getSlotDisplayName(slotId: string): string {
    return `Slot ${slotId?.toUpperCase() || ''}`;
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

  getComponentImagePath(component: MiniaturizedComponent): string {
    if (component.img) {
      return `/assets/tech-icons/${component.img}.png`;
    }
    return '/assets/tech-icons/placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/tech-icons/placeholder.png';
  }

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }
}
