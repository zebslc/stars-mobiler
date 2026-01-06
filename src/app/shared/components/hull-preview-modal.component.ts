import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull } from '../../data/hulls.data';
import { ShipDesign } from '../../models/game.model';
import { HullLayoutComponent } from './hull-layout/hull-layout.component';
import { ResourceCostComponent, Cost } from './resource-cost/resource-cost.component';

@Component({
  selector: 'app-hull-preview-modal',
  standalone: true,
  imports: [CommonModule, HullLayoutComponent, ResourceCostComponent],
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
              <div class="cost">
                <span class="label">Cost:</span>
                <app-resource-cost [cost]="toCost(hull.baseCost)"></app-resource-cost>
              </div>
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
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      padding: var(--space-lg);
    }
    .modal-content {
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      width: 92%;
      max-width: 640px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-md);
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .specs {
      display: flex;
      gap: var(--space-md);
      color: var(--color-text-main);
      font-size: var(--font-size-sm);
      flex-wrap: wrap;
    }
    .cost {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: var(--font-size-sm);
    }
    .cost .label { color: var(--color-text-muted); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullPreviewModalComponent {
  @Input() hull: Hull | null = null;
  @Input() design: ShipDesign | null = null;
  @Input() title: string | null = null;
  @Output() close = new EventEmitter<void>();

  toCost(cost: { ironium?: number; boranium?: number; germanium?: number; resources?: number }): Cost {
    return {
      ironium: cost?.ironium,
      boranium: cost?.boranium,
      germanium: cost?.germanium,
      resources: cost?.resources,
    };
  }
}
