import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../models/game.model';
import { BuildQueueService } from './build-queue.service';
import { BuildProcessorService } from './build-processor.service';
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
   * Add an item to a planet's build queue.
   */
  addToBuildQueue(game: GameState, planetId: string, item: BuildItem): GameState {
    return this.buildQueue.addToBuildQueue(game, planetId, item);
  }

  /**
   * Remove an item from a planet's build queue by index.
   */
  removeFromQueue(game: GameState, planetId: string, index: number): GameState {
    return this.buildQueue.removeFromQueue(game, planetId, index);
  }

  // ============================
  // BUILD PROCESSING
  // ============================

  /**
   * Process build queues for all owned planets.
   */
  processBuildQueues(game: GameState): void {
    this.buildProcessor.processBuildQueues(game);
  }

  // ============================
  // GOVERNOR MANAGEMENT
  // ============================

  /**
   * Process governors for all owned planets.
   */
  processGovernors(game: GameState): void {
    this.governor.processGovernors(game);
  }

  /**
   * Set governor for a planet.
   */
  setGovernor(game: GameState, planetId: string, governor: Planet['governor']): GameState {
    return this.governor.setGovernor(game, planetId, governor);
  }
}