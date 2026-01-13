import { Injectable } from '@angular/core';
import { GameState, Fleet } from '../models/game.model';
import { LogContext } from '../models/service-interfaces.model';
import { LoggingService } from './logging.service';
import { FleetOperationsService } from './fleet-operations.service';

export interface TransferSpec {
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

@Injectable({ providedIn: 'root' })
export class FleetTransferService {

  constructor(
    private logging: LoggingService,
    private fleetOperations: FleetOperationsService
  ) {}

  transfer(
    game: GameState,
    sourceId: string,
    targetId: string,
    transferSpec: TransferSpec,
  ): GameState {
    const context: LogContext = {
      service: 'FleetTransferService',
      operation: 'transfer',
      entityId: sourceId,
      entityType: 'fleet',
      additionalData: { targetId, transferSpec }
    };

    this.logging.debug(`Transferring between fleets ${sourceId} -> ${targetId}`, context);

    const source = game.fleets.find((f) => f.id === sourceId);
    const target = game.fleets.find((f) => f.id === targetId);
    
    if (!source || !target) {
      this.logging.error('Source or target fleet not found', context);
      return game;
    }

    // Validation: Same location
    const sameLoc = this.fleetsAtSameLocation(source, target);
    if (!sameLoc) {
      this.logging.error('Fleets must be at same location for transfer', context);
      return game;
    }

    // Transfer Ships
    for (const ship of transferSpec.ships) {
      const sourceStack = source.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (!sourceStack || sourceStack.count < ship.count) {
        this.logging.warn(`Insufficient ships for transfer: ${ship.designId}`, {
          ...context,
          additionalData: { ...context.additionalData, shipDesignId: ship.designId, requested: ship.count, available: sourceStack?.count || 0 }
        });
        continue;
      }

      sourceStack.count -= ship.count;
      if (sourceStack.count <= 0) {
        source.ships = source.ships.filter((s) => s !== sourceStack);
      }

      const targetStack = target.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (targetStack) {
        targetStack.count += ship.count;
      } else {
        target.ships.push({
          designId: ship.designId,
          count: ship.count,
          damage: ship.damage || 0,
        });
      }

      this.logging.debug(`Transferred ${ship.count} ships of design ${ship.designId}`, {
        ...context,
        additionalData: { ...context.additionalData, shipDesignId: ship.designId, count: ship.count }
      });
    }

    // Transfer Fuel
    const fuelToMove = Math.min(source.fuel, transferSpec.fuel);
    source.fuel -= fuelToMove;
    target.fuel += fuelToMove;

    if (fuelToMove > 0) {
      this.logging.debug(`Transferred ${fuelToMove} fuel`, {
        ...context,
        additionalData: { ...context.additionalData, fuel: fuelToMove }
      });
    }

    // Transfer Cargo
    this.transferCargo('resources', transferSpec.cargo.resources, source, target, context);
    this.transferCargo('colonists', transferSpec.cargo.colonists, source, target, context);
    this.transferMineral('ironium', transferSpec.cargo.ironium, source, target, context);
    this.transferMineral('boranium', transferSpec.cargo.boranium, source, target, context);
    this.transferMineral('germanium', transferSpec.cargo.germanium, source, target, context);

    // Cleanup empty fleets
    if (source.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== source.id);
      this.logging.info(`Removed empty source fleet ${source.name}`, context);
    }

    this.logging.info(`Transfer completed between ${source.name} and ${target.name}`, context);
    return { ...game, fleets: [...game.fleets] };
  }

  splitFleet(
    game: GameState,
    sourceId: string,
    transferSpec: TransferSpec,
  ): [GameState, string | null] {
    const context: LogContext = {
      service: 'FleetTransferService',
      operation: 'splitFleet',
      entityId: sourceId,
      entityType: 'fleet',
      additionalData: { transferSpec }
    };

    this.logging.debug(`Splitting fleet ${sourceId}`, context);

    const source = game.fleets.find((f) => f.id === sourceId);
    if (!source) {
      this.logging.error('Source fleet not found for split', context);
      return [game, null];
    }

    const newFleet = this.fleetOperations.createFleet(
      game,
      source.location,
      source.ownerId,
      transferSpec.ships[0]?.designId,
    );
    
    const nextGame = this.transfer(game, sourceId, newFleet.id, transferSpec);
    
    this.logging.info(`Fleet split completed: ${source.name} -> ${newFleet.name}`, {
      ...context,
      additionalData: { ...context.additionalData, newFleetId: newFleet.id, newFleetName: newFleet.name }
    });

    return [nextGame, newFleet.id];
  }

