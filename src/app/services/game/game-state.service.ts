import { Injectable, computed } from '@angular/core';
import type {
  GameSettings,
  Star,
  BuildItem,
  ShipDesign,
  FleetOrder} from '../../models/game.model';
import {
  GameState
} from '../../models/game.model';
import { GameInitializerService } from './game-initializer.service';
import { HabitabilityService } from '../colony/habitability.service';
import type { TechField } from '../../data/tech-tree.data';
import { CommandExecutorService } from '../../core/commands/command-executor.service';
import { CommandFactoryService } from '../../core/commands/command-factory.service';
import { ShipyardService } from '../ship-design/shipyard.service';

/**
 * Facade service for game state management using the Command pattern.
 * 
 * This service provides a clean API for game operations while delegating
 * the actual work to command objects. This approach:
 * - Separates concerns (API vs implementation)
 * - Makes operations testable in isolation
 * - Enables future features like undo/redo, command queuing, etc.
 * - Reduces coupling between the facade and business logic services
 */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Computed signals for reactive state access
  get game() { return this.commandExecutor.game; }
  readonly turn = computed(() => this.game()?.turn ?? 0);
  readonly stars = computed(() => this.game()?.stars ?? []);
  readonly player = computed(() => this.game()?.humanPlayer);
  readonly playerSpecies = computed(() => this.player()?.species);
  readonly playerEconomy = computed(() => this.game()?.playerEconomy);
  readonly starIndex = computed(() => this.commandExecutor.starIndex());

  constructor(
    private gameInitializer: GameInitializerService,
    private hab: HabitabilityService,
    private commandExecutor: CommandExecutorService,
    private commandFactory: CommandFactoryService,
    private shipyardService: ShipyardService, // Still needed for read operations
  ) {}

  newGame(settings: GameSettings) {
    const state = this.gameInitializer.initializeGame(settings);
    this.shipyardService.hydrateCompiledDesignCache(state);
    this.commandExecutor.setGame(state);
  }

  habitabilityFor(starId: string): number {
    const species = this.playerSpecies();
    const star = this.commandExecutor.starIndex().get(starId);
    if (!species || !star) return 0;
    return this.hab.calculate(star, species);
  }

  // Turn management
  endTurn() {
    const command = this.commandFactory.createEndTurnCommand();
    this.commandExecutor.execute(command);
  }

  // Colony management
  addToBuildQueue(starId: string, item: BuildItem): boolean {
    const command = this.commandFactory.createAddToBuildQueueCommand(starId, item);
    const currentGame = this.commandExecutor.getCurrentGame();
    if (!currentGame) return false;

    const originalGame = currentGame;
    this.commandExecutor.execute(command);

    // Check if the game state actually changed
    return this.commandExecutor.getCurrentGame() !== originalGame;
  }

  setGovernor(starId: string, governor: Star['governor']) {
    const command = this.commandFactory.createSetGovernorCommand(starId, governor);
    this.commandExecutor.execute(command);
  }

  removeFromQueue(starId: string, index: number) {
    const command = this.commandFactory.createRemoveFromQueueCommand(starId, index);
    this.commandExecutor.execute(command);
  }

  // Fleet management
  issueFleetOrder(fleetId: string, order: FleetOrder) {
    const command = this.commandFactory.createIssueFleetOrderCommand(fleetId, order);
    this.commandExecutor.execute(command);
  }

  setFleetOrders(fleetId: string, orders: Array<FleetOrder>) {
    const command = this.commandFactory.createSetFleetOrdersCommand(fleetId, orders);
    this.commandExecutor.execute(command);
  }

  colonizeNow(fleetId: string): string | null {
    const command = this.commandFactory.createColonizeNowCommand(fleetId);
    return this.commandExecutor.executeWithResult(command);
  }

  loadCargo(
    fleetId: string,
    starId: string,
    manifest: {
      resources?: number | 'all' | 'fill';
      ironium?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    },
  ) {
    const command = this.commandFactory.createLoadCargoCommand(fleetId, starId, manifest);
    this.commandExecutor.execute(command);
  }

  unloadCargo(
    fleetId: string,
    starId: string,
    manifest: {
      resources?: number | 'all';
      ironium?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    },
  ) {
    const command = this.commandFactory.createUnloadCargoCommand(fleetId, starId, manifest);
    this.commandExecutor.execute(command);
  }

  decommissionFleet(fleetId: string) {
    const command = this.commandFactory.createDecommissionFleetCommand(fleetId);
    this.commandExecutor.execute(command);
  }

  splitFleet(
    fleetId: string,
    transferSpec: {
      ships: Array<{ designId: string; count: number; damage?: number }>;
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    },
  ): string | null {
    const command = this.commandFactory.createSplitFleetCommand(fleetId, transferSpec);
    return this.commandExecutor.executeWithResult(command);
  }

  separateFleet(fleetId: string) {
    const command = this.commandFactory.createSeparateFleetCommand(fleetId);
    this.commandExecutor.execute(command);
  }

  mergeFleets(sourceId: string, targetId: string) {
    const command = this.commandFactory.createMergeFleetsCommand(sourceId, targetId);
    this.commandExecutor.execute(command);
  }

  transferFleetCargo(
    sourceId: string,
    targetId: string,
    transferSpec: {
      ships: Array<{ designId: string; count: number; damage?: number }>;
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    },
  ) {
    const command = this.commandFactory.createTransferFleetCargoCommand(sourceId, targetId, transferSpec);
    this.commandExecutor.execute(command);
  }

  // Research management
  setResearchField(fieldId: TechField) {
    const command = this.commandFactory.createSetResearchFieldCommand(fieldId);
    this.commandExecutor.execute(command);
  }

  // Ship design management
  saveShipDesign(design: ShipDesign) {
    const command = this.commandFactory.createSaveShipDesignCommand(design);
    this.commandExecutor.execute(command);
  }

  deleteShipDesign(designId: string) {
    const command = this.commandFactory.createDeleteShipDesignCommand(designId);
    this.commandExecutor.execute(command);
  }

  getPlayerShipDesigns(): Array<ShipDesign> {
    const game = this.commandExecutor.getCurrentGame();
    if (!game) return [];
    return this.shipyardService.getPlayerShipDesigns(game);
  }
}
