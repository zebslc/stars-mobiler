import { Injectable, inject } from '@angular/core';
import type { GameState, Fleet } from '../../models/game.model';
import type { LogContext } from '../../models/service-interfaces.model';
import { LoggingService } from '../core/logging.service';
import { FleetOperationsService } from './fleet-operations.service';
import type { TransferSpec } from './fleet-transfer.types';

const FLEET_TRANSFER_LOG_BASE = {
  service: 'FleetTransferService',
  entityType: 'fleet',
} as const;

const FLEET_TRANSFER_OPERATION = {
  TRANSFER: 'transfer',
  SPLIT_FLEET: 'splitFleet',
  SEPARATE_FLEET: 'separateFleet',
  MERGE_FLEETS: 'mergeFleets',
} as const;

type FleetTransferOperation =
  (typeof FLEET_TRANSFER_OPERATION)[keyof typeof FLEET_TRANSFER_OPERATION];

@Injectable({ providedIn: 'root' })
export class FleetTransferService {
  private readonly logging = inject(LoggingService);
  private readonly fleetOperations = inject(FleetOperationsService);

  transfer(
    game: GameState,
    sourceId: string,
    targetId: string,
    transferSpec: TransferSpec,
  ): GameState {
    const context = this.createContext(FLEET_TRANSFER_OPERATION.TRANSFER, sourceId, {
      targetId,
      transferSpec,
    });
    void this.logging.debug(`Transferring between fleets ${sourceId} -> ${targetId}`, context);

    const participants = this.resolveTransferParticipants(game, sourceId, targetId, context);
    if (!participants) {
      return game;
    }

    const nextState = this.applyTransferOperations(
      game,
      participants.source,
      participants.target,
      transferSpec,
      context,
    );

    void this.logging.info(
      `Transfer completed between ${participants.source.name} and ${participants.target.name}`,
      context,
    );
    return nextState;
  }

  splitFleet(
    game: GameState,
    sourceId: string,
    transferSpec: TransferSpec,
  ): [GameState, string | null] {
    const context = this.createContext(FLEET_TRANSFER_OPERATION.SPLIT_FLEET, sourceId, {
      transferSpec,
    });
    void this.logging.debug(`Splitting fleet ${sourceId}`, context);

    const source = this.requireFleet(game, sourceId, context, 'Source fleet not found for split');
    if (!source) {
      return [game, null];
    }

    return this.executeFleetSplit(game, source, transferSpec, context);
  }

  separateFleet(game: GameState, fleetId: string): GameState {
    const context = this.createContext(FLEET_TRANSFER_OPERATION.SEPARATE_FLEET, fleetId);
    void this.logging.debug(`Separating fleet ${fleetId}`, context);

    const source = this.requireFleet(game, fleetId, context, 'Fleet not found for separation');
    if (!source) {
      return game;
    }

    const totalShips = this.countShips(source);
    if (totalShips <= 1) {
      void this.logging.warn('Fleet has only 1 ship, cannot separate', context);
      return game;
    }

    const shipsToMove = this.collectShipsToSeparate(source, totalShips);
    const updatedGame = this.createSingleShipFleets(game, source, shipsToMove);

    void this.logging.info(`Fleet separation completed: created ${shipsToMove.length} new fleets`, {
      ...context,
      additionalData: { newFleetCount: shipsToMove.length, originalShipCount: totalShips },
    });

    return updatedGame;
  }

