import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompiledDesign } from '../data/ships.data';
import {
  ShipDesignItemComponent,
  ShipDesignDisplay,
} from './ship-design-item/ship-design-item.component';
import { CompiledShipStats } from '../models/game.model';
import { ClickOutsideDirective } from '../shared/directives';

export interface ShipOption {
  design: CompiledDesign;
  cost: {
    resources: number;
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
  shipType: 'attack' | 'cargo' | 'support' | 'colony';
  canAfford: boolean;
  existingCount?: number;
}

@Component({
  selector: 'app-ship-selector',
  standalone: true,
  imports: [CommonModule, ShipDesignItemComponent, ClickOutsideDirective],
  template: `
    <div class="ship-selector">
      <button
        type="button"
        class="selector-trigger"
        (click)="toggleDropdown()"
        [class.open]="isOpen()"
      >
        @if (selectedShip) {
          <span class="selected-content">
            <app-ship-design-item
              [design]="toDisplay(selectedShip.design)"
              [count]="selectedShip.existingCount"
              mode="selector"
              class="flex-grow"
            ></app-ship-design-item>
            <div class="selected-cost">{{ selectedShip.cost.resources }}R</div>
          </span>
        }
        @if (!selectedShip) {
          <span class="placeholder">Select ship design...</span>
        }
        <span class="dropdown-arrow">▼</span>
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel" (click)="$event.stopPropagation()" appClickOutside (clickOutside)="isOpen.set(false)">
          @if (options.length > 0) {
            <div class="options-list">
              @for (option of options; track option.design.id) {
                <button
                  type="button"
                  class="ship-option"
                  [class.selected]="option.design.id === selectedShip?.design?.id"
                  [class.cannot-afford]="!option.canAfford"
                  (click)="selectShip(option)"
                >
                  <div class="option-row">
                    <div class="design-wrapper">
                      <app-ship-design-item
                        [design]="toDisplay(option.design)"
                        [count]="option.existingCount"
                        mode="selector"
                      ></app-ship-design-item>
                    </div>

                    <div class="option-meta">
                      <div class="option-cost">
                        <div class="cost-main">{{ option.cost.resources }}R</div>
                        <div class="cost-minerals text-xs">
                          @if (option.cost.ironium) {
                            <span>{{ option.cost.ironium }}Fe</span>
                          }
                          @if (option.cost.boranium) {
                            <span>{{ option.cost.boranium }}Bo</span>
                          }
                          @if (option.cost.germanium) {
                            <span>{{ option.cost.germanium }}Ge</span>
                          }
                        </div>
                      </div>
                      @if (!option.canAfford) {
                        <div class="cannot-afford-warning">
                          <span class="text-xs">⚠️ Insufficient resources</span>
                        </div>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="no-options">
              <span class="text-muted">No ship designs available</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ship-selector {
        position: relative;
        width: 100%;
      }

      .selector-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
        padding: var(--space-xs);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        cursor: pointer;
        min-height: var(--touch-target-min);
        text-align: left;
        transition: all 0.2s;
      }

      .selector-trigger:hover {
        border-color: var(--color-primary);
      }

      .selector-trigger.open {
        border-color: var(--color-primary);
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .selected-content {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        flex: 1;
        width: 100%;
        overflow: hidden;
      }

      .flex-grow {
        flex: 1;
      }

      .selected-cost {
        font-weight: bold;
        color: var(--color-text-secondary);
        padding-right: var(--space-sm);
        white-space: nowrap;
      }

      .placeholder {
        padding: var(--space-sm);
        color: var(--color-text-muted);
      }

      .dropdown-arrow {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        transition: transform 0.2s;
        margin-right: var(--space-sm);
      }

      .selector-trigger.open .dropdown-arrow {
        transform: rotate(180deg);
      }

      .dropdown-panel {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--color-bg-primary);
        border: 1px solid var(--color-primary);
        border-top: none;
        border-radius: 0 0 var(--radius-md) var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        max-height: 500px;
        overflow-y: auto;
      }

      .options-list {
        display: flex;
        flex-direction: column;
      }

      .ship-option {
        display: flex;
        flex-direction: column;
        padding: 0;
        background: var(--color-bg-primary);
        border: none;
        border-bottom: 1px solid var(--color-border-light);
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
      }

      .option-row {
        display: flex;
        align-items: stretch;
      }

      .design-wrapper {
        flex: 1;
      }

      .option-meta {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-end;
        padding: var(--space-sm);
        min-width: 80px;
        border-left: 1px solid var(--color-border-light);
        background: rgba(0, 0, 0, 0.02);
      }

      .ship-option:last-child {
        border-bottom: none;
      }

      .ship-option:hover {
        background: var(--color-bg-secondary);
      }

      .ship-option.selected {
        background: var(--color-primary-light);
      }

      .ship-option.cannot-afford {
        opacity: 0.6;
      }

      .option-cost {
        text-align: right;
      }

      .cost-main {
        font-weight: bold;
        color: var(--color-text-primary);
      }

      .cost-minerals {
        display: flex;
        flex-direction: column;
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      .cannot-afford-warning {
        color: var(--color-danger);
        margin-top: var(--space-xs);
        text-align: right;
      }

      .no-options {
        padding: var(--space-xl);
        text-align: center;
        color: var(--color-text-muted);
      }

      @media (max-width: 640px) {
        .dropdown-panel {
          max-height: 400px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipSelectorComponent {
  @Input() options: ShipOption[] = [];
  @Input() selectedShip: ShipOption | null = null;
  @Output() shipSelected = new EventEmitter<ShipOption>();

  isOpen = signal(false);

  toggleDropdown() {
    this.isOpen.update((v) => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  selectShip(option: ShipOption) {
    this.shipSelected.emit(option);
    this.isOpen.set(false);
  }


  toDisplay(design: CompiledDesign): ShipDesignDisplay {
    return {
      id: design.id,
      name: design.name,
      hullId: design.hullId,
      stats: {
        mass: design.mass,
        armor: design.armor,
        shields: design.shields,
        firepower: design.firepower,
        warpSpeed: design.warpSpeed,
        fuelCapacity: design.fuelCapacity,
        cargoCapacity: design.cargoCapacity,
        colonistCapacity: design.colonistCapacity || 0,
        scanRange: design.scannerRange,
        penScanRange: 0,
        maxWeaponRange: 0,
        cost: {
          ironium: design.cost.ironium,
          boranium: design.cost.boranium,
          germanium: design.cost.germanium,
          resources: design.cost.resources || 0,
        },
        idealWarp: design.idealWarp,
        fuelEfficiency: design.fuelEfficiency,
        isRamscoop: false,
        accuracy: 100,
        initiative: design.initiative,
        canDetectCloaked: false,
        miningRate: 0,
        terraformRate: 0,
        bombing: { kill: 0, destroy: 0 },
        massDriver: { speed: 0, catch: 0 },
        hasEngine: design.warpSpeed > 0,
        hasColonyModule: design.colonyModule,
        isStarbase: design.warpSpeed === 0,
        isValid: true,
        validationErrors: [],
        components: design.components,
      },
    };
  }
}
