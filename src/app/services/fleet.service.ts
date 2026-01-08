import { Injectable } from '@angular/core';
import { GameState, Fleet, FleetOrder } from '../models/game.model';
import { getDesign } from '../data/ships.data';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';

@Injectable({ providedIn: 'root' })
export class FleetService {
  constructor(
    private settings: SettingsService,
    private hab: HabitabilityService,
    private shipyard: ShipyardService,
  ) {}

  issueFleetOrder(game: GameState, fleetId: string, order: FleetOrder): GameState {
    return this.setFleetOrders(game, fleetId, [order]);
  }

  setFleetOrders(game: GameState, fleetId: string, orders: FleetOrder[]): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) return game;
    fleet.orders = orders;
    return { ...game };
  }

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') return [game, null];
    const planet = game.stars
      .flatMap((s) => s.planets)
      .find((p) => p.id === (fleet.location as { type: 'orbit'; planetId: string }).planetId);
    if (!planet) return [game, null];
    const colonyStack = fleet.ships.find((s) => {
      const design = game.shipDesigns.find(d => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0
    });
    const hasColony = !!colonyStack;
    const hab = this.hab.calculate(
      planet,
      game.humanPlayer.species,
    );
    // Allow colonization if hab <= 0, but warn (handled in UI). Logic here allows it.
    if (!hasColony) return [game, null];
    const design = game.shipDesigns.find(d => d.id === colonyStack!.designId);
    if (!design) return [game, null];

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
    planet.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    // Broken-down ship parts contribute minerals based on its build cost
    const cost = this.shipyard.getShipCost(design);
    planet.resources += cost.resources;
    planet.surfaceMinerals.ironium += cost.ironium ?? 0;
    planet.surfaceMinerals.boranium += cost.boranium ?? 0;
    planet.surfaceMinerals.germanium += cost.germanium ?? 0;
    // Clear cargo after colonization
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
    fleet.orders = [];
    // Remove empty fleets
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    }
    const newGame = { ...game, stars: [...game.stars], fleets: [...game.fleets] };
    return [newGame, planet.id];
  }

  private fleetCargoCapacity(fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const d = getDesign(s.designId);
      return sum + d.cargoCapacity * s.count;
    }, 0);
  }
  private fleetCargoUsed(fleet: Fleet): number {
    const resourcesUsed = fleet.cargo.resources;
    const mineralsUsed =
      fleet.cargo.minerals.ironium + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
    const colonistUsed = Math.floor(fleet.cargo.colonists / 1000); // 1 kT per 1000 colonists
    return resourcesUsed + mineralsUsed + colonistUsed;
  }
  loadCargo(
    game: GameState,
    fleetId: string,
    planetId: string,
    manifest: {
      resources?: number | 'all' | 'fill';
      ironium?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    },
  ): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!fleet || !planet) return game;
    const capacity = this.fleetCargoCapacity(fleet);
    let used = this.fleetCargoUsed(fleet);
    const free = Math.max(0, capacity - used);
    const takeMineral = (key: 'ironium' | 'boranium' | 'germanium', req?: number | 'all' | 'fill') => {
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
    takeMineral('ironium', manifest.ironium);
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
    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }
  unloadCargo(
    game: GameState,
    fleetId: string,
    planetId: string,
    manifest: {
      resources?: number | 'all';
      ironium?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    },
  ): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!fleet || !planet) return game;
    const giveMineral = (key: 'ironium' | 'boranium' | 'germanium', req?: number | 'all') => {
      if (!req) return;
      const available = fleet.cargo.minerals[key];
      const wanted = req === 'all' ? available : Math.max(0, Math.floor(req));
      const give = Math.min(wanted, available);
      fleet.cargo.minerals[key] -= give;
      planet.surfaceMinerals[key] += give;
    };
    giveMineral('ironium', manifest.ironium);
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
    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }

  processFleets(game: GameState) {
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
          (s) => {
            const design = game.shipDesigns.find(d => d.id === s.designId);
            return design && getDesign(design.hullId)?.colonyModule && s.count > 0
          });
        const hasColony = !!colonyStack;
        const hab = this.hab.calculate(planet, game.humanPlayer.species);
        if (hasColony) {
          const design = game.shipDesigns.find(d => d.id === colonyStack!.designId);
          if (!design) continue;
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
          planet.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
          planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
          planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
          // Ship breakdown minerals
          const cost = this.shipyard.getShipCost(design, game.humanPlayer.techLevels);
          planet.resources += cost.resources;
          planet.surfaceMinerals.ironium += cost.ironium ?? 0;
          planet.surfaceMinerals.boranium += cost.boranium ?? 0;
          planet.surfaceMinerals.germanium += cost.germanium ?? 0;
          // Clear cargo after colonization
          fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
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

  private calculateMovementStats(fleet: Fleet) {
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
      fleet.cargo.minerals.ironium +
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
}