  mergeFleets(game: GameState, sourceId: string, targetId: string): GameState {
    const context = this.createContext(FLEET_TRANSFER_OPERATION.MERGE_FLEETS, sourceId, {
      targetId,
    });
    void this.logging.debug(`Merging fleet ${sourceId} into ${targetId}`, context);

    const source = this.requireFleet(game, sourceId, context, 'Source fleet not found for merge');
    if (!source) {
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

    void this.logging.info(`Fleet merge completed: ${source.name} merged into target`, context);
    return result;
  }

  private createContext(
    operation: FleetTransferOperation,
    entityId: string,
    additionalData?: Record<string, unknown>,
  ): LogContext {
    return {
      service: FLEET_TRANSFER_LOG_BASE.service,
      operation,
      entityId,
      entityType: FLEET_TRANSFER_LOG_BASE.entityType,
      ...(additionalData ? { additionalData } : {}),
    };
  }

  private requireFleet(
    game: GameState,
    fleetId: string,
    context: LogContext,
    errorMessage: string,
  ): Fleet | null {
    const fleet = game.fleets.find((f) => f.id === fleetId);
    if (!fleet) {
      void this.logging.error(errorMessage, context);
      return null;
    }
    return fleet;
  }

  private ensureSameLocation(source: Fleet, target: Fleet, context: LogContext): boolean {
    const sameLocation = this.fleetsAtSameLocation(source, target);
    if (!sameLocation) {
      void this.logging.error('Fleets must be at same location for transfer', context);
    }
    return sameLocation;
  }

  private resolveTransferParticipants(
    game: GameState,
    sourceId: string,
    targetId: string,
    context: LogContext,
  ): { source: Fleet; target: Fleet } | null {
    const source = this.requireFleet(game, sourceId, context, 'Source fleet not found');
    const target = this.requireFleet(game, targetId, context, 'Target fleet not found');

    if (!source || !target || !this.ensureSameLocation(source, target, context)) {
      return null;
    }

    return { source, target };
  }

  private applyTransferOperations(
    game: GameState,
    source: Fleet,
    target: Fleet,
    transferSpec: TransferSpec,
    context: LogContext,
  ): GameState {
    this.performShipTransfers(transferSpec.ships, source, target, context);
    this.transferFuelAmount(transferSpec.fuel, source, target, context);
    this.applyCargoTransferBundle(transferSpec.cargo, source, target, context);

    this.removeFleetIfEmpty(game, source, context);
    return this.cloneGame(game);
  }

  private performShipTransfers(
    ships: TransferSpec['ships'],
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ): void {
    for (const ship of ships) {
      this.transferShipStack(ship, source, target, context);
    }
  }

  private transferShipStack(
    ship: { designId: string; count: number; damage?: number },
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ): void {
    const sourceStack = this.findMatchingStack(source, ship);
    if (!this.hasSufficientShips(sourceStack, ship.count, ship.designId, context)) {
      return;
    }

    this.removeShipsFromSource(source, sourceStack, ship.count);
    this.addShipsToTarget(target, ship);
    this.logShipTransfer(ship, context);
  }

  private findMatchingStack(
    fleet: Fleet,
    ship: { designId: string; damage?: number },
  ): Fleet['ships'][number] | undefined {
    return fleet.ships.find(
      (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
    );
  }

  private hasSufficientShips(
    sourceStack: Fleet['ships'][number] | undefined,
    requested: number,
    designId: string,
    context: LogContext,
  ): sourceStack is Fleet['ships'][number] {
    if (!sourceStack || sourceStack.count < requested) {
      void this.logging.warn(`Insufficient ships for transfer: ${designId}`, {
        ...context,
        additionalData: {
          ...(context.additionalData ?? {}),
          shipDesignId: designId,
          requested,
          available: sourceStack?.count || 0,
        },
      });
      return false;
    }
    return true;
  }

  private removeShipsFromSource(
    source: Fleet,
    sourceStack: Fleet['ships'][number],
    count: number,
  ): void {
    sourceStack.count -= count;
    if (sourceStack.count <= 0) {
      source.ships = source.ships.filter((s) => s !== sourceStack);
    }
  }

  private addShipsToTarget(
    target: Fleet,
    ship: { designId: string; count: number; damage?: number },
  ): void {
    const targetStack = this.findMatchingStack(target, ship);
    if (targetStack) {
      targetStack.count += ship.count;
      return;
    }

    target.ships.push({
      designId: ship.designId,
      count: ship.count,
      damage: ship.damage || 0,
    });
  }

  private logShipTransfer(ship: { designId: string; count: number }, context: LogContext): void {
    void this.logging.debug(`Transferred ${ship.count} ships of design ${ship.designId}`, {
      ...context,
      additionalData: {
        ...(context.additionalData ?? {}),
        shipDesignId: ship.designId,
        count: ship.count,
      },
    });
  }

  private transferFuelAmount(
    amount: number,
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ): void {
    const fuelToMove = Math.min(source.fuel, amount);
    source.fuel -= fuelToMove;
    target.fuel += fuelToMove;

    if (fuelToMove > 0) {
      void this.logging.debug(`Transferred ${fuelToMove} fuel`, {
        ...context,
        additionalData: { ...(context.additionalData ?? {}), fuel: fuelToMove },
      });
    }
  }

  private applyCargoTransferBundle(
    cargo: TransferSpec['cargo'],
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ): void {
    this.transferCargo('resources', cargo.resources, source, target, context);
    this.transferCargo('colonists', cargo.colonists, source, target, context);
    this.transferMineral('ironium', cargo.ironium, source, target, context);
    this.transferMineral('boranium', cargo.boranium, source, target, context);
    this.transferMineral('germanium', cargo.germanium, source, target, context);
  }

  private removeFleetIfEmpty(game: GameState, source: Fleet, context: LogContext): void {
    if (source.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== source.id);
      void this.logging.info(`Removed empty source fleet ${source.name}`, context);
    }
  }

  private cloneGame(game: GameState): GameState {
    return { ...game, fleets: [...game.fleets] };
  }

  private collectShipsToSeparate(
    source: Fleet,
    totalShips: number,
  ): Array<{ designId: string; damage: number }> {
    const shipsToMove: Array<{ designId: string; damage: number }> = [];
    let shipsAdded = 0;

    // Leaving one ship behind keeps the source fleet alive.
    for (const stack of source.ships) {
      for (let i = 0; i < stack.count && shipsAdded < totalShips - 1; i++) {
        shipsToMove.push({ designId: stack.designId, damage: stack.damage || 0 });
        shipsAdded++;
      }
    }

    return shipsToMove;
  }

  private countShips(fleet: Fleet): number {
    return fleet.ships.reduce((total, stack) => total + stack.count, 0);
  }

  private executeFleetSplit(
    game: GameState,
    source: Fleet,
    transferSpec: TransferSpec,
    context: LogContext,
  ): [GameState, string | null] {
    const newFleet = this.fleetOperations.createFleet(
      game,
      source.location,
      source.ownerId,
      transferSpec.ships[0]?.designId,
    );

    const nextGame = this.transfer(game, source.id, newFleet.id, transferSpec);

    void this.logging.info(`Fleet split completed: ${source.name} -> ${newFleet.name}`, {
      ...context,
      additionalData: {
        ...(context.additionalData ?? {}),
        newFleetId: newFleet.id,
        newFleetName: newFleet.name,
      },
    });

    return [nextGame, newFleet.id];
  }

  private createSingleShipFleets(
    game: GameState,
    source: Fleet,
    shipsToMove: Array<{ designId: string; damage: number }>,
  ): GameState {
    let currentGame = game;
    for (const ship of shipsToMove) {
      currentGame = this.createFleetWithSingleShip(currentGame, source, ship);
    }
    return currentGame;
  }

  private createFleetWithSingleShip(
    game: GameState,
    source: Fleet,
    ship: { designId: string; damage: number },
  ): GameState {
    const newFleet = this.fleetOperations.createFleet(
      game,
      source.location,
      source.ownerId,
      ship.designId,
    );

    return this.transfer(game, source.id, newFleet.id, {
      ships: [{ designId: ship.designId, count: 1, damage: ship.damage }],
      fuel: 0,
      cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 },
    });
  }

