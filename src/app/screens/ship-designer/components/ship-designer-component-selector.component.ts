import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TouchClickDirective } from '../../../shared/directives';
import { MiniaturizedComponent } from '../../../utils/miniaturization.util';
import { SlotDefinition } from '../../../data/tech-atlas.types';
import { getComponent } from '../../../utils/data-access.util';

@Component({
  selector: 'app-ship-designer-component-selector',
  standalone: true,
  imports: [CommonModule, TouchClickDirective],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>
          {{ getSlotSelectionTitle(selectedSlot) }}
        </h3>

        @if (currentComponentId) {
          <div class="current-component">
            <strong>Currently installed</strong>
            <button appTouchClick (touchClick)="onRemove()" class="btn-danger">Remove Component</button>
          </div>
        }

        <div class="component-list">
          @for (component of components; track component.id) {
            <div
              class="component-option"
              [class.selected]="currentComponentId === component.id"
              appTouchClick
              (touchClick)="onSelect(component.id)"
            >
              <div class="component-icon">
                <img
                  [src]="getComponentImagePath(component)"
                  [alt]="component.name"
                  (error)="onImageError($event)"
                  (click)="$event.stopPropagation(); onPreview(component)"
                />
              </div>
              <div class="component-details">
                <div class="component-name">
                  {{ component.name }}
                  @if (component.isRamscoop) {
                    <span class="ramscoop-badge">Ramscoop</span>
                  }
                </div>
                @if (component.description) {
                  <div class="component-description">{{ component.description }}</div>
                }
                <div class="component-mass">Mass: {{ component.mass }}kt</div>
                <div class="component-cost">Cost: {{ formatCost(component.cost) }}</div>
                @if (getPrimaryStat(component); as statText) {
                  <div class="component-stats">{{ statText }}</div>
                }
              </div>
            </div>
          }
        </div>
        <button appTouchClick (touchClick)="onClose()" class="btn-text">Close</button>
      </div>
    </div>
  `,
  styles: [
    `
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
        max-width: 800px;
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
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }

      .component-option {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: left;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
        overflow: hidden;
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
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .component-icon img {
        max-width: 100%;
        max-height: 100%;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .component-icon img:hover {
        opacity: 0.8;
      }

      .component-details {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0; /* Prevents text overflow issues in flex items */
      }

      .component-name {
        font-weight: bold;
        color: #fff;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.15rem;
      }

      .ramscoop-badge {
        font-size: 0.7rem;
        background: rgba(255, 87, 34, 0.2);
        color: #ff5722;
        border: 1px solid #ff5722;
        padding: 0 4px;
        border-radius: 3px;
        text-transform: uppercase;
      }

      .component-description {
        font-size: 0.75rem;
        color: #888;
        font-style: italic;
        margin-bottom: 0.15rem;
      }

      .component-mass,
      .component-cost {
        font-size: 0.75rem;
        color: #aaa;
      }

      .component-stats {
        font-size: 0.75rem;
        color: #4fc3f7;
        margin-top: 2px;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerComponentSelectorComponent {
  @Input({ required: true }) components: MiniaturizedComponent[] = [];
  @Input({ required: true }) selectedSlotId: string | null = null;
  @Input({ required: true }) selectedSlot: SlotDefinition | null = null;
  @Input() currentComponentId: string | null = null;

  @Output() componentSelected = new EventEmitter<string>();
  @Output() componentRemoved = new EventEmitter<void>();
  @Output() previewComponent = new EventEmitter<MiniaturizedComponent>();
  @Output() close = new EventEmitter<void>();

  onSelect(componentId: string) {
    this.componentSelected.emit(componentId);
  }

  onPreview(component: MiniaturizedComponent) {
    this.previewComponent.emit(component);
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
      engine: '🚀',
      weapon: '🗡️',
      shield: '🛡️',
      electronics: '⚡',
      elect: '⚡',
      computer: '⚡',
      general: '🛠️',
      bomb: '💣',
      cargo: '📦',
      armor: '🛡️',
      mech: '⚙️',
      mechanical: '⚙️',
      scanner: '📡',
    };
    return allowedTypes.map((t) => typeMap[t.toLowerCase()] || '?').join('');
  }

  getComponentImagePath(component: MiniaturizedComponent): string {
    if (component.id) {
      return `/assets/tech-icons/${component.id}.png`;
    }
    return '/assets/tech-icons/placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = '/assets/tech-icons/placeholder.png';
  }

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number; resources?: number }): string {
    const parts: string[] = [];
    if (cost.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost.boranium) parts.push(`${cost.boranium} B`);
    if (cost.germanium) parts.push(`${cost.germanium} Ge`);
    if (cost.resources) parts.push(`${cost.resources} Res`);
    return parts.join(', ');
  }

  getSlotSelectionTitle(slot: SlotDefinition | null): string {
    if (!slot) return 'Select component';
    const types = (slot.Allowed || []).map((t: any) => String(t).toLowerCase());
    const order = [
      'engine',
      'weapon',
      'shield',
      'armor',
      'scanner',
      'elect',
      'mech',
      'cargo',
      'general',
    ];
    const primary = order.find((t) => types.some((x) => x.includes(t))) || types[0] || 'component';
    return `Select ${primary} component`;
  }

  getPrimaryStat(component: MiniaturizedComponent): string | null {
    const base = getComponent(component.id);
    if (!base || !base.stats) return null;

    // Prefer most relevant stat by type or available fields
    if (base.stats.shield) return `Shields: ${base.stats.shield}`;
    if (base.stats.power) {
      const parts: string[] = [`Damage: ${base.stats.power}`];
      if (base.stats.accuracy) parts.push(`Acc: ${base.stats.accuracy}%`);
      if (base.stats.range) parts.push(`Range: ${base.stats.range}`);
      return parts.join(' • ');
    }
    if (base.stats.armor) return `Armor: ${base.stats.armor}`;
    if (base.stats.enemyFleetScanDistance) {
      const parts: string[] = [`Scan: ${base.stats.enemyFleetScanDistance}`];
      if (base.stats.planetScanDistance !== undefined) {
         if (base.stats.planetScanDistance === 0) parts.push('Planet: Orbit');
         else if (base.stats.planetScanDistance === -1) parts.push('Planet: None');
         else parts.push(`Planet: ${base.stats.planetScanDistance}`);
      }
      return parts.join(' • ');
    }
    if (base.stats.scan) return `Scan: ${base.stats.scan}`;
    if (base.stats.cargoSteal) return 'Ability: Cargo Steal';
    if (base.stats.cloak) return `Cloak: ${base.stats.cloak}%`;
    if (base.stats.cap) return `Capacity: ${base.stats.cap}kT`;
    if (base.stats.terraform) return `Terraform: ±${base.stats.terraform}`;
    if (base.stats.driverSpeed) return `Driver: Warp ${base.stats.driverSpeed}`;
    if (base.stats.gateRange) return `Gate Range: ${base.stats.gateRange}ly`;

    // Fallback: show initiative or accuracy if present
    if (base.stats.initiative) return `Init: ${base.stats.initiative}`;
    if (base.stats.accuracy) return `Accuracy: ${base.stats.accuracy}%`;
    return null;
  }
}
