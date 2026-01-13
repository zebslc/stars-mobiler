import { Injectable } from '@angular/core';
import { GameState } from '../../models/game.model';
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
    // Production completes - distribute to each planet
    let totalResearch = 0;
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const prod = this.economy.calculateProduction(planet);
      // Add production directly to this planet
      planet.resources += prod.resources;
      // Mining extraction is applied to surface minerals in applyMiningDepletion
      this.economy.applyMiningDepletion(planet, prod.extraction);

      // Calculate Research
      // 1 Lab = 1 RP ? Or depends on resources?
      // Let's say 1 Lab = 1 RP for now.
      // Modifiers from species traits could apply here.
      const researchTrait =
        game.humanPlayer.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
      const baseResearch = planet.research || 0;
      totalResearch += baseResearch * (1 + researchTrait);
    }
    game.playerEconomy.research += totalResearch;

    // Distribute research across all tech fields
    this.research.advanceResearch(game, totalResearch);

    // Population grows or dies
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const habPct = this.hab.calculate(planet, game.humanPlayer.species);

      if (habPct > 0) {
        // Update maxPopulation based on hab
        planet.maxPopulation = Math.floor(1_000_000 * (habPct / 100));

        // Positive habitability: Logistic Growth
        const growthRate = (habPct / 100) * 0.1;
        const growth = this.economy.logisticGrowth(
          planet.population,
          planet.maxPopulation,
          growthRate,
        );
        planet.population = Math.min(planet.maxPopulation, planet.population + growth);
      } else {
        // Negative habitability: Die-off
        // Lose 10% per 10% negative habitability, min 5% loss per turn if occupied
        const lossRate = Math.min(0.15, Math.abs(habPct / 100) * 0.15);
        // Example: -45% hab -> 0.45 * 0.15 ~= 6.75% loss
        // Let's make it clearer: 3 turns to lose all? That's ~33% loss/turn.
        // User says "lose all in 3 turns" is a bug, implies it's too fast or unexpected.
        // If hab is negative, they SHOULD die off unless terraformed.
        // But if user says "it does not show any losses expected", the UI is wrong.
        // We will fix the logic here to be standard (e.g. 10% per turn max) and ensure UI shows it.
        const decay = Math.ceil(planet.population * lossRate);
        planet.population = Math.max(0, planet.population - decay);
        if (planet.population === 0) {
          planet.ownerId = 'neutral'; // Colony lost
        }
      }
    }
    // Mining already applied above; increment turn
    // Process one build item per owned planet (Finish previous work)
    this.colony.processBuildQueues(game);

    // Schedule builds if queue is empty (Prepare for next work)
    this.colony.processGovernors(game);

    // Movement and colonization
    this.fleet.processFleets(game);
    game.turn++;
    // Create new array references to ensure signal change detection triggers
    const nextGame = {
      ...game,
      humanPlayer: { ...game.humanPlayer },
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
    return nextGame;
  }
}
