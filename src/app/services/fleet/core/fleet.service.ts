import { Injectable } from '@angular/core';
import type { GameState, Fleet, FleetOrder, Star, ShipDesign, ShipStack } from '../../../models/game.model';
import type { CompiledDesign } from '../../../data/ships.data';
import { getDesign } from '../../../data/ships.data';
import { ENGINE_COMPONENTS } from '../../../data/techs/engines.data';
import type { ComponentStats } from '../../../data/tech-atlas.types';
import { SettingsService } from '../../core/settings.service';
import { HabitabilityService } from '../../colony/habitability.service';
import { ShipyardService } from '../../ship-design/shipyard.service';
import type { TransferSpec } from '../transfer/fleet-transfer.types';

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

interface FleetMovementStats {
  maxWarp: number;
  idealWarp: number;
  totalMass: number;
  totalFuel: number;
  worstEfficiency: number;
}

interface ShipTransfer {
  designId: string;
  count: number;
  damage?: number;
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
   * Build star index for O(1) lookups.
   */
  private buildStarIndex(game: GameState): Map<string, Star> {
    const index = new Map<string, Star>();
    for (const star of game.stars) {
      index.set(star.id, star);
    }
    return index;
  }

  addShipToFleet(game: GameState, star: Star, shipDesignId: string, count: number): void {
    const designId = shipDesignId ?? 'scout';
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    const legacyDesign = !shipDesign ? getDesign(designId) : null;
    const isStarbase = shipDesign?.spec?.isStarbase ?? legacyDesign?.isStarbase ?? false;

    let fleet = this.findTargetFleet(game, star, isStarbase);
    if (!fleet) {
      fleet = this.createFleet(
        game,
        { type: 'orbit', starId: star.id },
        game.humanPlayer.id,
        designId,
      );
    }

    this.addShipsToStack(fleet, designId, count);
    this.addStartingFuel(fleet, shipDesign ?? null, legacyDesign, count);
    this.loadColonistsForNewShip(star, fleet, shipDesign ?? null, legacyDesign, count);
  }

  private findTargetFleet(game: GameState, star: Star, isStarbase: boolean): Fleet | undefined {
    const orbitFleets = this.getOrbitFleets(game, star);
    if (isStarbase) {
      return orbitFleets.find((f) => this.hasStarbase(game, f));
    }
    return orbitFleets.find((f) => !this.hasStarbase(game, f));
  }

