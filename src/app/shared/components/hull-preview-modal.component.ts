import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HullTemplate } from '../../data/tech-atlas.types';
import { getComponent } from '../../utils/data-access.util';
import { ShipDesign } from '../../models/game.model';
import { HullLayoutComponent } from './hull-layout/hull-layout.component';
import { ResourceCostComponent, Cost } from './resource-cost/resource-cost.component';
import { ResearchUnlockDetailsComponent } from './research-unlock-details/research-unlock-details.component';
import { TouchClickDirective, ClickOutsideDirective } from '../directives';

@Component({
  selector: 'app-hull-preview-modal',
  standalone: true,
  imports: [
    CommonModule,
    HullLayoutComponent,
    ResourceCostComponent,
    ResearchUnlockDetailsComponent,
    TouchClickDirective,
    ClickOutsideDirective,
  ],
  template: `
    <div class="modal-overlay">
      <div class="modal-content" appClickOutside (clickOutside)="close.emit()" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title || hull?.Name || 'Hull Preview' }}</h3>
          <button class="btn-text" appTouchClick (touchClick)="close.emit()">Close</button>
        </div>
        <div class="modal-body">
          <div class="hull-info">
            @if (stats || hull) {
              <div class="info-grid">
                <div class="info-column">
                  <h4>General</h4>
                  <div class="spec-row">
                    <span class="label">Mass:</span>
                    <span class="value">{{ stats?.mass || hull?.Stats?.Mass }}kt</span>
                  </div>
                  <div class="spec-row">
                    <span class="label">Fuel:</span>
                    <span class="value"
                      >{{ stats?.fuelCapacity || hull?.Stats?.['Max Fuel'] }}mg</span
                    >
                  </div>
                  <div class="spec-row">
                    <span class="label">Armor:</span>
                    <span class="value">{{ stats?.armor || hull?.Stats?.Armor }}</span>
                  </div>
                  @if (stats?.shields > 0) {
                    <div class="spec-row">
                      <span class="label">Shields:</span>
                      <span class="value">{{ stats.shields }}</span>
                    </div>
                  }
                  @if (stats?.cargoCapacity > 0) {
                    <div class="spec-row">
                      <span class="label">Cargo:</span>
                      <span class="value">{{ stats.cargoCapacity }}kT</span>
                    </div>
                  }
                  @if (stats?.colonistCapacity > 0) {
                    <div class="spec-row">
                      <span class="label">Colonists:</span>
                      <span class="value">{{ stats.colonistCapacity }}</span>
                    </div>
                  }
                </div>

                @if (stats) {
                  <div class="info-column">
                    <h4>Performance</h4>
                    <div class="spec-row">
                      <span class="label">Warp:</span>
                      <span class="value">{{ stats.warpSpeed || stats.idealWarp || 0 }}</span>
                    </div>
                    @if (stats.firepower > 0) {
                      <div class="spec-row">
                        <span class="label">Weapons:</span>
                        <span class="value">{{ stats.firepower }}</span>
                      </div>
                    }
                    <div class="spec-row">
                      <span class="label">Initiative:</span>
                      <span class="value">{{ stats.initiative }}</span>
                    </div>
                    @if (stats.scanRange > 0) {
                      <div class="spec-row">
                        <span class="label">Scan Range:</span>
                        <span class="value">{{ stats.scanRange }} ly</span>
                      </div>
                    }
                    @if (stats.miningRate > 0) {
                      <div class="spec-row">
                        <span class="label">Mining:</span>
                        <span class="value">{{ stats.miningRate }}</span>
                      </div>
                    }
                    @if (stats.terraformRate > 0) {
                      <div class="spec-row">
                        <span class="label">Terraform:</span>
                        <span class="value">{{ stats.terraformRate }}%</span>
                      </div>
                    }
                    @if (stats.bombing?.kill > 0 || stats.bombing?.destroy > 0) {
                      <div class="spec-row">
                        <span class="label">Bombing:</span>
                        <span class="value"
                          >{{ stats.bombing.kill }}%/{{ stats.bombing.destroy }}</span
                        >
                      </div>
                    }
                    @if (stats.massDriver?.speed > 0) {
                      <div class="spec-row">
                        <span class="label">Mass Driver:</span>
                        <span class="value"
                          >{{ stats.massDriver.speed }} ({{ stats.massDriver.catch }}kT)</span
                        >
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="cost">
                <span class="label">Cost:</span>
                <app-resource-cost [cost]="toCost(stats?.cost || hull?.Cost)"></app-resource-cost>
              </div>
            }
          </div>

          <app-hull-layout
            [hull]="hull"
            [design]="design"
            [editable]="false"
            (componentInfoClick)="onComponentInfoClick($event)"
          ></app-hull-layout>
        </div>
      </div>
    </div>

    @if (previewComponentName()) {
      <app-research-unlock-details
        [unlockName]="previewComponentName()!"
        (close)="previewComponentName.set(null)"
      ></app-research-unlock-details>
    }
  `,
  styles: [
    `
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
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-md);
        background: rgba(255, 255, 255, 0.03);
        padding: var(--space-md);
        border-radius: var(--radius-md);
      }
      .info-column h4 {
        margin: 0 0 var(--space-sm) 0;
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        color: var(--color-text-muted);
        letter-spacing: 0.5px;
      }
      .spec-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: var(--font-size-sm);
      }
      .spec-row .label {
        color: var(--color-text-muted);
      }
      .spec-row .value {
        color: var(--color-text-main);
        font-weight: 500;
      }
      .cost {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--font-size-sm);
        margin-top: 4px;
      }
      .cost .label {
        color: var(--color-text-muted);
      }
      .components-section {
        background: rgba(255, 255, 255, 0.03);
        padding: var(--space-md);
        border-radius: var(--radius-md);
      }
      .components-section h4 {
        margin: 0 0 var(--space-sm) 0;
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        color: var(--color-text-muted);
        letter-spacing: 0.5px;
      }
      .components-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: var(--space-sm);
      }
      .component-item {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--font-size-sm);
        background: rgba(0, 0, 0, 0.2);
        padding: 4px 8px;
        border-radius: var(--radius-sm);
      }
      .component-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }
      .component-count {
        color: var(--color-text-highlight);
        font-weight: bold;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullPreviewModalComponent {
  @Input() hull: HullTemplate | null = null;
  @Input() design: ShipDesign | null = null;
  @Input() stats: any | null = null;
  @Input() title: string | null = null;
  @Output() close = new EventEmitter<void>();

  previewComponentName = signal<string | null>(null);

  onComponentInfoClick(slotId: string) {
    if (!this.design) return;
    const slot = this.design.slots.find((s) => s.slotId === slotId);
    if (slot && slot.components && slot.components.length > 0) {
      const componentId = slot.components[0].componentId;
      const component = getComponent(componentId);
      if (component) {
        this.previewComponentName.set(component.name);
      }
    }
  }

  get componentList(): { name: string; count: number; icon: string }[] {
    if (this.stats?.components) {
      return this.stats.components.map((c: any) => ({
        name: c.name,
        count: c.quantity,
        icon: this.getComponentIcon(c.id || c.name),
      }));
    }

    if (this.design) {
      const comps: { name: string; count: number; icon: string }[] = [];
      this.design.slots.forEach((slot) => {
        if (slot.components && slot.components.length > 0) {
          const c = slot.components[0];
          // We need to look up component name/icon
          // This assumes we have access to component data or helper
          // Since we don't have getComponent here, we rely on the parent or need to import it
          // Let's import getComponent
          const compDef = getComponent(c.componentId);
          if (compDef) {
            comps.push({
              name: compDef.name,
              count: c.count,
              icon: compDef.id.replace(/_/g, '-') || 'placeholder',
            });
          }
        }
      });
      return comps;
    }
    return [];
  }

  getComponentIcon(nameOrId: string): string {
    // Simple mapping or check
    const comp = getComponent(nameOrId);
    return comp?.id || 'placeholder';
  }

  toCost(cost: {
    Ironium?: number;
    Boranium?: number;
    Germanium?: number;
    Resources?: number;
    ironium?: number;
    boranium?: number;
    germanium?: number;
    resources?: number;
  }): Cost {
    return {
      ironium: cost?.ironium || cost?.Ironium,
      boranium: cost?.boranium || cost?.Boranium,
      germanium: cost?.germanium || cost?.Germanium,
      resources: cost?.resources || cost?.Resources,
    };
  }
}
