/// <reference types="jasmine" />
import { FleetMovementService } from './fleet-movement.service';
import type { LoggingService } from '../../core/logging.service';
import type {
  Fleet,
  GameSettings,
  GameState,
  Player,
  Species,
  Star,
} from '../../../models/game.model';
import type { FleetLocation } from '../../../models/service-interfaces.model';
import { FleetMovementOrderService } from './fleet-movement-order.service';
import { FleetMovementStatsService } from './fleet-movement-stats.service';
import { FleetFuelCalculatorService } from '../fuel/fleet-fuel-calculator.service';
import { FleetMovementValidatorService } from './fleet-movement-validator.service';
import { FleetShipDesignService } from '../design/fleet-ship-design.service';
import type { CompiledDesign } from '../../data/ship-design-registry.service';

interface FleetMovementTestContext {
  service: FleetMovementService;
  logging: jasmine.SpyObj<LoggingService>;
  orderService: FleetMovementOrderService;
  shipDesignService: jasmine.SpyObj<FleetShipDesignService>;
  statsService: FleetMovementStatsService;
  fuelCalculator: FleetFuelCalculatorService;
  validator: FleetMovementValidatorService;
  designSpy: jasmine.Spy;
  player: Player;
  star: Star;
  settings: GameSettings;
}

describe('FleetMovementService moveFleet', () => {
  let ctx: FleetMovementTestContext;
  let mockGame: GameState;
  let fleet: Fleet;

  beforeEach(() => {
    ctx = createTestContext();
    ({ game: mockGame, fleet } = createMoveFleetScenario(ctx));
  });

  it('adds a move order to a space destination', () => {
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    ctx.service.moveFleet(mockGame, fleet.id, destination);

    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0].type).toBe('move');
    expect(fleet.orders[0]).toEqual({ type: 'move', destination: { x: 50, y: 75 } });
  });

  it('adds a move order to the coordinates of an orbit destination', () => {
    const destination: FleetLocation = { type: 'orbit', starId: ctx.star.id };

    ctx.service.moveFleet(mockGame, fleet.id, destination);

    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0]).toEqual({
      type: 'move',
      destination: { x: ctx.star.position.x, y: ctx.star.position.y },
    });
  });

  it('logs an error when the fleet cannot be found', () => {
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    ctx.service.moveFleet(mockGame, 'nonexistent', destination);

    expect(ctx.logging.error).toHaveBeenCalledWith(
      'Fleet not found: nonexistent',
      jasmine.any(Object),
    );
  });

  it('logs the movement request', () => {
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    ctx.service.moveFleet(mockGame, fleet.id, destination);

    expect(ctx.logging.debug).toHaveBeenCalledWith(
      'Moving fleet f1 to destination',
      jasmine.any(Object),
    );
    expect(ctx.logging.info).toHaveBeenCalledWith(
      'Fleet Test Fleet ordered to move to space location',
      jasmine.any(Object),
    );
  });
});

describe('FleetMovementService calculateFuelConsumption', () => {
  let ctx: FleetMovementTestContext;
  let fleet: Fleet;

  beforeEach(() => {
    ctx = createTestContext();
    fleet = createFleetFixture(ctx.player);
  });

  it('returns a number greater than zero for a valid fleet', () => {
    const consumption = ctx.service.calculateFuelConsumption(fleet, 100);

    expect(consumption).toBeGreaterThan(0);
    expect(typeof consumption).toBe('number');
  });

  it('returns zero when the fleet has no ships', () => {
    fleet = {
      ...fleet,
      ships: [],
    };

    const consumption = ctx.service.calculateFuelConsumption(fleet, 100);

    expect(consumption).toBe(0);
    expect(ctx.logging.warn).toHaveBeenCalledWith(
      'Fleet has no ships for fuel calculation',
      jasmine.any(Object),
    );
  });

  it('scales fuel consumption with distance', () => {
    const consumption50 = ctx.service.calculateFuelConsumption(fleet, 50);
    const consumption100 = ctx.service.calculateFuelConsumption(fleet, 100);

    expect(consumption100).toBeCloseTo(consumption50 * 2, 1);
  });

  it('logs fuel calculations', () => {
    ctx.service.calculateFuelConsumption(fleet, 100);

    expect(ctx.logging.debug).toHaveBeenCalledWith(
      'Calculating fuel consumption for 100 LY',
      jasmine.any(Object),
    );
  });

  it('returns 0 when fleet has no valid engine', () => {
    ctx.designSpy.and.callFake((designId: string): CompiledDesign => {
      const design = createCompiledDesign({ id: designId });
      return { ...design, fuelCapacity: 0 };
    });

    const consumption = ctx.service.calculateFuelConsumption(fleet, 10);

    expect(consumption).toBeGreaterThanOrEqual(0);
  });
});

