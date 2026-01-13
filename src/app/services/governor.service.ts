import { Injectable } from '@angular/core';
import { GameState, Planet } from '../models/game.model';
import { PlanetUtilityService } from './planet-utility.service';
import { BuildQueueService } from './build-queue.service';
import { BUILD_COSTS } from '../data/costs.data';

@Injectable({ providedIn: 'root' })
export class GovernorService {
  
  constructor(
    private planetUtility: PlanetUtilityService,
    private buildQueue: BuildQueueService
  ) {}

  /**
   * Process governors for all owned planets.
   */
  processGovernors(game: GameState) {
    const ownedPlanets = this.planetUtility.getOwnedPlanets(game);
    for (const planet of ownedPlanets) {
      if (!this.shouldProcessGovernor(planet)) continue;
      this.processGovernorForPlanet(game, planet);
    }
  }

  /**
   * Set governor for a planet.
   */
  setGovernor(game: GameState, planetId: string, governor: Planet['governor']): GameState {
    const planet = this.planetUtility.getOwnedPlanet(game, planetId);
    if (!planet) return game;
    
    planet.governor = governor ?? { type: 'manual' };
    return this.planetUtility.updateGameState(game);
  }

  /**
   * Check if a planet should have its governor process.
   */
  private shouldProcessGovernor(planet: Planet): boolean {
    return Boolean(
      planet.governor &&
      planet.governor.type !== 'manual' &&
      (planet.buildQueue ?? []).length === 0
    );
  }

  /**
   * Process governor logic for a single planet.
   */
  private processGovernorForPlanet(game: GameState, planet: Planet): void {
    if (!planet.governor) return;

    switch (planet.governor.type) {
      case 'balanced':
        this.processBalancedGovernor(game, planet);
        break;
      case 'mining':
      case 'industrial':
      case 'military':
      case 'research':
        this.processSpecializedGovernor(game, planet, planet.governor.type);
        break;
      default:
        break;
    }
  }

  /**
   * Process governor logic for balanced type.
   */
  private processBalancedGovernor(game: GameState, planet: Planet): void {
    const minesTarget = Math.floor(planet.population / 20);
    const factoriesTarget = Math.floor(planet.population / 10);
    
    if (planet.mines < minesTarget) {
      this.queueProject(game, planet.id, 'mine');
    } else if (planet.factories < factoriesTarget) {
      this.queueProject(game, planet.id, 'factory');
    } else {
      this.queueProject(game, planet.id, 'defense');
    }
  }

  /**
   * Queue a specific project for a planet.
   */
  private queueProject(game: GameState, planetId: string, project: string): void {
    this.buildQueue.addToBuildQueue(game, planetId, {
      project: project as any,
      cost: BUILD_COSTS[project],
      isAuto: true,
    });
  }

  /**
   * Process governor logic for specialized types (mining, industrial, military, research).
   */
  private processSpecializedGovernor(game: GameState, planet: Planet, governorType: string): void {
    const projectMap: { [key: string]: string } = {
      mining: 'mine',
      industrial: 'factory',
      military: 'defense',
      research: 'research',
    };

    const project = projectMap[governorType];
    if (project) {
      this.queueProject(game, planet.id, project);
    }
  }
}