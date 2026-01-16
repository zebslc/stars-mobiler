import { Injectable, signal, computed } from '@angular/core';
import type { GameCommand, GameCommandWithResult } from './game-command.interface';
import type { GameState, Star } from '../../models/game.model';

/**
 * Service responsible for executing game commands and managing state transitions.
 * This centralizes command execution and provides a single point for state updates.
 */
@Injectable({ providedIn: 'root' })
export class CommandExecutorService {
  private readonly _game = signal<GameState | null>(null);
  readonly game = this._game.asReadonly();

  /**
   * Star index for O(1) lookups by star ID.
   * Computed signal that rebuilds the index whenever game state changes.
   */
  readonly starIndex = computed(() => {
    const game = this._game();
    if (!game) return new Map<string, Star>();

    const index = new Map<string, Star>();
    for (const star of game.stars) {
      index.set(star.id, star);
    }
    return index;
  });

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