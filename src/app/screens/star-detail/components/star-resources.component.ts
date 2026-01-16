import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Star } from '../../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-star-resources',
  imports: [CommonModule],
  template: `
    <div class="card resources-card">
      <h3 class="card-header">Minerals On Hand</h3>

      <div class="minerals-grid">
        <div class="mineral-item">
          <div class="label ironium">Ironium</div>
          <div class="value">{{ star().surfaceMinerals.ironium }} kT</div>
        </div>
        <div class="mineral-item">
          <div class="label boranium">Boranium</div>
          <div class="value">{{ star().surfaceMinerals.boranium }} kT</div>
        </div>
        <div class="mineral-item">
          <div class="label germanium">Germanium</div>
          <div class="value">{{ star().surfaceMinerals.germanium }} kT</div>
        </div>
      </div>

      <div class="facilities-grid">
        <div class="facility-item">
          <div class="label">Mines</div>
          <div class="value">{{ star().mines }} of {{ maxFacilities() }}</div>
        </div>
        <div class="facility-item">
          <div class="label">Factories</div>
          <div class="value">{{ star().factories }} of {{ maxFacilities() }}</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './star-resources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarResourcesComponent {
  readonly star = input.required<Star>();

  maxFacilities() {
    return Math.floor(this.star().population / 10);
  }
}
