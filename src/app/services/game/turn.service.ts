import { Injectable } from '@angular/core';
import { GameState, Star, Player } from '../../models/game.model';
import { EconomyService } from '../colony/economy.service';
import { ResearchService } from '../tech/research.service';
import { ColonyService } from '../colony/colony.service';
import { FleetService } from '../fleet/fleet.service';
import { HabitabilityService } from '../colony/habitability.service';

@Injectable({ providedIn: 'root' })
export class TurnService {
  constructor(
    private economy: EconomyService,
    private research: ResearchService,
    private colony: ColonyService,
    private fleet: FleetService,
    private hab: HabitabilityService,
  ) {}

  endTurn(game: GameState): GameState {
    const ownedStars = this.getOwnedStars(game);

    const totalResearch = this.processProduction(ownedStars, game.humanPlayer);
    this.processResearch(game, totalResearch);
    this.processPopulation(ownedStars, game.humanPlayer);
    this.processColonies(game);
    this.processFleets(game);

    return this.createNextGameState(game);
  }

  /**
   * Get all stars owned by the human player.
   */
  getOwnedStars(game: GameState): Star[] {
    return game.stars
      .map((s) => s)
      .filter((p) => p.ownerId === game.humanPlayer.id);
  }

  /**
   * Process production for all owned planets.
   * Returns total research points generated.
   */
  processProduction(planets: Star[], player: Player): number {
    let totalResearch = 0;
    const researchModifier = this.getResearchModifier(player);

    for (const planet of planets) {
      this.processPlanetProduction(planet);
      totalResearch += this.calculatePlanetResearch(planet, researchModifier);
    }

    return totalResearch;
  }

  /**
   * Process production for a single planet.
   */
  processPlanetProduction(planet: Star): void {
    const prod = this.economy.calculateProduction(planet);
    planet.resources += prod.resources;
    this.economy.applyMiningDepletion(planet, prod.extraction);
  }

  /**
   * Get research modifier from species traits.
   */
  getResearchModifier(player: Player): number {
    return player.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
  }

  /**
   * Calculate research points from a planet.
   */
  calculatePlanetResearch(planet: Star, modifier: number): number {
    const baseResearch = planet.research || 0;
    return baseResearch * (1 + modifier);
  }

  /**
   * Process research advancement.
   */
  processResearch(game: GameState, totalResearch: number): void {
    game.playerEconomy.research += totalResearch;
    this.research.advanceResearch(game, totalResearch);
  }

  /**
   * Process population growth or die-off for all owned planets.
   */
  processPopulation(planets: Star[], player: Player): void {
    for (const planet of planets) {
      const habPct = this.hab.calculate(planet, player.species);

      if (habPct > 0) {
        this.applyPopulationGrowth(planet, habPct);
      } else {
        this.applyPopulationDecay(planet, habPct);
      }
    }
  }

  /**
   * Apply population growth for positive habitability.
   */
  applyPopulationGrowth(planet: Star, habPct: number): void {
    planet.maxPopulation = Math.floor(1_000_000 * (habPct / 100));
    const growthRate = (habPct / 100) * 0.1;
    const growth = this.economy.logisticGrowth(
      planet.population,
      planet.maxPopulation,
      growthRate,
    );
    planet.population = Math.min(planet.maxPopulation, planet.population + growth);
  }

  /**
   * Apply population decay for negative habitability.
   */
  applyPopulationDecay(planet: Star, habPct: number): void {
    const lossRate = Math.min(0.15, Math.abs(habPct / 100) * 0.15);
    const decay = Math.ceil(planet.population * lossRate);
    planet.population = Math.max(0, planet.population - decay);

    if (planet.population === 0) {
      planet.ownerId = 'neutral';
    }
  }

  /**
   * Process colony build queues and governors.
   */
  processColonies(game: GameState): void {
    this.colony.processBuildQueues(game);
    this.colony.processGovernors(game);
  }

  /**
   * Process fleet movement and orders.
   */
  processFleets(game: GameState): void {
    this.fleet.processFleets(game);
  }

  /**
   * Create the next game state with updated turn and fresh references.
   */
  createNextGameState(game: GameState): GameState {
    game.turn++;
    return {
      ...game,
      humanPlayer: { ...game.humanPlayer },
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
  }
}
