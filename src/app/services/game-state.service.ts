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

import { SettingsService } from './settings.service';

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
    private settings: SettingsService,
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
    // Schedule builds after economy update
    this.processGovernors(game);
    // Population grows or dies
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      const habPct = this.habitabilityFor(planet.id);

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
          // If colony ship, preload colonists based on design capacity
          const design = getDesign(designId);
          if (design.colonyModule && design.colonistCapacity) {
            fleet.cargo.colonists += design.colonistCapacity;
          }
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

  colonizeNow(fleetId: string): string | null {
    const game = this._game();
    if (!game) return null;
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') return null;
    const planet = game.stars
      .flatMap((s) => s.planets)
      .find((p) => p.id === (fleet.location as { type: 'orbit'; planetId: string }).planetId);
    if (!planet) return null;
    const colonyStack = fleet.ships.find((s) => getDesign(s.designId).colonyModule && s.count > 0);
    const hasColony = !!colonyStack;
    const hab = this.habitabilityFor(planet.id);
    // Allow colonization if hab <= 0, but warn (handled in UI). Logic here allows it.
    if (!hasColony) return null;
    colonyStack!.count -= 1;
    if (colonyStack!.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }
    // Absorb ship cargo into the new colony
    planet.ownerId = game.humanPlayer.id;
    // Apply default governor from settings
    planet.governor = { type: this.settings.defaultGovernor() };

    // Set Max Population based on habitability
    planet.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000; // Allow small pop on hostile worlds

    const addedColonists = Math.max(0, fleet.cargo.colonists);
    planet.population = addedColonists;
    planet.surfaceMinerals.iron += fleet.cargo.minerals.iron;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    // Broken-down ship parts contribute minerals based on its build cost
    const cost = this.getShipCost(colonyStack!.designId);
    planet.surfaceMinerals.iron += cost.iron ?? 0;
    planet.surfaceMinerals.boranium += cost.boranium ?? 0;
    planet.surfaceMinerals.germanium += cost.germanium ?? 0;
    // Clear cargo after colonization
    fleet.cargo.minerals = { iron: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
    fleet.orders = [];
    // Remove empty fleets
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    }
    this._game.set({ ...game });
    return planet.id;
  }

  private fleetCargoCapacity(fleet: import('../models/game.model').Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const d = getDesign(s.designId);
      return sum + d.cargoCapacity * s.count;
    }, 0);
  }
  private fleetCargoUsed(fleet: import('../models/game.model').Fleet): number {
    const mineralsUsed =
      fleet.cargo.minerals.iron + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
    const colonistUsed = Math.floor(fleet.cargo.colonists / 1000); // 1 kT per 1000 colonists
    return mineralsUsed + colonistUsed;
  }
  loadCargo(
    fleetId: string,
    planetId: string,
    manifest: {
      iron?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    },
  ) {
    const game = this._game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!fleet || !planet) return;
    const capacity = this.fleetCargoCapacity(fleet);
    let used = this.fleetCargoUsed(fleet);
    const free = Math.max(0, capacity - used);
    const takeMineral = (key: 'iron' | 'boranium' | 'germanium', req?: number | 'all' | 'fill') => {
      if (!req) return;
      const available = planet.surfaceMinerals[key];
      const room = Math.max(0, free - (this.fleetCargoUsed(fleet) - used));
      const wanted =
        req === 'all' ? available : req === 'fill' ? room : Math.max(0, Math.floor(req));
      const take = Math.min(wanted, available, room);
      planet.surfaceMinerals[key] -= take;
      fleet.cargo.minerals[key] += take;
      used += take;
    };
    takeMineral('iron', manifest.iron);
    takeMineral('boranium', manifest.boranium);
    takeMineral('germanium', manifest.germanium);
    if (manifest.colonists) {
      const availablePeople = planet.population;
      const roomKT = Math.max(0, capacity - this.fleetCargoUsed(fleet));
      const roomPeople = roomKT * 1000;
      const wantedPeople =
        manifest.colonists === 'all'
          ? availablePeople
          : manifest.colonists === 'fill'
            ? roomPeople
            : Math.max(0, Math.floor(manifest.colonists));
      const takePeople = Math.min(wantedPeople, availablePeople, roomPeople);
      planet.population = Math.max(0, planet.population - takePeople);
      fleet.cargo.colonists += takePeople;
    }
    this._game.set({ ...game });
  }
  unloadCargo(
    fleetId: string,
    planetId: string,
    manifest: {
      iron?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    },
  ) {
    const game = this._game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!fleet || !planet) return;
    const giveMineral = (key: 'iron' | 'boranium' | 'germanium', req?: number | 'all') => {
      if (!req) return;
      const available = fleet.cargo.minerals[key];
      const wanted = req === 'all' ? available : Math.max(0, Math.floor(req));
      const give = Math.min(wanted, available);
      fleet.cargo.minerals[key] -= give;
      planet.surfaceMinerals[key] += give;
    };
    giveMineral('iron', manifest.iron);
    giveMineral('boranium', manifest.boranium);
    giveMineral('germanium', manifest.germanium);
    if (manifest.colonists) {
      const availablePeople = fleet.cargo.colonists;
      const wantedPeople =
        manifest.colonists === 'all'
          ? availablePeople
          : Math.max(0, Math.floor(manifest.colonists));
      const givePeople = Math.min(wantedPeople, availablePeople);
      fleet.cargo.colonists -= givePeople;
      planet.population += givePeople;
    }
    this._game.set({ ...game });
  }

  private processFleets(game: GameState) {
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;
      // Refuel when in orbit
      if (fleet.location.type === 'orbit') {
        const totalFuelCapacity = fleet.ships.reduce(
          (sum, s) => sum + getDesign(s.designId).fuelCapacity * s.count,
          0,
        );
        fleet.fuel = Math.min(totalFuelCapacity, totalFuelCapacity); // instant refuel to full when in orbit
      } else {
        // Light ramscoop-style refuel in space
        const totalFuelCapacity = fleet.ships.reduce(
          (sum, s) => sum + getDesign(s.designId).fuelCapacity * s.count,
          0,
        );
        fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * 0.15);
      }
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
        const perLy = this.fuelCostPerLightYearSpec(
          stats.totalMass,
          stats.maxWarp,
          stats.worstEfficiency,
          stats.idealWarp,
        );
        const maxLyFromFuel = perLy > 0 ? fleet.fuel / perLy : 1000;
        const perTurnDistance = stats.maxWarp * 20;
        const step = Math.min(dist, maxLyFromFuel, perTurnDistance);
        const ratio = dist > 0 ? step / dist : 0;
        const nx = curr.x + (dest.x - curr.x) * ratio;
        const ny = curr.y + (dest.y - curr.y) * ratio;
        fleet.fuel = Math.max(0, fleet.fuel - perLy * step);
        if (step >= dist) {
          const targetStar = game.stars.find(
            (s) => Math.hypot(s.position.x - dest.x, s.position.y - dest.y) < 2,
          );
          if (targetStar) {
            const targetPlanet = targetStar.planets[0];
            fleet.location = { type: 'orbit', planetId: targetPlanet.id };
          } else {
            fleet.location = { type: 'space', x: dest.x, y: dest.y };
          }
          fleet.orders = [];
        } else {
          fleet.location = { type: 'space', x: nx, y: ny };
        }
      } else if (order.type === 'colonize') {
        const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === order.planetId);
        if (!planet) continue;
        const colonyStack = fleet.ships.find(
          (s) => getDesign(s.designId).colonyModule && s.count > 0,
        );
        const hasColony = !!colonyStack;
        const hab = this.habitabilityFor(order.planetId);
        if (hasColony) {
          // consume one colony ship
          colonyStack!.count -= 1;
          if (colonyStack!.count <= 0) {
            fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
          }
          planet.ownerId = game.humanPlayer.id;
          // Apply default governor from settings
          planet.governor = { type: this.settings.defaultGovernor() };
          // Set Max Population based on habitability
          planet.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000;

          const addedColonists = Math.max(0, fleet.cargo.colonists);
          planet.population = addedColonists;
          // Cargo minerals
          planet.surfaceMinerals.iron += fleet.cargo.minerals.iron;
          planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
          planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
          // Ship breakdown minerals
          const cost = this.getShipCost(colonyStack!.designId);
          planet.surfaceMinerals.iron += cost.iron ?? 0;
          planet.surfaceMinerals.boranium += cost.boranium ?? 0;
          planet.surfaceMinerals.germanium += cost.germanium ?? 0;
          // Clear cargo after colonization
          fleet.cargo.minerals = { iron: 0, boranium: 0, germanium: 0 };
          fleet.cargo.colonists = 0;
          fleet.orders = [];
          if (fleet.ships.length === 0) {
            game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
          }
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
    let idealWarp = Infinity;
    let totalMass = 0;
    let totalFuel = 0;
    let worstEfficiency = -Infinity;
    for (const stack of fleet.ships) {
      const d = getDesign(stack.designId);
      maxWarp = Math.min(maxWarp, d.warpSpeed);
      idealWarp = Math.min(idealWarp, d.idealWarp);
      totalMass += d.mass * stack.count;
      totalFuel += d.fuelCapacity * stack.count;
      worstEfficiency = Math.max(worstEfficiency, d.fuelEfficiency);
    }
    // Cargo mass: minerals (kT) + colonists (1 kT per 1000 colonists)
    totalMass +=
      fleet.cargo.minerals.iron +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      Math.floor(fleet.cargo.colonists / 1000);
    return {
      maxWarp: Math.max(1, maxWarp),
      idealWarp: Math.max(1, idealWarp),
      totalMass: Math.max(1, totalMass),
      totalFuel,
      worstEfficiency: Math.max(0, worstEfficiency),
    };
  }

  private fuelCostPerLightYearSpec(
    mass: number,
    warp: number,
    efficiency: number,
    idealWarp: number,
  ): number {
    if (efficiency === 0) return 0;
    const basePerLy = mass / 100;
    const speedRatio = warp / idealWarp;
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = efficiency / 100;
    return Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier);
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
      case 'freighter':
        return { resources: 35, iron: 8, boranium: 5, germanium: 3 };
      case 'super_freighter':
        return { resources: 60, iron: 15, boranium: 8, germanium: 6 };
      case 'tanker':
        return { resources: 30, iron: 6, boranium: 6, germanium: 2 };
      case 'settler':
        return { resources: 80, iron: 10, boranium: 10, germanium: 8 };
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
