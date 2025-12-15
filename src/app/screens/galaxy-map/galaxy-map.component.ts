import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Star } from '../../models/game.model';

@Component({
  standalone: true,
  selector: 'app-galaxy-map',
  template: `
    <main style="padding:0.5rem">
      <ng-container *ngIf="stars().length > 0; else empty">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <div>Turn {{ turn() }}</div>
          <div style="display:flex;gap:0.5rem">
            <button disabled>End Turn ▶</button>
            <button (click)="newGame()">New Game</button>
          </div>
        </header>
        <section style="border:1px solid #ccc">
          <svg [attr.viewBox]="'0 0 1000 1000'" preserveAspectRatio="xMidYMid meet" style="width:100%;height:70vh">
            <ng-container *ngFor="let star of stars()">
              <circle 
                [attr.cx]="star.position.x" 
                [attr.cy]="star.position.y" 
                r="6" 
                [attr.fill]="colorForStar(star)" 
                stroke="#000" 
                stroke-width="0.5"
              />
            </ng-container>
          </svg>
        </section>
      </ng-container>
      <ng-template #empty>
        <section style="padding:1rem;display:grid;place-items:center;height:70vh">
          <div style="display:grid;gap:0.75rem;justify-items:center">
            <h2>No game loaded</h2>
            <p>Start a new game to generate a galaxy.</p>
            <button (click)="newGame()">Start New Game</button>
          </div>
        </section>
      </ng-template>
    </main>
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GalaxyMapComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);
  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;

  colorForStar(star: Star): string {
    const owned = star.planets.some((p) => p.ownerId === this.gs.player()?.id);
    const enemy = star.planets.some((p) => p.ownerId && p.ownerId !== this.gs.player()?.id);
    if (owned) return '#2e86de';
    if (enemy) return '#d63031';
    const colonizable = star.planets.some((p) => this.gs.habitabilityFor(p.id) > 0);
    return colonizable ? '#2ecc71' : '#bdc3c7';
  }

  newGame() {
    this.router.navigateByUrl('/');
  }
}
