import type { GameState } from '../../models/game.model';

/**
 * Command interface for game operations.
 * Each command encapsulates a single game operation and its parameters.
 */
export interface GameCommand {
  /**
   * Execute the command on the given game state.
   * @param game Current game state
   * @returns New game state after applying the command
   */
  execute(game: GameState): GameState;
}

/**
 * Command that may return additional data along with the new game state.
 */
export interface GameCommandWithResult<T> {
  /**
   * Execute the command on the given game state.
   * @param game Current game state
   * @returns Tuple of [new game state, result data]
   */
  execute(game: GameState): [GameState, T];
}