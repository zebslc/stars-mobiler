import { Injectable, computed, signal } from '@angular/core';
import { GameSettings, GameState, Player, AIPlayer, Star } from '../models/game.model';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { SPECIES } from '../data/species.data';
import { HabitabilityService } from './habitability.service';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private _game = signal<GameState | null>(null);

  readonly game = this._game.asReadonly();
  readonly turn = computed(() => this._game()?.turn ?? 0);
  readonly stars = computed(() => this._game()?.stars ?? []);
  readonly player = computed(() => this._game()?.humanPlayer);
  readonly playerSpecies = computed(() => this.player()?.species);

  constructor(
    private galaxy: GalaxyGeneratorService,
    private hab: HabitabilityService
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
      ownedPlanetIds: []
    };
    const ai: AIPlayer = {
      id: 'ai-1',
      name: 'AI',
      species: aiSpecies,
      ownedPlanetIds: [],
      brain: { personality: 'expansionist', difficulty: settings.aiDifficulty }
    };

    this.galaxy.assignStartPositions(stars, human.id, ai.id, playerSpecies, aiSpecies, settings.seed);
    // Fill starId in planets and set ownership/homeworlds
    for (const star of stars) {
      for (const planet of star.planets) {
        planet.starId = star.id;
      }
    }
    const humanHome = stars[0].planets[0];
    const aiHome = stars[stars.length - 1].planets[0];
    humanHome.ownerId = human.id;
    aiHome.ownerId = ai.id;
    human.ownedPlanetIds.push(humanHome.id);
    ai.ownedPlanetIds.push(aiHome.id);

    const state: GameState = {
      id: `game-${Date.now()}`,
      seed: settings.seed,
      turn: 1,
      settings,
      stars,
      humanPlayer: human,
      aiPlayers: [ai],
      fleets: []
    };
    this._game.set(state);
  }

  habitabilityFor(planetId: string): number {
    const species = this.playerSpecies();
    const planet = this.stars().flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!species || !planet) return 0;
    return this.hab.calculate(planet, species);
  }
}

