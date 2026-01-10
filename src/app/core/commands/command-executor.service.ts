import { Injectable, signal } from '@angular/core';
import { GameCommand, GameCommandWithResult } from './game-command.interface';
import { GameState } from '../../models/game.model';

/**
 * Service responsible for executing game commands and managing state transitions.
 * This centralizes command execution and provides a single point for state updates.
 */
@Injectable({ providedIn: 'root' })
export class CommandExecutorService {
  private _game = signal<GameState | null>(null);
  readonly game = this._game.asReadonly();

  /**
   * Execute a command that only returns a new game state.
   */
  execute(command: GameCommand): void {
    const currentGame = this._game();
    if (!currentGame) return;

    const newGame = command.execute(currentGame);
    this._game.set(newGame);
  }

  /**
   * Execute a command that returns both a new game state and additional result data.
   */
  executeWithResult<T>(command: GameCommandWithResult<T>): T | null {
    const currentGame = this._game();
    if (!currentGame) return null;

    const [newGame, result] = command.execute(currentGame);
    this._game.set(newGame);
    return result;
  }

  /**
   * Set the initial game state.
   */
  setGame(game: GameState): void {
    this._game.set(game);
  }

  /**
   * Get the current game state (for read-only operations).
   */
  getCurrentGame(): GameState | null {
    return this._game();
  }
}