import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompiledShipStats } from '../../../models/game.model';

@Component({
  selector: 'app-ship-stats-row',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
            <div class="ship-stats">
              <span title="Attack">⚔️{{ stats.firepower || 0 }}</span>
              <span title="Defense">🛡️{{ stats.armor || 0 }}</span>
              <span title="Shields">🔵{{ stats.shields || 0 }}</span>
              <span title="Storage">📦{{ stats.cargoCapacity || 0 }}</span>
            </div>
          `,
  styles: [`
    .ship-stats {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2px 12px;
      font-size: 0.85em;
      opacity: 0.8;
      align-items: center;
      white-space: nowrap;
      text-align: left;
    }
  `]
})
export class ShipStatsRowComponent {
  @Input({ required: true }) stats!: Partial<CompiledShipStats>;
}
