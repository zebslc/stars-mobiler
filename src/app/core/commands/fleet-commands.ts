import { GameCommand, GameCommandWithResult } from './game-command.interface';
import { GameState, FleetOrder } from '../../models/game.model';
import { FleetService } from '../../services/fleet/fleet.service';

/**
 * Command to issue a single order to a fleet.
 */
export class IssueFleetOrderCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private fleetId: string,
    private order: FleetOrder
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.setFleetOrders(game, this.fleetId, [this.order]);
  }
}

/**
 * Command to set multiple orders for a fleet.
 */
export class SetFleetOrdersCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private fleetId: string,
    private orders: FleetOrder[]
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.setFleetOrders(game, this.fleetId, this.orders);
  }
}

/**
 * Command to colonize a planet immediately.
 */
export class ColonizeNowCommand implements GameCommandWithResult<string | null> {
  constructor(
    private fleetService: FleetService,
    private fleetId: string
  ) {}

  execute(game: GameState): [GameState, string | null] {
    return this.fleetService.colonizeNow(game, this.fleetId);
  }
}

/**
 * Command to load cargo from a planet to a fleet.
 */
export class LoadCargoCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private fleetId: string,
    private planetId: string,
    private manifest: {
      resources?: number | 'all' | 'fill';
      ironium?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    }
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.loadCargo(game, this.fleetId, this.planetId, this.manifest);
  }
}

/**
 * Command to unload cargo from a fleet to a planet.
 */
export class UnloadCargoCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private fleetId: string,
    private planetId: string,
    private manifest: {
      resources?: number | 'all';
      ironium?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    }
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.unloadCargo(game, this.fleetId, this.planetId, this.manifest);
  }
}

/**
 * Command to split a fleet into two fleets.
 */
export class SplitFleetCommand implements GameCommandWithResult<string | null> {
  constructor(
    private fleetService: FleetService,
    private fleetId: string,
    private transferSpec: {
      ships: { designId: string; count: number; damage?: number }[];
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    }
  ) {}

  execute(game: GameState): [GameState, string | null] {
    return this.fleetService.splitFleet(game, this.fleetId, this.transferSpec);
  }
}

/**
 * Command to separate a fleet (split into individual ships).
 */
export class SeparateFleetCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private fleetId: string
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.separateFleet(game, this.fleetId);
  }
}

/**
 * Command to merge two fleets.
 */
export class MergeFleetsCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private sourceId: string,
    private targetId: string
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.mergeFleets(game, this.sourceId, this.targetId);
  }
}

/**
 * Command to transfer cargo between fleets.
 */
export class TransferFleetCargoCommand implements GameCommand {
  constructor(
    private fleetService: FleetService,
    private sourceId: string,
    private targetId: string,
    private transferSpec: {
      ships: { designId: string; count: number; damage?: number }[];
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    }
  ) {}

  execute(game: GameState): GameState {
    return this.fleetService.transfer(game, this.sourceId, this.targetId, this.transferSpec);
  }
}