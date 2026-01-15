import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilterItem<T = any> {
  label: string;
  icon?: string;
  value: T;
  title?: string;
  color?: string;
}

@Component({
  selector: 'app-filter-ribbon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filter-ribbon">
      @if (showAll()) {
        <button class="ribbon-btn" [class.active]="isAllSelected()" (click)="onSelectAll()">
          {{ allLabel() }}
        </button>
      }

      @for (item of items(); track trackByFn($index, item)) {
        <button
          class="ribbon-btn"
          [class.active]="isSelected(item.value)"
          (click)="onSelect(item.value)"
          [title]="item.title || item.label"
          [style.--btn-color]="item.color"
        >
          @if (item.icon) {
            <span class="btn-icon">{{ item.icon }}</span>
          }
          <span class="btn-label">{{ item.label }}</span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      .filter-ribbon {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: var(--color-bg-secondary, #f9f9f9);
        border-radius: 4px;
        border: 1px solid var(--color-border, #ddd);
        overflow-x: auto;
        white-space: nowrap;
        -webkit-overflow-scrolling: touch;
      }

      .ribbon-btn {
        background-color: var(--btn-color, rgba(0, 0, 0, 0.05));
        border: 1px solid var(--color-border, #ddd);
        color: var(--color-text-secondary, #555);
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        line-height: 1;
        flex-shrink: 0;
      }

      .ribbon-btn:hover {
        background-image: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
        color: var(--color-text-primary, #333);
      }

      .ribbon-btn.active {
        background-color: var(--color-primary, #2e86de);
        background-image: none;
        color: var(--color-text-inverse, #fff);
        border-color: var(--color-primary, #2e86de);
        font-weight: bold;
      }

      .btn-icon {
        font-size: 1.5rem;
        line-height: 1;
      }

      .btn-label {
        display: none;
      }

      @media (min-width: 768px) {
        .btn-label {
          display: inline;
        }
      }

      @media (min-width: 768px) {
        .btn-label {
          display: inline;
        }
      }
    `,
  ],
})
export class FilterRibbonComponent<T = any> {
  readonly items = input.required<FilterItem<T>[]>();
  readonly selected = input<T | Set<T> | T[] | null>(null);
  readonly showAll = input(false);
  readonly allLabel = input('All');
  readonly emptyMeansAll = input(true);

  readonly select = output<T | null>();

  onSelect(value: T) {
    this.select.emit(value);
  }

  onSelectAll() {
    this.select.emit(null);
  }

  isSelected(value: T): boolean {
    if (this.isAllSelected()) {
      return true;
    }
    const selected = this.selected();
    if (selected instanceof Set) {
      return selected.has(value);
    }
    if (Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  }

  isAllSelected(): boolean {
    const selected = this.selected();
    const items = this.items();
    const emptyMeansAll = this.emptyMeansAll();

    if (selected instanceof Set) {
      if (selected.size === 0) return emptyMeansAll;
      return items.every((i) => selected.has(i.value));
    }
    if (Array.isArray(selected)) {
      if (selected.length === 0) return emptyMeansAll;
      return items.every((i) => selected.includes(i.value));
    }
    return selected === null || selected === undefined;
  }

  trackByFn(index: number, item: FilterItem<T>) {
    return item.value;
  }
}
