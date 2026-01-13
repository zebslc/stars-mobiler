import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../../models/game.model';

@Injectable({ providedIn: 'root' })
export class PlanetUtilityService {
  
  /**
   * Build planet index for O(1) lookups.
   */
  buildPlanetIndex(game: GameState): Map<string, Planet> {
    const index = new Map<string, Planet>();
    for (const star of game.stars) {
      for (const planet of star.planets) {
        index.set(planet.id, planet);
      }
    }
    return index;
  }

  /**
   * Get a planet by ID and ensure it's owned by the human player.
   */
  getOwnedPlanet(game: GameState, planetId: string): Planet | null {
    const planet = this.buildPlanetIndex(game).get(planetId);
    return planet && planet.ownerId === game.humanPlayer.id ? planet : null;
  }

  /**
   * Get all owned planets that can have governors.
   */
  getOwnedPlanets(game: GameState): Planet[] {
    return game.stars
      .flatMap((s) => s.planets)
      .filter((p) => p.ownerId === game.humanPlayer.id);
  }

  /**
   * Update the game state to trigger Angular change detection.
   */
  updateGameState(game: GameState): GameState {
    return { ...game, stars: [...game.stars] };
  }
}