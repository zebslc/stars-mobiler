import { Injectable } from '@angular/core';
import { GameState, Star } from '../../models/game.model';
import { PlanetUtilityService } from './planet-utility.service';
import { BuildQueueService } from '../build/queue/build-queue.service';
import { BUILD_COSTS } from '../../data/costs.data';

@Injectable({ providedIn: 'root' })
export class GovernorService {

  constructor(
    private planetUtility: PlanetUtilityService,
    private buildQueue: BuildQueueService
  ) {}

  /**
   * Process governors for all owned stars.
   */
  processGovernors(game: GameState) {
    const ownedStars = this.planetUtility.getOwnedStars(game);
    for (const star of ownedStars) {
      if (!this.shouldProcessGovernor(star)) continue;
      this.processGovernorForStar(game, star);
    }
  }

  /**
   * Set governor for a star.
   */
  setGovernor(game: GameState, starId: string, governor: Star['governor']): GameState {
    const star = this.planetUtility.getOwnedStar(game, starId);
    if (!star) return game;

    star.governor = governor ?? { type: 'manual' };
    return this.planetUtility.updateGameState(game);
  }

  /**
   * Check if a star should have its governor process.
   */
  private shouldProcessGovernor(star: Star): boolean {
    return Boolean(
      star.governor &&
      star.governor.type !== 'manual' &&
      (star.buildQueue ?? []).length === 0
    );
  }

  /**
   * Process governor logic for a single star.
   */
  private processGovernorForStar(game: GameState, star: Star): void {
    if (!star.governor) return;

    switch (star.governor.type) {
      case 'balanced':
        this.processBalancedGovernor(game, star);
        break;
      case 'mining':
      case 'industrial':
      case 'military':
      case 'research':
        this.processSpecializedGovernor(game, star, star.governor.type);
        break;
      default:
        break;
    }
  }

  /**
   * Process governor logic for balanced type.
   */
  private processBalancedGovernor(game: GameState, star: Star): void {
    const minesTarget = Math.floor(star.population / 20);
    const factoriesTarget = Math.floor(star.population / 10);

    if (star.mines < minesTarget) {
      this.queueProject(game, star.id, 'mine');
    } else if (star.factories < factoriesTarget) {
      this.queueProject(game, star.id, 'factory');
    } else {
      this.queueProject(game, star.id, 'defense');
    }
  }

  /**
   * Queue a specific project for a star.
   */
  private queueProject(game: GameState, starId: string, project: string): void {
    this.buildQueue.addToBuildQueue(game, starId, {
      project: project as any,
      cost: BUILD_COSTS[project],
      isAuto: true,
    });
  }

  /**
   * Process governor logic for specialized types (mining, industrial, military, research).
   */
  private processSpecializedGovernor(game: GameState, star: Star, governorType: string): void {
    const projectMap: { [key: string]: string } = {
      mining: 'mine',
      industrial: 'factory',
      military: 'defense',
      research: 'research',
    };

    const project = projectMap[governorType];
    if (project) {
      this.queueProject(game, star.id, project);
    }
  }
}