import { GameCommand } from './game-command.interface';
import { GameState, BuildItem, Planet } from '../../models/game.model';
import { ColonyService } from '../../services/colony.service';

/**
 * Command to add an item to a planet's build queue.
 */
export class AddToBuildQueueCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private planetId: string,
    private item: BuildItem
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.addToBuildQueue(game, this.planetId, this.item);
  }
}

/**
 * Command to set a planet's governor.
 */
export class SetGovernorCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private planetId: string,
    private governor: Planet['governor']
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.setGovernor(game, this.planetId, this.governor);
  }
}

/**
 * Command to remove an item from a planet's build queue.
 */
export class RemoveFromQueueCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private planetId: string,
    private index: number
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.removeFromQueue(game, this.planetId, this.index);
  }
}