import { Injectable, signal } from '@angular/core';
import { GovernorType } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly showMapControls = signal<boolean>(true);
  readonly defaultGovernor = signal<GovernorType>('balanced');

  toggleMapControls(show: boolean) {
    this.showMapControls.set(show);
  }

  setDefaultGovernor(type: GovernorType) {
    this.defaultGovernor.set(type);
  }
}
