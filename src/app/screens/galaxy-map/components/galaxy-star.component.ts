import {
  Component,
  ChangeDetectionStrategy,
  Input,
  output,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import type { Star } from '../../../models/game.model';
import { GameStateService } from '../../../services/game/game-state.service';

@Component({
  selector: 'g[app-galaxy-star]',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <!-- Star Circle -->
    <svg:circle
      [attr.cx]="star.position.x"
      [attr.cy]="star.position.y"
      [attr.r]="7"
      [attr.fill]="colorForStar()"
      [attr.stroke]="isVisible && isIsolated() ? '#e67e22' : '#000'"
      [attr.stroke-width]="isVisible && isIsolated() ? 1.2 : 0.7"
      (click)="starClick.emit($event)"
      (dblclick)="starDoubleClick.emit($event)"
      (contextmenu)="starContext.emit($event)"
      style="cursor: pointer"
    >
      <svg:title>{{ star.name }}</svg:title>
    </svg:circle>

    <!-- Habitability Heatmap Overlay -->
    @if (isVisible && viewMode === 'habitability' && planetDetails(); as d) {
      <svg:circle
        [attr.cx]="star.position.x"
        [attr.cy]="star.position.y"
        [attr.r]="habRadius(d.hab)"
        fill="none"
        [attr.stroke]="habColor(d.hab)"
        stroke-width="2"
        opacity="0.8"
        style="pointer-events: none"
      />
    }

    <!-- Minerals Bar Chart Overlay -->
    @if (isVisible && viewMode === 'minerals' && planetDetails(); as d) {
      <svg:g
        [attr.transform]="'translate(' + (star.position.x - 7) + ' ' + (star.position.y - 30) + ')'"
        style="pointer-events: none"
      >
        <!-- Background -->
        <svg:rect x="-1" y="-1" width="17" height="22" fill="rgba(0, 0, 0, 0.6)" rx="2" />

        <!-- Ironium (Red) -->
        <svg:rect
          x="1"
          [attr.y]="20 - d.ironium * 0.2"
          width="4"
          [attr.height]="d.ironium * 0.2"
          fill="#e74c3c"
        />

        <!-- Boranium (Yellow) -->
        <svg:rect
          x="6"
          [attr.y]="20 - d.boranium * 0.2"
          width="4"
          [attr.height]="d.boranium * 0.2"
          fill="#f1c40f"
        />

        <!-- Germanium (Green) -->
        <svg:rect
          x="11"
          [attr.y]="20 - d.germanium * 0.2"
          width="4"
          [attr.height]="d.germanium * 0.2"
          fill="#2ecc71"
        />
      </svg:g>
    }

    <!-- Value Overlay -->
    @if (isVisible && viewMode === 'value' && planetDetails(); as d) {
      <svg:text
        [attr.x]="star.position.x"
        [attr.y]="star.position.y - 12"
        text-anchor="middle"
        font-size="10"
        fill="#f1c40f"
        stroke="#000"
        stroke-width="0.5"
        style="pointer-events: none; font-weight: bold;"
      >
        {{ d.resources }}R
      </svg:text>
    }

    <!-- Info Labels & Details -->
    @if (showLabels) {
      <svg:g [attr.transform]="'translate(' + star.position.x + ' ' + star.position.y + ')'">
        @if (planetDetails(); as d) {
          <!-- Detailed View Box -->
          @if (scale > 1.5) {
            <svg:rect
              x="10"
              y="-10"
              width="150"
              height="105"
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#ccc"
              stroke-width="0.5"
              rx="4"
              style="pointer-events: none"
            />

            <svg:g style="pointer-events: none; font-family: sans-serif" font-size="10">
              <!-- Header -->
              <svg:text x="15" y="5" fill="#2c3e50" font-weight="bold">{{ star.name }}</svg:text>

              <!-- Content based on View Mode -->
              @switch (viewMode) {
                @case ('minerals') {
                  <svg:g transform="translate(15, 20)">
                    <svg:text y="0" font-size="9">Mineral Concentration:</svg:text>

                    <!-- Ironium -->
                    <svg:text y="15" x="0" font-size="9" fill="#e74c3c">
                      Fe: {{ d.ironium }}%
                    </svg:text>
                    <svg:rect
                      x="40"
                      y="8"
                      [attr.width]="d.ironium"
                      height="8"
                      fill="#e74c3c"
                      opacity="0.6"
                    />

                    <!-- Boranium -->
                    <svg:text y="30" x="0" font-size="9" fill="#f1c40f">
                      Bo: {{ d.boranium }}%
                    </svg:text>
                    <svg:rect
                      x="40"
                      y="23"
                      [attr.width]="d.boranium"
                      height="8"
                      fill="#f1c40f"
                      opacity="0.6"
                    />

                    <!-- Germanium -->
                    <svg:text y="45" x="0" font-size="9" fill="#2ecc71">
                      Ge: {{ d.germanium }}%
                    </svg:text>
                    <svg:rect
                      x="40"
                      y="38"
                      [attr.width]="d.germanium"
                      height="8"
                      fill="#2ecc71"
                      opacity="0.6"
                    />

                    <svg:text y="65" font-size="9">
                      Surface: {{ d.surfaceIronium }} / {{ d.surfaceBoranium }} /
                      {{ d.surfaceGermanium }}
                    </svg:text>
                  </svg:g>
                }
                @case ('value') {
                  <svg:g transform="translate(15, 20)">
                    <svg:text y="0" font-size="9">Value Analysis:</svg:text>
                    <svg:text y="15" font-size="9">Habitability: {{ d.hab }}%</svg:text>
                    <svg:text y="30" font-size="9">Max Pop: {{ d.maxPop }}M</svg:text>
                    <svg:text y="45" font-size="9">Current Pop: {{ d.pop | number }}</svg:text>
                    <svg:text y="60" font-size="9">Resources: {{ d.resources }}</svg:text>
                  </svg:g>
                }
                @case ('habitability') {
                  <svg:g transform="translate(15, 20)">
                    <svg:text y="0" font-size="9">Habitability Assessment:</svg:text>
                    <svg:text
                      y="20"
                      font-size="14"
                      [attr.fill]="getHabColor(d.hab)"
                      font-weight="bold"
                    >
                      {{ d.hab }}%
                    </svg:text>
                    <svg:text y="40" font-size="9">Terraforming needed for 100%</svg:text>
                  </svg:g>
                }
                @default {
                  <!-- Normal View -->
                  <svg:text x="15" y="20" font-size="9" fill="#2e86de">
                    Resources: {{ d.resources }}R
                  </svg:text>
                  <svg:text x="15" y="32" font-size="9">
                    Conc: Fe{{ d.ironium }}% Bo{{ d.boranium }}% Ge{{ d.germanium }}%
                  </svg:text>
                  <svg:text x="15" y="44" font-size="9">
                    Surface: {{ d.surfaceIronium }}Fe {{ d.surfaceBoranium }}Bo
                    {{ d.surfaceGermanium }}Ge
                  </svg:text>
                  <svg:text x="15" y="56" font-size="9">
                    Pop: {{ d.pop | number }} / {{ d.maxPop }}M
                  </svg:text>
                  <svg:text x="15" y="68" font-size="9">Owner: {{ d.owner }}</svg:text>
                  <svg:text x="15" y="80" font-size="9" [attr.fill]="getHabColor(d.hab)">
                    Hab: {{ d.hab }}%
                  </svg:text>
                }
              }
            </svg:g>
          } @else {
            <!-- Simple Label when zoomed out but labels enabled -->
            <svg:text
              [attr.x]="9"
              [attr.y]="-9"
              [attr.font-size]="11"
              fill="#ffffff"
              stroke="#000000"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="pointer-events: none; paint-order: stroke;"
            >
              {{ star.name }}
            </svg:text>
          }
        } @else {
          <!-- Not Visible (Unexplored) - Just Name -->
          <svg:text
            [attr.x]="9"
            [attr.y]="-9"
            [attr.font-size]="11"
            fill="#bdc3c7"
            stroke="#000000"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="pointer-events: none; paint-order: stroke;"
          >
            {{ star.name }}
          </svg:text>
        }
      </svg:g>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyStarComponent {
  @Input({ required: true }) star!: Star;
  @Input({ required: true }) scale!: number;
  @Input() viewMode: 'normal' | 'minerals' | 'value' | 'habitability' = 'normal';
  @Input() showLabels = false;
  @Input() stationName?: string;

  private readonly _isVisible = signal(true);
  @Input() set isVisible(val: boolean) {
    this._isVisible.set(val);
  }
  get isVisible() {
    return this._isVisible();
  }

  readonly starClick = output<MouseEvent>();
  readonly starDoubleClick = output<MouseEvent>();
  readonly starContext = output<MouseEvent>();

  private gs = inject(GameStateService);

  getHabColor(hab: number): string {
    if (hab >= 80) return '#2ecc71';
    if (hab >= 50) return '#f1c40f';
    if (hab > 0) return '#e67e22';
    return '#c0392b';
  }

  habColor(hab: number): string {
    if (hab > 0) return '#2ecc71'; // Green
    if (hab >= -50) return '#f1c40f'; // Yellow
    return '#e74c3c'; // Red
  }

  habRadius(hab: number): number {
    const minR = 8;
    const maxAdd = 8;

    if (hab > 0) {
      // 0 to 100 -> minR to minR + maxAdd
      return minR + (Math.min(hab, 100) / 100) * maxAdd;
    }

    if (hab >= -50) {
      // -50 to 0 -> minR to minR + maxAdd (closer to 0 is bigger)
      return minR + ((50 + hab) / 50) * maxAdd;
    }

    // < -50
    // -50 to -100 (or less) -> minR to minR + maxAdd (more negative is bigger)
    const harshness = Math.abs(hab) - 50;
    return minR + (Math.min(harshness, 50) / 50) * maxAdd;
  }

  readonly planetDetails = computed(() => {
    if (!this._isVisible()) return null;
    const s = this.star;
    return {
      resources: s.resources,
      ironium: s.mineralConcentrations.ironium,
      boranium: s.mineralConcentrations.boranium,
      germanium: s.mineralConcentrations.germanium,
      surfaceIronium: s.surfaceMinerals.ironium,
      surfaceBoranium: s.surfaceMinerals.boranium,
      surfaceGermanium: s.surfaceMinerals.germanium,
      maxPop: (s.maxPopulation / 1_000_000).toFixed(1),
      pop: s.population,
      owner: s.ownerId === this.gs.player()?.id ? 'You' : s.ownerId ? 'Enemy' : 'Unowned',
      hab: this.gs.habitabilityFor(s.id),
    };
  });

  readonly colorForStar = computed(() => {
    if (!this._isVisible()) return '#bdc3c7';
    const s = this.star;
    const owned = s.ownerId === this.gs.player()?.id;
    const enemy = s.ownerId && s.ownerId !== this.gs.player()?.id;
    if (owned) return '#2e86de';
    if (enemy) return '#d63031';
    const colonizable = this.gs.habitabilityFor(s.id) > 0;
    return colonizable ? '#2ecc71' : '#bdc3c7';
  });

  readonly isIsolated = computed(() => {
    return false;
  });
}
