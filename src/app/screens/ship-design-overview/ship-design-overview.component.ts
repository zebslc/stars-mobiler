import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPILED_DESIGNS } from '../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-ship-design-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:var(--space-lg);max-width:1400px;margin:0 auto">
      <h1 style="margin-bottom:var(--space-lg)">Ship Design</h1>

      <div class="coming-soon-banner">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        <h2>Ship Design System</h2>
        <p class="text-muted">Custom ship design and editing features are coming soon.</p>
      </div>

      <div class="action-buttons">
        <button class="btn-primary" disabled>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Design
        </button>
        <button disabled>Import Design</button>
        <button disabled>Manage Templates</button>
      </div>

      <h2 style="margin-top:var(--space-xl);margin-bottom:var(--space-lg)">Available Ship Designs</h2>

      <div class="designs-grid">
        <div *ngFor="let design of shipDesigns" class="design-card">
          <div class="design-header">
            <h3>{{ design.name }}</h3>
            <span class="design-type">{{ formatType(design) }}</span>
          </div>

          <div class="design-stats">
            <div class="stat-row">
              <span class="stat-label">Hull:</span>
              <span class="stat-value">{{ design.id }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Mass:</span>
              <span class="stat-value">{{ design.mass }} kT</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Armor:</span>
              <span class="stat-value">{{ design.armor }}</span>
            </div>
            <div *ngIf="design.firepower > 0" class="stat-row">
              <span class="stat-label">Firepower:</span>
              <span class="stat-value">{{ design.firepower }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Speed:</span>
              <span class="stat-value">Warp {{ design.warpSpeed }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Fuel Capacity:</span>
              <span class="stat-value">{{ design.fuelCapacity }}</span>
            </div>
            <div *ngIf="design.cargoCapacity > 0" class="stat-row">
              <span class="stat-label">Cargo:</span>
              <span class="stat-value">{{ design.cargoCapacity }} kT</span>
            </div>
            <div *ngIf="design.colonistCapacity" class="stat-row">
              <span class="stat-label">Colonists:</span>
              <span class="stat-value">{{ design.colonistCapacity | number }}</span>
            </div>
          </div>

          <div class="design-actions">
            <button class="btn-small" disabled>Edit</button>
            <button class="btn-small" disabled>Clone</button>
            <button class="btn-small btn-danger" disabled>Retire</button>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .coming-soon-banner {
      background: var(--color-bg-secondary);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
      text-align: center;
      margin-bottom: var(--space-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
    }

    .coming-soon-banner svg {
      color: var(--color-warning);
    }

    .coming-soon-banner h2 {
      margin: 0;
      color: var(--color-warning);
    }

    .action-buttons {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
    }

    .action-buttons button {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
    }

    .designs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-lg);
    }

    .design-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .design-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--space-sm);
      border-bottom: 1px solid var(--color-border);
    }

    .design-header h3 {
      margin: 0;
      font-size: var(--font-size-lg);
    }

    .design-type {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: var(--color-bg-tertiary);
      color: var(--color-text-muted);
    }

    .design-stats {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-label {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .stat-value {
      font-weight: 600;
      font-size: var(--font-size-sm);
    }

    .design-actions {
      display: flex;
      gap: var(--space-sm);
      padding-top: var(--space-sm);
      border-top: 1px solid var(--color-border);
    }

    .btn-small {
      flex: 1;
      padding: 6px 12px;
      font-size: var(--font-size-sm);
    }

    .btn-danger {
      background: var(--color-danger);
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c0392b;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ShipDesignOverviewComponent {
  shipDesigns = Object.values(COMPILED_DESIGNS);

  formatType(design: any): string {
    if (design.colonyModule) return 'Colony Ship';
    if (design.cargoCapacity > 0) return 'Freighter';
    if (design.firepower > 0) return 'Warship';
    return 'Scout';
  }
}
