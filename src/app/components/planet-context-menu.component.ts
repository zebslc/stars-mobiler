import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Star, Fleet } from '../models/game.model';

export interface PlanetContextMenuOption {
  label: string;
  action: () => void;
  disabled?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-planet-context-menu',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="context-menu"
        [style.left.px]="x()"
        [style.top.px]="y()"
        (click)="$event.stopPropagation()"
        (touchstart)="$event.stopPropagation()"
        (touchmove)="$event.stopPropagation()"
      >
        @for (option of options(); track $index) {
          <div
            class="context-menu-item"
            [class.disabled]="option.disabled"
            (click)="selectOption(option)"
          >
            {{ option.label }}
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .context-menu {
      position: fixed;
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      min-width: 180px;
      padding: var(--space-xs) 0;
    }

    .context-menu-item {
      padding: var(--space-sm) var(--space-md);
      cursor: pointer;
      transition: background 0.15s ease;
      font-size: 14px;
      color: var(--color-text-primary);
    }

    .context-menu-item:hover:not(.disabled) {
      background: var(--color-bg-tertiary);
    }

    .context-menu-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      color: var(--color-text-muted);
    }
  `]
})
export class PlanetContextMenuComponent {
  readonly visible = input.required<boolean>();
  readonly x = input.required<number>();
  readonly y = input.required<number>();
  readonly star = input.required<Star | null>();
  readonly selectedFleet = input<Fleet | null>(null);
  readonly canSendFleet = input<boolean>(false);

  close = output<void>();
  viewPlanet = output<string>();
  sendFleetToStar = output<Star>();

  readonly options = computed(() => {
    const star = this.star();
    if (!star) return [];

    const opts: Array<PlanetContextMenuOption> = [];

    opts.push({
      label: `View ${star.name}`,
      action: () => this.viewPlanet.emit(star.id),
    });

    if (this.selectedFleet() && this.canSendFleet()) {
      opts.push({
        label: 'Send Fleet Here',
        action: () => this.sendFleetToStar.emit(star),
      });
    }

    return opts;
  });

  selectOption(option: PlanetContextMenuOption) {
    if (option.disabled) return;
    option.action();
    this.close.emit();
  }
}