  private getOrbitFleets(game: GameState, star: Star): Array<Fleet> {
    return game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.location.type === 'orbit' &&
        (f.location as { type: 'orbit'; starId: string }).starId === star.id,
    );
  }

  private hasStarbase(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const d = game.shipDesigns.find((sd) => sd.id === s.designId);
      const ld = !d ? getDesign(s.designId) : null;
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

  private addStartingFuel(fleet: Fleet, shipDesign: ShipDesign | null, legacyDesign: CompiledDesign | null, count: number): void {
    const fuelCap = shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
    fleet.fuel += fuelCap * count;
  }

  private loadColonistsForNewShip(
    star: Star,
    fleet: Fleet,
    shipDesign: ShipDesign | null,
    legacyDesign: CompiledDesign | null,
    count: number,
  ): void {
    const hasColony = shipDesign?.spec?.hasColonyModule ?? legacyDesign?.colonyModule;
    const colCap = shipDesign?.spec?.colonistCapacity ?? legacyDesign?.colonistCapacity;

    if (hasColony && colCap) {
      const totalColCap = colCap * count;
      const amount = Math.min(totalColCap, star.population);
      star.population -= amount;
      fleet.cargo.colonists += amount;
    }
  }

  createFleet(
    game: GameState,
    location: { type: 'space'; x: number; y: number } | { type: 'orbit'; starId: string },
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
    // Only check legacy designs if no user design found
    const legacyDesign = !userDesign && baseNameSource ? getDesign(baseNameSource) : null;
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
    location: { type: 'space'; x: number; y: number } | { type: 'orbit'; starId: string },
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
      return (source.location as { type: 'orbit'; starId: string }).starId ===
        (target.location as { type: 'orbit'; starId: string }).starId;
    }
    return (
      (source.location as { type: 'space'; x: number; y: number }).x ===
        (target.location as { type: 'space'; x: number; y: number }).x &&
      (source.location as { type: 'space'; x: number; y: number }).y ===
        (target.location as { type: 'space'; x: number; y: number }).y
    );
  }

  private transferShips(source: Fleet, target: Fleet, shipsToTransfer: Array<ShipTransfer>): void {
    for (const ship of shipsToTransfer) {
      const sourceStack = source.ships.find(
        (s) => s.designId === ship.designId && (s.damage || 0) === (ship.damage || 0),
      );
      if (!sourceStack || sourceStack.count < ship.count) continue;

      this.moveShipStack(source, target, sourceStack, ship);
    }
  }

  private moveShipStack(source: Fleet, target: Fleet, sourceStack: ShipStack, ship: ShipTransfer): void {
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

  private transferCargo(source: Fleet, target: Fleet, cargoSpec: TransferSpec['cargo']): void {
    this.moveCargoItem(source, target, 'resources', cargoSpec.resources);
    this.moveCargoItem(source, target, 'colonists', cargoSpec.colonists);
    this.moveCargoItem(source, target, 'ironium', cargoSpec.ironium, true);
    this.moveCargoItem(source, target, 'boranium', cargoSpec.boranium, true);
    this.moveCargoItem(source, target, 'germanium', cargoSpec.germanium, true);
  }

  private moveCargoItem(
    source: Fleet,
    target: Fleet,
    key: 'resources' | 'colonists' | 'ironium' | 'boranium' | 'germanium',
    amount: number,
    isMineral = false,
  ): void {
    if (isMineral && (key === 'ironium' || key === 'boranium' || key === 'germanium')) {
      const val = Math.min(source.cargo.minerals[key], amount);
      source.cargo.minerals[key] -= val;
      target.cargo.minerals[key] += val;
    } else if (!isMineral && (key === 'resources' || key === 'colonists')) {
      const val = Math.min(source.cargo[key], amount);
      source.cargo[key] -= val;
      target.cargo[key] += val;
    }
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

  private getShipsToSeparate(source: Fleet): Array<{ designId: string; damage: number }> {
    const shipsToMove: Array<{ designId: string; damage: number }> = [];
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

  decommissionFleet(game: GameState, fleetId: string): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) return game;
    game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    return { ...game, fleets: [...game.fleets] };
  }

  issueFleetOrder(game: GameState, fleetId: string, order: FleetOrder): GameState {
    return this.setFleetOrders(game, fleetId, [order]);
  }

  setFleetOrders(game: GameState, fleetId: string, orders: Array<FleetOrder>): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) return game;
    fleet.orders = orders;
    return { ...game };
  }

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') return [game, null];

    const starIndex = this.buildStarIndex(game);
    const star = starIndex.get(
      (fleet.location as { type: 'orbit'; starId: string }).starId,
    );

    if (!star) return [game, null];

    const colonyStack = this.findColonyStack(game, fleet);
    if (!colonyStack) return [game, null];

    this.executeColonization(game, fleet, star, colonyStack);

    const newGame = { ...game, stars: [...game.stars], fleets: [...game.fleets] };
    return [newGame, star.id];
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
  loadCargo(game: GameState, fleetId: string, starId: string, manifest: LoadManifest): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const star = this.buildStarIndex(game).get(starId);
    if (!fleet || !star) return game;

    this.processLoadMinerals(game, fleet, star, manifest);
    this.processLoadResources(game, fleet, star, manifest);
    this.processLoadColonists(game, fleet, star, manifest);

    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }

  private processLoadMinerals(
    game: GameState,
    fleet: Fleet,
    star: Star,
    manifest: LoadManifest,
  ) {
    this.loadMineralItem(game, fleet, star, 'ironium', manifest.ironium);
    this.loadMineralItem(game, fleet, star, 'boranium', manifest.boranium);
    this.loadMineralItem(game, fleet, star, 'germanium', manifest.germanium);
  }

  private loadMineralItem(
    game: GameState,
    fleet: Fleet,
    star: Star,
    key: 'ironium' | 'boranium' | 'germanium',
    req: number | 'all' | 'fill' | undefined,
  ) {
    if (!req) return;
    const capacity = this.fleetCargoCapacity(game, fleet);
    const used = this.fleetCargoUsed(fleet);
    const free = Math.max(0, capacity - used);

    const available = star.surfaceMinerals[key];
    const wanted = req === 'all' ? available : req === 'fill' ? free : Math.max(0, Math.floor(req));
    const take = Math.min(wanted, available, free);

    star.surfaceMinerals[key] -= take;
    fleet.cargo.minerals[key] += take;
  }

  private processLoadResources(
    game: GameState,
    fleet: Fleet,
    star: Star,
    manifest: LoadManifest,
  ) {
    if (!manifest.resources) return;
    const free = Math.max(0, this.fleetCargoCapacity(game, fleet) - this.fleetCargoUsed(fleet));
    const available = star.resources;
    const wanted =
      manifest.resources === 'all'
        ? available
        : manifest.resources === 'fill'
          ? free
          : Math.max(0, Math.floor(manifest.resources));
    const take = Math.min(wanted, available, free);

    star.resources -= take;
    fleet.cargo.resources += take;
  }

  private processLoadColonists(
    game: GameState,
    fleet: Fleet,
    star: Star,
    manifest: LoadManifest,
  ) {
    if (!manifest.colonists) return;
    const freeKT = Math.max(0, this.fleetCargoCapacity(game, fleet) - this.fleetCargoUsed(fleet));
    const availablePeople = star.population;
    const roomPeople = freeKT * 1000;

    const wantedPeople =
      manifest.colonists === 'all'
        ? availablePeople
        : manifest.colonists === 'fill'
          ? roomPeople
          : Math.max(0, Math.floor(manifest.colonists));
    const takePeople = Math.min(wantedPeople, availablePeople, roomPeople);

    star.population = Math.max(0, star.population - takePeople);
    fleet.cargo.colonists += takePeople;
  }

  unloadCargo(
    game: GameState,
    fleetId: string,
    starId: string,
    manifest: UnloadManifest,
  ): GameState {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    const star = this.buildStarIndex(game).get(starId);
    if (!fleet || !star) return game;

    this.processUnloadMinerals(fleet, star, manifest);
    this.processUnloadResources(fleet, star, manifest);
    this.processUnloadColonists(fleet, star, manifest);

    return { ...game, stars: [...game.stars], fleets: [...game.fleets] };
  }

  private processUnloadMinerals(fleet: Fleet, star: Star, manifest: UnloadManifest) {
    this.unloadMineralItem(fleet, star, 'ironium', manifest.ironium);
    this.unloadMineralItem(fleet, star, 'boranium', manifest.boranium);
    this.unloadMineralItem(fleet, star, 'germanium', manifest.germanium);
  }

  private unloadMineralItem(
    fleet: Fleet,
    star: Star,
    key: 'ironium' | 'boranium' | 'germanium',
    req: number | 'all' | undefined,
  ) {
    if (!req) return;
    const available = fleet.cargo.minerals[key];
    const wanted = req === 'all' ? available : Math.max(0, Math.floor(req));
    const give = Math.min(wanted, available);

    fleet.cargo.minerals[key] -= give;
    star.surfaceMinerals[key] += give;
  }

  private processUnloadResources(fleet: Fleet, star: Star, manifest: UnloadManifest) {
    if (!manifest.resources) return;
    const available = fleet.cargo.resources;
    const wanted =
      manifest.resources === 'all' ? available : Math.max(0, Math.floor(manifest.resources));
    const give = Math.min(wanted, available);

    fleet.cargo.resources -= give;
    star.resources += give;
  }

  private processUnloadColonists(fleet: Fleet, star: Star, manifest: UnloadManifest) {
    if (!manifest.colonists) return;
    const availablePeople = fleet.cargo.colonists;
    const wantedPeople =
      manifest.colonists === 'all' ? availablePeople : Math.max(0, Math.floor(manifest.colonists));
    const givePeople = Math.min(wantedPeople, availablePeople);

    fleet.cargo.colonists -= givePeople;
    star.population += givePeople;
  }

  private getShipDesign(game: GameState, designId: string): CompiledDesign {
    const dynamicDesign = game.shipDesigns.find((d) => d.id === designId);
    if (dynamicDesign?.spec) {
      const engineStats = this.findEngineComponent(dynamicDesign);
      const engineMaxWarp = engineStats?.stats?.maxWarp;
      const calculatedWarp = engineMaxWarp ?? dynamicDesign.spec.warpSpeed;
      const idealWarp = Math.min(dynamicDesign.spec.idealWarp, calculatedWarp);

      return {
        id: dynamicDesign.id,
        name: dynamicDesign.name,
        hullId: dynamicDesign.hullId,
        hullName: dynamicDesign.name,
        mass: dynamicDesign.spec.mass,
        cargoCapacity: dynamicDesign.spec.cargoCapacity,
        fuelCapacity: dynamicDesign.spec.fuelCapacity,
        fuelEfficiency: dynamicDesign.spec.fuelEfficiency ?? 100,
        warpSpeed: calculatedWarp,
        idealWarp,
        armor: dynamicDesign.spec.armor,
        shields: dynamicDesign.spec.shields,
        initiative: dynamicDesign.spec.initiative,
        firepower: dynamicDesign.spec.firepower,
        colonistCapacity: dynamicDesign.spec.colonistCapacity,
        cost: dynamicDesign.spec.cost,
        colonyModule: dynamicDesign.spec.hasColonyModule,
        scannerRange: dynamicDesign.spec.scanRange,
        cloakedRange: 0,
        components: dynamicDesign.spec.components,
      };
    }
    return getDesign(designId);
  }

  processFleets(game: GameState) {
    const starIndex = this.buildStarIndex(game);
    for (const fleet of game.fleets) {
      if (fleet.ownerId !== game.humanPlayer.id) continue;

      this.refuelFleet(game, fleet, starIndex);

      const order = fleet.orders[0];
      if (!order) continue;

      if (order.type === 'move' || order.type === 'orbit') {
        this.processMovementOrder(game, fleet, order, starIndex);
      } else if (order.type === 'colonize') {
        this.processColonizeOrder(game, fleet, order, starIndex);
      }
    }
  }

  private refuelFleet(game: GameState, fleet: Fleet, starIndex: Map<string, Star>) {
    const totalFuelCapacity = this.calculateTotalFuelCapacity(game, fleet);

    if (fleet.location.type === 'orbit') {
      this.refuelFromStar(game, fleet, starIndex, totalFuelCapacity);
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

  private refuelFromStar(
    game: GameState,
    fleet: Fleet,
    starIndex: Map<string, Star>,
    totalFuelCapacity: number,
  ) {
    const star = starIndex.get(
      (fleet.location as { type: 'orbit'; starId: string }).starId,
    );

    if (star && star.ownerId === fleet.ownerId) {
      const hasStardock = this.checkForStardock(game, fleet, star.id);
      const refuelRate = hasStardock ? 1.0 : 0.25;
      fleet.fuel = Math.min(totalFuelCapacity, fleet.fuel + totalFuelCapacity * refuelRate);
    }
  }

  private checkForStardock(game: GameState, fleet: Fleet, starId: string): boolean {
    return game.fleets.some(
      (f) =>
        f.ownerId === fleet.ownerId &&
        f.location.type === 'orbit' &&
        (f.location as { type: 'orbit'; starId: string }).starId === starId &&
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
    starIndex: Map<string, Star>,
  ) {
    if (order.type !== 'move' && order.type !== 'orbit') return;

    const dest = this.getMovementDestination(game, fleet, order, starIndex);
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
    starIndex: Map<string, Star>,
  ): { x: number; y: number } | null {
    if (order.type === 'orbit') {
      return this.getOrbitDestination(game, fleet, order, starIndex);
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
    starIndex: Map<string, Star>,
  ): { x: number; y: number } | null {
    if (order.type !== 'orbit') return null;

    if (!starIndex.has(order.starId)) {
      fleet.orders.shift();
      return null;
    }
    if (fleet.location.type === 'orbit' && fleet.location.starId === order.starId) {
      if (order.action === 'colonize') {
        fleet.orders.splice(1, 0, { type: 'colonize', starId: order.starId });
      }
      fleet.orders.shift();
      return null;
    }
    return this.starPosition(game, order.starId);
  }

  private getCurrentPosition(game: GameState, fleet: Fleet): { x: number; y: number } {
    return fleet.location.type === 'orbit'
      ? this.starPosition(game, fleet.location.starId)
      : { x: fleet.location.x, y: fleet.location.y };
  }

  private calculateTravelWarp(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    stats: FleetMovementStats,
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
      fleet.location = { type: 'orbit', starId: order.starId };
      if (order.action === 'colonize') {
        fleet.orders.splice(1, 0, { type: 'colonize', starId: order.starId });
      }
    } else {
      this.resolveSpaceMovement(game, fleet, dest);
    }
    fleet.orders.shift();
  }

  private resolveSpaceMovement(game: GameState, fleet: Fleet, dest: { x: number; y: number }) {
    const targetStar = game.stars.find(
      (s) => Math.hypot(s.position.x - dest.x, s.position.y - dest.y) < 2,
    );
    if (targetStar) {
      fleet.location = { type: 'orbit', starId: targetStar.id };
    } else {
      fleet.location = { type: 'space', x: dest.x, y: dest.y };
    }
  }

  private processColonizeOrder(
    game: GameState,
    fleet: Fleet,
    order: FleetOrder,
    starIndex: Map<string, Star>,
  ) {
    if (order.type !== 'colonize' || !order.starId) return;
    const star = starIndex.get(order.starId);
    if (!star) return;

    const colonyStack = this.findColonyStack(game, fleet);
    if (!colonyStack) return;

    this.executeColonization(game, fleet, star, colonyStack);
  }

  private findColonyStack(game: GameState, fleet: Fleet) {
    return fleet.ships.find((s) => {
      return this.getShipDesign(game, s.designId).colonyModule && s.count > 0;
    });
  }

  private executeColonization(
    game: GameState,
    fleet: Fleet,
    star: Star,
    colonyStack: ShipStack,
  ) {
    const hab = this.hab.calculate(star, game.humanPlayer.species);
    this.consumeColonyShip(fleet, colonyStack);
    this.initializeStar(game, star, hab);
    this.transferColonistsAndMinerals(fleet, star);
    this.recycleColonyShip(game, star, colonyStack.designId);
    this.cleanupFleet(game, fleet);
  }

  private consumeColonyShip(fleet: Fleet, colonyStack: ShipStack) {
    colonyStack.count -= 1;
    if (colonyStack.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }
  }

  private initializeStar(game: GameState, star: Star, hab: number) {
    star.ownerId = game.humanPlayer.id;
    star.governor = { type: this.settings.defaultGovernor() };
    star.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000;
  }

  private transferColonistsAndMinerals(fleet: Fleet, star: Star) {
    const addedColonists = Math.max(0, fleet.cargo.colonists);
    star.population = addedColonists;
    star.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    star.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    star.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
  }

  private recycleColonyShip(game: GameState, star: Star, designId: string) {
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    if (shipDesign) {
      const cost = this.shipyard.getShipCost(shipDesign, game.humanPlayer.techLevels);
      star.resources += cost.resources;
      star.surfaceMinerals.ironium += cost.ironium ?? 0;
      star.surfaceMinerals.boranium += cost.boranium ?? 0;
      star.surfaceMinerals.germanium += cost.germanium ?? 0;
    } else {
      const legacyDesign = getDesign(designId);
      star.resources += legacyDesign.cost.resources;
      star.surfaceMinerals.ironium += legacyDesign.cost.ironium ?? 0;
      star.surfaceMinerals.boranium += legacyDesign.cost.boranium ?? 0;
      star.surfaceMinerals.germanium += legacyDesign.cost.germanium ?? 0;
    }
  }

  private cleanupFleet(game: GameState, fleet: Fleet) {
    fleet.orders = [];
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
    }
  }

  private starPosition(game: GameState, starId: string): { x: number; y: number } {
    const star = game.stars.find((s) => s.id === starId);
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

  private calculateStackFuelCost(game: GameState, stack: ShipStack, warp: number) {
    const design = game.shipDesigns.find((d) => d.id === stack.designId);
    if (!design) {
      return this.calculateLegacyStackCost(game, stack, warp);
    }

    const factor = this.getDesignEngineFactor(design, warp);
    const mass = design.spec?.mass || 10;
    const cost = (mass * stack.count * factor) / 2000;
    return { cost, mass: mass * stack.count, factor };
  }

  private calculateLegacyStackCost(game: GameState, stack: ShipStack, warp: number) {
    const legacySpec = this.getShipDesign(game, stack.designId);
    const factor = this.calculateLegacyEngineFactor(legacySpec, warp);
    const mass = legacySpec.mass || 10;
    const cost = (mass * stack.count * factor) / 2000;
    return { cost, mass: mass * stack.count, factor };
  }

  private getDesignEngineFactor(design: ShipDesign, warp: number): number {
    const engineStat = this.findEngineComponent(design);
    if (engineStat?.stats?.fuelUsage) {
      const key = `warp${warp}` as keyof typeof engineStat.stats.fuelUsage;
      return engineStat.stats.fuelUsage[key] || 0;
    }
    return this.calculateLegacyEngineFactor(design.spec ?? null, warp);
  }

  private findEngineComponent(design: ShipDesign): ComponentStats | null {
    if (design.slots) {
      for (const slot of design.slots) {
        if (!slot.components) continue;
        for (const compAssignment of slot.components) {
          const comp = ENGINE_COMPONENTS.find((c) => c.id === compAssignment.componentId);
          if (comp?.type === 'Engine') return comp;
        }
      }
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

  private calculateLegacyEngineFactor(spec: CompiledDesign | { fuelEfficiency?: number; idealWarp?: number } | null, warp: number): number {
    if (!spec) return 0;
    const efficiency = spec.fuelEfficiency || 100;
    const idealWarp = spec.idealWarp || 6;
    if (efficiency === 0) return 0;

    const speedRatio = warp / idealWarp;
    const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
    const efficiencyMultiplier = efficiency / 100;

    return 20 * speedMultiplier * efficiencyMultiplier;
  }
}
