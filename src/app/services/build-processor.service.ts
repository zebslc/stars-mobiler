import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../models/game.model';
import { PlanetUtilityService } from './planet-utility.service';
import { BuildQueueService } from './build-queue.service';
import { BuildPaymentService } from './build-payment.service';
import { BuildProjectService } from './build-project.service';
import { StarbaseUpgradeService } from './starbase-upgrade.service';

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
   * Process build queues for all owned planets.
   */
  processBuildQueues(game: GameState) {
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      this.processPlanetBuildQueue(game, planet);
    }
  }

  /**
   * Process the build queue for a single planet.
   */
  private processPlanetBuildQueue(game: GameState, planet: Planet): void {
    let queue = planet.buildQueue ?? [];

    // Process items in queue until resources run out or queue is empty
    while (queue.length > 0) {
      const item = queue[0];
      const success = this.processBuildItem(game, planet, item);
      
      if (!success) {
        // Not finished, ran out of resources
        break;
      }
    }

    planet.buildQueue = queue;
  }

  /**
   * Process a single build item.
   * @returns true if the item was completed or progressed, false if resources ran out
   */
  private processBuildItem(game: GameState, planet: Planet, item: BuildItem): boolean {
    this.buildPayment.initializeItemPayment(item);
    
    const totalCost = this.buildPayment.calculateTotalCost(item);
    const starbaseInfo = this.starbaseUpgrade.handleStarbaseUpgrade(game, planet, item);
    const remaining = this.buildPayment.calculateRemainingCost(totalCost, item.paid!, starbaseInfo.scrapCredit);
    
    const paymentResult = this.buildPayment.processItemPayment(planet, item, remaining, totalCost, starbaseInfo.scrapCredit);
    
    if (paymentResult.isComplete) {
      this.completeBuildItem(game, planet, item, paymentResult.paid, starbaseInfo, totalCost);
      return true;
    }
    
    return false;
  }

  /**
   * Complete a build item.
   */
  private completeBuildItem(
    game: GameState,
    planet: Planet,
    item: BuildItem,
    paid: any,
    starbaseInfo: any,
    totalCost: any
  ): void {
    this.buildPayment.handleExcessRefunds(planet, paid, starbaseInfo.scrapCredit, totalCost);
    this.starbaseUpgrade.removeOldStarbase(game, starbaseInfo.existingFleet, starbaseInfo.existingStarbaseIndex);
    this.buildProject.executeBuildProject(game, planet, item);
    this.buildQueue.handleQueueProgression(item, planet.buildQueue ?? []);
  }
}