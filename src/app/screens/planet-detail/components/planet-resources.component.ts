import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Planet } from '../../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-planet-resources',
  imports: [CommonModule],
  template: `
    <div class="card resources-card">
      <h3 class="card-header">Minerals On Hand</h3>

      <div class="minerals-grid">
        <div class="mineral-item">
          <div class="label iron">Ironium</div>
          <div class="value">{{ planet().surfaceMinerals.iron }} kT</div>
        </div>
        <div class="mineral-item">
          <div class="label boranium">Boranium</div>
          <div class="value">{{ planet().surfaceMinerals.boranium }} kT</div>
        </div>
        <div class="mineral-item">
          <div class="label germanium">Germanium</div>
          <div class="value">{{ planet().surfaceMinerals.germanium }} kT</div>
        </div>
      </div>

      <div class="facilities-grid">
        <div class="facility-item">
          <div class="label">Mines</div>
          <div class="value">{{ planet().mines }} of {{ maxFacilities() }}</div>
        </div>
        <div class="facility-item">
          <div class="label">Factories</div>
          <div class="value">{{ planet().factories }} of {{ maxFacilities() }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './planet-resources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetResourcesComponent {
  planet = input.required<Planet>();

  maxFacilities() {
    return Math.floor(this.planet().population / 10);
  }
}
