import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsService } from '../../services/settings.service';
import { GameStateService } from '../../services/game-state.service';
import { GovernorType } from '../../models/game.model';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-settings',
  template: `
    <main style="padding:var(--space-lg)">
      <header class="card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);gap:var(--space-lg);flex-wrap:wrap">
        <h2>Settings</h2>
        <button (click)="back()" class="btn-small" style="background:rgba(255,255,255,0.2);color:#fff;border:none">← Back</button>
      </header>

      <section style="display:flex;flex-direction:column;gap:var(--space-xl);max-width:600px">
        <div class="card">
          <h3 style="margin-bottom:var(--space-lg)">Interface</h3>
          <label style="display:flex;gap:var(--space-md);align-items:center;cursor:pointer">
            <input
              type="checkbox"
              [ngModel]="settings.showMapControls()"
              (ngModelChange)="settings.toggleMapControls($event)"
            />
            <span class="font-medium">Show Map Overlay Controls (Zoom/Pan)</span>
          </label>
          <p class="text-small text-muted" style="margin-top:var(--space-sm);margin-left:calc(var(--touch-target-min) + var(--space-md))">
            Display zoom and pan controls on the galaxy map
          </p>
        </div>

        <div class="card">
          <h3 style="margin-bottom:var(--space-lg)">Automation</h3>
          <div>
            <label>Default Governor for New Planets</label>
            <select
              [ngModel]="settings.defaultGovernor()"
              (ngModelChange)="settings.setDefaultGovernor($event)"
              style="width:100%"
            >
              <option value="manual">Manual Control</option>
              <option value="balanced">Balanced (Auto-build all)</option>
              <option value="mining">Mining (Focus Mines)</option>
              <option value="industrial">Industrial (Focus Factories)</option>
              <option value="military">Military (Focus Defenses)</option>
              <option value="shipyard">Shipyard (Auto-build Ships)</option>
            </select>
            <p class="text-small text-muted" style="margin-top:var(--space-sm)">
              Newly colonized or conquered planets will automatically be assigned this governor.
            </p>
          </div>
        </div>
      </section>
    </main>
  `,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  settings = inject(SettingsService);
  private gs = inject(GameStateService);
  private router = inject(Router);

  back() {
    if (this.gs.game()) {
      this.router.navigateByUrl('/map');
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
