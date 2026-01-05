import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameStateService } from '../services/game-state.service';

@Component({
  standalone: true,
  selector: 'app-nav-bar',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav-bar">
      <div class="nav-buttons">
        <button
          class="nav-button"
          routerLink="/map"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
          title="Galaxy Map"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
          </svg>
          <span class="nav-label">Map</span>
        </button>

        <button class="nav-button" routerLink="/planets" routerLinkActive="active" title="Planets">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <ellipse cx="12" cy="12" rx="5" ry="10" />
          </svg>
          <span class="nav-label">Planets</span>
        </button>

        <button class="nav-button" routerLink="/fleets" routerLinkActive="active" title="Fleets">
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span class="nav-label">Fleets</span>
        </button>

        <button
          class="nav-button"
          routerLink="/research"
          routerLinkActive="active"
          title="Research"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M9 11a3 3 0 100-6 3 3 0 000 6z" />
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span class="nav-label">Research</span>
        </button>

        <button
          class="nav-button"
          routerLink="/ship-design"
          routerLinkActive="active"
          title="Ship Design"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
            />
          </svg>
          <span class="nav-label">Design</span>
        </button>

        <button
          class="nav-button"
          routerLink="/settings"
          routerLinkActive="active"
          title="Settings"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m5.2-15.8l-4.2 4.2m-6 6l-4.2 4.2m14.4 0l-4.2-4.2m-6-6l-4.2-4.2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <span class="nav-label">Settings</span>
        </button>
      </div>

      <div class="turn-info">
        <button (click)="gs.endTurn()" class="btn-end-turn">End Turn ({{ gs.turn() }}) ▶</button>
      </div>
    </nav>
  `,
  styles: [
    `
      .nav-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--color-bg-secondary);
        border-bottom: 1px solid var(--color-border);
        padding: var(--space-sm) var(--space-md);
        z-index: 1000;
        gap: var(--space-md);
      }

      .nav-buttons {
        display: flex;
        gap: var(--space-xs);
        align-items: center;
      }

      .turn-info {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .btn-end-turn {
        background: var(--color-success);
        color: white;
        border: none;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
        white-space: nowrap;
        font-size: 13px;
      }

      .btn-end-turn:hover {
        background: #27ae60;
      }

      .nav-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: none;
        padding: var(--space-sm);
        cursor: pointer;
        color: var(--color-text-muted);
        transition: all 0.2s ease;
        border-radius: var(--radius-sm);
        min-width: 60px;
      }

      .nav-button:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      .nav-button.active {
        color: var(--color-primary);
        background: var(--color-bg-tertiary);
        font-weight: 600;
      }

      .nav-icon {
        width: 24px;
        height: 24px;
      }

      .nav-label {
        font-size: 11px;
        white-space: nowrap;
      }

      @media (max-width: 768px) {
        .nav-buttons {
          flex-wrap: wrap;
          gap: 2px;
        }

        .turn-info {
          gap: var(--space-sm);
        }

        .btn-end-turn {
          padding: var(--space-xs) var(--space-sm);
          font-size: 12px;
        }
      }

      @media (max-width: 640px) {
        .nav-label {
          font-size: 10px;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
        }

        .nav-button {
          min-width: 50px;
          padding: var(--space-xs);
        }
      }
    `,
  ],
})
export class NavBarComponent {
  gs = inject(GameStateService);
}
