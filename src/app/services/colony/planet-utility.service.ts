import { Injectable } from '@angular/core';
import type { GameState, Star } from '../../models/game.model';

@Injectable({ providedIn: 'root' })
export class PlanetUtilityService {

  /**
   * Build star index for O(1) lookups.
   */
  buildStarIndex(game: GameState): Map<string, Star> {
    const index = new Map<string, Star>();
    for (const star of game.stars) {
      index.set(star.id, star);
    }
    return index;
  }

  /**
   * Get a star by ID and ensure it's owned by the human player.
   */
  getOwnedStar(game: GameState, starId: string): Star | null {
    const star = this.buildStarIndex(game).get(starId);
    return star && star.ownerId === game.humanPlayer.id ? star : null;
  }

  /**
   * Get all owned stars that can have governors.
   */
  getOwnedStars(game: GameState): Array<Star> {
    return game.stars.filter((s) => s.ownerId === game.humanPlayer.id);
  }

  /**
   * Update the game state to trigger Angular change detection.
   */
  updateGameState(game: GameState): GameState {
    return { ...game, stars: [...game.stars] };
  }
}