import { Injectable, computed, signal } from '@angular/core';
import {
  GameSettings,
  GameState,
  Player,
  AIPlayer,
  Planet,
  BuildItem,
} from '../models/game.model';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { SPECIES } from '../data/species.data';
import { HabitabilityService } from './habitability.service';
import { EconomyService } from './economy.service';
import { getDesign } from '../data/ships.data';
import { TECH_FIELDS, TECH_FIELD_LIST, TechField } from '../data/tech-tree.data';

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
    this.advanceResearch(game, totalResearch);

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
    // Process one build item per owned planet (Finish previous work)
    this.processBuildQueues(game);

    // Schedule builds if queue is empty (Prepare for next work)
    this.processGovernors(game);

    // Movement and colonization
    this.processFleets(game);
    game.turn++;
    // Create new array references to ensure signal change detection triggers
    const nextGame = {
      ...game,
      humanPlayer: { ...game.humanPlayer },
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
    this._game.set(nextGame);
  }

  addToBuildQueue(planetId: string, item: BuildItem): boolean {
    const game = this._game();
    if (!game) return false;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return false;
    
    // We don't spend resources here anymore. They are spent during turn processing.
    // Just add to queue.
    planet.buildQueue = [...(planet.buildQueue ?? []), item];
    
    // Update stars array reference to trigger signals
    this._game.set({ ...game, stars: [...game.stars] });
    return true;
  }

  private processBuildQueues(game: GameState) {
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;
      
      let queue = planet.buildQueue ?? [];

      // Process items in queue until resources run out or queue is empty
      while (queue.length > 0) {
        const item = queue[0];
        const count = item.count ?? 1;
        let constructed = 0;

        // Try to build as many as possible
        for (let i = 0; i < count; i++) {
          if (this.economy.spend(planet, item.cost)) {
            // Build successful
            constructed++;
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
              case 'research':
                planet.research = (planet.research || 0) + 1;
                break;
              case 'scanner':
                planet.scanner = 1;
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
                    cargo: {
                      resources: 0,
                      minerals: { iron: 0, boranium: 0, germanium: 0 },
                      colonists: 0,
                    },
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
          } else {
            // Cannot afford anymore
            break;
          }
        }

        if (constructed > 0) {
          // If we built some, update the item count
          if (constructed >= count) {
            // Finished this item
            queue = queue.slice(1);
          } else {
            // Partially finished
            item.count = count - constructed;
            // Stop processing this planet for this turn as we ran out of resources
            break;
          }
        } else {
          // Couldn't build even one. Stop processing this planet.
          break;
        }
      }

      planet.buildQueue = queue;
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
            this.addToBuildQueue(planet.id, {
              project: 'mine',
              cost: { resources: 5 },
              isAuto: true,
            });
          } else if (planet.factories < Math.floor(planet.population / 10)) {
            this.addToBuildQueue(planet.id, {
              project: 'factory',
              cost: { resources: 10, germanium: 4 },
              isAuto: true,
            });
          } else {
            this.addToBuildQueue(planet.id, {
              project: 'defense',
              cost: { resources: 15, iron: 2, boranium: 2 },
              isAuto: true,
            });
          }
          break;
        }
        case 'mining':
          this.addToBuildQueue(planet.id, {
            project: 'mine',
            cost: { resources: 5 },
            isAuto: true,
          });
          break;
        case 'industrial':
          this.addToBuildQueue(planet.id, {
            project: 'factory',
            cost: { resources: 10, germanium: 4 },
            isAuto: true,
          });
          break;
        case 'military':
          this.addToBuildQueue(planet.id, {
            project: 'defense',
            cost: { resources: 15, iron: 2, boranium: 2 },
            isAuto: true,
          });
          break;
        case 'shipyard': {
          const designId = planet.governor.shipDesignId ?? 'scout';
          const limit = planet.governor.buildLimit ?? 0;
          const queuedShips = (planet.buildQueue ?? []).filter((i) => i.project === 'ship').length;
          if (limit === 0 || queuedShips < limit) {
            const cost = this.getShipCost(designId);
            this.addToBuildQueue(planet.id, {
              project: 'ship',
              cost,
              shipDesignId: designId,
              isAuto: true,
            });
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
    this._game.set({ ...game, stars: [...game.stars] });
  }

  removeFromQueue(planetId: string, index: number) {
    const game = this._game();
    if (!game) return;
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || !planet.buildQueue) return;
    planet.buildQueue = planet.buildQueue.filter((_, i) => i !== index);
    this._game.set({ ...game, stars: [...game.stars] });
  }

  issueFleetOrder(fleetId: string, order: import('../models/game.model').FleetOrder) {
    this.setFleetOrders(fleetId, [order]);
  }

  setFleetOrders(fleetId: string, orders: import('../models/game.model').FleetOrder[]) {
    const game = this._game();
    if (!game) return;
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) return;
    fleet.orders = orders;
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
    // Initialize build queue
    planet.buildQueue = [];

    // Set Max Population based on habitability
    planet.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000; // Allow small pop on hostile worlds

    const addedColonists = Math.max(0, fleet.cargo.colonists);
    planet.population = addedColonists;
    planet.surfaceMinerals.iron += fleet.cargo.minerals.iron;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    // Broken-down ship parts contribute minerals based on its build cost
    const cost = this.getShipCost(colonyStack!.designId);
    planet.resources += cost.resources;
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
    this._game.set({ ...game, stars: [...game.stars], fleets: [...game.fleets] });
    return planet.id;
  }

  private fleetCargoCapacity(fleet: import('../models/game.model').Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const d = getDesign(s.designId);
      return sum + d.cargoCapacity * s.count;
    }, 0);
  }
  private fleetCargoUsed(fleet: import('../models/game.model').Fleet): number {
    const resourcesUsed = fleet.cargo.resources;
    const mineralsUsed =
      fleet.cargo.minerals.iron + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
    const colonistUsed = Math.floor(fleet.cargo.colonists / 1000); // 1 kT per 1000 colonists
    return resourcesUsed + mineralsUsed + colonistUsed;
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
    if (manifest.resources) {
      const available = planet.resources;
      const room = Math.max(0, free - (this.fleetCargoUsed(fleet) - used));
      const wanted =
        manifest.resources === 'all'
          ? available
          : manifest.resources === 'fill'
            ? room
            : Math.max(0, Math.floor(manifest.resources));
      const take = Math.min(wanted, available, room);
      planet.resources -= take;
      fleet.cargo.resources += take;
      used += take;
    }
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
    this._game.set({ ...game, stars: [...game.stars], fleets: [...game.fleets] });
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
    if (manifest.resources) {
      const available = fleet.cargo.resources;
      const wanted =
        manifest.resources === 'all' ? available : Math.max(0, Math.floor(manifest.resources));
      const give = Math.min(wanted, available);
      fleet.cargo.resources -= give;
      planet.resources += give;
    }
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
    this._game.set({ ...game, stars: [...game.stars], fleets: [...game.fleets] });
  }

  private processFleets(game: GameState) {
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;
      // Calculate total fuel capacity
      const totalFuelCapacity = fleet.ships.reduce(
        (sum, s) => sum + getDesign(s.designId).fuelCapacity * s.count,
        0,
      );

      // Refuel logic
      if (fleet.location.type === 'orbit') {
        const planet = game.stars
          .flatMap((s) => s.planets)
          .find((p) => p.id === (fleet.location as { type: 'orbit'; planetId: string }).planetId);

        if (planet && planet.ownerId === fleet.ownerId) {
          // Check for stardock in orbit
          const hasStardock = game.fleets.some(
            (f) =>
              f.ownerId === fleet.ownerId &&
              f.location.type === 'orbit' &&
              (f.location as { type: 'orbit'; planetId: string }).planetId === planet.id &&
              f.ships.some((s) => s.designId === 'stardock'),
          );
          // Owned planet: 25% refuel, or 100% if stardock present
          const refuelRate = hasStardock ? 1.0 : 0.25;
          fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * refuelRate);
        }
        // Unowned or enemy planet: no refueling
      } else {
        // In space: only ramscoop ships refuel
        const hasRamscoop = fleet.ships.some((s) => getDesign(s.designId).fuelEfficiency === 0);
        if (hasRamscoop) {
          fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * 0.15);
        }
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
          // Movement complete, remove this order
          fleet.orders.shift();
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
          planet.resources += cost.resources;
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

  private advanceResearch(game: GameState, totalRP: number) {
    // All research goes into the selected field
    const field = game.humanPlayer.selectedResearchField;
    game.humanPlayer.researchProgress[field] += totalRP;

    // Check if we've reached the next level
    const currentLevel = game.humanPlayer.techLevels[field];
    if (currentLevel >= 26) return; // Max level

    const techInfo = TECH_FIELDS[field];
    const nextLevel = techInfo.levels[currentLevel + 1];

    if (nextLevel && game.humanPlayer.researchProgress[field] >= nextLevel.cost) {
      // Level up!
      game.humanPlayer.techLevels[field]++;
      game.humanPlayer.researchProgress[field] -= nextLevel.cost;

      // TODO: Show notification to player about tech advancement
      console.log(`Advanced ${techInfo.name} to level ${game.humanPlayer.techLevels[field]}`);
    }
  }

  setResearchField(fieldId: TechField) {
    const game = this._game();
    if (!game) return;

    // Update the player's selected research field immutably
    const nextPlayer = { ...game.humanPlayer, selectedResearchField: fieldId };

    // Create new references to trigger signal updates with OnPush
    const nextGame = {
      ...game,
      humanPlayer: nextPlayer,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
    this._game.set(nextGame);
  }

  /**
   * Save a new ship design or update an existing one
   */
  saveShipDesign(design: import('../models/game.model').ShipDesign) {
    const game = this._game();
    if (!game) return;

    const existingIndex = game.shipDesigns.findIndex((d) => d.id === design.id);
    let nextDesigns: import('../models/game.model').ShipDesign[];

    if (existingIndex >= 0) {
      // Update existing design
      nextDesigns = [...game.shipDesigns];
      nextDesigns[existingIndex] = { ...design };
    } else {
      // Add new design
      nextDesigns = [...game.shipDesigns, { ...design }];
    }

    this._game.set({
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    });
  }

  /**
   * Delete a ship design
   */
  deleteShipDesign(designId: string) {
    const game = this._game();
    if (!game) return;

    const nextDesigns = game.shipDesigns.filter((d) => d.id !== designId);

    this._game.set({
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    });
  }

  /**
   * Get all ship designs for the current player
   */
  getPlayerShipDesigns(): import('../models/game.model').ShipDesign[] {
    const game = this._game();
    if (!game) return [];
    return game.shipDesigns.filter((d) => d.playerId === game.humanPlayer.id);
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
      case 'stardock':
        return { resources: 200, iron: 50, boranium: 30, germanium: 40 };
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
