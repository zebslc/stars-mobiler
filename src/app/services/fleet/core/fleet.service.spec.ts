import { FleetService, type LoadManifest, type UnloadManifest } from './fleet.service';
import { MAX_FLEETS_PER_PLAYER, MAX_SHIPS_PER_DESIGN } from './fleet.constants';
import type {
  Fleet,
  FleetOrder,
  GameSettings,
  GameState,
  Player,
  PlayerTech,
  Species,
  Star,
} from '../../../models/game.model';
import type { FleetLocation } from '../../../models/service-interfaces.model';
import type { TransferSpec } from '../transfer/fleet-transfer.types';
import type { FleetOperationsService } from '../operations/fleet-operations.service';
import type { FleetTransferService } from '../transfer/fleet-transfer.service';
import type { FleetCargoService } from '../cargo/fleet-cargo.service';
import type { FleetColonizationService } from '../colonization/fleet-colonization.service';
import type { FleetProcessingService } from '../processing/fleet-processing.service';

const BASE_TECH: PlayerTech = { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 };
const DEFAULT_SETTINGS: GameSettings = {
  galaxySize: 'small',
  aiCount: 0,
  aiDifficulty: 'easy',
  seed: 1,
  speciesId: 'species',
};

describe('FleetService', () => {
  let operations: jasmine.SpyObj<FleetOperationsService>;
  let transfer: jasmine.SpyObj<FleetTransferService>;
  let cargo: jasmine.SpyObj<FleetCargoService>;
  let colonization: jasmine.SpyObj<FleetColonizationService>;
  let processing: jasmine.SpyObj<FleetProcessingService>;
  let service: FleetService;

  beforeEach(() => {
    operations = jasmine.createSpyObj('FleetOperationsService', ['addShipToFleet', 'createFleet']);
    transfer = jasmine.createSpyObj('FleetTransferService', ['transfer', 'splitFleet', 'separateFleet', 'mergeFleets']);
    cargo = jasmine.createSpyObj('FleetCargoService', ['loadCargo', 'unloadCargo']);
    colonization = jasmine.createSpyObj('FleetColonizationService', ['colonizeNow']);
    processing = jasmine.createSpyObj('FleetProcessingService', ['processFleets']);

    service = new FleetService(
      operations as unknown as FleetOperationsService,
      transfer as unknown as FleetTransferService,
      cargo as unknown as FleetCargoService,
      colonization as unknown as FleetColonizationService,
      processing as unknown as FleetProcessingService,
    );
  });

  it('exposes fleet caps from constants', () => {
    expect(service.MAX_FLEETS).toBe(MAX_FLEETS_PER_PLAYER);
    expect(service.MAX_SHIPS_PER_DESIGN).toBe(MAX_SHIPS_PER_DESIGN);
  });

  it('delegates ship addition to operations service', () => {
    const game = createGameState();
    const star = createStar();

    service.addShipToFleet(game, star, 'design', 3);

    expect(operations.addShipToFleet).toHaveBeenCalledWith(game, star, 'design', 3);
  });

  it('delegates fleet creation to operations service', () => {
    const game = createGameState();
    const location: FleetLocation = { type: 'orbit', starId: 'star-1' };
    const createdFleet = createFleet();
    operations.createFleet.and.returnValue(createdFleet);

    const result = service.createFleet(game, location, 'owner', 'base');

    expect(result).toBe(createdFleet);
    expect(operations.createFleet).toHaveBeenCalledWith(game, location, 'owner', 'base');
  });

  it('delegates fleet transfer operations', () => {
    const game = createGameState();
    const transferResult = createGameState({ id: 'updated' });
    const spec: TransferSpec = { ships: [], fuel: 0, cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 } };
    transfer.transfer.and.returnValue(transferResult);

    const result = service.transfer(game, 'source', 'target', spec);

    expect(result).toBe(transferResult);
    expect(transfer.transfer).toHaveBeenCalledWith(game, 'source', 'target', spec);
  });

  it('delegates split fleet and returns new identifier', () => {
    const game = createGameState();
    const next = createGameState({ id: 'next' });
    const spec: TransferSpec = { ships: [], fuel: 0, cargo: { resources: 0, colonists: 0, ironium: 0, boranium: 0, germanium: 0 } };
    transfer.splitFleet.and.returnValue([next, 'new-fleet']);

    const result = service.splitFleet(game, 'source', spec);

    expect(result).toEqual([next, 'new-fleet']);
    expect(transfer.splitFleet).toHaveBeenCalledWith(game, 'source', spec);
  });

  it('delegates separation and merge flows', () => {
    const current = createGameState();
    const separated = createGameState({ id: 'separated' });
    const merged = createGameState({ id: 'merged' });
    transfer.separateFleet.and.returnValue(separated);
    transfer.mergeFleets.and.returnValue(merged);

    expect(service.separateFleet(current, 'fleet')).toBe(separated);
    expect(service.mergeFleets(current, 'a', 'b')).toBe(merged);
  });

  it('sets single order via issueFleetOrder helper', () => {
    const order: FleetOrder = { type: 'move', destination: { x: 1, y: 2 } };
    const game = createGameState({ fleets: [createFleet({ id: 'fleet', ownerId: 'player', orders: [] })] });
    const spy = spyOn(service, 'setFleetOrders').and.callThrough();

    service.issueFleetOrder(game, 'fleet', order);

    expect(spy).toHaveBeenCalledWith(game, 'fleet', [order]);
  });

  it('updates orders when fleet belongs to player', () => {
    const fleet = createFleet({ id: 'fleet-1', ownerId: 'player', orders: [] });
    const game = createGameState({ fleets: [fleet] });
    const orders: Array<FleetOrder> = [{ type: 'move', destination: { x: 5, y: 5 } }];

    const result = service.setFleetOrders(game, 'fleet-1', orders);

    expect(result).not.toBe(game);
    expect(fleet.orders).toEqual(orders);
  });

  it('ignores order updates for unknown fleets', () => {
    const game = createGameState();
    const orders: Array<FleetOrder> = [{ type: 'move', destination: { x: 1, y: 1 } }];

    const result = service.setFleetOrders(game, 'missing', orders);

    expect(result).toBe(game);
  });

  it('delegates colonization, cargo load, and unload', () => {
    const game = createGameState();
    const colonizeResult: [GameState, string | null] = [createGameState({ id: 'colonized' }), 'star-1'];
    colonization.colonizeNow.and.returnValue(colonizeResult);
    const loadResult = createGameState({ id: 'load' });
    const unloadResult = createGameState({ id: 'unload' });
    cargo.loadCargo.and.returnValue(loadResult);
    cargo.unloadCargo.and.returnValue(unloadResult);
    const manifest: LoadManifest = { resources: 'all' };
    const unloadManifest: UnloadManifest = { resources: 'all' };

    const colonize = service.colonizeNow(game, 'fleet');
    const load = service.loadCargo(game, 'fleet', 'star', manifest);
    const unload = service.unloadCargo(game, 'fleet', 'star', unloadManifest);

    expect(colonize).toBe(colonizeResult);
    expect(load).toBe(loadResult);
    expect(unload).toBe(unloadResult);
  });

  it('removes fleet during decommissioning', () => {
    const remaining = createFleet({ id: 'keep', ownerId: 'player' });
    const target = createFleet({ id: 'remove', ownerId: 'player' });
    const game = createGameState({ fleets: [remaining, target] });

    const result = service.decommissionFleet(game, 'remove');

    expect(result.fleets.some((f) => f.id === 'remove')).toBeFalse();
    expect(result.fleets.some((f) => f.id === 'keep')).toBeTrue();
  });

  it('delegates processing to FleetProcessingService', () => {
    const game = createGameState();

    service.processFleets(game);

    expect(processing.processFleets).toHaveBeenCalledWith(game);
  });
});

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: overrides.id ?? 'game',
    seed: overrides.seed ?? 1,
    turn: overrides.turn ?? 1,
    settings: overrides.settings ?? DEFAULT_SETTINGS,
    stars: overrides.stars ?? [],
    humanPlayer: overrides.humanPlayer ?? createPlayer(),
    aiPlayers: overrides.aiPlayers ?? [],
    fleets: overrides.fleets ?? [],
    playerEconomy: overrides.playerEconomy ?? { freighterCapacity: 0, research: 0 },
    shipDesigns: overrides.shipDesigns ?? [],
  };
}

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: overrides.id ?? 'player',
    name: overrides.name ?? 'Player',
    species: overrides.species ?? createSpecies(),
    ownedStarIds: overrides.ownedStarIds ?? [],
    techLevels: overrides.techLevels ?? { ...BASE_TECH },
    researchProgress: overrides.researchProgress ?? { ...BASE_TECH },
    selectedResearchField: overrides.selectedResearchField ?? 'Energy',
  };
}

