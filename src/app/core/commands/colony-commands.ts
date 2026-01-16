import type { GameCommand } from './game-command.interface';
import type { GameState, BuildItem, Star } from '../../models/game.model';
import type { ColonyService } from '../../services/colony/colony.service';

/**
 * Command to add an item to a star's build queue.
 */
export class AddToBuildQueueCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private starId: string,
    private item: BuildItem
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.addToBuildQueue(game, this.starId, this.item);
  }
}

/**
 * Command to set a star's governor.
 */
export class SetGovernorCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private starId: string,
    private governor: Star['governor']
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.setGovernor(game, this.starId, this.governor);
  }
}

/**
 * Command to remove an item from a star's build queue.
 */
export class RemoveFromQueueCommand implements GameCommand {
  constructor(
    private colonyService: ColonyService,
    private starId: string,
    private index: number
  ) {}

  execute(game: GameState): GameState {
    return this.colonyService.removeFromQueue(game, this.starId, this.index);
  }
}