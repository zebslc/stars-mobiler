import { Injectable, inject } from '@angular/core';
import type { Fleet } from '../../models/game.model';
import { GameStateService } from '../game/game-state.service';
import type { TransferState } from '../../screens/fleet-detail/components/fleet-transfer/fleet-transfer.component';

export type TransferMode = 'split' | 'transfer';
export type SplitMode = 'custom' | 'separate';

export interface TransferEvent {
  mode: TransferMode;
  splitMode: SplitMode;
  state: TransferState;
}

export interface TransferResult {
  success: boolean;
  kind: 'split-custom' | 'split-separate' | 'transfer';
  newFleetId?: string;
}

@Injectable({ providedIn: 'root' })
export class FleetTransferService {
  private gs = inject(GameStateService);

  buildSplitSpec(state: TransferState) {
    return {
      ships: state.ships
        .filter((s) => s.count > 0)
        .map((s) => ({ designId: s.designId, count: s.count, damage: s.damage })),
      fuel: 0,
      cargo: { resources: 0, ironium: 0, boranium: 0, germanium: 0, colonists: 0 },
    };
  }

  buildTransferSpec(state: TransferState) {
    return {
      ships: state.ships
        .filter((s) => s.count > 0)
        .map((s) => ({ designId: s.designId, count: s.count, damage: s.damage })),
      fuel: state.fuel,
      cargo: {
        resources: state.resources,
        ironium: state.ironium,
        boranium: state.boranium,
        germanium: state.germanium,
        colonists: state.colonists,
      },
    };
  }

  applyTransfer(
    fleetId: string,
    target: Fleet | { name: string; id: 'new' },
    event: TransferEvent,
  ): TransferResult {
    if (event.mode === 'split') {
      if (event.splitMode === 'separate') {
        this.gs.separateFleet(fleetId);
        return { success: true, kind: 'split-separate' };
      }
      const spec = this.buildSplitSpec(event.state);
      if (spec.ships.length === 0) {
        return { success: false, kind: 'split-custom' };
      }
      const newId = this.gs.splitFleet(fleetId, spec);
      return { success: !!newId, kind: 'split-custom', newFleetId: newId || undefined };
    }

    // Transfer
    if ('id' in target && target.id !== 'new') {
      const spec = this.buildTransferSpec(event.state);
      this.gs.transferFleetCargo(fleetId, target.id, spec);
      return { success: true, kind: 'transfer' };
    }
    return { success: false, kind: 'transfer' };
  }

  mergeFleets(sourceId: string, targetId: string): void {
    this.gs.mergeFleets(sourceId, targetId);
  }
}