function createSpecies(): Species {
  return {
    id: 'species',
    name: 'Species',
    habitat: { idealTemperature: 50, idealAtmosphere: 50, toleranceRadius: 20 },
    traits: [],
    primaryTraits: [],
    lesserTraits: [],
  };
}

function createFleet(overrides: Partial<Fleet> = {}): Fleet {
  return {
    id: overrides.id ?? 'fleet',
    name: overrides.name ?? 'Fleet',
    ownerId: overrides.ownerId ?? 'player',
    location: overrides.location ?? { type: 'space', x: 0, y: 0 },
    ships:
      overrides.ships ?? [
        { designId: 'design', count: 1, damage: 0 },
      ],
    fuel: overrides.fuel ?? 0,
    cargo:
      overrides.cargo ?? {
        resources: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
        colonists: 0,
      },
    orders: overrides.orders ?? [],
  };
}

function createStar(overrides: Partial<Star> = {}): Star {
  return {
    id: overrides.id ?? 'star',
    name: overrides.name ?? 'Star',
    position: overrides.position ?? { x: 0, y: 0 },
    temperature: overrides.temperature ?? 50,
    atmosphere: overrides.atmosphere ?? 50,
    mineralConcentrations:
      overrides.mineralConcentrations ?? { ironium: 0, boranium: 0, germanium: 0 },
    surfaceMinerals:
      overrides.surfaceMinerals ?? { ironium: 0, boranium: 0, germanium: 0 },
    ownerId: overrides.ownerId ?? null,
    population: overrides.population ?? 0,
    maxPopulation: overrides.maxPopulation ?? 0,
    mines: overrides.mines ?? 0,
    factories: overrides.factories ?? 0,
    defenses: overrides.defenses ?? 0,
    research: overrides.research ?? 0,
    scanner: overrides.scanner ?? 0,
    terraformOffset: overrides.terraformOffset ?? { temperature: 0, atmosphere: 0 },
    resources: overrides.resources ?? 0,
    buildQueue: overrides.buildQueue ?? [],
    governor: overrides.governor,
  };
}
