import { Injectable } from '@angular/core';
import { GameState, Fleet, FleetOrder, Planet, ShipDesign } from '../models/game.model';
import { getDesign } from '../data/ships.data';
import { ENGINE_COMPONENTS } from '../data/techs/engines.data';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';

export interface TransferSpec {
  ships: { designId: string; count: number; damage?: number }[];
  fuel: number;
  cargo: {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
    colonists: number;
  };
}

export interface LoadManifest {
  resources?: number | 'all' | 'fill';
  ironium?: number | 'all' | 'fill';
  boranium?: number | 'all' | 'fill';
  germanium?: number | 'all' | 'fill';
  colonists?: number | 'all' | 'fill';
}

export interface UnloadManifest {
  resources?: number | 'all';
  ironium?: number | 'all';
  boranium?: number | 'all';
  germanium?: number | 'all';
  colonists?: number | 'all';
}

@Injectable({ providedIn: 'root' })
export class FleetService {
  readonly MAX_FLEETS = 512;
  readonly MAX_SHIPS_PER_DESIGN = 32000;

  constructor(
    private settings: SettingsService,
    private hab: HabitabilityService,
    private shipyard: ShipyardService,
  ) {}

  /**
   * Build planet index for O(1) lookups.
   */
  private buildPlanetIndex(game: GameState): Map<string, Planet> {
    const index = new Map<string, Planet>();
    for (const star of game.stars) {
      for (const planet of star.planets) {
        index.set(planet.id, planet);
      }
    }
    return index;
  }

  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void {
    const designId = shipDesignId ?? 'scout';
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    const legacyDesign = getDesign(designId);
    const isStarbase = shipDesign?.spec?.isStarbase ?? legacyDesign?.isStarbase ?? false;

    let fleet = this.findTargetFleet(game, planet, isStarbase);
    if (!fleet) {
      fleet = this.createFleet(
        game,
        { type: 'orbit', planetId: planet.id },
        game.humanPlayer.id,
        designId,
      );
    }

    this.addShipsToStack(fleet, designId, count);
    this.addStartingFuel(fleet, shipDesign, legacyDesign, count);
    this.loadColonistsForNewShip(planet, fleet, shipDesign, legacyDesign, count);
  }

  private findTargetFleet(game: GameState, planet: Planet, isStarbase: boolean): Fleet | undefined {
    const orbitFleets = this.getOrbitFleets(game, planet);
    if (isStarbase) {
      return orbitFleets.find((f) => this.hasStarbase(game, f));
    }
    return orbitFleets.find((f) => !this.hasStarbase(game, f));
  }

