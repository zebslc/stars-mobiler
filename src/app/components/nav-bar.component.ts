import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameStateService } from '../services/game/game-state.service';

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
          <span class="nav-icon">🌃</span>
          <span class="nav-label">Map</span>
        </button>

        <button class="nav-button" routerLink="/planets" routerLinkActive="active" title="Planets">
          <span class="nav-icon">🌍</span>
          <span class="nav-label">Planets</span>
        </button>

        <button class="nav-button" routerLink="/fleets" routerLinkActive="active" title="Fleets">
          <span class="nav-icon">🚀</span>
          <span class="nav-label">Fleets</span>
        </button>

        <button
          class="nav-button"
          routerLink="/research"
          routerLinkActive="active"
          title="Research"
        >
          <span class="nav-icon">🔬</span>
          <span class="nav-label">Research</span>
        </button>

        <button
          class="nav-button"
          routerLink="/ship-design"
          routerLinkActive="active"
          title="Ship Design"
        >
          <span class="nav-icon">🛠️</span>
          <span class="nav-label">Design</span>
        </button>

        <button
          class="nav-button"
          routerLink="/settings"
          routerLinkActive="active"
          title="Settings"
        >
          <span class="nav-icon">⚙️</span>
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
        font-size: 24px;
        line-height: 1;
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
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
