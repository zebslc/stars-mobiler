import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../../models/game.model';
import { PlanetUtilityService } from '../colony/planet-utility.service';

@Injectable({ providedIn: 'root' })
export class BuildQueueService {
  
  constructor(private planetUtility: PlanetUtilityService) {}

  /**
   * Add an item to a planet's build queue.
   */
  addToBuildQueue(game: GameState, planetId: string, item: BuildItem): GameState {
    const planet = this.planetUtility.getOwnedPlanet(game, planetId);
    if (!planet) return game;

    // We don't spend resources here anymore. They are spent during turn processing.
    // Just add to queue.
    planet.buildQueue = [...(planet.buildQueue ?? []), item];

    return this.planetUtility.updateGameState(game);
  }

  /**
   * Remove an item from a planet's build queue by index.
   */
  removeFromQueue(game: GameState, planetId: string, index: number): GameState {
    const planet = this.planetUtility.getOwnedPlanet(game, planetId);
    if (!planet || !planet.buildQueue) return game;
    
    planet.buildQueue = planet.buildQueue.filter((_, i) => i !== index);
    return this.planetUtility.updateGameState(game);
  }

  /**
   * Handle item queue management after completion or partial completion.
   */
  handleQueueProgression(item: BuildItem, queue: BuildItem[]): void {
    if (item.count && item.count > 1) {
      item.count--;
      item.paid = undefined; // Reset for next unit
    } else {
      queue.shift(); // Remove completed item
    }
  }
}