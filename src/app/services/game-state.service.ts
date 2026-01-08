import { Injectable, computed, signal } from '@angular/core';
import {
  GameSettings,
  GameState,
  Planet,
  BuildItem,
  ShipDesign,
  FleetOrder,
} from '../models/game.model';
import { GameInitializerService } from './game-initializer.service';
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
    private gameInitializer: GameInitializerService,
    private hab: HabitabilityService,
    private settings: SettingsService,
    private turnService: TurnService,
    private researchService: ResearchService,
    private colonyService: ColonyService,
    private fleetService: FleetService,
    private shipyardService: ShipyardService,
  ) {}

  newGame(settings: GameSettings) {
    const state = this.gameInitializer.initializeGame(settings);
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
      ironium?: number | 'all' | 'fill';
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
      ironium?: number | 'all';
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

  splitFleet(
    fleetId: string,
    transferSpec: {
      ships: { designId: string; count: number; damage?: number }[];
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    },
  ): string | null {
    const game = this._game();
    if (!game) return null;
    const [nextGame, newFleetId] = this.fleetService.splitFleet(game, fleetId, transferSpec);
    this._game.set(nextGame);
    return newFleetId;
  }

  separateFleet(fleetId: string) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.separateFleet(game, fleetId);
    this._game.set(nextGame);
  }

  mergeFleets(sourceId: string, targetId: string) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.mergeFleets(game, sourceId, targetId);
    this._game.set(nextGame);
  }

  transferFleetCargo(
    sourceId: string,
    targetId: string,
    transferSpec: {
      ships: { designId: string; count: number; damage?: number }[];
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    },
  ) {
    const game = this._game();
    if (!game) return;
    const nextGame = this.fleetService.transfer(game, sourceId, targetId, transferSpec);
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
