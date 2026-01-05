import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Planet } from '../../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-planet-resources',
  imports: [CommonModule],
  template: `
    <div class="card resources-card">
      <h3 class="card-header">
        Resources
      </h3>
      <div class="available-resources">
        <div class="text-small text-muted">Available Resources</div>
        <div class="value">
          {{ planet().resources }}
        </div>
        <div class="text-xs text-muted">+{{ resourcesPerTurn() }}/turn</div>
      </div>
      <div class="minerals-grid">
        <div class="mineral-item">
          <div class="label iron">Iron</div>
          <div class="value">
            {{ planet().surfaceMinerals.iron }}
          </div>
          <div class="text-xs text-muted">{{ planet().mineralConcentrations.iron }}%</div>
        </div>
        <div class="mineral-item">
          <div class="label boranium">Boranium</div>
          <div class="value">
            {{ planet().surfaceMinerals.boranium }}
          </div>
          <div class="text-xs text-muted">{{ planet().mineralConcentrations.boranium }}%</div>
        </div>
        <div class="mineral-item">
          <div class="label germanium">Germanium</div>
          <div class="value">
            {{ planet().surfaceMinerals.germanium }}
          </div>
          <div class="text-xs text-muted">{{ planet().mineralConcentrations.germanium }}%</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './planet-resources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetResourcesComponent {
  planet = input.required<Planet>();
  resourcesPerTurn = input.required<number>();
}
