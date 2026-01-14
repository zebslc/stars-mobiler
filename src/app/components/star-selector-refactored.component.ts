import { Component, Input, Output, EventEmitter, signal, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideDirective, TouchClickDirective } from '../shared/directives';
import { StarOption } from './star-selector.component'; // Assuming this interface exists

export interface StarSelectorRefactoredOptions {
  options: StarOption[];
  selectedStar: StarOption | null;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Refactored Star Selector using unified input directives
 * This demonstrates how to use the new input system instead of raw event handlers
 */
@Component({
  selector: 'app-star-selector-refactored',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective, TouchClickDirective],
  template: `
    <div class="star-selector">
      <div 
        class="selector-trigger"
        [class.open]="isOpen()"
        [class.disabled]="disabled"
        appTouchClick
        (touchClick)="onToggleClick($event)"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="true"
        role="combobox"
      >
        <div class="selected-content">
          @if (selectedStar; as selected) {
            <span class="star-icon">{{ getIcon(selected) }}</span>
            <span class="star-name">{{ selected.name }}</span>
          } @else {
            <span class="placeholder">{{ placeholder || 'Select a star...' }}</span>
          }
        </div>
        <span class="dropdown-arrow">▼</span>
      </div>

      @if (isOpen()) {
        <div 
          class="dropdown-panel"
          appClickOutside 
          (clickOutside)="onClickOutside($event)"
          [excludeElements]="[elementRef.nativeElement]"
          role="listbox"
        >
          <div class="options-list">
            @for (option of options; track option.id) {
              <button
                type="button"
                class="star-option"
                [class.selected]="option.id === selectedStar?.id"
                [class.out-of-range]="option.outOfRange"
                [disabled]="option.outOfRange"
                appTouchClick
                (touchClick)="onOptionSelect(option)"
                role="option"
                [attr.aria-selected]="option.id === selectedStar?.id"
              >
                <div class="option-main">
                  <span class="star-icon">{{ getIcon(option) }}</span>
                  <div class="star-info">
                    <div class="star-name">{{ option.name }}</div>
                    <div class="star-meta">
                      @if (option.distance !== undefined) {
                        <span>{{ option.distance }} ly</span>
                        <span class="separator">•</span>
                      }
                      @if (option.turns !== undefined) {
                        <span [class.warning]="option.turns > 10">{{ option.turns }} turns</span>
                      }
                      @if (option.fuelWarning) {
                        <span class="fuel-warning">⚠️ Low fuel</span>
                      }
                    </div>
                  </div>
                </div>
                
                <div class="option-status">
                  @if (option.isHome) {
                    <span class="status-badge" title="Home Star">🏠</span>
                  }
                  @if (option.isEnemy) {
                    <span class="status-badge" title="Enemy Territory">⚔️</span>
                  }
                  @if (option.habitability !== undefined) {
                    <span 
                      class="habitability-indicator"
                      [class.hab-good]="option.habitability > 50"
                      [class.hab-terraformable]="option.habitability >= 0 && option.habitability <= 50"
                      [class.hab-poor]="option.habitability < 0"
                      [title]="'Habitability: ' + option.habitability + '%'"
                    >
                      {{ option.habitability > 50 ? '🌍' : option.habitability >= 0 ? '🌙' : '☄️' }}
                    </span>
                  }
                </div>
              </button>
            } @empty {
              <div class="no-options">No stars available</div>
            }
          </div>
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
      user-select: none;
    }

    .selector-trigger:hover:not(.disabled) {
      border-color: var(--color-primary);
    }

    .selector-trigger.open {
      border-color: var(--color-primary);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .selector-trigger.disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .star-option:hover:not(:disabled) {
      background: var(--color-bg-secondary);
    }

    .star-option.selected {
      background: var(--color-primary-light);
    }

    .star-option.out-of-range {
      opacity: 0.6;
    }

    .star-option:disabled {
      cursor: not-allowed;
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
      font-size: var(--font-size-sm);
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
      
      .star-option {
        min-height: 48px; /* Ensure touch-friendly size */
      }
    }
  `]
})
export class StarSelectorRefactoredComponent {
  @Input() options: StarOption[] = [];
  @Input() selectedStar: StarOption | null = null;
  @Input() placeholder: string = 'Select a star...';
  @Input() disabled: boolean = false;
  @Output() starSelected = new EventEmitter<StarOption>();

  private elementRef = inject(ElementRef);
  isOpen = signal(false);

  onToggleClick(event: any): void {
    if (this.disabled) return;
    this.isOpen.update(val => !val);
  }

  onOptionSelect(option: StarOption): void {
    if (option.outOfRange) return;
    
    this.starSelected.emit(option);
    this.isOpen.set(false);
  }

  onClickOutside(event: any): void {
    this.isOpen.set(false);
  }

  getIcon(option: StarOption): string {
    // Priority: Home > Enemy > Unoccupied
    if (option.isHome) return '⭐'; // Home star
    if (option.isEnemy) return '🔴'; // Enemy star
    if (option.isUnoccupied) {
      // Unoccupied - show based on habitability
      if (option.habitability > 0) return '🌍'; // Habitable
      if (option.habitability === 0) return '🌙'; // Neutral/Terraformable
      return '☄️'; // Inhospitable
    }
    return '⭐'; // Default to star icon
  }
}

/*
MIGRATION BENEFITS DEMONSTRATED:

1. **Simplified Event Handling**: 
   - No more @HostListener('document:click') 
   - No more manual event type checking
   - Unified touch and mouse handling

2. **Better Accessibility**:
   - Proper ARIA attributes
   - Touch-friendly interaction
   - Keyboard support can be easily added

3. **Cleaner Code**:
   - Event handling logic is moved to directives
   - Component focuses on business logic
   - No manual event cleanup needed

4. **Testing Benefits**:
   - Directives can be tested independently
   - Component tests are simpler
   - Mock input events are easier to create

5. **Consistency**:
   - All components can use the same interaction patterns
   - Touch and mouse behavior is identical
   - Gesture recognition is standardized

TO MIGRATE EXISTING COMPONENTS:
1. Replace @HostListener with appClickOutside directive
2. Replace (click) with appTouchClick directive  
3. Add appLongPress for mobile context menus
4. Use appPanZoom for scrollable/zoomable areas
5. Use appDragDrop for drag and drop functionality
*/