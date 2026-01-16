import { Injectable } from '@angular/core';
import type { Fleet, FleetOrder, GameState, Star } from '../../../models/game.model';
import type { FleetLocation } from '../../../models/service-interfaces.model';
import { MAX_FLEETS_PER_PLAYER, MAX_SHIPS_PER_DESIGN } from './fleet.constants';
import { FleetOperationsService } from '../operations/fleet-operations.service';
import { FleetTransferService } from '../transfer/fleet-transfer.service';
import type { TransferSpec } from '../transfer/fleet-transfer.types';
import { FleetCargoService, type CargoManifest } from '../cargo/fleet-cargo.service';
import { FleetColonizationService } from '../colonization/fleet-colonization.service';
import { FleetProcessingService } from '../processing/fleet-processing.service';

export type LoadManifest = CargoManifest;

export interface UnloadManifest {
  resources?: number | 'all';
  ironium?: number | 'all';
  boranium?: number | 'all';
  germanium?: number | 'all';
  colonists?: number | 'all';
}

@Injectable({ providedIn: 'root' })
export class FleetService {
  readonly MAX_FLEETS = MAX_FLEETS_PER_PLAYER;
  readonly MAX_SHIPS_PER_DESIGN = MAX_SHIPS_PER_DESIGN;

  constructor(
    private readonly operations: FleetOperationsService,
    private readonly transferService: FleetTransferService,
    private readonly cargoService: FleetCargoService,
    private readonly colonizationService: FleetColonizationService,
    private readonly processingService: FleetProcessingService,
  ) {}

  addShipToFleet(game: GameState, star: Star, shipDesignId: string, count: number): void {
    this.operations.addShipToFleet(game, star, shipDesignId, count);
  }

  createFleet(
    game: GameState,
    location: FleetLocation,
    ownerId: string,
    baseNameSource?: string,
  ): Fleet {
    return this.operations.createFleet(game, location, ownerId, baseNameSource);
  }

  transfer(
    game: GameState,
    sourceId: string,
    targetId: string,
    transferSpec: TransferSpec,
  ): GameState {
    return this.transferService.transfer(game, sourceId, targetId, transferSpec);
  }

  splitFleet(
    game: GameState,
    sourceId: string,
    transferSpec: TransferSpec,
  ): [GameState, string | null] {
    return this.transferService.splitFleet(game, sourceId, transferSpec);
  }

  separateFleet(game: GameState, fleetId: string): GameState {
    return this.transferService.separateFleet(game, fleetId);
  }

  mergeFleets(game: GameState, sourceId: string, targetId: string): GameState {
    return this.transferService.mergeFleets(game, sourceId, targetId);
  }

  issueFleetOrder(game: GameState, fleetId: string, order: FleetOrder): GameState {
    return this.setFleetOrders(game, fleetId, [order]);
  }

  setFleetOrders(game: GameState, fleetId: string, orders: Array<FleetOrder>): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) {
      return game;
    }
    fleet.orders = orders;
    return { ...game };
  }

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    return this.colonizationService.colonizeNow(game, fleetId);
  }

  loadCargo(game: GameState, fleetId: string, starId: string, manifest: LoadManifest): GameState {
    return this.cargoService.loadCargo(game, fleetId, starId, manifest);
  }

  unloadCargo(
    game: GameState,
    fleetId: string,
    starId: string,
    manifest: UnloadManifest,
  ): GameState {
    return this.cargoService.unloadCargo(game, fleetId, starId, manifest);
  }

  decommissionFleet(game: GameState, fleetId: string): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) {
      return game;
    }
    game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    return { ...game, fleets: [...game.fleets] };
  }

  processFleets(game: GameState): void {
    this.processingService.processFleets(game);
  }
}
