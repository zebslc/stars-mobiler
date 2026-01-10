import { GameCommand } from './game-command.interface';
import { GameState } from '../../models/game.model';
import { TurnService } from '../../services/turn.service';

/**
 * Command to end the current turn and process all game mechanics.
 */
export class EndTurnCommand implements GameCommand {
  constructor(private turnService: TurnService) {}

  execute(game: GameState): GameState {
    return this.turnService.endTurn(game);
  }
}