import { Injectable, signal } from '@angular/core';
import { GovernorType } from '../models/game.model';
import { SHIP_ROLE_CONFIG } from '../shared/constants/ship-roles.const';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly showMapControls = signal<boolean>(false);
  readonly showScannerRanges = signal<boolean>(true);
  readonly showCloakedRanges = signal<boolean>(false);
  readonly scannerRangePct = signal<number>(100);
  readonly viewMode = signal<'normal' | 'minerals' | 'value' | 'habitability'>('normal');
  readonly showLabels = signal<boolean>(true);
  readonly fleetFilter = signal<Set<string>>(new Set(Object.keys(SHIP_ROLE_CONFIG)));
  readonly showEnemyFleets = signal<boolean>(false);
  readonly showFleetCounts = signal<boolean>(false);
  readonly showMinefields = signal<boolean>(false);
  readonly showRemoteMining = signal<boolean>(false);
  readonly defaultGovernor = signal<GovernorType>('balanced');

  toggleMapControls(show: boolean) {
    this.showMapControls.set(show);
  }

  toggleScannerRanges(show: boolean) {
    this.showScannerRanges.set(show);
  }

  toggleCloakedRanges(show: boolean) {
    this.showCloakedRanges.set(show);
  }

  setScannerRangePct(pct: number) {
    this.scannerRangePct.set(pct);
  }

  setViewMode(mode: 'normal' | 'minerals' | 'value' | 'habitability') {
    this.viewMode.set(mode);
  }

  toggleLabels(show: boolean) {
    this.showLabels.set(show);
  }

  setFleetFilter(filter: Set<string>) {
    this.fleetFilter.set(filter);
  }

  toggleEnemyFleets(show: boolean) {
    this.showEnemyFleets.set(show);
  }

  toggleFleetCounts(show: boolean) {
    this.showFleetCounts.set(show);
  }

  toggleMinefields(show: boolean) {
    this.showMinefields.set(show);
  }

  toggleRemoteMining(show: boolean) {
    this.showRemoteMining.set(show);
  }

  setDefaultGovernor(type: GovernorType) {
    this.defaultGovernor.set(type);
  }
}
