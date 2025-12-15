import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../services/game-state.service';
import { SettingsService } from '../../services/settings.service';
import { Star } from '../../models/game.model';
import { getDesign } from '../../data/ships.data';

@Component({
  standalone: true,
  selector: 'app-galaxy-map',
  template: `
    <main
      style="padding:0.5rem; height: 100vh; display: flex; flex-direction: column; overflow: hidden;"
    >
      <ng-container *ngIf="stars().length > 0; else empty">
        <header
          style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem; flex-shrink: 0;"
        >
          <div style="display:flex;gap:1rem;align-items:center">
            <strong>Turn {{ turn() }}</strong>
            <span *ngIf="gs.playerEconomy() as econ"
              >Res: {{ econ.resources | number: '1.0-0' }}</span
            >
          </div>
          <div style="display:flex;gap:0.5rem">
            <button (click)="openSettings()">Settings</button>
            <button (click)="endTurn()">End Turn ▶</button>
          </div>
        </header>

        <section
          style="border:1px solid #ccc; position: relative; flex-grow: 1; overflow: hidden;"
          (mousedown)="startPan($event)"
          (mousemove)="pan($event)"
          (mouseup)="endPan()"
          (mouseleave)="endPan()"
          (touchstart)="startTouch($event)"
          (touchmove)="moveTouch($event)"
          (touchend)="endTouch()"
          (wheel)="onWheel($event)"
        >
          <svg
            [attr.viewBox]="'0 0 1000 1000'"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;height:100%;touch-action:none"
          >
            <g [attr.transform]="transformString()">
              <ng-container *ngIf="showTransfer && centerOwnedStar() as center; else starsOnly">
                <circle
                  [attr.cx]="center.position.x"
                  [attr.cy]="center.position.y"
                  [attr.r]="gs.playerEconomy()?.transferRange ?? 0"
                  fill="rgba(46,134,222,0.08)"
                  stroke="#2e86de"
                  stroke-dasharray="4,3"
                  style="pointer-events: none"
                />
              </ng-container>
              <ng-template #starsOnly></ng-template>

              <!-- Draw fleets first so stars remain clickable on top -->
              <ng-container *ngFor="let fleet of filteredFleets()">
                <ng-container [ngSwitch]="fleet.location.type">
                  <ng-container *ngSwitchCase="'orbit'">
                    <ng-container *ngIf="fleetOrbitPosition(fleet) as pos">
                      <rect
                        [attr.x]="pos.x - 6"
                        [attr.y]="pos.y - 6"
                        width="12"
                        height="12"
                        [attr.fill]="fleet.ownerId === gs.player()?.id ? '#2e86de' : '#d63031'"
                        [attr.stroke]="'#000'"
                        [attr.stroke-width]="0.8"
                        [attr.transform]="'rotate(45 ' + pos.x + ' ' + pos.y + ')'"
                        (click)="selectFleet(fleet.id); $event.stopPropagation()"
                        style="cursor: pointer"
                      />
                    </ng-container>
                  </ng-container>
                  <ng-container *ngSwitchCase="'space'">
                    <rect
                      [attr.x]="fleet.location.x - 6"
                      [attr.y]="fleet.location.y - 6"
                      width="12"
                      height="12"
                      [attr.fill]="fleet.ownerId === gs.player()?.id ? '#2e86de' : '#d63031'"
                      [attr.stroke]="'#000'"
                      [attr.stroke-width]="0.8"
                      (click)="selectFleet(fleet.id); $event.stopPropagation()"
                      style="cursor: pointer"
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
                    [attr.stroke-width]="1"
                    style="pointer-events: none"
                  />
                  <circle
                    [attr.cx]="fr.x"
                    [attr.cy]="fr.y"
                    [attr.r]="fr.oneWay"
                    fill="rgba(241,196,15,0.06)"
                    stroke="#f1c40f"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events: none"
                  />
                </ng-container>
              </ng-container>

              <ng-container *ngIf="selectedFleetId as fid">
                <ng-container *ngIf="orderDest(fid) as dest">
                  <line
                    [attr.x1]="fleetPos(fid).x"
                    [attr.y1]="fleetPos(fid).y"
                    [attr.x2]="dest.x"
                    [attr.y2]="dest.y"
                    stroke="#34495e"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events:none"
                  />
                  <ng-container *ngFor="let m of pathMarkersTo(fid, dest)">
                    <circle
                      [attr.cx]="m.x"
                      [attr.cy]="m.y"
                      [attr.r]="3"
                      fill="#34495e"
                      style="pointer-events:none"
                    />
                  </ng-container>
                </ng-container>
              </ng-container>

              <!-- Draw stars on top for clear selection -->
              <ng-container *ngFor="let star of stars()">
                <circle
                  [attr.cx]="star.position.x"
                  [attr.cy]="star.position.y"
                  [attr.r]="7"
                  [attr.fill]="colorForStar(star)"
                  [attr.stroke]="isIsolated(star) ? '#e67e22' : '#000'"
                  [attr.stroke-width]="isIsolated(star) ? 1.2 : 0.7"
                  (click)="selectStar(star); $event.stopPropagation()"
                  style="cursor: pointer"
                >
                  <title>{{ star.name }}</title>
                </circle>
                <text
                  [attr.x]="star.position.x + 9"
                  [attr.y]="star.position.y - 9"
                  [attr.font-size]="10"
                  fill="#2c3e50"
                  style="pointer-events: none"
                >
                  {{ star.name }}
                </text>
              </ng-container>

              <ng-container *ngIf="selectedStar && selectedFleetId as fid">
                <ng-container *ngIf="pathMarkers(fid, selectedStar) as marks">
                  <line
                    [attr.x1]="fleetPos(fid).x"
                    [attr.y1]="fleetPos(fid).y"
                    [attr.x2]="selectedStar.position.x"
                    [attr.y2]="selectedStar.position.y"
                    stroke="#34495e"
                    stroke-dasharray="4,3"
                    [attr.stroke-width]="1"
                    style="pointer-events:none"
                  />
                  <ng-container *ngFor="let m of marks">
                    <circle
                      [attr.cx]="m.x"
                      [attr.cy]="m.y"
                      [attr.r]="3"
                      fill="#34495e"
                      style="pointer-events:none"
                    />
                  </ng-container>
                </ng-container>
              </ng-container>
            </g>
          </svg>

          <!-- Overlay Controls -->
          <div
            *ngIf="settings.showMapControls()"
            style="position:absolute; bottom:1rem; right:1rem; display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.8); padding:0.5rem; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.2)"
          >
            <div style="display:flex; gap:0.5rem; justify-content:center">
              <button (click)="zoomIn()" style="width:30px;height:30px;font-weight:bold">+</button>
              <button (click)="zoomOut()" style="width:30px;height:30px;font-weight:bold">-</button>
            </div>
            <div
              style="display:grid; grid-template-columns: 30px 30px 30px; gap:0.25rem; justify-content:center"
            >
              <div></div>
              <button (click)="panArrow(0, -50)" style="width:30px;height:30px">↑</button>
              <div></div>
              <button (click)="panArrow(-50, 0)" style="width:30px;height:30px">←</button>
              <button (click)="resetView()" style="width:30px;height:30px;font-size:0.8rem">
                R
              </button>
              <button (click)="panArrow(50, 0)" style="width:30px;height:30px">→</button>
              <div></div>
              <button (click)="panArrow(0, 50)" style="width:30px;height:30px">↓</button>
              <div></div>
            </div>
          </div>
        </section>

        <section
          *ngIf="selectedStar"
          style="margin-top:0.5rem;border-top:1px solid #ddd;padding-top:0.5rem; flex-shrink: 0;"
        >
          <ng-container *ngIf="selectedStar.planets[0] as p">
            <div
              style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem"
            >
              <strong style="font-size:1.1rem">{{ p.name }}</strong>
              <span
                [style.color]="
                  p.ownerId === gs.player()?.id ? '#2e86de' : p.ownerId ? '#d63031' : '#7f8c8d'
                "
              >
                {{ planetOwner(p.ownerId) }}
              </span>
            </div>

            <div style="display:flex;gap:1rem;font-size:0.9rem;color:#555;margin-bottom:0.5rem">
              <span
                >Habitability: <strong>{{ gs.habitabilityFor(p.id) }}%</strong></span
              >
            </div>

            <div style="display:flex;gap:0.5rem">
              <button
                (click)="openPlanet(p.id)"
                style="flex:1;padding:0.5rem;background:#2c3e50;color:#fff;border:none;border-radius:4px;cursor:pointer"
              >
                View Surface
              </button>
              <button
                *ngIf="selectedFleetId && canTravelTo(selectedStar)"
                (click)="travelTo(selectedStar)"
                style="flex:1;padding:0.5rem;background:#27ae60;color:#fff;border:none;border-radius:4px;cursor:pointer"
              >
                Travel Here
              </button>
            </div>
          </ng-container>

          <div
            *ngIf="fleetsAtStar(selectedStar).length > 0"
            style="margin-top:0.75rem;border-top:1px solid #eee;padding-top:0.5rem"
          >
            <div style="font-size:0.9rem;font-weight:bold;margin-bottom:0.25rem">
              Fleets in Orbit
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              <div
                *ngFor="let f of fleetsAtStar(selectedStar)"
                style="display:flex;justify-content:space-between;align-items:center;background:#f9f9f9;padding:0.5rem;border-radius:4px"
              >
                <span style="font-size:0.9rem">Fleet {{ f.id }} ({{ totalShips(f) }} ships)</span>
                <div style="display:flex;gap:0.5rem">
                  <button (click)="openFleet(f.id)" style="padding:0.25rem 0.5rem">View</button>
                  <button (click)="selectFleet(f.id)" style="padding:0.25rem 0.5rem">Select</button>
                </div>
              </div>
            </div>
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
  settings = inject(SettingsService);

  readonly stars = this.gs.stars;
  readonly turn = this.gs.turn;
  showTransfer = true;
  selectedStar: Star | null = null;
  selectedFleetId: string | null = null;

  // Zoom & Pan state
  scale = signal(1);
  translateX = signal(0);
  translateY = signal(0);
  isPanning = false;
  startX = 0;
  startY = 0;
  lastTouchDistance = 0;

  transformString() {
    return `translate(${this.translateX()} ${this.translateY()}) scale(${this.scale()})`;
  }

  openSettings() {
    this.router.navigateByUrl('/settings');
  }

  // Zoom Logic
  zoomIn() {
    this.scale.update((s) => Math.min(s * 1.2, 5));
  }

  zoomOut() {
    this.scale.update((s) => Math.max(s / 1.2, 0.5));
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = Math.sign(event.deltaY) * -1;
    const factor = 1.1;

    // Get cursor position relative to the container
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const oldScale = this.scale();
    let newScale = oldScale;

    if (delta > 0) {
      newScale = Math.min(oldScale * factor, 5);
    } else {
      newScale = Math.max(oldScale / factor, 0.5);
    }

    if (newScale !== oldScale) {
      // Calculate how much the view shifts to keep cursor point fixed
      // The logic is: (cursor - translate) / scale = worldPoint
      // newTranslate = cursor - worldPoint * newScale
      // So: newTranslate = cursor - ((cursor - oldTranslate) / oldScale) * newScale

      const worldX = (cursorX - this.translateX()) / oldScale;
      const worldY = (cursorY - this.translateY()) / oldScale;

      this.scale.set(newScale);
      this.translateX.set(cursorX - worldX * newScale);
      this.translateY.set(cursorY - worldY * newScale);
    }
  }

  // Pan Logic
  startPan(event: MouseEvent) {
    if (event.button === 0) {
      // Left click
      this.isPanning = true;
      this.startX = event.clientX - this.translateX();
      this.startY = event.clientY - this.translateY();
    }
  }

  pan(event: MouseEvent) {
    if (!this.isPanning) return;
    event.preventDefault();
    this.translateX.set(event.clientX - this.startX);
    this.translateY.set(event.clientY - this.startY);
  }

  endPan() {
    this.isPanning = false;
  }

  panArrow(dx: number, dy: number) {
    this.translateX.update((x) => x - dx); // Move view opposite to direction? No, pan means moving the camera. moving content means +dx moves content right.
    // If arrow is "Right", usually implies camera moves right -> content moves left.
    // But map convention: Right Arrow moves map Viewport Right? No, usually pans map to reveal what's on the right.
    // Let's assume Arrow Right moves content Left (view moves Right).
    // dx=50 means move content -50?
    // Actually, usually arrow keys move the "camera".
    // Let's implement standard "pan map" logic.
    // If I click Right Arrow, I want to see what is to the right. So I should move the content LEFT.
    this.translateX.update((x) => x - dx);
    this.translateY.update((y) => y - dy);
  }

  resetView() {
    this.scale.set(1);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  // Touch Logic
  startTouch(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isPanning = true;
      this.startX = event.touches[0].clientX - this.translateX();
      this.startY = event.touches[0].clientY - this.translateY();
    } else if (event.touches.length === 2) {
      this.isPanning = false;
      this.lastTouchDistance = this.getTouchDistance(event.touches);
    }
  }

  moveTouch(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1 && this.isPanning) {
      this.translateX.set(event.touches[0].clientX - this.startX);
      this.translateY.set(event.touches[0].clientY - this.startY);
    } else if (event.touches.length === 2) {
      const dist = this.getTouchDistance(event.touches);
      const factor = dist / this.lastTouchDistance;
      this.scale.update((s) => Math.min(Math.max(s * factor, 0.5), 5));
      this.lastTouchDistance = dist;
    }
  }

  endTouch() {
    this.isPanning = false;
  }

  private getTouchDistance(touches: TouchList): number {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  }

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
  filteredFleets() {
    const fleets = this.gs.game()?.fleets ?? [];
    return fleets.filter((f) => f.ships.reduce((sum: number, s: any) => sum + s.count, 0) > 0);
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
    const radius = 18;
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
    let idealWarp = Infinity;
    let totalMass = 0;
    let worstEfficiency = -Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * s.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    totalMass = Math.max(1, totalMass);
    // Cargo mass: minerals + colonists (1 kT per 1000)
    totalMass +=
      fleet.cargo.minerals.iron +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      fleet.cargo.colonists;
    const basePerLy = totalMass / 100;
    const speedRatio = Math.max(1, maxWarp / Math.max(1, idealWarp));
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = worstEfficiency / 100;
    const perLy =
      worstEfficiency === 0 ? 0 : Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
    const oneWay = perLy === 0 ? 1000 : fleet.fuel / perLy;
    const roundTrip = perLy === 0 ? 500 : fleet.fuel / perLy / 2;
    if (fleet.location.type === 'orbit') {
      const pos = this.planetPos(fleet.location.planetId);
      return { x: pos.x, y: pos.y, oneWay, roundTrip };
    } else {
      return { x: fleet.location.x, y: fleet.location.y, oneWay, roundTrip };
    }
  }
  fleetPos(id: string): { x: number; y: number } {
    const game = this.gs.game();
    if (!game) return { x: 0, y: 0 };
    const fleet = game.fleets.find((f) => f.id === id);
    if (!fleet) return { x: 0, y: 0 };
    if (fleet.location.type === 'orbit') return this.planetPos(fleet.location.planetId);
    return { x: fleet.location.x, y: fleet.location.y };
  }
  orderDest(id: string): { x: number; y: number } | null {
    const game = this.gs.game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === id);
    const ord = fleet?.orders[0];
    if (!ord || ord.type !== 'move') return null;
    return ord.destination;
  }
  canTravelTo(star: Star): boolean {
    const fr = this.selectedFleetId ? this.fleetRange(this.selectedFleetId) : null;
    if (!fr) return false;
    const pos = this.fleetPos(this.selectedFleetId!);
    const dist = Math.hypot(star.position.x - pos.x, star.position.y - pos.y);
    return dist <= fr.oneWay;
  }
  travelTo(star: Star) {
    const game = this.gs.game();
    if (!game || !this.selectedFleetId) return;
    this.gs.issueFleetOrder(this.selectedFleetId, { type: 'move', destination: star.position });
    this.selectedFleetId = null;
    this.selectedStar = null;
  }
  pathMarkers(fid: string, star: Star): Array<{ x: number; y: number }> {
    const game = this.gs.game();
    if (!game) return [];
    const fleet = game.fleets.find((f) => f.id === fid);
    if (!fleet) return [];
    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const perTurnDistance = maxWarp * 20;
    const start = this.fleetPos(fid);
    const end = star.position;
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    if (dist === 0) return [];
    const steps = Math.floor(dist / perTurnDistance);
    const marks: Array<{ x: number; y: number }> = [];
    for (let i = 1; i <= steps; i++) {
      const ratio = (perTurnDistance * i) / dist;
      marks.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      });
    }
    return marks;
  }
  pathMarkersTo(fid: string, dest: { x: number; y: number }): Array<{ x: number; y: number }> {
    const game = this.gs.game();
    if (!game) return [];
    const fleet = game.fleets.find((f) => f.id === fid);
    if (!fleet) return [];
    let maxWarp = Infinity;
    for (const s of fleet.ships) {
      const d = getDesign(s.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
    }
    const perTurnDistance = maxWarp * 20;
    const start = this.fleetPos(fid);
    const end = dest;
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    if (dist === 0) return [];
    const steps = Math.floor(dist / perTurnDistance);
    const marks: Array<{ x: number; y: number }> = [];
    for (let i = 1; i <= steps; i++) {
      const ratio = (perTurnDistance * i) / dist;
      marks.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      });
    }
    return marks;
  }
}
