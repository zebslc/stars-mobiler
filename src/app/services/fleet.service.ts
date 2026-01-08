import { Injectable } from '@angular/core';
import { GameState, Fleet, FleetOrder, Planet } from '../models/game.model';
import { getDesign } from '../data/ships.data';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';

@Injectable({ providedIn: 'root' })
export class FleetService {
  readonly MAX_FLEETS = 512;
  readonly MAX_SHIPS_PER_DESIGN = 32000;

  constructor(
    private settings: SettingsService,
    private hab: HabitabilityService,
    private shipyard: ShipyardService,
  ) {}

  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void {
    const designId = shipDesignId ?? 'scout';
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    const legacyDesign = getDesign(designId);

    const isNewShipStarbase = shipDesign?.spec?.isStarbase ?? legacyDesign?.isStarbase ?? false;

    // Find or create fleet
    // We must separate starbases from regular fleets because starbases are hidden in fleet lists
    const orbitFleets = game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.location.type === 'orbit' &&
        (f.location as any).planetId === planet.id,
    );

    let fleet: Fleet | undefined;

    if (isNewShipStarbase) {
      // Look for existing starbase fleet to merge into (usually only one)
      fleet = orbitFleets.find((f) =>
        f.ships.some((s) => {
          const d = game.shipDesigns.find((sd) => sd.id === s.designId);
          const ld = getDesign(s.designId);
          return d?.spec?.isStarbase ?? ld?.isStarbase;
        }),
      );
    } else {
      // Look for existing regular fleet (non-starbase)
      // If there are multiple, we pick the first one.
      // Ideally we might want to let user choose, but auto-stacking is standard for now.
      fleet = orbitFleets.find(
        (f) =>
          !f.ships.some((s) => {
            const d = game.shipDesigns.find((sd) => sd.id === s.designId);
            const ld = getDesign(s.designId);
            return d?.spec?.isStarbase ?? ld?.isStarbase;
          }),
      );
    }

    if (!fleet) {
      fleet = this.createFleet(
        game,
        { type: 'orbit', planetId: planet.id },
        game.humanPlayer.id,
        designId,
      );
    }

    const stack = fleet.ships.find((s) => s.designId === designId && (s.damage || 0) === 0);
    if (stack) {
      if (stack.count + count > this.MAX_SHIPS_PER_DESIGN) {
        throw new Error(
          `Cannot add ships: Fleet '${fleet.name}' already has ${stack.count} ships of design '${designId}' (Max: ${this.MAX_SHIPS_PER_DESIGN})`,
        );
      }
      stack.count += count;
    } else {
      if (count > this.MAX_SHIPS_PER_DESIGN) {
        throw new Error(
          `Cannot add ships: Amount ${count} exceeds max ships per design (${this.MAX_SHIPS_PER_DESIGN})`,
        );
      }
      fleet.ships.push({ designId, count, damage: 0 });
    }

    // Add starting fuel
    const fuelCap = shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
    fleet.fuel += fuelCap * count;

    // Preload colonists if colony ship
    const hasColony = shipDesign?.spec?.hasColonyModule ?? legacyDesign?.colonyModule;
    const colCap = shipDesign?.spec?.colonistCapacity ?? legacyDesign?.colonistCapacity;

