import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull } from '../../data/hulls.data';
import { ShipDesign } from '../../models/game.model';
import { HullLayoutComponent } from './hull-layout/hull-layout.component';

@Component({
  selector: 'app-hull-preview-modal',
  standalone: true,
  imports: [CommonModule, HullLayoutComponent],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title || (hull?.name || 'Hull Preview') }}</h3>
          <button class="btn-text" (click)="close.emit()">Close</button>
        </div>
        <div class="modal-body">
          <div class="hull-info">
            @if (hull) {
              <div class="specs">
                <div class="spec">Mass: {{ hull.mass }}kt</div>
                <div class="spec">Fuel: {{ hull.fuelCapacity }}mg</div>
                <div class="spec">Armor: {{ hull.armor }}</div>
              </div>
              <div class="cost">Cost: {{ formatCost(hull.baseCost) }}</div>
            }
          </div>
          <app-hull-layout [hull]="hull" [design]="design" [editable]="false"></app-hull-layout>
        </div>
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
      padding: 1rem;
      width: 92%;
      max-width: 640px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .specs {
      display: flex;
      gap: 1rem;
      color: #cfe8ff;
      font-size: 0.9rem;
    }
    .cost {
      color: #9bd1ff;
      font-size: 0.9rem;
    }
    @media (max-width: 480px) {
      .specs {
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: 0.85rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullPreviewModalComponent {
  @Input() hull: Hull | null = null;
  @Input() design: ShipDesign | null = null;
  @Input() title: string | null = null;
  @Output() close = new EventEmitter<void>();

  formatCost(cost: { ironium?: number; boranium?: number; germanium?: number }): string {
    const parts: string[] = [];
    if (cost?.ironium) parts.push(`${cost.ironium} Fe`);
    if (cost?.boranium) parts.push(`${cost.boranium} B`);
    if (cost?.germanium) parts.push(`${cost.germanium} Ge`);
    return parts.join(', ');
  }
}

