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
  Star,
} from '../../models/game.model';

type OrbitOrder = Extract<FleetOrder, { type: 'orbit' }>;

interface OrbitScenario {
  game: GameState;
  fleet: Fleet;
  star: Star;
  orbitOrder: OrbitOrder;
  design: ShipDesign;
}

const BASE_TECH: PlayerTech = {
  Energy: 0,
  Kinetics: 0,
  Propulsion: 0,
  Construction: 0,
};

const BASE_SPEC: CompiledShipStats = {
  warpSpeed: 10,
  fuelCapacity: 2000,
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

describe('FleetService Orbit Order', () => {
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

  it('moves directly into orbit when within one turn', () => {
    const { game, fleet, star } = createOrbitScenario({ distance: 100 });

    service.processFleets(game);

    expect(fleet.location.type).toBe('orbit');
    if (fleet.location.type === 'orbit') {
      expect(fleet.location.starId).toBe(star.id);
    }
    expect(fleet.orders.length).toBe(0);
  });

  it('moves partially and preserves the order when out of range', () => {
    const { game, fleet, orbitOrder } = createOrbitScenario({ distance: 300 });

    service.processFleets(game);

    expect(fleet.location.type).toBe('space');
    if (fleet.location.type === 'space') {
      expect(fleet.location.x).toBe(200);
      expect(fleet.location.y).toBe(0);
    }
    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0].type).toBe(orbitOrder.type);
  });

  it('clears the order when already in orbit', () => {
    const { game, fleet, star } = createOrbitScenario({ distance: 0 });
    fleet.location = { type: 'orbit', starId: star.id };

    service.processFleets(game);

    expect(fleet.orders.length).toBe(0);
    expect(fleet.location.type).toBe('orbit');
    if (fleet.location.type === 'orbit') {
      expect(fleet.location.starId).toBe(star.id);
    }
  });

  it('inserts colonize order immediately when already present with colonize action', () => {
    const { game, fleet, star } = createOrbitScenario({ distance: 0 });
    fleet.location = { type: 'orbit', starId: star.id };
    fleet.orders = [{ type: 'orbit', starId: star.id, action: 'colonize' }];

    service.processFleets(game);

    expect(fleet.orders.length).toBe(1);
    const nextOrder = fleet.orders[0];
    expect(nextOrder.type).toBe('colonize');
    if (nextOrder.type === 'colonize') {
      expect(nextOrder.starId).toBe(star.id);
    }
  });

  it('inserts colonize order upon arriving with colonize action', () => {
    const { game, fleet, star } = createOrbitScenario({ distance: 10 });
    fleet.orders = [{ type: 'orbit', starId: star.id, action: 'colonize', warpSpeed: 9 }];

    service.processFleets(game);

    expect(fleet.location.type).toBe('orbit');
    if (fleet.location.type === 'orbit') {
      expect(fleet.location.starId).toBe(star.id);
    }
    expect(fleet.orders.length).toBe(1);
    const [nextOrder] = fleet.orders;
    expect(nextOrder.type).toBe('colonize');
    if (nextOrder.type === 'colonize') {
      expect(nextOrder.starId).toBe(star.id);
    }
  });
});

function createOrbitScenario({ distance }: { distance: number }): OrbitScenario {
  const player = createPlayer();
  const design = createShipDesign();
  const orbitOrder: OrbitOrder = { type: 'orbit', starId: 'star1' };
  const star = createStar(distance);
  const fleet: Fleet = {
    id: 'f1',
    ownerId: player.id,
    name: 'Fleet 1',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: design.id, count: 1, damage: 0 }],
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    fuel: 2000,
    orders: [orbitOrder],
  };
  const game: GameState = {
    id: 'game1',
    seed: 123,
    turn: 1,
    settings: createSettings(),
    stars: [star],
    humanPlayer: player,
    aiPlayers: [],
    fleets: [fleet],
    shipDesigns: [design],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  return { game, fleet, star, orbitOrder, design };
}

function createSettings(): GameSettings {
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
    techLevels: { ...BASE_TECH },
    researchProgress: { ...BASE_TECH },
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
    slots: createEngineSlot(),
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

function createEngineSlot(): Array<SlotAssignment> {
  return [
    {
      slotId: 'engine-slot',
      components: [{ componentId: 'eng_quick_jump_5', count: 1 }],
    },
  ];
}

function createStar(distance: number): Star {
  return {
    id: 'star1',
    name: 'Star 1',
    position: { x: distance, y: 0 },
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
    ownerId: null,
    population: 0,
    maxPopulation: 1_000_000,
    mines: 0,
    factories: 0,
    defenses: 0,
    research: 0,
    scanner: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    resources: 0,
    buildQueue: [],
  };
}