  separateFleet(game: GameState, fleetId: string): GameState {
    const context: LogContext = {
      service: 'FleetTransferService',
      operation: 'separateFleet',
      entityId: fleetId,
      entityType: 'fleet'
    };

    this.logging.debug(`Separating fleet ${fleetId}`, context);

    const source = game.fleets.find((f) => f.id === fleetId);
    if (!source) {
      this.logging.error('Fleet not found for separation', context);
      return game;
    }

    // Calculate total ships
    let totalShips = 0;
    source.ships.forEach((s) => (totalShips += s.count));

    // If only 1 ship, nothing to separate
    if (totalShips <= 1) {
      this.logging.warn('Fleet has only 1 ship, cannot separate', context);
      return game;
    }

    // Create a flat list of all ships to move (leave exactly 1 ship in source)
    const shipsToMove: { designId: string; damage: number }[] = [];
    let shipsAdded = 0;
    
    for (const stack of source.ships) {
      for (let i = 0; i < stack.count; i++) {
        if (shipsAdded < totalShips - 1) {
          shipsToMove.push({ designId: stack.designId, damage: stack.damage || 0 });
          shipsAdded++;
        }
      }
    }

    let currentGame = game;
    for (const ship of shipsToMove) {
      const newFleet = this.fleetOperations.createFleet(
        currentGame,
        source.location,
        source.ownerId,
        ship.designId,
      );
      currentGame = this.transfer(currentGame, source.id, newFleet.id, {
        ships: [{ designId: ship.designId, count: 1, damage: ship.damage }],
        fuel: 0,
        cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 },
      });
    }

    this.logging.info(`Fleet separation completed: created ${shipsToMove.length} new fleets`, {
      ...context,
      additionalData: { newFleetCount: shipsToMove.length, originalShipCount: totalShips }
    });

    return currentGame;
  }

  mergeFleets(game: GameState, sourceId: string, targetId: string): GameState {
    const context: LogContext = {
      service: 'FleetTransferService',
      operation: 'mergeFleets',
      entityId: sourceId,
      entityType: 'fleet',
      additionalData: { targetId }
    };

    this.logging.debug(`Merging fleet ${sourceId} into ${targetId}`, context);

    const source = game.fleets.find((f) => f.id === sourceId);
    if (!source) {
      this.logging.error('Source fleet not found for merge', context);
      return game;
    }

    // Move everything
    const result = this.transfer(game, sourceId, targetId, {
      ships: source.ships.map((s) => ({ ...s })),
      fuel: source.fuel,
      cargo: {
        resources: source.cargo.resources,
        ironium: source.cargo.minerals.ironium,
        boranium: source.cargo.minerals.boranium,
        germanium: source.cargo.minerals.germanium,
        colonists: source.cargo.colonists,
      },
    });

    this.logging.info(`Fleet merge completed: ${source.name} merged into target`, context);
    return result;
  }

  private fleetsAtSameLocation(source: Fleet, target: Fleet): boolean {
    return (
      (source.location.type === 'orbit' &&
        target.location.type === 'orbit' &&
        (source.location as any).planetId === (target.location as any).planetId) ||
      (source.location.type === 'space' &&
        target.location.type === 'space' &&
        (source.location as any).x === (target.location as any).x &&
        (source.location as any).y === (target.location as any).y)
    );
  }

  private transferCargo(
    key: 'resources' | 'colonists',
    amount: number,
    source: Fleet,
    target: Fleet,
    context: LogContext
  ) {
    const val = Math.min(source.cargo[key], amount);
    source.cargo[key] -= val;
    target.cargo[key] += val;

    if (val > 0) {
      this.logging.debug(`Transferred ${val} ${key}`, {
        ...context,
        additionalData: { ...context.additionalData, cargoType: key, amount: val }
      });
    }
  }

  private transferMineral(
    key: 'ironium' | 'boranium' | 'germanium',
    amount: number,
    source: Fleet,
    target: Fleet,
    context: LogContext
  ) {
    const val = Math.min(source.cargo.minerals[key], amount);
    source.cargo.minerals[key] -= val;
    target.cargo.minerals[key] += val;

    if (val > 0) {
      this.logging.debug(`Transferred ${val} ${key}`, {
        ...context,
        additionalData: { ...context.additionalData, mineral: key, amount: val }
      });
    }
  }
}