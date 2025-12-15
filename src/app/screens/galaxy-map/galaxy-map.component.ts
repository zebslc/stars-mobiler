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
        <header
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem"
        >
          <div style="display:flex;gap:1rem;align-items:center">
            <strong>Turn {{ turn() }}</strong>
            <span *ngIf="gs.playerEconomy() as econ"
              >Resources: {{ econ.resources }} • Fe {{ econ.minerals.iron }} • Bo
              {{ econ.minerals.boranium }} • Ge {{ econ.minerals.germanium }}</span
            >
          </div>
          <div style="display:flex;gap:0.5rem">
            <label style="display:flex;gap:0.25rem;align-items:center">
              <input type="checkbox" [checked]="showTransfer" (change)="toggleTransfer($event)" />
              Show transfer range
            </label>
            <button (click)="endTurn()">End Turn ▶</button>
            <button (click)="newGame()">New Game</button>
          </div>
        </header>
        <section style="border:1px solid #ccc">
          <svg
            [attr.viewBox]="'0 0 1000 1000'"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;height:70vh"
          >
            <ng-container *ngIf="showTransfer && centerOwnedStar() as center; else starsOnly">
              <circle
                [attr.cx]="center.position.x"
                [attr.cy]="center.position.y"
                [attr.r]="gs.playerEconomy()?.transferRange ?? 0"
                fill="rgba(46,134,222,0.08)"
                stroke="#2e86de"
                stroke-dasharray="4,3"
              />
            </ng-container>
            <ng-template #starsOnly></ng-template>
            <ng-container *ngFor="let star of stars()">
              <circle
                [attr.cx]="star.position.x"
                [attr.cy]="star.position.y"
                r="6"
                [attr.fill]="colorForStar(star)"
                [attr.stroke]="isIsolated(star) ? '#e67e22' : '#000'"
                [attr.stroke-width]="isIsolated(star) ? 1.2 : 0.5"
                (click)="openFirstPlanet(star)"
              />
            </ng-container>
            <ng-container *ngFor="let fleet of gs.game()?.fleets ?? []">
              <rect
                [attr.x]="
                  fleet.location.type === 'space'
                    ? fleet.location.x - 4
                    : planetPos(fleet.location.planetId).x - 4
                "
                [attr.y]="
                  fleet.location.type === 'space'
                    ? fleet.location.y - 4
                    : planetPos(fleet.location.planetId).y - 4
                "
                width="8"
                height="8"
                [attr.fill]="fleet.ownerId === gs.player()?.id ? '#2e86de' : '#d63031'"
                (click)="openFleet(fleet.id)"
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyMapComponent {
  private gs = inject(GameStateService);
  private router = inject(Router);
  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;
  showTransfer = true;

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

  openFirstPlanet(star: Star) {
    const p = star.planets.find((pl) => pl.ownerId === this.gs.player()?.id) ?? star.planets[0];
    if (p) {
      this.router.navigateByUrl(`/planet/${p.id}`);
    }
  }

  endTurn() {
    this.gs.endTurn();
  }

  toggleTransfer(event: Event) {
    this.showTransfer = (event.target as HTMLInputElement).checked;
  }

  centerOwnedStar(): Star | null {
    const ownedStars = this.stars().filter((s) =>
      s.planets.some((p) => p.ownerId === this.gs.player()?.id),
    );
    return ownedStars.length ? ownedStars[0] : null;
  }

  isIsolated(star: Star): boolean {
    const econ = this.gs.playerEconomy();
    if (!econ) return false;
    const ownedStars = this.stars().filter((s) =>
      s.planets.some((p) => p.ownerId === this.gs.player()?.id),
    );
    if (ownedStars.length === 0) return false;
    const withinRange = ownedStars.some((os) => {
      const dx = os.position.x - star.position.x;
      const dy = os.position.y - star.position.y;
      const dist = Math.hypot(dx, dy);
      return dist <= econ.transferRange;
    });
    return !withinRange;
  }

  openFleet(id: string) {
    this.router.navigateByUrl(`/fleet/${id}`);
  }

  planetPos(planetId: string): { x: number; y: number } {
    const star = this.stars().find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }
}
