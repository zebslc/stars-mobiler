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
    <main style="padding:1rem">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h2>Settings</h2>
        <button (click)="back()">Back</button>
      </header>
      
      <section style="display:flex;flex-direction:column;gap:1.5rem">
        <div style="border:1px solid #ccc;padding:1rem;border-radius:4px">
          <h3>Interface</h3>
          <label style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem">
            <input 
              type="checkbox" 
              [ngModel]="settings.showMapControls()" 
              (ngModelChange)="settings.toggleMapControls($event)"
            />
            Show Map Overlay Controls (Zoom/Pan)
          </label>
        </div>

        <div style="border:1px solid #ccc;padding:1rem;border-radius:4px">
          <h3>Automation</h3>
          <label style="display:flex;flex-direction:column;gap:0.5rem;margin-top:0.5rem">
            <span>Default Governor for New Planets:</span>
            <select 
              [ngModel]="settings.defaultGovernor()" 
              (ngModelChange)="settings.setDefaultGovernor($event)"
              style="padding:0.5rem"
            >
              <option value="manual">Manual</option>
              <option value="balanced">Balanced</option>
              <option value="mining">Mining</option>
              <option value="industrial">Industrial</option>
              <option value="military">Military</option>
              <option value="shipyard">Shipyard</option>
            </select>
          </label>
          <p style="font-size:0.9rem;color:#666;margin-top:0.5rem">
            Newly colonized or conquered planets will automatically be assigned this governor.
          </p>
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
