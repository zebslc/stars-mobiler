import { Injectable } from '@angular/core';
import type { BuildItem, GameState, Star } from '../../models/game.model';
import { BuildQueueService } from '../build/queue/build-queue.service';
import { BuildProcessorService } from '../build/processor/build-processor.service';
import { GovernorService } from './governor.service';

@Injectable({ providedIn: 'root' })
export class ColonyService {
  constructor(
    private buildQueue: BuildQueueService,
    private buildProcessor: BuildProcessorService,
    private governor: GovernorService,
  ) {}

  // ============================
  // BUILD QUEUE MANAGEMENT
  // ============================

  /**
   * Add an item to a star's build queue.
   */
  addToBuildQueue(game: GameState, starId: string, item: BuildItem): GameState {
    return this.buildQueue.addToBuildQueue(game, starId, item);
  }

  /**
   * Remove an item from a star's build queue by index.
   */
  removeFromQueue(game: GameState, starId: string, index: number): GameState {
    return this.buildQueue.removeFromQueue(game, starId, index);
  }

  // ============================
  // BUILD PROCESSING
  // ============================

  /**
   * Process build queues for all owned stars.
   */
  processBuildQueues(game: GameState): void {
    this.buildProcessor.processBuildQueues(game);
  }

  // ============================
  // GOVERNOR MANAGEMENT
  // ============================

  /**
   * Process governors for all owned stars.
   */
  processGovernors(game: GameState): void {
    this.governor.processGovernors(game);
  }

  /**
   * Set governor for a star.
   */
  setGovernor(game: GameState, starId: string, governor: Star['governor']): GameState {
    return this.governor.setGovernor(game, starId, governor);
  }
}