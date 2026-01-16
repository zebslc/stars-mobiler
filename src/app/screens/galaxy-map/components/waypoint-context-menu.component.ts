import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waypoint-context-menu',
  standalone: true,
  imports: [CommonModule],
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
        <div class="menu-item" (click)="onMove()"><span>📍</span> Move Waypoint</div>
        <div class="menu-item" (click)="onSetSpeed()"><span>🚀</span> Set Warp Speed</div>
        <div
          class="menu-item"
          [class.disabled]="!canColonize()"
          (click)="canColonize() && onColonize()"
        >
          <span>🌱</span>
          Colonise
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item delete" (click)="onDelete()"><span>🗑️</span> Delete Waypoint</div>
      </div>

      <!-- Overlay to close menu when clicking outside -->
      <div
        class="menu-overlay"
        (click)="close.emit()"
        (contextmenu)="$event.preventDefault(); close.emit()"
      ></div>
    }
  `,
  styles: [
    `
      .context-menu {
        position: fixed;
        z-index: 1000;
        background: rgba(16, 20, 40, 0.95);
        border: 1px solid rgba(52, 152, 219, 0.3);
        border-radius: 8px;
        padding: 0.5rem 0;
        min-width: 180px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        animation: fadeIn 0.1s ease-out;
      }

      .menu-item {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #ecf0f1;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 0.9rem;
      }

      .menu-item:hover {
        background: rgba(52, 152, 219, 0.2);
      }

      .menu-item span {
        font-size: 1.1rem;
        width: 20px;
        text-align: center;
      }

      .menu-item.disabled {
        opacity: 0.4;
        cursor: default;
      }

      .menu-item.disabled:hover {
        background: transparent;
      }

      .menu-item.delete {
        color: #e74c3c;
      }

      .menu-item.delete:hover {
        background: rgba(231, 76, 60, 0.2);
      }

      .menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0.25rem 0;
      }

      .menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `,
  ],
})
export class WaypointContextMenuComponent {
  readonly visible = input(false);
  readonly x = input(0);
  readonly y = input(0);
  readonly canColonize = input(false);
  readonly close = output<void>();
  readonly delete = output<void>();
  readonly move = output<void>();
  readonly setSpeed = output<void>();
  readonly colonize = output<void>();

  onDelete() {
    this.delete.emit();
  }

  onMove() {
    this.move.emit();
  }

  onSetSpeed() {
    this.setSpeed.emit();
  }

  onColonize() {
    this.colonize.emit();
  }
}
