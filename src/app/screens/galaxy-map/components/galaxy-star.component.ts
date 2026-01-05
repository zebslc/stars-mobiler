import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Star } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';

@Component({
  selector: 'g[app-galaxy-star]',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <svg:circle
      [attr.cx]="star.position.x"
      [attr.cy]="star.position.y"
      [attr.r]="7"
      [attr.fill]="colorForStar()"
      [attr.stroke]="isIsolated() ? '#e67e22' : '#000'"
      [attr.stroke-width]="isIsolated() ? 1.2 : 0.7"
      (click)="starClick.emit($event)"
      (dblclick)="starDoubleClick.emit($event)"
      (contextmenu)="starContext.emit($event)"
      style="cursor: pointer"
    >
      <svg:title>{{ star.name }}</svg:title>
    </svg:circle>

    @if (planetDetails(); as d) {
      @if (scale > 1.5) {
        <svg:g [attr.transform]="'translate(' + star.position.x + ' ' + star.position.y + ')'">
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
          <svg:text
            x="15"
            y="5"
            fill="#2c3e50"
            style="pointer-events: none; font-family: sans-serif"
            font-size="10"
          >
            <tspan font-weight="bold" x="15" dy="0">{{ star.name }}</tspan>
            <tspan x="15" dy="12" font-size="9" fill="#2e86de">
              Resources: {{ d.resources }}R
            </tspan>
            <tspan x="15" dy="11" font-size="9">
              Conc: Fe{{ d.fe }}% Bo{{ d.bo }}% Ge{{ d.ge }}%
            </tspan>
            <tspan x="15" dy="11" font-size="9">
              Surface: {{ d.surfaceFe }}Fe {{ d.surfaceBo }}Bo {{ d.surfaceGe }}Ge
            </tspan>
            <tspan x="15" dy="11" font-size="9">
              Pop: {{ d.pop | number }} / {{ d.maxPop }}M
            </tspan>
            <tspan x="15" dy="11" font-size="9">Owner: {{ d.owner }}</tspan>
            <tspan
              x="15"
              dy="11"
              font-size="9"
              [attr.fill]="d.hab > 0 ? '#27ae60' : '#c0392b'"
            >
              Hab: {{ d.hab }}%
            </tspan>
          </svg:text>
        </svg:g>
      } @else {
        <svg:text
          [attr.x]="star.position.x + 9"
          [attr.y]="star.position.y - 9"
          [attr.font-size]="10"
          fill="#2c3e50"
          style="pointer-events: none; text-shadow: 0px 0px 2px white;"
        >
          {{ star.name }}
        </svg:text>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyStarComponent {
  @Input({ required: true }) star!: Star;
  @Input({ required: true }) scale!: number;

  @Output() starClick = new EventEmitter<MouseEvent>();
  @Output() starDoubleClick = new EventEmitter<MouseEvent>();
  @Output() starContext = new EventEmitter<MouseEvent>();

  private gs = inject(GameStateService);

  planetDetails = computed(() => {
    const p = this.star.planets[0];
    if (!p) return null;
    return {
      resources: p.resources,
      fe: p.mineralConcentrations.iron,
      bo: p.mineralConcentrations.boranium,
      ge: p.mineralConcentrations.germanium,
      surfaceFe: p.surfaceMinerals.iron,
      surfaceBo: p.surfaceMinerals.boranium,
      surfaceGe: p.surfaceMinerals.germanium,
      maxPop: (p.maxPopulation / 1_000_000).toFixed(1),
      pop: p.population,
      owner: p.ownerId === this.gs.player()?.id ? 'You' : p.ownerId ? 'Enemy' : 'Unowned',
      hab: this.gs.habitabilityFor(p.id),
    };
  });

  colorForStar = computed(() => {
    const owned = this.star.planets.some((p) => p.ownerId === this.gs.player()?.id);
    const enemy = this.star.planets.some((p) => p.ownerId && p.ownerId !== this.gs.player()?.id);
    if (owned) return '#2e86de';
    if (enemy) return '#d63031';
    const colonizable = this.star.planets.some((p) => this.gs.habitabilityFor(p.id) > 0);
    return colonizable ? '#2ecc71' : '#bdc3c7';
  });

  isIsolated = computed(() => {
    const econ = this.gs.playerEconomy();
    if (!econ) return false;
    
    // Check if player owns any planets on this star
    if (this.star.planets.some(p => p.ownerId === this.gs.player()?.id)) return false;

    const stars = this.gs.stars();
    const ownedStars = stars.filter((s) =>
      s.planets.some((p) => p.ownerId === this.gs.player()?.id),
    );
    if (ownedStars.length === 0) return false;
    const withinRange = ownedStars.some((os) => {
      const dx = os.position.x - this.star.position.x;
      const dy = os.position.y - this.star.position.y;
      const dist = Math.hypot(dx, dy);
      return dist <= econ.transferRange;
    });
    return !withinRange;
  });
}
