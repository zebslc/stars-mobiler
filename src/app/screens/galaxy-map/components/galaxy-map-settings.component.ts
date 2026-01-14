import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../services/core/settings.service';
import {
  FilterRibbonComponent,
  FilterItem,
} from '../../../shared/components/filter-ribbon/filter-ribbon.component';
import { SHIP_ROLE_CONFIG } from '../../../shared/constants/ship-roles.const';

@Component({
  selector: 'app-galaxy-map-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterRibbonComponent],
  template: `
    <div class="settings-container">
      @if (!navigationMode) {
        <button
          class="settings-toggle"
          (click)="toggleMenu()"
          [class.active]="isOpen"
        >
          <span style="font-size: 20px;">👁️</span>
        </button>
      }
      @if (navigationMode) {
        <button
          class="settings-toggle"
          style="background: #e74c3c; color: white;"
          (click)="exitNavigation.emit()"
        >
          <span style="font-size: 20px;">✕</span>
        </button>
      }

      @if (isOpen && !navigationMode) {
        <div class="dropdown-menu">
        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tab-btn"
            [class.active]="activeTab === 'scanner'"
            (click)="activeTab = 'scanner'"
            title="Scanner Settings"
          >
            <!-- Satellite Dish -->
            <span style="font-size: 20px;">📡</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'fleets'"
            (click)="activeTab = 'fleets'"
            title="Fleet Settings"
          >
            <!-- Rocket -->
            <span style="font-size: 20px;">🚀</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'planets'"
            (click)="activeTab = 'planets'"
            title="Planet Settings"
          >
            <!-- Planet (Globe) -->
            <span style="font-size: 20px;">🌍</span>
          </button>
        </div>

        <div class="tab-content">
          <!-- Scanner Controls -->
          @if (activeTab === 'scanner') {
            <div class="section">
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showScannerRanges()"
                  (ngModelChange)="settings.toggleScannerRanges($event)"
                />
                Show Ranges
              </label>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showCloakedRanges()"
                  (ngModelChange)="settings.toggleCloakedRanges($event)"
                />
                Show Cloaked
              </label>
            </div>
            <div class="control-row range-slider">
              <label>Range: {{ settings.scannerRangePct() }}%</label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                [value]="settings.scannerRangePct()"
                (input)="settings.setScannerRangePct($any($event.target).valueAsNumber)"
              />
              <div class="range-visual" [style.width.%]="settings.scannerRangePct()"></div>
            </div>
            </div>
          }

          <!-- Fleet Controls -->
          @if (activeTab === 'fleets') {
            <div class="section">
            <div class="control-row">
              <app-filter-ribbon
                [items]="fleetFilterItems"
                [selected]="settings.fleetFilter()"
                [showAll]="true"
                allLabel="All"
                [emptyMeansAll]="false"
                (select)="onFleetFilterSelect($event)"
              ></app-filter-ribbon>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showEnemyFleets()"
                  (ngModelChange)="settings.toggleEnemyFleets($event)"
                />
                Enemy Fleets Only
              </label>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showFleetCounts()"
                  (ngModelChange)="settings.toggleFleetCounts($event)"
                />
                Show Counts
              </label>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showMinefields()"
                  (ngModelChange)="settings.toggleMinefields($event)"
                />
                Show Minefields
              </label>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showRemoteMining()"
                  (ngModelChange)="settings.toggleRemoteMining($event)"
                />
                Remote Mining
              </label>
            </div>
            </div>
          }

          <!-- Planetary View -->
          @if (activeTab === 'planets') {
            <div class="section">
            <div class="control-group">
              <button
                [class.active]="settings.viewMode() === 'normal'"
                (click)="settings.setViewMode('normal')"
              >
                Normal
              </button>
              <button
                [class.active]="settings.viewMode() === 'minerals'"
                (click)="settings.setViewMode('minerals')"
              >
                Minerals
              </button>
              <button
                [class.active]="settings.viewMode() === 'value'"
                (click)="settings.setViewMode('value')"
              >
                Value
              </button>
              <button
                [class.active]="settings.viewMode() === 'habitability'"
                (click)="settings.setViewMode('habitability')"
              >
                Hab
              </button>
            </div>
            <div class="control-row">
              <label>
                <input
                  type="checkbox"
                  [ngModel]="settings.showLabels()"
                  (ngModelChange)="settings.toggleLabels($event)"
                />
                Show Labels
              </label>
            </div>
            </div>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .settings-container {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 100;
        font-family: sans-serif;
      }

      .settings-toggle {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ccc;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        transition: all 0.2s;
      }

      .settings-toggle:hover {
        background: white;
        transform: scale(1.05);
      }

      .settings-toggle.active {
        background: #3498db;
        color: white;
        border-color: #2980b9;
      }

      .dropdown-menu {
        position: absolute;
        top: 50px;
        right: 0;
        width: 300px;
        max-width: calc(100vw - 3rem);
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(5px);
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.1);
        animation: fadeIn 0.2s ease-out;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Contains the tabs */
      }

      .tabs {
        display: flex;
        background: #f1f2f6;
        border-bottom: 1px solid #ddd;
      }

      .tab-btn {
        flex: 1;
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
        color: #95a5a6;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .tab-btn:hover {
        background: rgba(0, 0, 0, 0.05);
        color: #7f8c8d;
      }

      .tab-btn.active {
        color: #3498db;
        border-bottom-color: #3498db;
        background: white;
      }

      .tab-btn svg {
        width: 20px;
        height: 20px;
      }

      .tab-content {
        padding: 1rem;
        flex: 1;
        overflow-y: auto;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .section h3 {
        margin: 0 0 0.5rem 0;
        font-size: 0.9rem;
        color: #7f8c8d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .control-row {
        margin-bottom: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .control-row:last-child {
        margin-bottom: 0;
      }

      .control-row label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #2c3e50;
        cursor: pointer;
        user-select: none;
      }

      .control-group {
        display: flex;
        gap: 2px;
        background: #ecf0f1;
        padding: 2px;
        border-radius: 4px;
        margin-bottom: 0.8rem;
      }

      .control-group button {
        flex: 1;
        border: none;
        background: none;
        padding: 6px 4px;
        font-size: 0.8rem;
        cursor: pointer;
        border-radius: 2px;
        color: #7f8c8d;
        transition: all 0.2s;
      }

      .control-group button.active {
        background: white;
        color: #2c3e50;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        font-weight: 500;
      }

      select {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #2c3e50;
      }

      input[type='range'] {
        width: 100%;
        margin-top: 0.25rem;
      }

      .range-slider {
        flex-direction: column;
        align-items: stretch;
      }

      .range-visual {
        height: 2px;
        background: #3498db;
        margin-top: 2px;
        border-radius: 1px;
        transition: width 0.2s;
      }
    `,
  ],
})
export class GalaxyMapSettingsComponent {
  settings = inject(SettingsService);
  isOpen = false;
  activeTab: 'scanner' | 'fleets' | 'planets' = 'scanner';

  @Input() navigationMode = false;
  @Output() exitNavigation = new EventEmitter<void>();

  fleetFilterItems: FilterItem<string>[] = Object.entries(SHIP_ROLE_CONFIG)
    .filter(([key]) => key !== 'starbase')
    .map(([key, config]) => ({
      label: config.label,
      value: key,
      icon: config.icon,
      color: config.color,
    }));

  onFleetFilterSelect(value: string | null) {
    const current = new Set(this.settings.fleetFilter());
    const allKeys = this.fleetFilterItems.map((item) => item.value);

    if (value === null) {
      // Toggle All
      // If current filter has all available keys, then we deselect all.
      // Otherwise (some missing or empty), we select all.
      const isAllSelected = allKeys.every((k) => current.has(k));

      console.log('Toggle All:', {
        isAllSelected,
        currentSize: current.size,
        totalKeys: allKeys.length,
      });

      if (isAllSelected) {
        this.settings.setFleetFilter(new Set()); // Select None (Show Nothing)
      } else {
        this.settings.setFleetFilter(new Set(allKeys)); // Select All (Show Everything)
      }
    } else {
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      this.settings.setFleetFilter(current);
    }
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }
}
