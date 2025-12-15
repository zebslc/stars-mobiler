import { Injectable, computed, signal } from '@angular/core';
import {
  GameSettings,
  GameState,
  Player,
  AIPlayer,
  Star,
  PlayerEconomy,
  Planet,
  BuildItem,
} from '../models/game.model';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { SPECIES } from '../data/species.data';
import { HabitabilityService } from './habitability.service';
import { EconomyService } from './economy.service';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private _game = signal<GameState | null>(null);

  readonly game = this._game.asReadonly();
  readonly turn = computed(() => this._game()?.turn ?? 0);
  readonly stars = computed(() => this._game()?.stars ?? []);
  readonly player = computed(() => this._game()?.humanPlayer);
  readonly playerSpecies = computed(() => this.player()?.species);
  readonly playerEconomy = computed(() => this._game()?.playerEconomy);

  constructor(
    private galaxy: GalaxyGeneratorService,
    private hab: HabitabilityService,
    private economy: EconomyService,
  ) {}

  newGame(settings: GameSettings) {
    const starCount =
      settings.galaxySize === 'small' ? 16 : settings.galaxySize === 'medium' ? 24 : 36;
    const stars = this.galaxy.generateGalaxy(starCount, settings.seed);
    const playerSpecies = SPECIES.find((s) => s.id === settings.speciesId)!;
    const aiSpecies = SPECIES.find((s) => s.id !== settings.speciesId)!;

    const human: Player = {
      id: 'human',
      name: 'You',
      species: playerSpecies,
      ownedPlanetIds: [],
    };
    const ai: AIPlayer = {
      id: 'ai-1',
      name: 'AI',
      species: aiSpecies,
      ownedPlanetIds: [],
      brain: { personality: 'expansionist', difficulty: settings.aiDifficulty },
    };

    this.galaxy.assignStartPositions(
      stars,
      human.id,
      ai.id,
      playerSpecies,
      aiSpecies,
      settings.seed,
    );
    // Fill starId in planets and set ownership/homeworlds
    for (const star of stars) {
      for (const planet of star.planets) {
        planet.starId = star.id;
      }
    }
    const humanHome = stars.flatMap((s) => s.planets).find((p) => p.name === 'Home');
    const aiHome = stars.flatMap((s) => s.planets).find((p) => p.name === 'Enemy Home');
    if (humanHome) {
      humanHome.ownerId = human.id;
      human.ownedPlanetIds.push(humanHome.id);
    }
    if (aiHome) {
      aiHome.ownerId = ai.id;
      ai.ownedPlanetIds.push(aiHome.id);
    }

    const state: GameState = {
      id: `game-${Date.now()}`,
      seed: settings.seed,
      turn: 1,
      settings,
      stars,
      humanPlayer: human,
      aiPlayers: [ai],
      fleets: [],
      playerEconomy: {
        resources: 100,
        minerals: { iron: 200, boranium: 150, germanium: 100 },
        transferRange: 300,
        freighterCapacity: 100,
      },
    };
    this._game.set(state);
  }

  habitabilityFor(planetId: string): number {
    const species = this.playerSpecies();
    const planet = this.stars()
      .flatMap((s) => s.planets)
      .find((p) => p.id === planetId);
    if (!species || !planet) return 0;
    return this.hab.calculate(planet, species);
  }

  endTurn() {
    const game = this._game();
    if (!game) return;
    this.processGovernors(game);
    // Production completes
    let totalResources = 0;
    let iron = 0,
      bo = 0,
      ge = 0;
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const prod = this.economy.calculateProduction(planet);
      totalResources += prod.resources;
      iron += Math.floor(prod.extraction.iron);
      bo += Math.floor(prod.extraction.boranium);
      ge += Math.floor(prod.extraction.germanium);
      this.economy.applyMiningDepletion(planet, prod.extraction);
    }
    game.playerEconomy.resources += totalResources;
    game.playerEconomy.minerals.iron += iron;
    game.playerEconomy.minerals.boranium += bo;
    game.playerEconomy.minerals.germanium += ge;
    // Population grows
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const habPct = this.habitabilityFor(planet.id);
      const growthRate = (Math.max(0, habPct) / 100) * 0.1;
      const growth = this.economy.logisticGrowth(
        planet.population,
        planet.maxPopulation,
        growthRate,
      );
      planet.population = Math.min(planet.maxPopulation, planet.population + growth);
    }
    // Mining already applied above; increment turn
    // Process one build item per owned planet
    this.processBuildQueues(game);
    game.turn++;
    this._game.set({ ...game });
  }

  addToBuildQueue(planetId: string, item: BuildItem): boolean {
    const game = this._game();
    if (!game) return false;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return false;
    const ok = this.economy.spend(game.playerEconomy, item.cost);
    if (!ok) {
      console.warn('Insufficient stockpile for project', item);
      return false;
    }
    planet.buildQueue = [...(planet.buildQueue ?? []), item];
    this._game.set({ ...game });
    return true;
  }

  private processBuildQueues(game: GameState) {
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const queue = planet.buildQueue ?? [];
      if (queue.length === 0) continue;
      const item = queue[0];
      switch (item.project) {
        case 'mine':
          planet.mines += 1;
          break;
        case 'factory':
          planet.factories += 1;
          break;
        case 'defense':
          planet.defenses += 1;
          break;
        case 'terraform':
          planet.temperature +=
            planet.temperature < game.humanPlayer.species.habitat.idealTemperature ? 1 : -1;
          planet.atmosphere +=
            planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere ? 1 : -1;
          break;
        default:
          break;
      }
      planet.buildQueue = queue.slice(1);
    }
  }

  private processGovernors(game: GameState) {
    const owned = game.stars
      .flatMap((s) => s.planets)
      .filter((p) => p.ownerId === game.humanPlayer.id);
    for (const planet of owned) {
      if (!planet.governor || planet.governor.type === 'manual') continue;
      if ((planet.buildQueue ?? []).length > 0) continue;
      switch (planet.governor.type) {
        case 'balanced': {
          const minesTarget = Math.floor(planet.population / 20);
          if (planet.mines < minesTarget) {
            this.addToBuildQueue(planet.id, { project: 'mine', cost: { resources: 5 } });
          } else if (planet.factories < Math.floor(planet.population / 10)) {
            this.addToBuildQueue(planet.id, {
              project: 'factory',
              cost: { resources: 10, germanium: 4 },
            });
          } else {
            this.addToBuildQueue(planet.id, {
              project: 'defense',
              cost: { resources: 15, iron: 2, boranium: 2 },
            });
          }
          break;
        }
        case 'mining':
          this.addToBuildQueue(planet.id, { project: 'mine', cost: { resources: 5 } });
          break;
        case 'industrial':
          this.addToBuildQueue(planet.id, {
            project: 'factory',
            cost: { resources: 10, germanium: 4 },
          });
          break;
        case 'military':
          this.addToBuildQueue(planet.id, {
            project: 'defense',
            cost: { resources: 15, iron: 2, boranium: 2 },
          });
          break;
      }
    }
  }

  setGovernor(
    planetId: string,
    type: Planet['governor'] extends infer T ? (T extends { type: infer K } ? K : never) : never,
  ) {
    const game = this._game();
    if (!game) return;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return;
    planet.governor = { type: type as any };
    this._game.set({ ...game });
  }

  removeFromQueue(planetId: string, index: number) {
    const game = this._game();
    if (!game) return;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || !planet.buildQueue) return;
    planet.buildQueue = planet.buildQueue.filter((_, i) => i !== index);
    this._game.set({ ...game });
  }
}
