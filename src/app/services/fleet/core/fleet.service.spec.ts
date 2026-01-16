import { FleetService } from './fleet.service';
import { SettingsService } from '../../core/settings.service';
import type { HabitabilityService } from '../../colony/habitability.service';
import type { ShipyardService } from '../../ship-design/shipyard.service';
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
} from '../../../models/game.model';

type MoveOrder = Extract<FleetOrder, { type: 'move' }>;

interface FleetLimitScenario {
  game: GameState;
  star: Star;
  design: ShipDesign;
}

interface MovementScenario {
  game: GameState;
  fleet: Fleet;
  design: ShipDesign;
  order: MoveOrder;
}

const BASE_TECH: PlayerTech = {
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

describe('FleetService', () => {
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

  it('creates service instance', () => {
    expect(service).toBeTruthy();
  });

  describe('fleet limits', () => {
    let scenario: FleetLimitScenario;

    beforeEach(() => {
      scenario = createFleetLimitScenario();
    });

    it('throws when creation exceeds fleet cap', () => {
      fillFleetLimit(scenario.game, scenario.design.id);

      expect(() => {
        service.createFleet(scenario.game, { type: 'orbit', starId: scenario.star.id }, 'p1', scenario.design.id);
      }).toThrowError(/Maximum of 512 fleets/);
    });

    it('throws when adding ships exceeds per design cap', () => {
      const fleet = createFleetWithCount(scenario.design.id, 32000);
      scenario.game.fleets.push(fleet);

      expect(() => {
        service.addShipToFleet(scenario.game, scenario.star, scenario.design.id, 1);
      }).toThrowError(/Max: 32000/);
    });

    it('allows adding ships up to the cap', () => {
      const fleet = createFleetWithCount(scenario.design.id, 31999);
      scenario.game.fleets.push(fleet);

      service.addShipToFleet(scenario.game, scenario.star, scenario.design.id, 1);

      const stack = fleet.ships.find((s) => s.designId === scenario.design.id);
      expect(stack?.count).toBe(32000);
    });
  });

  describe('movement logic', () => {
    it('travels at max speed when fuel allows', () => {
      const { game, fleet } = createMovementScenario({ fuel: 500, distance: 100 });
      const warpSpy = spyOn<any>(service as any, 'calculateTravelWarp').and.callThrough();

      service.processFleets(game);

      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0);
      expect(fleet.fuel).toBeLessThan(500);
      expect(fleet.fuel).toBeGreaterThan(0);
      const warpUsed = warpSpy.calls.mostRecent().returnValue as number;
      expect(warpUsed).toBe(10);
    });

    it('reduces speed when fuel cannot sustain max warp', () => {
      const { game, fleet } = createMovementScenario({ fuel: 200, distance: 100 });
      const warpSpy = spyOn<any>(service as any, 'calculateTravelWarp').and.callThrough();

      service.processFleets(game);

      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0);
      expect(fleet.fuel).toBeLessThan(200);
      const warpUsed = warpSpy.calls.mostRecent().returnValue as number;
      expect(warpUsed).toBeLessThan(10);
      expect(warpUsed).toBeGreaterThan(0);
    });

    it('respects requested warp when fuel is sufficient', () => {
      const { game, fleet } = createMovementScenario({ fuel: 500, distance: 100, warpSpeed: 5 });
      const warpSpy = spyOn<any>(service as any, 'calculateTravelWarp').and.callThrough();

      service.processFleets(game);

      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0);
      const warpUsed = warpSpy.calls.mostRecent().returnValue as number;
      expect(warpUsed).toBe(order.warpSpeed);
    });

    it('drops requested warp when fuel is insufficient', () => {
      const { game, fleet } = createMovementScenario({ fuel: 200, distance: 100, warpSpeed: 9 });
      const warpSpy = spyOn<any>(service as any, 'calculateTravelWarp').and.callThrough();

      service.processFleets(game);

      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0);
      const warpUsed = warpSpy.calls.mostRecent().returnValue as number;
      expect(warpUsed).toBeLessThan(order.warpSpeed!);
      expect(warpUsed).toBeGreaterThan(0);
    });
  });
});

function createFleetLimitScenario(): FleetLimitScenario {
  const star = createStar({ id: 'planet1', name: 'Earth', ownerId: 'p1' });
  const player = createPlayer();
  const design = createShipDesign({ id: 'scout', name: 'Scout', playerId: player.id, spec: buildSpec({ fuelCapacity: 100, mass: 10, cost: { ...BASE_SPEC.cost, resources: 50, ironium: 10 } }) });
  const game: GameState = {
    id: 'game1',
    seed: 123,
    turn: 1,
    settings: createSettings(),
    stars: [star],
    humanPlayer: player,
    aiPlayers: [],
    fleets: [],
    shipDesigns: [design],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  return { game, star, design };
}

function fillFleetLimit(game: GameState, designId: string): void {
  while (game.fleets.length < 512) {
    game.fleets.push(createFleetWithCount(designId, 0));
  }
}

function createFleetWithCount(designId: string, count: number): Fleet {
  return {
    id: `fleet-${designId}-${count}`,
    ownerId: 'p1',
    name: `Fleet ${designId} ${count}`,
    location: { type: 'orbit', starId: 'planet1' },
    ships: [{ designId, count, damage: 0 }],
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    fuel: 0,
    orders: [],
  };
}

function createMovementScenario({
  fuel,
  distance,
  warpSpeed,
}: {
  fuel: number;
  distance: number;
  warpSpeed?: number;
}): MovementScenario {
  const player = createPlayer();
  const design = createShipDesign({
    id: 'move-ship',
    name: 'Move Ship',
    playerId: player.id,
    spec: buildSpec(),
  });
  const order: MoveOrder = { type: 'move', destination: { x: distance, y: 0 }, warpSpeed };
  const fleet: Fleet = {
    id: 'fleet-move',
    ownerId: player.id,
    name: 'Fleet 1',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: design.id, count: 1, damage: 0 }],
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    fuel,
    orders: [order],
  };
  const game: GameState = {
    id: 'game-move',
    seed: 456,
    turn: 1,
    settings: createSettings(),
    stars: [],
    humanPlayer: player,
    aiPlayers: [],
    fleets: [fleet],
    shipDesigns: [design],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  return { game, fleet, design, order };
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

function createShipDesign({
  id,
  name,
  playerId,
  spec,
  slots,
}: {
  id: string;
  name: string;
  playerId: string;
  spec?: CompiledShipStats;
  slots?: Array<SlotAssignment>;
}): ShipDesign {
  return {
    id,
    name,
    hullId: 'Scout',
    slots: slots ?? createEngineSlot(),
    createdTurn: 0,
    playerId,
    spec,
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

function createStar({ id, name, ownerId }: { id: string; name: string; ownerId: string }): Star {
  return {
    id,
    name,
    position: { x: 0, y: 0 },
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    ownerId,
    population: 10_000,
    maxPopulation: 1_000_000,
    mines: 10,
    factories: 10,
    defenses: 0,
    research: 0,
    scanner: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    resources: 1_000,
    buildQueue: [],
  };
}
