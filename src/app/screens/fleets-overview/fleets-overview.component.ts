import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Fleet } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';
import { TechService } from '../../services/tech.service';

@Component({
  standalone: true,
  selector: 'app-fleets-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:var(--space-lg);max-width:1400px;margin:0 auto">
      <h1 style="margin-bottom:var(--space-lg)">Fleets</h1>

      <div *ngIf="fleets().length === 0" class="empty-state">
        <p>You don't have any fleets yet.</p>
        <p class="text-muted">Build ships at your planets to create fleets!</p>
      </div>

      <div class="fleets-grid">
        <div *ngFor="let fleet of fleets()" class="fleet-card">
          <div class="fleet-header">
            <div class="fleet-title">
              <h3>Fleet {{ fleet.id.slice(-4) }}</h3>
              <span class="fleet-status" [class]="'status-' + fleetStatus(fleet).type">
                {{ fleetStatus(fleet).label }}
              </span>
            </div>
            <button (click)="jumpToFleet(fleet)" class="btn-small">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 8 12 12 16"/>
                <line x1="16" y1="12" x2="8" y2="12"/>
              </svg>
              View on Map
            </button>
          </div>

          <div class="fleet-composition">
            <div class="composition-header">Ships:</div>
            <div class="ships-list">
              <div *ngFor="let ship of fleet.ships" class="ship-row">
                <span class="ship-icon tech-icon" [ngClass]="getHullImageClass(ship.designId)"></span>
                <span class="ship-count">{{ ship.count }}x</span>
                <span class="ship-name">{{ getDesignName(ship.designId) }}</span>
                <span *ngIf="ship.damage > 0" class="ship-damage">{{ ship.damage }}% dmg</span>
              </div>
            </div>
          </div>

          <div class="fleet-stats">
            <div class="stat-row">
              <span class="stat-label">Location:</span>
              <span class="stat-value">{{ fleetLocation(fleet) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Fuel:</span>
              <span class="stat-value" [style.color]="fuelColor(fleet)">
                {{ fleet.fuel | number:'1.0-0' }} / {{ fleetMaxFuel(fleet) | number:'1.0-0' }}
              </span>
            </div>
            <div *ngIf="fleetCargo(fleet) > 0" class="stat-row">
              <span class="stat-label">Cargo:</span>
              <span class="stat-value">{{ fleetCargo(fleet) }} / {{ fleetCargoCapacity(fleet) }} kT</span>
            </div>
          </div>

          <div *ngIf="fleetOrders(fleet).length > 0" class="fleet-orders">
            <div class="orders-header">Orders:</div>
            <div *ngFor="let order of fleetOrders(fleet); let i = index" class="order-item">
              <span class="order-index">{{ i + 1 }}.</span>
              <span class="order-text">{{ formatOrder(order) }}</span>
            </div>
          </div>

          <div *ngIf="fleetOrders(fleet).length === 0" class="text-small text-muted" style="padding:var(--space-md)">
            No orders - fleet is idle
          </div>

          <div class="future-features">
            <div class="text-xs text-muted">
              Advanced Orders: <span class="coming-soon">Coming Soon</span>
            </div>
            <div class="text-xs text-muted" style="margin-top:4px">
              (Patrol, Auto Cargo, Refuel Missions)
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: var(--space-xl);
      color: var(--color-text-muted);
    }

    .fleets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-lg);
    }

    .fleet-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .fleet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: var(--space-sm);
      border-bottom: 1px solid var(--color-border);
    }

    .fleet-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .fleet-title h3 {
      margin: 0;
      font-size: var(--font-size-lg);
    }

    .fleet-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-idle {
      background: #95a5a6;
      color: white;
    }

    .status-moving {
      background: #3498db;
      color: white;
    }

    .status-colonizing {
      background: #2ecc71;
      color: white;
    }

    .btn-small {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      font-size: var(--font-size-sm);
      white-space: nowrap;
    }

    .fleet-composition {
      background: var(--color-bg-tertiary);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
    }

    .composition-header {
      font-weight: 600;
      margin-bottom: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    .ships-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .ship-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    .ship-icon {
      flex-shrink: 0;
    }

    .ship-count {
      color: var(--color-text-muted);
      min-width: 30px;
    }

    .ship-name {
      flex: 1;
    }

    .ship-damage {
      color: var(--color-danger);
      font-size: var(--font-size-xs);
    }

    .fleet-stats {
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

    .fleet-orders {
      background: var(--color-bg-tertiary);
      padding: var(--space-md);
      border-radius: var(--radius-sm);
    }

    .orders-header {
      font-weight: 600;
      margin-bottom: var(--space-sm);
      font-size: var(--font-size-sm);
    }

    .order-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-sm);
      padding: var(--space-xs) 0;
      font-size: var(--font-size-sm);
    }

    .order-index {
      color: var(--color-text-muted);
      min-width: 20px;
    }

    .order-text {
      flex: 1;
    }

    .future-features {
      padding-top: var(--space-sm);
      border-top: 1px solid var(--color-border);
    }

    .coming-soon {
      color: var(--color-warning);
      font-weight: 600;
    }
  `]
})
export class FleetsOverviewComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);
  private techService = inject(TechService);

  fleets = computed(() => {
    const allFleets = this.gs.game()?.fleets || [];
    const playerId = this.gs.player()?.id;
    return allFleets.filter(f => f.ownerId === playerId);
  });

  getDesignName(designId: string): string {
    const design = getDesign(designId);
    return design.name || designId;
  }

  /**
   * Map design name to hull name from tech-atlas.data
   */
  getHullNameFromDesign(designId: string): string {
    const design = getDesign(designId);
    const name = design.name;

    // Map compiled design names to hull names
    const nameMap: Record<string, string> = {
      'Scout': 'Scout',
      'Frigate': 'Frigate',
      'Destroyer': 'Destroyer',
      'Small Freighter': 'Small Freighter',
      'Super Freighter': 'Super Freighter',
      'Fuel Transport': 'Fuel Transport',
      'Colony Ship': 'Colony Ship',
      'Starbase': 'Orbital Fort'
    };

    return nameMap[name] || 'Scout'; // Default to Scout if not found
  }

  /**
   * Get CSS class for hull image
   */
  getHullImageClass(designId: string): string {
    const hullName = this.getHullNameFromDesign(designId);
    return this.techService.getHullImageClass(hullName);
  }

  fleetStatus(fleet: Fleet): { type: string; label: string } {
    if (fleet.orders.length === 0) {
      return { type: 'idle', label: 'Idle' };
    }
    const firstOrder = fleet.orders[0];
    if (firstOrder.type === 'colonize') {
      return { type: 'colonizing', label: 'Colonizing' };
    }
    if (firstOrder.type === 'move') {
      return { type: 'moving', label: 'Moving' };
    }
    return { type: 'idle', label: 'Idle' };
  }

  fleetLocation(fleet: Fleet): string {
    if (fleet.location.type === 'orbit') {
      const location = fleet.location as { type: 'orbit'; planetId: string };
      const planet = this.gs.stars()
        .flatMap(s => s.planets)
        .find(p => p.id === location.planetId);
      return planet ? `Orbiting ${planet.name}` : 'In orbit';
    }
    const location = fleet.location as { type: 'space'; x: number; y: number };
    return `Space (${location.x.toFixed(0)}, ${location.y.toFixed(0)})`;
  }

  fleetMaxFuel(fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const design = getDesign(s.designId);
      return sum + design.fuelCapacity * s.count;
    }, 0);
  }

  fuelColor(fleet: Fleet): string {
    const maxFuel = this.fleetMaxFuel(fleet);
    const percent = maxFuel > 0 ? (fleet.fuel / maxFuel) * 100 : 100;
    if (percent < 20) return '#c0392b';
    if (percent < 50) return '#f39c12';
    return '#27ae60';
  }

  fleetCargo(fleet: Fleet): number {
    const r = fleet.cargo.resources;
    const m = fleet.cargo.minerals;
    const minerals = m.iron + m.boranium + m.germanium;
    const colonists = Math.floor(fleet.cargo.colonists / 1000);
    return r + minerals + colonists;
  }

  fleetCargoCapacity(fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const design = getDesign(s.designId);
      return sum + design.cargoCapacity * s.count;
    }, 0);
  }

  fleetOrders(fleet: Fleet) {
    return fleet.orders || [];
  }

  formatOrder(order: any): string {
    if (order.type === 'move') {
      return `Move to (${order.destination.x.toFixed(0)}, ${order.destination.y.toFixed(0)})`;
    }
    if (order.type === 'colonize') {
      const planet = this.gs.stars()
        .flatMap(s => s.planets)
        .find(p => p.id === order.planetId);
      return `Colonize ${planet?.name || 'planet'}`;
    }
    return order.type;
  }

  jumpToFleet(fleet: Fleet) {
    this.router.navigate(['/fleet', fleet.id]);
  }
}
