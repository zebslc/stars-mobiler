import { TestBed } from '@angular/core/testing';
import { ColonyService } from './colony.service';
import { EconomyService } from './economy.service';
import { ShipyardService } from '../ship-design/shipyard.service';
import { GameState, Player, Fleet, ShipDesign, BuildItem, Star } from '../../models/game.model';

describe('ColonyService', () => {
  let service: ColonyService;
  let mockEconomyService: any;
  let mockShipyardService: any;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const mockPlanet: Star = {
    id: 'planet1',
    name: 'Earth',
    position: { x: 0, y: 0 },
    ownerId: 'p1',
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 500, boranium: 300, germanium: 200 },
    population: 10000,
    maxPopulation: 1000000,
    resources: 1000, // Rich planet
    mines: 10,
    factories: 10,
    defenses: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    buildQueue: [],
    scanner: 0,
    research: 0,
  };

  const mockDesign: ShipDesign = {
    id: 'scout',
    name: 'Scout',
    hullId: 'Scout',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: {
      cost: { resources: 50, ironium: 10, boranium: 0, germanium: 0 },
      isStarbase: false,
    } as any,
  };

  const mockStarbaseDesign: ShipDesign = {
    id: 'starbase1',
    name: 'Starbase I',
    hullId: 'Space Station',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: {
      cost: { resources: 200, ironium: 100, boranium: 50, germanium: 50 },
      isStarbase: true,
    } as any,
  };

  const mockStarbaseDesign2: ShipDesign = {
    id: 'starbase2',
    name: 'Starbase II',
    hullId: 'Space Station',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: {
      cost: { resources: 400, ironium: 200, boranium: 100, germanium: 100 },
      isStarbase: true,
    } as any,
  };

  beforeEach(() => {
    mockEconomyService = jasmine.createSpyObj('EconomyService', ['spend']);
    mockShipyardService = jasmine.createSpyObj('ShipyardService', ['getShipCost']);

    TestBed.configureTestingModule({
      providers: [
        ColonyService,
        { provide: EconomyService, useValue: mockEconomyService },
        { provide: ShipyardService, useValue: mockShipyardService },
      ],
    });
    service = TestBed.inject(ColonyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processBuildQueues', () => {
    it('should process partial payment for expensive items', () => {
      const planet = {
        ...mockPlanet,
        resources: 10,
        surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
      };
      const item: BuildItem = {
        project: 'ship',
        cost: { resources: 100, ironium: 0, boranium: 0, germanium: 0 },
        shipDesignId: 'scout',
        count: 1,
      };
      planet.buildQueue = [item];

      const game: GameState = {
        humanPlayer: mockPlayer,
        shipDesigns: [mockDesign],
        fleets: [],
      } as any;

      service.processBuildQueues(game);

      expect(item.paid).toBeDefined();
      expect(item.paid?.resources).toBe(10);
      expect(planet.resources).toBe(0);
      expect(planet.buildQueue?.length).toBe(1); // Still in queue
      expect(game.fleets.length).toBe(0);
    });

    it('should complete item when fully paid', () => {
      const planet = {
        ...mockPlanet,
        resources: 100,
        surfaceMinerals: { ironium: 10, boranium: 0, germanium: 0 },
      };
      const item: BuildItem = {
        project: 'ship',
        cost: { resources: 50, ironium: 10, boranium: 0, germanium: 0 },
        shipDesignId: 'scout',
        count: 1,
      };
      planet.buildQueue = [item];

      const game: GameState = {
        humanPlayer: mockPlayer,
        shipDesigns: [mockDesign],
        fleets: [],
        stars: [planet],
      } as any;

      service.processBuildQueues(game);

      expect(planet.buildQueue?.length).toBe(0); // Removed from queue
      expect(planet.resources).toBe(50); // 100 - 50
      expect(game.fleets.length).toBe(1); // Fleet created
    });

    it('should apply 75% mineral recovery for starbase upgrades', () => {
      const planet = {
        ...mockPlanet,
        resources: 1000,
        surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
      };

      // Existing starbase fleet
      const existingFleet: Fleet = {
        id: 'f1',
        ownerId: 'p1',
        location: { type: 'orbit', starId: planet.id },
        ships: [{ designId: 'starbase1', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 0,
        orders: [],
        name: 'Starbase',
      };

      // New starbase build item
      const item: BuildItem = {
        project: 'ship',
        cost: mockStarbaseDesign2.spec!.cost, // 400 res, 200 Fe, 100 Bo, 100 Ge
        shipDesignId: 'starbase2',
        count: 1,
      };
      planet.buildQueue = [item];

      const game: GameState = {
        humanPlayer: mockPlayer,
        shipDesigns: [mockStarbaseDesign, mockStarbaseDesign2],
        fleets: [existingFleet],
        stars: [planet],
      } as any;

      service.processBuildQueues(game);

      // Calculation:
      // Old cost: 200 Res, 100 Fe, 50 Bo, 50 Ge
      // Credit (75%): 75 Fe, 37 Bo, 37 Ge (Resources not credited)
      // New cost: 400 Res, 200 Fe, 100 Bo, 100 Ge
      // Net needed: 400 Res, 125 Fe, 63 Bo, 63 Ge

      // Paid:
      // Resources: 400
      // Ironium: 125
      // Boranium: 63
      // Germanium: 63

      // Remaining on planet:
      // Resources: 1000 - 400 = 600
      // Ironium: 1000 - 125 = 875
      // Boranium: 1000 - 63 = 937
      // Germanium: 1000 - 63 = 937

      expect(planet.buildQueue?.length).toBe(0);
      expect(planet.resources).toBe(600);
      expect(planet.surfaceMinerals.ironium).toBe(875);
      expect(planet.surfaceMinerals.boranium).toBe(937);
      expect(planet.surfaceMinerals.germanium).toBe(937);

      expect(game.fleets.length).toBe(1);
      expect(game.fleets[0].ships[0].designId).toBe('starbase2');
    });
  });
});