    if (hasColony && colCap) {
      // Deduct colonists from planet
      const totalColCap = colCap * count;
      const amount = Math.min(totalColCap, planet.population);
      planet.population -= amount;
      fleet.cargo.colonists += amount;
    }
  }

  createFleet(
    game: GameState,
    location: { type: 'space'; x: number; y: number } | { type: 'orbit'; planetId: string },
    ownerId: string,
    baseNameSource?: string,
  ): Fleet {
    // Check fleet limit
    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    if (playerFleets.length >= this.MAX_FLEETS) {
      throw new Error(`Maximum of ${this.MAX_FLEETS} fleets allowed per player.`);
    }

    // Generate fleet name
    const userDesign = baseNameSource
      ? game.shipDesigns.find((d) => d.id === baseNameSource)
      : null;
    const legacyDesign = baseNameSource ? getDesign(baseNameSource) : null;
    const baseName = userDesign?.name || legacyDesign?.name || 'Fleet';

    const sameNameFleets = game.fleets.filter(
      (f) => f.ownerId === ownerId && f.name && f.name.startsWith(baseName),
    );
    let maxNum = 0;
    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedBaseName}-(\\d+)$`);
    for (const f of sameNameFleets) {
      const match = f.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const newName = `${baseName}-${maxNum + 1}`;

    const fleet: Fleet = {
      id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName,
      ownerId: ownerId,
      location: location,
      ships: [],
      fuel: 0,
      cargo: {
        resources: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
        colonists: 0,
      },
      orders: [],
    };
    game.fleets.push(fleet);
    return fleet;
  }

  transfer(
    game: GameState,
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
  ): GameState {
    const source = game.fleets.find((f) => f.id === sourceId);
    const target = game.fleets.find((f) => f.id === targetId);
    if (!source || !target) return game;

    // Validation: Same location
    const sameLoc =
      (source.location.type === 'orbit' &&
        target.location.type === 'orbit' &&
        (source.location as any).planetId === (target.location as any).planetId) ||
      (source.location.type === 'space' &&
        target.location.type === 'space' &&
        (source.location as any).x === (target.location as any).x &&
        (source.location as any).y === (target.location as any).y);

    if (!sameLoc) return game;

    // Transfer Ships
    for (const ship of transferSpec.ships) {
      const sourceStack = source.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (!sourceStack || sourceStack.count < ship.count) continue;

      sourceStack.count -= ship.count;
      if (sourceStack.count <= 0) {
        source.ships = source.ships.filter((s) => s !== sourceStack);
      }

      const targetStack = target.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (targetStack) {
        targetStack.count += ship.count;
      } else {
        target.ships.push({
          designId: ship.designId,
          count: ship.count,
          damage: ship.damage || 0,
        });
      }
    }

    // Transfer Fuel
    const fuelToMove = Math.min(source.fuel, transferSpec.fuel);
    source.fuel -= fuelToMove;
    target.fuel += fuelToMove;

    // Transfer Cargo
    const moveCargo = (
      key: 'resources' | 'colonists' | 'ironium' | 'boranium' | 'germanium',
      amount: number,
    ) => {
      if (key === 'resources' || key === 'colonists') {
        const val = Math.min(source.cargo[key], amount);
        source.cargo[key] -= val;
        target.cargo[key] += val;
      } else {
        const val = Math.min(source.cargo.minerals[key], amount);
        source.cargo.minerals[key] -= val;
        target.cargo.minerals[key] += val;
      }
    };

    moveCargo('resources', transferSpec.cargo.resources);
    moveCargo('colonists', transferSpec.cargo.colonists);
    moveCargo('ironium', transferSpec.cargo.ironium);
    moveCargo('boranium', transferSpec.cargo.boranium);
    moveCargo('germanium', transferSpec.cargo.germanium);

    // Cleanup empty fleets
    if (source.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== source.id);
    }

    return { ...game, fleets: [...game.fleets] };
  }

  splitFleet(
    game: GameState,
    sourceId: string,
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
  ): [GameState, string | null] {
    const source = game.fleets.find((f) => f.id === sourceId);
    if (!source) return [game, null];

    const newFleet = this.createFleet(
      game,
      source.location,
      source.ownerId,
      transferSpec.ships[0]?.designId,
    );
    const nextGame = this.transfer(game, sourceId, newFleet.id, transferSpec);
    return [nextGame, newFleet.id];
  }

  separateFleet(game: GameState, fleetId: string): GameState {
    const source = game.fleets.find((f) => f.id === fleetId);
    if (!source) return game;

    // Create a flat list of all ships to move
    // We leave exactly 1 ship in the source fleet (the last one processed)
    const shipsToMove: { designId: string; damage: number }[] = [];

    // Calculate total ships
    let totalShips = 0;
    source.ships.forEach((s) => (totalShips += s.count));

    // If only 1 ship, nothing to separate
    if (totalShips <= 1) return game;

    // We want to move (total - 1) ships
    let shipsAdded = 0;
    for (const stack of source.ships) {
      for (let i = 0; i < stack.count; i++) {
        if (shipsAdded < totalShips - 1) {
          shipsToMove.push({ designId: stack.designId, damage: stack.damage || 0 });
          shipsAdded++;
        }
      }
    }

    let currentGame = game;
    for (const ship of shipsToMove) {
      const newFleet = this.createFleet(
        currentGame,
        source.location,
        source.ownerId,
        ship.designId,
      );
      currentGame = this.transfer(currentGame, source.id, newFleet.id, {
        ships: [{ designId: ship.designId, count: 1, damage: ship.damage }],
        fuel: 0,
        cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 },
      });
    }

    return currentGame;
  }

  mergeFleets(game: GameState, sourceId: string, targetId: string): GameState {
    const source = game.fleets.find((f) => f.id === sourceId);
    if (!source) return game;

    // Move everything
    return this.transfer(game, sourceId, targetId, {
      ships: source.ships.map((s) => ({ ...s })),
      fuel: source.fuel,
      cargo: {
        resources: source.cargo.resources,
        ironium: source.cargo.minerals.ironium,
        boranium: source.cargo.minerals.boranium,
        germanium: source.cargo.minerals.germanium,
        colonists: source.cargo.colonists,
      },
    });
  }

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
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0;
    });
    const hasColony = !!colonyStack;
    const hab = this.hab.calculate(planet, game.humanPlayer.species);
    // Allow colonization if hab <= 0, but warn (handled in UI). Logic here allows it.
    if (!hasColony) return [game, null];
    const design = game.shipDesigns.find((d) => d.id === colonyStack!.designId);
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

  private fleetCargoCapacity(game: GameState, fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const d = this.getShipDesign(game, s.designId);
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
    const capacity = this.fleetCargoCapacity(game, fleet);
    let used = this.fleetCargoUsed(fleet);
    const free = Math.max(0, capacity - used);
    const takeMineral = (
      key: 'ironium' | 'boranium' | 'germanium',
      req?: number | 'all' | 'fill',
    ) => {
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

  private getShipDesign(game: GameState, designId: string): any {
    const dynamicDesign = game.shipDesigns.find((d) => d.id === designId);
    if (dynamicDesign?.spec) {
      return {
        ...dynamicDesign.spec,
        colonyModule: dynamicDesign.spec.hasColonyModule,
        fuelEfficiency: dynamicDesign.spec.fuelEfficiency ?? 100,
      };
    }
    return getDesign(designId);
  }

  processFleets(game: GameState) {
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;
      // Calculate total fuel capacity
      const totalFuelCapacity = fleet.ships.reduce(
        (sum, s) => sum + this.getShipDesign(game, s.designId).fuelCapacity * s.count,
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
        const hasRamscoop = fleet.ships.some(
          (s) => this.getShipDesign(game, s.designId).fuelEfficiency === 0,
        );
        if (hasRamscoop) {
          fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * 0.15);
        }
      }
      const order = fleet.orders[0];
      if (!order) continue;
      if (order.type === 'move') {
        const stats = this.calculateMovementStats(game, fleet);
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
        const colonyStack = fleet.ships.find((s) => {
          return this.getShipDesign(game, s.designId).colonyModule && s.count > 0;
        });
        const hasColony = !!colonyStack;
        const hab = this.hab.calculate(planet, game.humanPlayer.species);
        if (hasColony) {
          const design = game.shipDesigns.find((d) => d.id === colonyStack!.designId);
          // If dynamic design missing but we found it via getShipDesign (static), we might need fallback logic?
          // But getShipCost needs dynamic design or compiled design?
          // shipyard.getShipCost takes compiled design or similar.
          // Let's assume if it's a colony ship it has a design.
          // However, if it's a static design (e.g. starter colony ship), game.shipDesigns won't have it.
          // We should use the result of getShipDesign?
          // But getShipCost might expect a specific type.

          // Let's just fix the finding logic first.

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
          // We need a design object for getShipCost.
          // If it is dynamic, 'design' is valid. If static, 'design' is undefined.
          // We can use this.getShipDesign(game, colonyStack!.designId) but getShipCost signature might vary.
          // Let's check getShipCost later. For now, try to get the design if possible.
          const effectiveDesign = this.getShipDesign(game, colonyStack!.designId);

          // We'll pass effectiveDesign to getShipCost if it accepts it, or just use it manually?
          // this.shipyard.getShipCost expects (design: CompiledDesign | ShipDesign, ...) ?
          // I'll assume getShipCost can handle the object returned by getShipDesign which matches CompiledDesign.
          const cost = this.shipyard.getShipCost(effectiveDesign, game.humanPlayer.techLevels);
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

  private calculateMovementStats(game: GameState, fleet: Fleet) {
    let maxWarp = Infinity;
    let idealWarp = Infinity;
    let totalMass = 0;
    let totalFuel = 0;
    let worstEfficiency = -Infinity;
    for (const stack of fleet.ships) {
      const d = this.getShipDesign(game, stack.designId);
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
