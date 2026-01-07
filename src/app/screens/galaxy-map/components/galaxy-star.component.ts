import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Star } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';

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
        [attr.r]="10"
        fill="none"
        [attr.stroke]="getHabColor(d.hab)"
        stroke-width="3"
        opacity="0.6"
        style="pointer-events: none"
      />
    }

    <!-- Info Labels & Details -->
    @if (showLabels || scale > 1.5) {
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
              [attr.font-size]="10"
              fill="#2c3e50"
              style="pointer-events: none; text-shadow: 0px 0px 2px white;"
            >
              {{ star.name }}
            </svg:text>
          }
        } @else {
          <!-- Not Visible (Unexplored) - Just Name -->
          <svg:text
            [attr.x]="9"
            [attr.y]="-9"
            [attr.font-size]="10"
            fill="#7f8c8d"
            style="pointer-events: none; text-shadow: 0px 0px 2px white;"
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

  private _isVisible = signal(true);
  @Input() set isVisible(val: boolean) {
    this._isVisible.set(val);
  }
  get isVisible() {
    return this._isVisible();
  }

  @Output() starClick = new EventEmitter<MouseEvent>();
  @Output() starDoubleClick = new EventEmitter<MouseEvent>();
  @Output() starContext = new EventEmitter<MouseEvent>();

  private gs = inject(GameStateService);

  getHabColor(hab: number): string {
    if (hab >= 80) return '#2ecc71';
    if (hab >= 50) return '#f1c40f';
    if (hab > 0) return '#e67e22';
    return '#c0392b';
  }

  planetDetails = computed(() => {
    if (!this._isVisible()) return null;
    const p = this.star.planets[0];
    if (!p) return null;
    return {
      resources: p.resources,
      ironium: p.mineralConcentrations.ironium,
      boranium: p.mineralConcentrations.boranium,
      germanium: p.mineralConcentrations.germanium,
      surfaceIronium: p.surfaceMinerals.ironium,
      surfaceBoranium: p.surfaceMinerals.boranium,
      surfaceGermanium: p.surfaceMinerals.germanium,
      maxPop: (p.maxPopulation / 1_000_000).toFixed(1),
      pop: p.population,
      owner: p.ownerId === this.gs.player()?.id ? 'You' : p.ownerId ? 'Enemy' : 'Unowned',
      hab: this.gs.habitabilityFor(p.id),
    };
  });

  colorForStar = computed(() => {
    if (!this._isVisible()) return '#bdc3c7';
    const owned = this.star.planets.some((p) => p.ownerId === this.gs.player()?.id);
    const enemy = this.star.planets.some((p) => p.ownerId && p.ownerId !== this.gs.player()?.id);
    if (owned) return '#2e86de';
    if (enemy) return '#d63031';
    const colonizable = this.star.planets.some((p) => this.gs.habitabilityFor(p.id) > 0);
    return colonizable ? '#2ecc71' : '#bdc3c7';
  });

  isIsolated = computed(() => {
    return false;
  });
}
