import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Planet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';
import { inject } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-planet-summary',
  imports: [CommonModule],
  template: `
    <div class="card planet-summary-card">
      <h3 class="card-header">
        <div
          class="planet-visual"
          [style.background]="planetTexture()"
        ></div>
        {{ planet().name }}
      </h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="label">Habitability</div>
          <div class="value">{{ habitability() }}%</div>
        </div>
        <div class="stat-item">
          <div class="label">Population</div>
          <div>{{ planet().population | number }}</div>
          <div
            [class.positive]="projectionDelta() >= 0"
            [class.negative]="projectionDelta() < 0"
            class="delta"
          >
            {{ projectionDelta() >= 0 ? '+' : '' }}{{ projectionDelta() | number }}
          </div>
        </div>
        <div class="stat-item">
          <div class="label">Owner</div>
          <div class="value">
            @if (planet().ownerId === gs.player()?.id) {
              You
            } @else if (planet().ownerId) {
              Enemy
            } @else {
              Unowned
            }
          </div>
        </div>
        <div class="stat-item">
          <div class="label">Research Labs</div>
          <div class="value">{{ planet().research || 0 }}</div>
        </div>
        <div class="stat-item">
          <div class="label">Mines</div>
          <div class="value">{{ planet().mines }}</div>
        </div>
        <div class="stat-item">
          <div class="label">Factories</div>
          <div class="value">{{ planet().factories }}</div>
        </div>
        @if (planet().defenses > 0) {
          <div class="stat-item">
            <div class="label">Defense Coverage</div>
            <div class="value">{{ defenseCoverage() }}%</div>
          </div>
        }
        @if (planet().scanner > 0) {
          <div class="stat-item">
            <div class="label">Scanner Range</div>
            <div class="value">{{ scannerRange() }} LY</div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './planet-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetSummaryComponent {
  gs = inject(GameStateService);

  planet = input.required<Planet>();
  habitability = input.required<number>();
  planetTexture = input.required<string>();
  projectionDelta = input.required<number>();
  defenseCoverage = input.required<number>();
  scannerRange = input.required<number>();
}
