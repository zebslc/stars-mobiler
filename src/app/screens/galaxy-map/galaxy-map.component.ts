import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';

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
            <!-- Draw fleets first so stars remain clickable on top -->
            <ng-container *ngFor="let fleet of gs.game()?.fleets ?? []">
              <ng-container [ngSwitch]="fleet.location.type">
                <ng-container *ngSwitchCase="'orbit'">
                  <ng-container *ngIf="fleetOrbitPosition(fleet) as pos">
                    <rect
                      [attr.x]="pos.x - 5"
                      [attr.y]="pos.y - 5"
                      width="10"
                      height="10"
                      [attr.fill]="fleet.ownerId === gs.player()?.id ? '#2e86de' : '#d63031'"
                      [attr.stroke]="'#000'"
                      [attr.stroke-width]="0.5"
                      [attr.transform]="'rotate(45 ' + pos.x + ' ' + pos.y + ')'"
                      (click)="selectFleet(fleet.id)"
                    />
                  </ng-container>
                </ng-container>
                <ng-container *ngSwitchCase="'space'">
                  <rect
                    [attr.x]="fleet.location.x - 5"
                    [attr.y]="fleet.location.y - 5"
                    width="10"
                    height="10"
                    [attr.fill]="fleet.ownerId === gs.player()?.id ? '#2e86de' : '#d63031'"
                    [attr.stroke]="'#000'"
                    [attr.stroke-width]="0.5"
                    (click)="selectFleet(fleet.id)"
                  />
                </ng-container>
              </ng-container>
            </ng-container>
            <ng-container *ngIf="selectedFleetId as fid">
              <ng-container *ngIf="fleetRange(fid) as fr">
                <circle
                  [attr.cx]="fr.x"
                  [attr.cy]="fr.y"
                  [attr.r]="fr.roundTrip"
                  fill="rgba(46,204,113,0.08)"
                  stroke="#2ecc71"
                  stroke-dasharray="4,3"
                />
                <circle
                  [attr.cx]="fr.x"
                  [attr.cy]="fr.y"
                  [attr.r]="fr.oneWay"
                  fill="rgba(241,196,15,0.06)"
                  stroke="#f1c40f"
                  stroke-dasharray="4,3"
                />
              </ng-container>
            </ng-container>
            <!-- Draw stars on top for clear selection -->
            <ng-container *ngFor="let star of stars()">
              <circle
                [attr.cx]="star.position.x"
                [attr.cy]="star.position.y"
                r="7"
                [attr.fill]="colorForStar(star)"
                [attr.stroke]="isIsolated(star) ? '#e67e22' : '#000'"
                [attr.stroke-width]="isIsolated(star) ? 1.2 : 0.7"
                (click)="selectStar(star)"
              >
                <title>{{ star.name }}</title>
              </circle>
              <text
                [attr.x]="star.position.x + 9"
                [attr.y]="star.position.y - 9"
                font-size="10"
                fill="#2c3e50"
              >
                {{ star.name }}
              </text>
            </ng-container>
          </svg>
        </section>
        <section
          *ngIf="selectedStar"
          style="margin-top:0.5rem;border-top:1px solid #ddd;padding-top:0.5rem"
        >
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>{{ selectedStar.name }}</strong>
            <button (click)="openFirstPlanet(selectedStar!)">Open Planet</button>
          </div>
          <div>
            <ul>
              <li *ngFor="let p of selectedStar.planets">
                {{ p.name }} — {{ planetOwner(p.ownerId) }} — Habitability
                {{ gs.habitabilityFor(p.id) }}%
                <button (click)="openPlanet(p.id)">View</button>
              </li>
            </ul>
          </div>
          <div>
            Fleets:
            <ul>
              <li *ngFor="let f of fleetsAtStar(selectedStar)">
                Fleet {{ f.id }} — Ships {{ totalShips(f) }} — Fuel {{ f.fuel | number: '1.0-0' }}
                <button (click)="openFleet(f.id)">View</button>
                <button (click)="selectFleet(f.id)">Show Range</button>
              </li>
            </ul>
          </div>
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
  selectedStar: Star | null = null;
  selectedFleetId: string | null = null;

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
  openPlanet(id: string) {
    this.router.navigateByUrl(`/planet/${id}`);
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
  selectFleet(id: string) {
    this.selectedFleetId = id;
  }

  planetPos(planetId: string): { x: number; y: number } {
    const star = this.stars().find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  selectStar(star: Star) {
    this.selectedStar = star;
  }
  planetOwner(ownerId: string | null): string {
    if (!ownerId) return 'Unowned';
    return ownerId === this.gs.player()?.id ? 'You' : 'Enemy';
  }
  fleetsAtStar(star: Star) {
    const ids = star.planets.map((p) => p.id);
    const fleets = this.gs.game()?.fleets ?? [];
    return fleets.filter((f) => f.location.type === 'orbit' && ids.includes(f.location.planetId));
  }
  totalShips(fleet: any): number {
    return fleet.ships.reduce((sum: number, s: any) => sum + s.count, 0);
  }
  fleetOrbitPosition(fleet: any): { x: number; y: number } | null {
    if (fleet.location.type !== 'orbit') return null;
    const star = this.stars().find((s) => s.planets.some((p) => p.id === fleet.location.planetId));
    if (!star) return null;
    const fleets = this.fleetsAtStar(star);
    const idx = fleets.findIndex((f) => f.id === fleet.id);
    const total = fleets.length || 1;
    const angle = (Math.PI * 2 * idx) / total;
    const radius = 14;
    return {
      x: star.position.x + Math.cos(angle) * radius,
      y: star.position.y + Math.sin(angle) * radius,
    };
  }
  fleetRange(id: string): { x: number; y: number; oneWay: number; roundTrip: number } | null {
    const game = this.gs.game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return null;
    let maxWarp = Infinity;
    let totalMass = 0;
    let bestEfficiency = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      totalMass += (d.armor + d.shields + d.firepower) * s.count;
      if (d.fuelEfficiency < bestEfficiency && d.fuelEfficiency >= 0)
        bestEfficiency = d.fuelEfficiency;
    }
    totalMass = Math.max(1, totalMass);
    const perLy =
      bestEfficiency === 0
        ? 0
        : ((totalMass * bestEfficiency) / 1000) * Math.pow(Math.max(1, maxWarp) / 5, 2);
    const oneWay = perLy === 0 ? 1000 : fleet.fuel / perLy;
    const roundTrip = perLy === 0 ? 500 : fleet.fuel / perLy / 2;
    if (fleet.location.type === 'orbit') {
      const pos = this.planetPos(fleet.location.planetId);
      return { x: pos.x, y: pos.y, oneWay, roundTrip };
    } else {
      return { x: fleet.location.x, y: fleet.location.y, oneWay, roundTrip };
    }
  }
}