  private getOrbitFleets(game: GameState, planet: Planet): Fleet[] {
    return game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.location.type === 'orbit' &&
        (f.location as any).planetId === planet.id,
    );
  }

  private hasStarbase(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = game.shipDesigns.find((sd) => sd.id === s.designId);
      const ld = getDesign(s.designId);
      return d?.spec?.isStarbase ?? ld?.isStarbase;
    });
  }

  private addShipsToStack(fleet: Fleet, designId: string, count: number): void {
    const stack = fleet.ships.find((s) => s.designId === designId && (s.damage || 0) === 0);
    if (stack) {
      this.checkShipLimit(fleet, designId, stack.count + count);
      stack.count += count;
    } else {
      this.checkShipLimit(fleet, designId, count);
      fleet.ships.push({ designId, count, damage: 0 });
    }
  }

  private checkShipLimit(fleet: Fleet, designId: string, count: number): void {
    if (count > this.MAX_SHIPS_PER_DESIGN) {
      throw new Error(
        `Cannot add ships: Fleet '${fleet.name}' already has or will have ${count} ships of design '${designId}' (Max: ${this.MAX_SHIPS_PER_DESIGN})`,
      );
    }
  }

  private addStartingFuel(
    fleet: Fleet,
    shipDesign: any,
    legacyDesign: any,
    count: number,
  ): void {
    const fuelCap = shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
    fleet.fuel += fuelCap * count;
  }

  private loadColonistsForNewShip(
    planet: Planet,
    fleet: Fleet,
    shipDesign: any,
    legacyDesign: any,
    count: number,
  ): void {
    const hasColony = shipDesign?.spec?.hasColonyModule ?? legacyDesign?.colonyModule;
    const colCap = shipDesign?.spec?.colonistCapacity ?? legacyDesign?.colonistCapacity;

    if (hasColony && colCap) {
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
    this.checkFleetLimit(game, ownerId);
    const name = this.generateFleetName(game, ownerId, baseNameSource);
    const fleet = this.initializeFleet(ownerId, location, name);
    game.fleets.push(fleet);
    return fleet;
  }

  private checkFleetLimit(game: GameState, ownerId: string): void {
    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    if (playerFleets.length >= this.MAX_FLEETS) {
      throw new Error(`Maximum of ${this.MAX_FLEETS} fleets allowed per player.`);
    }
  }

  private generateFleetName(game: GameState, ownerId: string, baseNameSource?: string): string {
    const userDesign = baseNameSource
      ? game.shipDesigns.find((d) => d.id === baseNameSource)
      : null;
    const legacyDesign = baseNameSource ? getDesign(baseNameSource) : null;
    const baseName = userDesign?.name || legacyDesign?.name || 'Fleet';

    return this.findNextAvailableName(game, ownerId, baseName);
  }

  private findNextAvailableName(game: GameState, ownerId: string, baseName: string): string {
    const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedBaseName}-(\\d+)$`);
    const sameNameFleets = game.fleets.filter(
      (f) => f.ownerId === ownerId && f.name?.startsWith(baseName),
    );

    const maxNum = sameNameFleets.reduce((max, f) => {
      const match = f.name.match(regex);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `${baseName}-${maxNum + 1}`;
  }

  private initializeFleet(
    ownerId: string,
    location: { type: 'space'; x: number; y: number } | { type: 'orbit'; planetId: string },
    name: string,
  ): Fleet {
    return {
      id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      ownerId,
      location,
      ships: [],
      fuel: 0,
      cargo: {
        resources: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
        colonists: 0,
      },
      orders: [],
    };
  }

  transfer(
    game: GameState,
    sourceId: string,
    targetId: string,
    transferSpec: TransferSpec,
  ): GameState {
    const source = game.fleets.find((f) => f.id === sourceId);
    const target = game.fleets.find((f) => f.id === targetId);
    if (!source || !target || !this.areFleetsAtSameLocation(source, target)) return game;

    this.transferShips(source, target, transferSpec.ships);
    this.transferFuel(source, target, transferSpec.fuel);
    this.transferCargo(source, target, transferSpec.cargo);
    this.cleanupEmptyFleet(game, source);

    return { ...game, fleets: [...game.fleets] };
  }

  private areFleetsAtSameLocation(source: Fleet, target: Fleet): boolean {
    if (source.location.type !== target.location.type) return false;
    if (source.location.type === 'orbit') {
      return (source.location as any).planetId === (target.location as any).planetId;
    }
    return (
      (source.location as any).x === (target.location as any).x &&
      (source.location as any).y === (target.location as any).y
    );
  }

  private transferShips(source: Fleet, target: Fleet, shipsToTransfer: any[]): void {
    for (const ship of shipsToTransfer) {
      const sourceStack = source.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (!sourceStack || sourceStack.count < ship.count) continue;

      this.moveShipStack(source, target, sourceStack, ship);
    }
  }

  private moveShipStack(source: Fleet, target: Fleet, sourceStack: any, ship: any): void {
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
      target.ships.push({ designId: ship.designId, count: ship.count, damage: ship.damage || 0 });
    }
  }

  private transferFuel(source: Fleet, target: Fleet, amount: number): void {
    const fuelToMove = Math.min(source.fuel, amount);
    source.fuel -= fuelToMove;
    target.fuel += fuelToMove;
  }

  private transferCargo(source: Fleet, target: Fleet, cargoSpec: any): void {
    this.moveCargoItem(source, target, 'resources', cargoSpec.resources);
    this.moveCargoItem(source, target, 'colonists', cargoSpec.colonists);
    this.moveCargoItem(source, target, 'ironium', cargoSpec.ironium, true);
    this.moveCargoItem(source, target, 'boranium', cargoSpec.boranium, true);
    this.moveCargoItem(source, target, 'germanium', cargoSpec.germanium, true);
  }

  private moveCargoItem(
    source: Fleet,
    target: Fleet,
    key: string,
    amount: number,
    isMineral = false,
  ): void {
    const containerSource = isMineral ? source.cargo.minerals : source.cargo;
    const containerTarget = isMineral ? target.cargo.minerals : target.cargo;

    const val = Math.min((containerSource as any)[key], amount);
    (containerSource as any)[key] -= val;
    (containerTarget as any)[key] += val;
  }

  private cleanupEmptyFleet(game: GameState, fleet: Fleet): void {
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    }
  }

  splitFleet(
    game: GameState,
    sourceId: string,
    transferSpec: TransferSpec,
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
    if (!source || this.getTotalShips(source) <= 1) return game;

    const shipsToMove = this.getShipsToSeparate(source);
    let currentGame = game;

    for (const ship of shipsToMove) {
      currentGame = this.separateSingleShip(currentGame, source, ship);
    }

    return currentGame;
  }

  private getTotalShips(fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => sum + s.count, 0);
  }

  private getShipsToSeparate(source: Fleet): { designId: string; damage: number }[] {
    const shipsToMove: { designId: string; damage: number }[] = [];
    let shipsAdded = 0;
    const totalShips = this.getTotalShips(source);

    for (const stack of source.ships) {
      for (let i = 0; i < stack.count; i++) {
        if (shipsAdded < totalShips - 1) {
          shipsToMove.push({ designId: stack.designId, damage: stack.damage || 0 });
          shipsAdded++;
        }
      }
    }
    return shipsToMove;
  }

  private separateSingleShip(
    game: GameState,
    source: Fleet,
    ship: { designId: string; damage: number },
  ): GameState {
    const newFleet = this.createFleet(game, source.location, source.ownerId, ship.designId);
    return this.transfer(game, source.id, newFleet.id, {
      ships: [{ designId: ship.designId, count: 1, damage: ship.damage }],
      fuel: 0,
      cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 },
    });
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

    const planetIndex = this.buildPlanetIndex(game);
    const planet = planetIndex.get((fleet.location as { type: 'orbit'; planetId: string }).planetId);

    if (!planet) return [game, null];

    const colonyStack = this.findColonyStack(game, fleet);
    if (!colonyStack) return [game, null];

    this.executeColonization(game, fleet, planet, colonyStack);

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
    manifest: LoadManifest,
  ): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = this.buildPlanetIndex(game).get(planetId);
    if (!fleet || !planet) return game;

    this.processLoadMinerals(game, fleet, planet, manifest);
    this.processLoadResources(game, fleet, planet, manifest);
    this.processLoadColonists(game, fleet, planet, manifest);

    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }

  private processLoadMinerals(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    manifest: LoadManifest,
  ) {
    this.loadMineralItem(game, fleet, planet, 'ironium', manifest.ironium);
    this.loadMineralItem(game, fleet, planet, 'boranium', manifest.boranium);
    this.loadMineralItem(game, fleet, planet, 'germanium', manifest.germanium);
  }

  private loadMineralItem(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    key: 'ironium' | 'boranium' | 'germanium',
    req: number | 'all' | 'fill' | undefined,
  ) {
    if (!req) return;
    const capacity = this.fleetCargoCapacity(game, fleet);
    const used = this.fleetCargoUsed(fleet);
    const free = Math.max(0, capacity - used);

    const available = planet.surfaceMinerals[key];
    const wanted =
      req === 'all' ? available : req === 'fill' ? free : Math.max(0, Math.floor(req));
    const take = Math.min(wanted, available, free);

    planet.surfaceMinerals[key] -= take;
    fleet.cargo.minerals[key] += take;
  }

  private processLoadResources(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    manifest: LoadManifest,
  ) {
    if (!manifest.resources) return;
    const free = Math.max(0, this.fleetCargoCapacity(game, fleet) - this.fleetCargoUsed(fleet));
    const available = planet.resources;
    const wanted =
      manifest.resources === 'all'
        ? available
        : manifest.resources === 'fill'
          ? free
          : Math.max(0, Math.floor(manifest.resources));
    const take = Math.min(wanted, available, free);

    planet.resources -= take;
    fleet.cargo.resources += take;
  }

  private processLoadColonists(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    manifest: LoadManifest,
  ) {
    if (!manifest.colonists) return;
    const freeKT = Math.max(0, this.fleetCargoCapacity(game, fleet) - this.fleetCargoUsed(fleet));
    const availablePeople = planet.population;
    const roomPeople = freeKT * 1000;

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

  unloadCargo(
    game: GameState,
    fleetId: string,
    planetId: string,
    manifest: UnloadManifest,
  ): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const planet = this.buildPlanetIndex(game).get(planetId);
    if (!fleet || !planet) return game;

    this.processUnloadMinerals(fleet, planet, manifest);
    this.processUnloadResources(fleet, planet, manifest);
    this.processUnloadColonists(fleet, planet, manifest);

    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }

  private processUnloadMinerals(fleet: Fleet, planet: Planet, manifest: UnloadManifest) {
    this.unloadMineralItem(fleet, planet, 'ironium', manifest.ironium);
    this.unloadMineralItem(fleet, planet, 'boranium', manifest.boranium);
    this.unloadMineralItem(fleet, planet, 'germanium', manifest.germanium);
  }

  private unloadMineralItem(
    fleet: Fleet,
    planet: Planet,
    key: 'ironium' | 'boranium' | 'germanium',
    req: number | 'all' | undefined,
  ) {
    if (!req) return;
    const available = fleet.cargo.minerals[key];
    const wanted = req === 'all' ? available : Math.max(0, Math.floor(req));
    const give = Math.min(wanted, available);

    fleet.cargo.minerals[key] -= give;
    planet.surfaceMinerals[key] += give;
  }

  private processUnloadResources(fleet: Fleet, planet: Planet, manifest: UnloadManifest) {
    if (!manifest.resources) return;
    const available = fleet.cargo.resources;
    const wanted =
      manifest.resources === 'all' ? available : Math.max(0, Math.floor(manifest.resources));
    const give = Math.min(wanted, available);

    fleet.cargo.resources -= give;
    planet.resources += give;
  }

  private processUnloadColonists(fleet: Fleet, planet: Planet, manifest: UnloadManifest) {
    if (!manifest.colonists) return;
    const availablePeople = fleet.cargo.colonists;
    const wantedPeople =
      manifest.colonists === 'all'
        ? availablePeople
        : Math.max(0, Math.floor(manifest.colonists));
    const givePeople = Math.min(wantedPeople, availablePeople);

    fleet.cargo.colonists -= givePeople;
    planet.population += givePeople;
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
    const planetIndex = this.buildPlanetIndex(game);
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;
      
      this.refuelFleet(game, fleet, planetIndex);

      const order = fleet.orders[0];
      if (!order) continue;

      if (order.type === 'move' || order.type === 'orbit') {
        this.processMovementOrder(game, fleet, order, planetIndex);
      } else if (order.type === 'colonize') {
        this.processColonizeOrder(game, fleet, order, planetIndex);
      }
    }
  }

  private refuelFleet(game: GameState, fleet: Fleet, planetIndex: Map<string, Planet>) {
    const totalFuelCapacity = this.calculateTotalFuelCapacity(game, fleet);

    if (fleet.location.type === 'orbit') {
      this.refuelFromPlanet(game, fleet, planetIndex, totalFuelCapacity);
    } else {
      this.refuelFromSpace(game, fleet, totalFuelCapacity);
    }
  }

  private calculateTotalFuelCapacity(game: GameState, fleet: Fleet): number {
    return fleet.ships.reduce(
      (sum, s) => sum + this.getShipDesign(game, s.designId).fuelCapacity * s.count,
      0,
    );
  }

  private refuelFromPlanet(
    game: GameState,
    fleet: Fleet,
    planetIndex: Map<string, Planet>,
    totalFuelCapacity: number,
  ) {
    const planet = planetIndex.get((fleet.location as { type: 'orbit'; planetId: string }).planetId);

    if (planet && planet.ownerId === fleet.ownerId) {
      const hasStardock = this.checkForStardock(game, fleet, planet.id);
      const refuelRate = hasStardock ? 1.0 : 0.25;
      fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * refuelRate);
    }
  }

  private checkForStardock(game: GameState, fleet: Fleet, planetId: string): boolean {
    return game.fleets.some(
      (f) =>
        f.ownerId === fleet.ownerId &&
        f.location.type === 'orbit' &&
        (f.location as { type: 'orbit'; planetId: string }).planetId === planetId &&
        f.ships.some((s) => s.designId === 'stardock'),
    );
  }

  private refuelFromSpace(game: GameState, fleet: Fleet, totalFuelCapacity: number) {
    const hasRamscoop = fleet.ships.some(
      (s) => this.getShipDesign(game, s.designId).fuelEfficiency === 0,
    );
    if (hasRamscoop) {
      fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * 0.15);
    }
  }

  private processMovementOrder(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    planetIndex: Map<string, Planet>,
  ) {
    if (order.type !== 'move' && order.type !== 'orbit') return;

    const dest = this.getMovementDestination(game, fleet, order, planetIndex);
    if (!dest) return;

    const stats = this.calculateMovementStats(game, fleet);
    const curr = this.getCurrentPosition(game, fleet);
    const dist = Math.hypot(dest.x - curr.x, dest.y - curr.y);

    const travelWarp = this.calculateTravelWarp(game, fleet, order, stats, dist);
    this.executeMovement(game, fleet, dest, curr, dist, travelWarp, order);
  }

  private getMovementDestination(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    planetIndex: Map<string, Planet>,
  ): { x: number; y: number } | null {
    if (order.type === 'orbit') {
      return this.getOrbitDestination(game, fleet, order, planetIndex);
    }
    if (order.type === 'move') {
      return order.destination;
    }
    return null;
  }

  private getOrbitDestination(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    planetIndex: Map<string, Planet>,
  ): { x: number; y: number } | null {
    if (order.type !== 'orbit') return null;

    if (!planetIndex.has(order.planetId)) {
      fleet.orders.shift();
      return null;
    }
    if (fleet.location.type === 'orbit' && fleet.location.planetId === order.planetId) {
      fleet.orders.shift();
      return null;
    }
    return this.planetPosition(game, order.planetId);
  }

  private getCurrentPosition(game: GameState, fleet: Fleet): { x: number; y: number } {
    return fleet.location.type === 'orbit'
      ? this.planetPosition(game, fleet.location.planetId)
      : { x: fleet.location.x, y: fleet.location.y };
  }

  private calculateTravelWarp(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    stats: any,
    dist: number,
  ): number {
    const warpSpeed = 'warpSpeed' in order ? order.warpSpeed : undefined;
    const requestedSpeed = warpSpeed ?? stats.maxWarp;
    const maxPossibleSpeed = Math.min(requestedSpeed, stats.maxWarp);

    for (let w = maxPossibleSpeed; w >= 1; w--) {
      const cost = this.calculateFleetFuelCostPerLy(game, fleet, w);
      if (cost * dist <= fleet.fuel || w === 1) {
        return w;
      }
    }
    return 1;
  }

  private executeMovement(
    game: GameState,
    fleet: Fleet,
    dest: { x: number; y: number },
    curr: { x: number; y: number },
    dist: number,
    warp: number,
    order: FleetOrder,
  ): void {
    const perLy = this.calculateFleetFuelCostPerLy(game, fleet, warp);
    const maxLyFromFuel = perLy > 0 ? fleet.fuel / perLy : 1000;
    const step = Math.min(dist, maxLyFromFuel, warp * 20);

    this.updateFleetPosition(game, fleet, curr, dest, step, dist, order);
    fleet.fuel = Math.max(0, fleet.fuel - Math.ceil(perLy * step));
  }

  private updateFleetPosition(
    game: GameState,
    fleet: Fleet,
    curr: { x: number; y: number },
    dest: { x: number; y: number },
    step: number,
    dist: number,
    order: FleetOrder,
  ): void {
    if (step >= dist - 0.001) {
      this.completeMovement(game, fleet, dest, order);
    } else {
      const ratio = dist > 0 ? step / dist : 0;
      fleet.location = {
        type: 'space',
        x: curr.x + (dest.x - curr.x) * ratio,
        y: curr.y + (dest.y - curr.y) * ratio,
      };
    }
  }

  private completeMovement(
    game: GameState,
    fleet: Fleet,
    dest: { x: number; y: number },
    order: FleetOrder,
  ): void {
    if (order.type === 'orbit') {
      fleet.location = { type: 'orbit', planetId: order.planetId };
    } else {
      const targetStar = game.stars.find(
        (s) => Math.hypot(s.position.x - dest.x, s.position.y - dest.y) < 2,
      );
      if (targetStar) {
        fleet.location = { type: 'orbit', planetId: targetStar.planets[0].id };
      } else {
        fleet.location = { type: 'space', x: dest.x, y: dest.y };
      }
    }
    fleet.orders.shift();
  }

  private processColonizeOrder(game: GameState, fleet: Fleet, order: FleetOrder, planetIndex: Map<string, Planet>) {
    if (order.type !== 'colonize' || !order.planetId) return;
    const planet = planetIndex.get(order.planetId);
    if (!planet) return;

    const colonyStack = this.findColonyStack(game, fleet);
    if (!colonyStack) return;

    this.executeColonization(game, fleet, planet, colonyStack);
  }

  private findColonyStack(game: GameState, fleet: Fleet) {
    return fleet.ships.find((s) => {
      return this.getShipDesign(game, s.designId).colonyModule && s.count > 0;
    });
  }

  private executeColonization(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    colonyStack: { designId: string; count: number; damage?: number },
  ) {
    const hab = this.hab.calculate(planet, game.humanPlayer.species);
    this.consumeColonyShip(fleet, colonyStack);
    this.initializePlanet(game, planet, hab);
    this.transferColonistsAndMinerals(fleet, planet);
    this.recycleColonyShip(game, planet, colonyStack.designId);
    this.cleanupFleet(game, fleet);
  }

  private consumeColonyShip(fleet: Fleet, colonyStack: any) {
    colonyStack.count -= 1;
    if (colonyStack.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }
  }

  private initializePlanet(game: GameState, planet: Planet, hab: number) {
    planet.ownerId = game.humanPlayer.id;
    planet.governor = { type: this.settings.defaultGovernor() };
    planet.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000;
  }

  private transferColonistsAndMinerals(fleet: Fleet, planet: Planet) {
    const addedColonists = Math.max(0, fleet.cargo.colonists);
    planet.population = addedColonists;
    planet.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
  }

  private recycleColonyShip(game: GameState, planet: Planet, designId: string) {
    const effectiveDesign = this.getShipDesign(game, designId);
    const cost = this.shipyard.getShipCost(effectiveDesign, game.humanPlayer.techLevels);
    planet.resources += cost.resources;
    planet.surfaceMinerals.ironium += cost.ironium ?? 0;
    planet.surfaceMinerals.boranium += cost.boranium ?? 0;
    planet.surfaceMinerals.germanium += cost.germanium ?? 0;
  }

  private cleanupFleet(game: GameState, fleet: Fleet) {
    fleet.orders = [];
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    }
  }

  private planetPosition(game: GameState, planetId: string): { x: number; y: number } {
    const star = game.stars.find((s) => s.planets.some((p) => p.id === planetId));
    return star ? star.position : { x: 0, y: 0 };
  }

  private calculateMovementStats(game: GameState, fleet: Fleet) {
    const shipStats = this.calculateShipStats(game, fleet);
    const cargoMass = this.calculateCargoMass(fleet);
    const totalMass = shipStats.totalMass + cargoMass;

    return {
      maxWarp: Math.max(1, shipStats.maxWarp),
      idealWarp: Math.max(1, shipStats.idealWarp),
      totalMass: Math.max(1, totalMass),
      totalFuel: shipStats.totalFuel,
      worstEfficiency: Math.max(0, shipStats.worstEfficiency),
    };
  }

  private calculateShipStats(game: GameState, fleet: Fleet) {
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
    return { maxWarp, idealWarp, totalMass, totalFuel, worstEfficiency };
  }

  private calculateCargoMass(fleet: Fleet): number {
    return (
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      Math.floor(fleet.cargo.colonists / 1000)
    );
  }

  private calculateFleetFuelCostPerLy(game: GameState, fleet: Fleet, warp: number): number {
    const { totalCost, totalShipMass, weightedEngineFactorSum } = this.calculateShipsFuelCost(
      game,
      fleet,
      warp,
    );

    const averageFactor = totalShipMass > 0 ? weightedEngineFactorSum / totalShipMass : 0;
    const cargoCost = this.calculateCargoFuelCost(fleet, averageFactor);

    return totalCost + cargoCost;
  }

  private calculateShipsFuelCost(game: GameState, fleet: Fleet, warp: number) {
    let totalCost = 0;
    let totalShipMass = 0;
    let weightedEngineFactorSum = 0;

    for (const stack of fleet.ships) {
      const { cost, mass, factor } = this.calculateStackFuelCost(game, stack, warp);
      totalCost += cost;
      totalShipMass += mass;
      weightedEngineFactorSum += factor * mass * stack.count;
    }
    return { totalCost, totalShipMass, weightedEngineFactorSum };
  }

  private calculateStackFuelCost(game: GameState, stack: any, warp: number) {
    const design = game.shipDesigns.find((d) => d.id === stack.designId);
    if (!design) {
      return this.calculateLegacyStackCost(game, stack, warp);
    }

    const factor = this.getDesignEngineFactor(design, warp);
    const mass = design.spec?.mass || 10;
    const cost = (mass * stack.count * factor) / 2000;
    return { cost, mass: mass * stack.count, factor };
  }

  private calculateLegacyStackCost(game: GameState, stack: any, warp: number) {
    const legacySpec = this.getShipDesign(game, stack.designId);
    const factor = this.calculateLegacyEngineFactor(legacySpec, warp);
    const mass = legacySpec.mass || 10;
    const cost = (mass * stack.count * factor) / 2000;
    return { cost, mass: mass * stack.count, factor };
  }

  private getDesignEngineFactor(design: any, warp: number): number {
    const engineStat = this.findEngineComponent(design);
    if (engineStat) {
      const key = `warp${warp}`;
      return engineStat.stats.fuelUsage[key] || 0;
    }
    return this.calculateLegacyEngineFactor(design.spec, warp);
  }

  private findEngineComponent(design: any): any {
    if (design.slots) {
      for (const slot of design.slots) {
        if (!slot.components) continue;
        for (const compAssignment of slot.components) {
          const comp = ENGINE_COMPONENTS.find((c: any) => c.id === compAssignment.componentId);
          if (comp?.type === 'Engine') return comp;
          if (comp?.stats?.fuelUsage && !comp) return comp;
        }
      }
    }
    if (design.spec?.engine) {
      return ENGINE_COMPONENTS.find((c) => c.id === design.spec.engine.id);
    }
    return null;
  }

  private calculateCargoFuelCost(fleet: Fleet, averageFactor: number): number {
    const cargoMass =
      fleet.cargo.minerals.ironium +
      fleet.cargo.minerals.boranium +
      fleet.cargo.minerals.germanium +
      Math.floor(fleet.cargo.colonists / 1000) +
      fleet.cargo.resources;
    return (cargoMass * averageFactor) / 2000;
  }

  private calculateLegacyEngineFactor(spec: any, warp: number): number {
    if (!spec) return 0;
    const efficiency = spec.fuelEfficiency || 100;
    const idealWarp = spec.idealWarp || 6;
    if (efficiency === 0) return 0;

    // Formula to approximate factor:
    // Base Factor roughly 100?
    // Let's use the logic from fuelCostPerLightYearSpec:
    // cost = (mass/100) * speedMult * effMult
    // cost = (mass * factor) / 2000
    // => factor = (2000 / 100) * speedMult * effMult = 20 * speedMult * effMult

    const speedRatio = warp / idealWarp;
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = efficiency / 100;

    return 20 * speedMultiplier * efficiencyMultiplier;
  }
}
