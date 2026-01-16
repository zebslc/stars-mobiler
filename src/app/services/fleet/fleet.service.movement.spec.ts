import { FleetService } from './fleet.service';
import { SettingsService } from '../core/settings.service';
import type { HabitabilityService } from '../colony/habitability.service';
import type { ShipyardService } from '../ship-design/shipyard.service';
import type {
  CompiledShipStats,
  Fleet,
  FleetOrder,
  GameSettings,
  GameState,
  Player,
  PlayerTech,
  ShipDesign,
  SlotAssignment,
  Species,
} from '../../models/game.model';

type MoveOrder = Extract<FleetOrder, { type: 'move' }>;

interface MovementScenario {
  game: GameState;
  fleet: Fleet;
  moveOrder: MoveOrder;
  design: ShipDesign;
}

const BASE_PLAYER_TECH: PlayerTech = {
  Energy: 0,
  Kinetics: 0,
  Propulsion: 0,
  Construction: 0,
};

const BASE_SPEC: CompiledShipStats = {
  warpSpeed: 10,
  fuelCapacity: 1000,
  fuelEfficiency: 100,
  idealWarp: 6,
  isRamscoop: false,
  firepower: 0,
  maxWeaponRange: 0,
  armor: 0,
  shields: 0,
  accuracy: 0,
  initiative: 0,
  cargoCapacity: 0,
  colonistCapacity: 0,
  scanRange: 0,
  penScanRange: 0,
  canDetectCloaked: false,
  miningRate: 0,
  terraformRate: 0,
  bombing: { kill: 0, destroy: 0 },
  massDriver: { speed: 0, catch: 0 },
  mass: 100,
  cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
  hasEngine: true,
  hasColonyModule: false,
  isStarbase: false,
  isValid: true,
  validationErrors: [],
  components: [],
};

describe('FleetService Movement NEW', () => {
  let service: FleetService;
  let settingsService: SettingsService;
  let habitabilityService: jasmine.SpyObj<HabitabilityService>;
  let shipyardService: jasmine.SpyObj<ShipyardService>;

  beforeEach(() => {
    settingsService = new SettingsService();
    habitabilityService = jasmine.createSpyObj<HabitabilityService>('HabitabilityService', ['calculate']);
    shipyardService = jasmine.createSpyObj<ShipyardService>('ShipyardService', ['getShipCost']);
    service = new FleetService(settingsService, habitabilityService, shipyardService);
  });

  it('rides Quick Jump 5 at warp two for 100 ly using six fuel', () => {
    const { game, fleet, moveOrder, design } = createMovementScenario({ fuel: 50, distance: 100 });

    expect(design.spec).toBeDefined();
    const spec = design.spec!;
    design.hullId = 'hull-scout';
    spec.mass = 12;
    spec.fuelCapacity = 50;
    design.slots = createEngineSlot('eng_quick_jump_5');
    moveOrder.warpSpeed = 2;

    service.processFleets(game);

    expect(fleet.location.type).toBe('space');
    expect(fleet.location.type === 'space' ? fleet.location.x : 0).toBe(40);
    expect(fleet.fuel).toBe(44);
  });

  it('arrives at max speed when fuel is ample', () => {
    const { game, fleet } = createMovementScenario({ fuel: 500, distance: 100 });

    service.processFleets(game);

    expect(fleet.location.type).toBe('space');
    expect(fleet.location.type === 'space' ? fleet.location.x : 0).toBe(100);
    expect(fleet.orders.length).toBe(0);
    expect(fleet.fuel).toBeCloseTo(141, 0);
  });

  it('drops to a viable warp when fuel cannot sustain max speed', () => {
    const { game, fleet } = createMovementScenario({ fuel: 200, distance: 100 });

    service.processFleets(game);

    expect(fleet.location.type).toBe('space');
    expect(fleet.location.type === 'space' ? fleet.location.x : 0).toBe(100);
    expect(fleet.orders.length).toBe(0);
    expect(fleet.fuel).toBeGreaterThanOrEqual(0);
    expect(fleet.fuel).toBeLessThan(100);
  });

  it('creeps along at warp one when fuel is scarce', () => {
    const { game, fleet } = createMovementScenario({ fuel: 50, distance: 100 });

    service.processFleets(game);

    expect(fleet.orders.length).toBe(1);
    expect(fleet.location.type).toBe('space');
    expect(fleet.location.type === 'space' ? fleet.location.x : 0).toBe(20);
    expect(fleet.fuel).toBe(30);
  });
});

function createMovementScenario(params: { fuel: number; distance: number }): MovementScenario {
  const player = createPlayer();
  const design = createShipDesign();
  const moveOrder: MoveOrder = {
    type: 'move',
    destination: { x: params.distance, y: 0 },
  };
  const fleet: Fleet = {
    id: 'f1',
    ownerId: player.id,
    name: 'Fleet 1',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: design.id, count: 1, damage: 0 }],
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    fuel: params.fuel,
    orders: [moveOrder],
  };
  const game: GameState = {
    id: 'game1',
    seed: 123,
    turn: 1,
    settings: createGameSettings(),
    stars: [],
    humanPlayer: player,
    aiPlayers: [],
    fleets: [fleet],
    shipDesigns: [design],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  return { game, fleet, moveOrder, design };
}

function createGameSettings(): GameSettings {
  return {
    galaxySize: 'small',
    aiCount: 0,
    aiDifficulty: 'easy',
    seed: 123,
    speciesId: 'species-human',
  };
}

function createPlayer(): Player {
  return {
    id: 'p1',
    name: 'Human',
    species: createSpecies(),
    ownedStarIds: [],
    techLevels: { ...BASE_PLAYER_TECH },
    researchProgress: { ...BASE_PLAYER_TECH },
    selectedResearchField: 'Energy',
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

function createShipDesign(): ShipDesign {
  return {
    id: 'test-ship',
    name: 'Test Ship',
    hullId: 'Scout',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: buildSpec(),
  };
}

function buildSpec(overrides: Partial<CompiledShipStats> = {}): CompiledShipStats {
  return {
    ...BASE_SPEC,
    ...overrides,
    bombing: { ...BASE_SPEC.bombing, ...overrides.bombing },
    massDriver: { ...BASE_SPEC.massDriver, ...overrides.massDriver },
    cost: { ...BASE_SPEC.cost, ...overrides.cost },
    components: overrides.components ? [...overrides.components] : [...BASE_SPEC.components],
    validationErrors: overrides.validationErrors
      ? [...overrides.validationErrors]
      : [...BASE_SPEC.validationErrors],
  };
}

function createEngineSlot(componentId: string): Array<SlotAssignment> {
  return [
    {
      slotId: 'engine-slot',
      components: [{ componentId, count: 1 }],
    },
  ];
}
