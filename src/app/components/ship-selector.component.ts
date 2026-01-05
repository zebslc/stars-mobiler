import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompiledDesign } from '../data/ships.data';

export interface ShipOption {
  design: CompiledDesign;
  cost: {
    resources: number;
    iron?: number;
    boranium?: number;
    germanium?: number;
  };
  shipType: 'attack' | 'cargo' | 'support' | 'colony';
  canAfford: boolean;
}

@Component({
  selector: 'app-ship-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ship-selector">
      <button
        type="button"
        class="selector-trigger"
        (click)="toggleDropdown()"
        [class.open]="isOpen()"
      >
        <span *ngIf="selectedShip" class="selected-content">
          <span class="ship-icon">{{ getIcon(selectedShip) }}</span>
          <span class="ship-name">{{ selectedShip.design.name }}</span>
          <span class="ship-cost text-xs">{{ selectedShip.cost.resources }}R</span>
        </span>
        <span *ngIf="!selectedShip" class="placeholder">Select ship design...</span>
        <span class="dropdown-arrow">▼</span>
      </button>

      <div class="dropdown-panel" *ngIf="isOpen()" (click)="$event.stopPropagation()">
        <div class="options-list" *ngIf="options.length > 0; else noOptions">
          <button
            type="button"
            *ngFor="let option of options"
            class="ship-option"
            [class.selected]="option.design.id === selectedShip?.design?.id"
            [class.cannot-afford]="!option.canAfford"
            (click)="selectShip(option)"
          >
            <div class="option-header">
              <div class="option-main">
                <span class="ship-icon">{{ getIcon(option) }}</span>
                <div class="ship-info">
                  <div class="ship-name-row">
                    <span class="ship-name">{{ option.design.name }}</span>
                    <span class="ship-type-badge" [class]="'badge-' + option.shipType">
                      {{ getTypeName(option.shipType) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="option-cost">
                <div class="cost-main">{{ option.cost.resources }}R</div>
                <div class="cost-minerals text-xs">
                  <span *ngIf="option.cost.iron">{{ option.cost.iron }}Fe</span>
                  <span *ngIf="option.cost.boranium">{{ option.cost.boranium }}Bo</span>
                  <span *ngIf="option.cost.germanium">{{ option.cost.germanium }}Ge</span>
                </div>
              </div>
            </div>

            <div class="option-stats">
              <!-- Attack Ships -->
              <div *ngIf="option.shipType === 'attack'" class="stats-grid">
                <div class="stat">
                  <span class="stat-icon">⚔️</span>
                  <span class="stat-value">{{ option.design.firepower }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🛡️</span>
                  <span class="stat-value">{{ option.design.armor + option.design.shields }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🚀</span>
                  <span class="stat-value">W{{ option.design.warpSpeed }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⛽</span>
                  <span class="stat-value">{{ option.design.fuelCapacity }}</span>
                </div>
              </div>

              <!-- Cargo Ships -->
              <div *ngIf="option.shipType === 'cargo'" class="stats-grid">
                <div class="stat">
                  <span class="stat-icon">📦</span>
                  <span class="stat-value">{{ option.design.cargoCapacity }}kT</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🚀</span>
                  <span class="stat-value">W{{ option.design.warpSpeed }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⛽</span>
                  <span class="stat-value">{{ option.design.fuelCapacity }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⚖️</span>
                  <span class="stat-value">{{ option.design.mass }}kT</span>
                </div>
              </div>

              <!-- Support/Tanker Ships -->
              <div *ngIf="option.shipType === 'support'" class="stats-grid">
                <div class="stat">
                  <span class="stat-icon">🛢️</span>
                  <span class="stat-value">{{ option.design.fuelCapacity }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🚀</span>
                  <span class="stat-value">W{{ option.design.warpSpeed }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-value">{{ option.design.fuelEfficiency }}%</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">⚖️</span>
                  <span class="stat-value">{{ option.design.mass }}kT</span>
                </div>
              </div>

              <!-- Colony Ships -->
              <div *ngIf="option.shipType === 'colony'" class="stats-grid">
                <div class="stat">
                  <span class="stat-icon">👥</span>
                  <span class="stat-value"
                    >{{ (option.design.colonistCapacity || 0) / 1000 | number: '1.0-0' }}k</span
                  >
                </div>
                <div class="stat">
                  <span class="stat-icon">📦</span>
                  <span class="stat-value">{{ option.design.cargoCapacity }}kT</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🚀</span>
                  <span class="stat-value">W{{ option.design.warpSpeed }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon" *ngIf="option.design.fuelEfficiency === 0">♾️</span>
                  <span class="stat-icon" *ngIf="option.design.fuelEfficiency > 0">⛽</span>
                  <span class="stat-value" *ngIf="option.design.fuelEfficiency === 0">∞</span>
                  <span class="stat-value" *ngIf="option.design.fuelEfficiency > 0">{{
                    option.design.fuelCapacity
                  }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="!option.canAfford" class="cannot-afford-warning">
              <span class="text-xs">⚠️ Insufficient resources</span>
            </div>
          </button>
        </div>
        <ng-template #noOptions>
          <div class="no-options">
            <span class="text-muted">No ship designs available</span>
          </div>
        </ng-template>
      </div>
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
        padding: var(--space-md);
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
      }

      .placeholder {
        color: var(--color-text-muted);
      }

      .dropdown-arrow {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        transition: transform 0.2s;
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
        gap: var(--space-sm);
        padding: var(--space-md);
        background: var(--color-bg-primary);
        border: none;
        border-bottom: 1px solid var(--color-border-light);
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
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

      .option-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--space-md);
      }

      .option-main {
        display: flex;
        align-items: flex-start;
        gap: var(--space-sm);
        flex: 1;
      }

      .ship-icon {
        font-size: var(--font-size-xl);
        line-height: 1;
      }

      .ship-info {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .ship-name-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        flex-wrap: wrap;
      }

      .ship-name {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
      }

      .ship-type-badge {
        font-size: var(--font-size-xs);
        padding: 2px var(--space-xs);
        border-radius: var(--radius-sm);
        font-weight: var(--font-weight-medium);
        text-transform: uppercase;
      }

      .badge-attack {
        background: var(--color-danger-light);
        color: var(--color-danger);
      }

      .badge-cargo {
        background: var(--color-warning-light);
        color: var(--color-warning);
      }

      .badge-support {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }

      .badge-colony {
        background: var(--color-success-light);
        color: var(--color-success);
      }

      .option-cost {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }

      .cost-main {
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .cost-minerals {
        display: flex;
        gap: var(--space-xs);
        color: var(--color-text-muted);
      }

      .option-stats {
        padding-left: calc(var(--font-size-xl) + var(--space-sm));
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-sm);
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--font-size-sm);
      }

      .stat-icon {
        font-size: var(--font-size-sm);
      }

      .stat-value {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
      }

      .cannot-afford-warning {
        padding-left: calc(var(--font-size-xl) + var(--space-sm));
        color: var(--color-danger);
      }

      .ship-cost {
        margin-left: auto;
        color: var(--color-text-muted);
      }

      .no-options {
        padding: var(--space-xl);
        text-align: center;
        color: var(--color-text-muted);
      }

      /* Mobile optimizations */
      @media (max-width: 640px) {
        .dropdown-panel {
          max-height: 400px;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .ship-name-row {
          flex-direction: column;
          align-items: flex-start;
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

  private elementRef = inject(ElementRef);
  isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isOpen.update((val) => !val);
  }

  selectShip(option: ShipOption) {
    this.shipSelected.emit(option);
    this.isOpen.set(false);
  }

  getIcon(option: ShipOption): string {
    switch (option.shipType) {
      case 'attack':
        return '⚔️';
      case 'cargo':
        return '📦';
      case 'support':
        return '🛢️';
      case 'colony':
        return '🏘️';
      default:
        return '🚀';
    }
  }

  getTypeName(type: string): string {
    switch (type) {
      case 'attack':
        return 'Attack';
      case 'cargo':
        return 'Cargo';
      case 'support':
        return 'Support';
      case 'colony':
        return 'Colony';
      default:
        return 'Ship';
    }
  }
}
