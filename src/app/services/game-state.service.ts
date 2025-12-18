import { Injectable, computed, signal } from '@angular/core';
import {
  GameSettings,
  GameState,
  Player,
  AIPlayer,
  Planet,
  BuildItem,
  ShipDesign,
  FleetOrder,
} from '../models/game.model';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { SPECIES } from '../data/species.data';
import { HabitabilityService } from './habitability.service';
import { TechField } from '../data/tech-tree.data';

import { SettingsService } from './settings.service';
import { TurnService } from './turn.service';
import { ResearchService } from './research.service';
import { ColonyService } from './colony.service';
import { FleetService } from './fleet.service';
import { ShipyardService } from './shipyard.service';

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
    private settings: SettingsService,
    private turnService: TurnService,
    private researchService: ResearchService,
    private colonyService: ColonyService,
    private fleetService: FleetService,
    private shipyardService: ShipyardService,
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
      techLevels: {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
      },
      researchProgress: {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      },
      selectedResearchField: 'Propulsion',
    };
    const ai: AIPlayer = {
      id: 'ai-1',
      name: 'AI',
      species: aiSpecies,
      ownedPlanetIds: [],
      techLevels: {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
      },
      researchProgress: {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      },
      selectedResearchField: 'Propulsion',
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
      humanHome.resources = 100;
      humanHome.surfaceMinerals.iron += 200;
      humanHome.surfaceMinerals.boranium += 150;
      humanHome.surfaceMinerals.germanium += 100;
      humanHome.buildQueue = [];
      humanHome.governor = { type: 'balanced' };
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
        transferRange: 300,
        freighterCapacity: 100,
        research: 0,
      },
      shipDesigns: [],
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
    const nextGame = this.turnService.endTurn(game);
    this._game.set(nextGame);
  }

  addToBuildQueue(planetId: string, item: BuildItem): boolean {
    const game = this._game();
    if (!game) return false;
    const nextGame = this.colonyService.addToBuildQueue(game, planetId, item);
    if (nextGame !== game) {
      this._game.set(nextGame);
      return true;
    }
    return false;
  }

  setGovernor(planetId: string, governor: Planet['governor']) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.colonyService.setGovernor(game, planetId, governor);
    this._game.set(nextGame);
  }

  removeFromQueue(planetId: string, index: number) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.colonyService.removeFromQueue(game, planetId, index);
    this._game.set(nextGame);
  }

  issueFleetOrder(fleetId: string, order: FleetOrder) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.setFleetOrders(game, fleetId, [order]);
    this._game.set(nextGame);
  }

  setFleetOrders(fleetId: string, orders: FleetOrder[]) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.setFleetOrders(game, fleetId, orders);
    this._game.set(nextGame);
  }

  colonizeNow(fleetId: string): string | null {
    const game = this._game();
    if (!game) return null;
    const [nextGame, planetId] = this.fleetService.colonizeNow(game, fleetId);
    if (planetId) {
      this._game.set(nextGame);
    }
    return planetId;
  }

  loadCargo(
    fleetId: string,
    planetId: string,
    manifest: {
      resources?: number | 'all' | 'fill';
      iron?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    },
  ) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.loadCargo(game, fleetId, planetId, manifest);
    this._game.set(nextGame);
  }

  unloadCargo(
    fleetId: string,
    planetId: string,
    manifest: {
      resources?: number | 'all';
      iron?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    },
  ) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.unloadCargo(game, fleetId, planetId, manifest);
    this._game.set(nextGame);
  }

  setResearchField(fieldId: TechField) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.researchService.setResearchField(game, fieldId);
    this._game.set(nextGame);
  }

  saveShipDesign(design: ShipDesign) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.shipyardService.saveShipDesign(game, design);
    this._game.set(nextGame);
  }

  deleteShipDesign(designId: string) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.shipyardService.deleteShipDesign(game, designId);
    this._game.set(nextGame);
  }

  getPlayerShipDesigns(): ShipDesign[] {
    const game = this._game();
    if (!game) return [];
    return this.shipyardService.getPlayerShipDesigns(game);
  }
}
