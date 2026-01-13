import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Planet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game/game-state.service';
import { inject } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-planet-summary',
  imports: [CommonModule],
  template: `
    <div class="card planet-summary-card">
      <div class="status-section">
        <div class="governor-section">
          <div class="controls">
            <label>Governor:</label>
            <select
              [value]="planet().governor?.type ?? 'manual'"
              (change)="onGovernorTypeChange($event)"
              class="main-select"
            >
              <option value="manual">No governor</option>
              <option value="balanced">Balanced</option>
              <option value="mining">Mining</option>
              <option value="industrial">Industrial</option>
              <option value="military">Military</option>
              <option value="research">Labs / Research</option>
            </select>
          </div>
        </div>

        <div class="stats-list">
          <div class="stat-row">
            <div class="label">Population</div>
            <div class="value">{{ planet().population | number }}</div>
          </div>

          <div class="stat-row">
            <div class="label">Resources</div>
            <div class="value">
              {{ planet().resources | number }} ({{ resourcesPerTurn() }} / {{ maxResources() }})
            </div>
          </div>

          <!-- Minerals Section -->
          <div class="stat-row">
            <div class="label">Surface</div>
            <div class="value minerals-inline">
              <span class="min-val ironium">{{ planet().surfaceMinerals.ironium }}Fe</span>
              <span class="min-val boranium">{{ planet().surfaceMinerals.boranium }}Bo</span>
              <span class="min-val germanium">{{ planet().surfaceMinerals.germanium }}Ge</span>
            </div>
          </div>

          <div class="stat-row">
            <div class="label">Concentration</div>
            <div class="value minerals-inline">
              <span class="min-val ironium">{{ planet().mineralConcentrations.ironium }}Fe</span>
              <span class="min-val boranium">{{ planet().mineralConcentrations.boranium }}Bo</span>
              <span class="min-val germanium"
                >{{ planet().mineralConcentrations.germanium }}Ge</span
              >
            </div>
          </div>

          <div class="stat-row">
            <div class="label">Mines</div>
            <div class="value">{{ planet().mines }} / {{ maxFacilities() }}</div>
          </div>

          <div class="stat-row">
            <div class="label">Factories</div>
            <div class="value">{{ planet().factories }} / {{ maxFacilities() }}</div>
          </div>

          <div class="stat-row">
            <div class="label">Labs</div>
            <div class="value">{{ planet().research }} / {{ maxFacilities() }}</div>
          </div>

          <div class="stat-row">
            <div class="label">Defenses</div>
            <div class="value">{{ planet().defenses }} ({{ defenseCoverage() }}%)</div>
          </div>

          <div class="stat-row">
            <div class="label">Scanner</div>
            <div class="value">{{ scannerRange() > 0 ? 'Range ' + scannerRange() + ' ly' : 'None' }}</div>
          </div>
        </div>
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
  planetTexture = input.required<string>(); // Used by parent now, but maybe we don't need it here?
  // Actually, parent will use it for the header.
  // We can remove it from here if we don't use it.
  projectionDelta = input.required<number>();
  defenseCoverage = input.required<number>();
  scannerRange = input.required<number>();
  resourcesPerTurn = input.required<number>();
  starbase = input<{ name: string; fleetId: string; imageClass: string } | null>(null);

  onGovernorType = output<Event>();
  viewStarbase = output<string>();

  onGovernorTypeChange(event: Event) {
    this.onGovernorType.emit(event);
  }

  // Removed header outputs
  // prev = output<void>();
  // next = output<void>();

  maxResources() {
    return Math.floor(this.planet().population / 10);
  }

  maxDefenses() {
    return Math.floor(this.planet().population / 10);
  }

  maxFacilities() {
    return Math.floor(this.planet().population / 10);
  }
}
