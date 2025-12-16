import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fleet } from '../models/game.model';

export interface FleetContextMenuOption {
  label: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-fleet-context-menu',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="visible()"
      class="context-menu"
      [style.left.px]="x()"
      [style.top.px]="y()"
      (click)="$event.stopPropagation()"
    >
      <div
        *ngFor="let option of options()"
        [class.divider]="option.divider"
      >
        <div
          *ngIf="!option.divider"
          class="context-menu-item"
          [class.disabled]="option.disabled"
          (click)="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
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

    .divider {
      height: 1px;
      background: var(--color-border);
      margin: var(--space-xs) 0;
    }
  `]
})
export class FleetContextMenuComponent {
  visible = input.required<boolean>();
  x = input.required<number>();
  y = input.required<number>();
  fleet = input.required<Fleet | null>();
  clickedPosition = input<{ x: number; y: number } | null>(null);
  isFleetSelected = input<boolean>(false);

  close = output<void>();
  viewFleet = output<string>();
  addWaypoint = output<{ x: number; y: number }>();
  moveToPosition = output<{ x: number; y: number }>();

  options = computed(() => {
    const fleet = this.fleet();
    const clickedPos = this.clickedPosition();
    const isSelected = this.isFleetSelected();

    const opts: FleetContextMenuOption[] = [];

    // If context menu is opened on a fleet
    if (fleet) {
      opts.push({
        label: `View Fleet ${fleet.id}`,
        action: () => this.viewFleet.emit(fleet.id),
      });

      if (isSelected) {
        opts.push({
          label: 'Clear Selection',
          action: () => this.close.emit(),
        });
      }
    }

    // If context menu is opened in empty space with a fleet selected
    if (!fleet && isSelected && clickedPos) {
      opts.push({
        label: 'Add Waypoint',
        action: () => this.addWaypoint.emit(clickedPos),
      });

      opts.push({
        label: 'Move Here',
        action: () => this.moveToPosition.emit(clickedPos),
      });
    }

    return opts;
  });

  selectOption(option: FleetContextMenuOption) {
    if (option.disabled) return;
    option.action();
    this.close.emit();
  }
}
