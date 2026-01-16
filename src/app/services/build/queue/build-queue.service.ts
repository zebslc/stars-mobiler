import { Injectable } from '@angular/core';
import { BuildItem, GameState } from '../../../models/game.model';
import { PlanetUtilityService } from '../../colony/planet-utility.service';

@Injectable({ providedIn: 'root' })
export class BuildQueueService {

  constructor(private planetUtility: PlanetUtilityService) {}

  /**
   * Add an item to a star's build queue.
   */
  addToBuildQueue(game: GameState, starId: string, item: BuildItem): GameState {
    const star = this.planetUtility.getOwnedStar(game, starId);
    if (!star) return game;

    // We don't spend resources here anymore. They are spent during turn processing.
    // Just add to queue.
    star.buildQueue = [...(star.buildQueue ?? []), item];

    return this.planetUtility.updateGameState(game);
  }

  /**
   * Remove an item from a star's build queue by index.
   */
  removeFromQueue(game: GameState, starId: string, index: number): GameState {
    const star = this.planetUtility.getOwnedStar(game, starId);
    if (!star || !star.buildQueue) return game;

    star.buildQueue = star.buildQueue.filter((_, i) => i !== index);
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