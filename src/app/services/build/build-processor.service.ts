import { Injectable } from '@angular/core';
import { BuildItem, GameState, Star } from '../../models/game.model';
import { PlanetUtilityService } from '../colony/planet-utility.service';
import { BuildQueueService } from './build-queue.service';
import { BuildPaymentService } from './build-payment.service';
import { BuildProjectService } from './build-project.service';
import { StarbaseUpgradeService } from '../ship-design/starbase-upgrade.service';

@Injectable({ providedIn: 'root' })
export class BuildProcessorService {

  constructor(
    private planetUtility: PlanetUtilityService,
    private buildQueue: BuildQueueService,
    private buildPayment: BuildPaymentService,
    private buildProject: BuildProjectService,
    private starbaseUpgrade: StarbaseUpgradeService
  ) {}

  /**
   * Process build queues for all owned stars.
   */
  processBuildQueues(game: GameState) {
    for (const star of game.stars) {
      if (star.ownerId !== game.humanPlayer.id) continue;
      this.processStarBuildQueue(game, star);
    }
  }

  /**
   * Process the build queue for a single star.
   */
  private processStarBuildQueue(game: GameState, star: Star): void {
    const queue = star.buildQueue ?? [];

    // Process items in queue until resources run out or queue is empty
    while (queue.length > 0) {
      const item = queue[0];
      const success = this.processBuildItem(game, star, item);

      if (!success) {
        // Not finished, ran out of resources
        break;
      }
    }

    star.buildQueue = queue;
  }

  /**
   * Process a single build item.
   * @returns true if the item was completed or progressed, false if resources ran out
   */
  private processBuildItem(game: GameState, star: Star, item: BuildItem): boolean {
    this.buildPayment.initializeItemPayment(item);

    const totalCost = this.buildPayment.calculateTotalCost(item);
    const starbaseInfo = this.starbaseUpgrade.handleStarbaseUpgrade(game, star, item);
    const remaining = this.buildPayment.calculateRemainingCost(totalCost, item.paid!, starbaseInfo.scrapCredit);

    const paymentResult = this.buildPayment.processItemPayment(star, item, remaining, totalCost, starbaseInfo.scrapCredit);

    if (paymentResult.isComplete) {
      this.completeBuildItem(game, star, item, paymentResult.paid, starbaseInfo, totalCost);
      return true;
    }

    return false;
  }

  /**
   * Complete a build item.
   */
  private completeBuildItem(
    game: GameState,
    star: Star,
    item: BuildItem,
    paid: any,
    starbaseInfo: any,
    totalCost: any
  ): void {
    this.buildPayment.handleExcessRefunds(star, paid, starbaseInfo.scrapCredit, totalCost);
    this.starbaseUpgrade.removeOldStarbase(game, starbaseInfo.existingFleet, starbaseInfo.existingStarbaseIndex);
    this.buildProject.executeBuildProject(game, star, item);
    this.buildQueue.handleQueueProgression(item, star.buildQueue ?? []);
  }
}