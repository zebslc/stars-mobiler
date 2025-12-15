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
import { getDesign } from '../data/ships.data';

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
    // Movement and colonization
    this.processFleets(game);
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
        case 'ship': {
          const designId = item.shipDesignId ?? 'scout';
          const orbitFleets = game.fleets.filter(
            (f) =>
              f.ownerId === game.humanPlayer.id &&
              f.location.type === 'orbit' &&
              f.location.planetId === planet.id,
          );
          let fleet = orbitFleets[0];
          if (!fleet) {
            fleet = {
              id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              ownerId: game.humanPlayer.id,
              location: { type: 'orbit', planetId: planet.id },
              ships: [],
              fuel: 0,
              cargo: { minerals: { iron: 0, boranium: 0, germanium: 0 }, colonists: 0 },
              orders: [],
            };
            game.fleets.push(fleet);
          }
          const stack = fleet.ships.find((s) => s.designId === designId);
          if (stack) stack.count += 1;
          else fleet.ships.push({ designId, count: 1, damage: 0 });
          // Add starting fuel based on design
          fleet.fuel += getDesign(designId).fuelCapacity;
          break;
        }
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
        case 'shipyard': {
          const designId = planet.governor.shipDesignId ?? 'scout';
          const limit = planet.governor.buildLimit ?? 0;
          const queuedShips = (planet.buildQueue ?? []).filter((i) => i.project === 'ship').length;
          if (limit === 0 || queuedShips < limit) {
            const cost = this.getShipCost(designId);
            this.addToBuildQueue(planet.id, { project: 'ship', cost, shipDesignId: designId });
          }
          break;
        }
      }
    }
  }

  setGovernor(planetId: string, governor: Planet['governor']) {
    const game = this._game();
    if (!game) return;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return;
    planet.governor = governor ?? { type: 'manual' };
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

  issueFleetOrder(fleetId: string, order: import('../models/game.model').FleetOrder) {
    const game = this._game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) return;
    fleet.orders = [order];
    this._game.set({ ...game });
  }

  private processFleets(game: GameState) {
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;
      const order = fleet.orders[0];
      if (!order) continue;
      if (order.type === 'move') {
        const stats = this.calculateMovementStats(fleet);
        const dest = order.destination;
        const curr =
          fleet.location.type === 'orbit'
            ? this.planetPosition(game, fleet.location.planetId)
            : { x: fleet.location.x, y: fleet.location.y };
        const dist = Math.hypot(dest.x - curr.x, dest.y - curr.y);
        const perLy = this.fuelCostPerLightYear(
          stats.totalMass,
          stats.maxWarp,
          stats.bestEfficiency,
        );
        const maxLy = perLy > 0 ? fleet.fuel / perLy : 1000;
        if (dist <= maxLy) {
          fleet.fuel = Math.max(0, fleet.fuel - perLy * dist);
          fleet.location = { type: 'space', x: dest.x, y: dest.y };
          fleet.orders = [];
        } else {
          // Move as far as fuel allows
          const ratio = maxLy / dist;
          const nx = curr.x + (dest.x - curr.x) * ratio;
          const ny = curr.y + (dest.y - curr.y) * ratio;
          fleet.fuel = 0;
          fleet.location = { type: 'space', x: nx, y: ny };
        }
      } else if (order.type === 'colonize') {
        const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === order.planetId);
        if (!planet) continue;
        const hasColony = fleet.ships.some(
          (s) => getDesign(s.designId).colonyModule && s.count > 0,
        );
        const hab = this.habitabilityFor(order.planetId);
        if (hasColony && hab > 0) {
          // consume one colony ship
          const stack = fleet.ships.find((s) => getDesign(s.designId).colonyModule);
          if (stack) {
            stack.count -= 1;
            if (stack.count <= 0) {
              fleet.ships = fleet.ships.filter((s) => s !== stack);
            }
          }
          planet.ownerId = game.humanPlayer.id;
          planet.population = Math.max(planet.population, 25_000);
          planet.maxPopulation = Math.max(planet.maxPopulation, 250_000);
          fleet.orders = [];
        }
      }
    }
  }

  private planetPosition(game: GameState, planetId: string): { x: number; y: number } {
    const star = game.stars.find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  private calculateMovementStats(fleet: import('../models/game.model').Fleet) {
    let maxWarp = Infinity;
    let totalMass = 0;
    let totalFuel = 0;
    let bestEfficiency = Infinity;
    for (const stack of fleet.ships) {
      const d = getDesign(stack.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      totalMass += (d.armor + d.shields + d.firepower) * stack.count;
      totalFuel += d.fuelCapacity * stack.count;
      if (d.fuelEfficiency < bestEfficiency && d.fuelEfficiency >= 0)
        bestEfficiency = d.fuelEfficiency;
    }
    totalMass += fleet.cargo.colonists / 100;
    totalMass +=
      fleet.cargo.minerals.iron + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
    return {
      maxWarp: Math.max(1, maxWarp),
      totalMass: Math.max(1, totalMass),
      totalFuel,
      bestEfficiency,
    };
  }

  private fuelCostPerLightYear(mass: number, warp: number, efficiency: number): number {
    if (efficiency === 0) return 0;
    return ((mass * efficiency) / 1000) * Math.pow(warp / 5, 2);
  }

  private getShipCost(designId: string): {
    resources: number;
    iron?: number;
    boranium?: number;
    germanium?: number;
  } {
    switch (designId) {
      case 'scout':
        return { resources: 20, iron: 5 };
      case 'frigate':
        return { resources: 40, iron: 10, boranium: 5 };
      case 'destroyer':
        return { resources: 60, iron: 15, boranium: 10, germanium: 5 };
      case 'settler':
        return { resources: 80, iron: 10, boranium: 10, germanium: 8 };
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