  private fleetsAtSameLocation(source: Fleet, target: Fleet): boolean {
    if (source.location.type !== target.location.type) {
      return false;
    }

    if (source.location.type === 'orbit' && target.location.type === 'orbit') {
      return source.location.starId === target.location.starId;
    }

    if (source.location.type === 'space' && target.location.type === 'space') {
      return (
        source.location.x === target.location.x && source.location.y === target.location.y
      );
    }

    return false;
  }

  private transferCargo(
    key: 'resources' | 'colonists',
    amount: number,
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ) {
    const val = Math.min(source.cargo[key], amount);
    source.cargo[key] -= val;
    target.cargo[key] += val;

    if (val > 0) {
      void this.logging.debug(`Transferred ${val} ${key}`, {
        ...context,
        additionalData: { ...(context.additionalData ?? {}), cargoType: key, amount: val },
      });
    }
  }

  private transferMineral(
    key: 'ironium' | 'boranium' | 'germanium',
    amount: number,
    source: Fleet,
    target: Fleet,
    context: LogContext,
  ) {
    const val = Math.min(source.cargo.minerals[key], amount);
    source.cargo.minerals[key] -= val;
    target.cargo.minerals[key] += val;

    if (val > 0) {
      void this.logging.debug(`Transferred ${val} ${key}`, {
        ...context,
        additionalData: { ...(context.additionalData ?? {}), mineral: key, amount: val },
      });
    }
  }
}