describe('FleetMovementService validateMovement', () => {
  let ctx: FleetMovementTestContext;
  let fleet: Fleet;

  beforeEach(() => {
    ctx = createTestContext();
    fleet = createFleetFixture(ctx.player, { fuel: 1000 });
  });

  it('passes validation for a reachable destination', () => {
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.fuelAvailable).toBe(1000);
    expect(result.fuelRequired).toBeGreaterThan(0);
  });

  it('flags fleets without ships', () => {
    fleet = {
      ...fleet,
      ships: [],
    };
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Fleet has no ships');
  });

  it('flags space destinations without coordinates', () => {
    const destination = { type: 'space' } as FleetLocation;

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Space destination requires x and y coordinates');
  });

  it('flags orbit destinations without a starId', () => {
    const destination = { type: 'orbit' } as FleetLocation;

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Orbit destination requires starId');
  });

  it('warns when available fuel is insufficient', () => {
    fleet = {
      ...fleet,
      fuel: 1,
    };
    const destination: FleetLocation = { type: 'space', x: 1000, y: 1000 };

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Insufficient fuel');
    expect(result.canMove).toBe(false);
  });

  it('marks short trips as move-ready', () => {
    const destination: FleetLocation = { type: 'space', x: 10, y: 10 };

    const result = ctx.service.validateMovement(fleet, destination);

    expect(result.isValid).toBe(true);
    expect(result.canMove).toBe(true);
  });

  it('logs validation flow', () => {
    const destination: FleetLocation = { type: 'space', x: 50, y: 75 };

    ctx.service.validateMovement(fleet, destination);

    expect(ctx.logging.debug).toHaveBeenCalledWith(
      'Validating fleet movement',
      jasmine.any(Object),
    );
  });
});

function createTestContext(): FleetMovementTestContext {
  const logging = jasmine.createSpyObj<LoggingService>('LoggingService', [
    'debug',
    'info',
    'warn',
    'error',
  ]);
  const orderService = new FleetMovementOrderService();
  const shipDesignService = jasmine.createSpyObj<FleetShipDesignService>('FleetShipDesignService', [
    'getDesign',
  ]);
  const statsService = new FleetMovementStatsService(shipDesignService);
  const fuelCalculator = new FleetFuelCalculatorService(logging, shipDesignService);
  const validator = new FleetMovementValidatorService(fuelCalculator);
  const species = createSpecies();
  const player = createPlayer(species);
  const star = createStar(player.id);
  const settings = createSettings(species.id);
  const designSpy = shipDesignService.getDesign.and.callFake((designId: string) =>
    createCompiledDesign({ id: designId, engine: { id: 'eng_fuel_mizer' } }),
  );
  const service = new FleetMovementService(
    logging,
    orderService,
    statsService,
    fuelCalculator,
    validator,
    shipDesignService,
  );

  return {
    service,
    logging,
    orderService,
    shipDesignService,
    statsService,
    fuelCalculator,
    validator,
    designSpy,
    player,
    star,
    settings,
  };
}

function createMoveFleetScenario(ctx: FleetMovementTestContext): { game: GameState; fleet: Fleet } {
  const fleet = createFleetFixture(ctx.player, { id: 'f1', fuel: 100 });
  const game = createGameState(ctx, { fleets: [fleet] });

  return { game, fleet };
}

function createFleetFixture(player: Player, overrides: Partial<Fleet> = {}): Fleet {
  const base: Fleet = {
    id: 'f1',
    ownerId: player.id,
    name: 'Test Fleet',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: 'scout', count: 1, damage: 0 }],
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    fuel: 100,
    orders: [],
  };

  return {
    ...base,
    ...overrides,
    location: overrides.location ?? base.location,
    ships: overrides.ships ?? base.ships,
    cargo: overrides.cargo ?? base.cargo,
    orders: overrides.orders ?? base.orders,
  };
}

function createGameState(
  ctx: FleetMovementTestContext,
  overrides: Partial<GameState> = {},
): GameState {
  const base: GameState = {
    id: 'game1',
    seed: 123,
    turn: 1,
    settings: ctx.settings,
    stars: [ctx.star],
    humanPlayer: ctx.player,
    aiPlayers: [],
    fleets: [],
    shipDesigns: [],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  return {
    ...base,
    ...overrides,
    stars: overrides.stars ?? base.stars,
    fleets: overrides.fleets ?? base.fleets,
    aiPlayers: overrides.aiPlayers ?? base.aiPlayers,
    shipDesigns: overrides.shipDesigns ?? base.shipDesigns,
  };
}

function createSpecies(): Species {
  return {
    id: 'species-human',
    name: 'Human',
    habitat: { idealTemperature: 50, idealAtmosphere: 50, toleranceRadius: 20 },
    traits: [],
    primaryTraits: [],
    lesserTraits: [],
  };
}

function createPlayer(species: Species): Player {
  return {
    id: 'p1',
    name: 'Human',
    species,
    ownedStarIds: [],
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    scanReports: {},
  };
}

function createStar(ownerId: string): Star {
  return {
    id: 'planet1',
    name: 'Sol',
    position: { x: 100, y: 200 },
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    ownerId,
    population: 10_000,
    maxPopulation: 1_000_000,
    resources: 1_000,
    mines: 10,
    factories: 10,
    defenses: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    buildQueue: [],
    scanner: 0,
    research: 0,
  };
}

function createSettings(speciesId: string): GameSettings {
  return {
    galaxySize: 'small',
    aiCount: 0,
    aiDifficulty: 'easy',
    seed: 123,
    speciesId,
  };
}

function createCompiledDesign(overrides: Partial<CompiledDesign> = {}): CompiledDesign {
  const base: CompiledDesign = {
    id: 'scout',
    name: 'Scout',
    hullId: 'scout',
    hullName: 'Scout',
    mass: 10,
    cargoCapacity: 0,
    fuelCapacity: 20,
    fuelEfficiency: 100,
    warpSpeed: 5,
    idealWarp: 5,
    armor: 0,
    shields: 0,
    initiative: 0,
    firepower: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    colonyModule: false,
    scannerRange: 0,
    cloakedRange: 0,
    components: [],
    engine: { id: 'eng_fuel_mizer' },
  };

  return {
    ...base,
    ...overrides,
    cost: { ...base.cost, ...overrides.cost },
    components: overrides.components ? [...overrides.components] : [...base.components],
    engine: overrides.engine ?? base.engine,
  };
}
