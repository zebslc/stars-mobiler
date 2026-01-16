import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Star } from '../models/game.model';
import { ClickOutsideDirective } from '../shared/directives';

export interface StarOption {
  star: Star;
  isHome: boolean;
  isEnemy: boolean;
  isUnoccupied: boolean;
  habitability: number;
  turnsAway: number;
  isInRange: boolean;
  distance: number;
}

@Component({
  selector: 'app-star-selector',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  template: `
    <div class="star-selector">
      <button
        type="button"
        class="selector-trigger"
        (click)="toggleDropdown()"
        [class.open]="isOpen()"
      >
        @if (selectedStar(); as selected) {
          <span class="selected-content">
            <span class="star-icon">{{ getIcon(selected) }}</span>
            <span class="star-name">{{ selected.star.name }}</span>
            <span class="star-distance text-xs text-muted">{{ selected.turnsAway }}T</span>
          </span>
        } @else {
          <span class="placeholder">Select destination...</span>
        }
        <span class="dropdown-arrow">▼</span>
      </button>

      @if (isOpen()) {
        <div class="dropdown-panel" (click)="$event.stopPropagation()" appClickOutside (clickOutside)="isOpen.set(false)">
          @if (options().length > 0) {
            <div class="options-list">
              @for (option of options(); track option.star.id) {
                <button
                  type="button"
                  class="star-option"
                  [class.selected]="option.star.id === selectedStar()?.star?.id"
                  [class.out-of-range]="!option.isInRange"
                  (click)="selectStar(option)"
                >
                  <div class="option-main">
                    <span class="star-icon">{{ getIcon(option) }}</span>
                    <div class="star-info">
                      <div class="star-name">{{ option.star.name }}</div>
                      <div class="star-meta text-xs">
                        <span class="distance">{{ option.distance | number: '1.0-0' }} ly</span>
                        <span class="separator">•</span>
                        <span class="turns" [class.warning]="!option.isInRange">
                          {{ option.turnsAway }} turn{{ option.turnsAway !== 1 ? 's' : '' }}
                        </span>
                        @if (!option.isInRange) {
                          <span class="fuel-warning">⛽</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="option-status">
                    @if (option.isHome) {
                      <span
                        class="status-badge home"
                        title="Home System"
                      >🏠</span>
                    }
                    @if (option.isEnemy) {
                      <span
                        class="status-badge enemy"
                        title="Enemy Territory"
                      >⚔️</span>
                    }
                    @if (option.isUnoccupied) {
                      <span
                        class="habitability-indicator"
                        [class.hab-good]="option.habitability > 0"
                        [class.hab-terraformable]="option.habitability === 0"
                        [class.hab-poor]="option.habitability < 0"
                        [title]="'Habitability: ' + option.habitability + '%'"
                      >●</span>
                    }
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="no-options">
              <span class="text-muted">No star systems available</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .star-selector {
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
      max-height: 400px;
      overflow-y: auto;
    }

    .options-list {
      display: flex;
      flex-direction: column;
    }

    .star-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--color-bg-primary);
      border: none;
      border-bottom: 1px solid var(--color-border-light);
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;
      min-height: var(--touch-target-min);
    }

    .star-option:last-child {
      border-bottom: none;
    }

    .star-option:hover {
      background: var(--color-bg-secondary);
    }

    .star-option.selected {
      background: var(--color-primary-light);
    }

    .star-option.out-of-range {
      opacity: 0.6;
    }

    .option-main {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      flex: 1;
    }

    .star-icon {
      font-size: var(--font-size-lg);
      width: 24px;
      text-align: center;
    }

    .star-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .star-name {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .star-meta {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      color: var(--color-text-muted);
    }

    .separator {
      opacity: 0.5;
    }

    .turns.warning {
      color: var(--color-warning);
    }

    .fuel-warning {
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }

    .option-status {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }

    .status-badge {
      font-size: var(--font-size-lg);
    }

    .habitability-indicator {
      font-size: var(--font-size-xl);
      line-height: 1;
    }

    .habitability-indicator.hab-good {
      color: var(--color-success);
    }

    .habitability-indicator.hab-terraformable {
      color: var(--color-warning);
    }

    .habitability-indicator.hab-poor {
      color: var(--color-danger);
    }

    .star-distance {
      margin-left: auto;
    }

    .no-options {
      padding: var(--space-xl);
      text-align: center;
      color: var(--color-text-muted);
    }

    /* Mobile optimizations */
    @media (max-width: 640px) {
      .dropdown-panel {
        max-height: 300px;
      }

      .star-meta {
        flex-wrap: wrap;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarSelectorComponent {
  readonly options = input<Array<StarOption>>([]);
  readonly selectedStar = input<StarOption | null>(null);
  readonly starSelected = output<StarOption>();

  readonly isOpen = signal(false);



  toggleDropdown() {
    this.isOpen.update(val => !val);
  }

  selectStar(option: StarOption) {
    this.starSelected.emit(option);
    this.isOpen.set(false);
  }

  getIcon(option: StarOption): string {
    // Priority: Home > Enemy > Unoccupied
    if (option.isHome) return '⭐'; // Home star
    if (option.isEnemy) return '🔴'; // Enemy star
    if (option.isUnoccupied) {
      // Unoccupied - show based on habitability
      if (option.habitability > 0) return '🌍'; // Habitable
      if (option.habitability === 0) return '🌙'; // Neutral/Terraformable (using moon instead)
      return '☄️'; // Inhospitable
    }
    return '⭐'; // Default to star icon
  }
}
