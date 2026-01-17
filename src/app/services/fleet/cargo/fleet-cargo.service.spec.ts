import { FleetCargoService } from './fleet-cargo.service';
import type { LoggingService } from '../../core/logging.service';
import type { GameState, Fleet, Player, Star } from '../../../models/game.model';

describe('FleetCargoService', () => {
  let service: FleetCargoService;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

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
    id: 'star1',
    name: 'Earth',
    position: { x: 0, y: 0 },
    ownerId: 'p1',
    temperature: 50,
    atmosphere: 50,
    population: 10000,
    maxPopulation: 1000000,
    resources: 1000,
    surfaceMinerals: { ironium: 500, boranium: 300, germanium: 200 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    mines: 10,
    factories: 10,
    defenses: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    buildQueue: [],
    scanner: 0,
    research: 0,
  };

  const mockStar: Star = {
    id: 'planet1',
    name: 'Sol',
    position: { x: 0, y: 0 },
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    ownerId: null,
    population: 0,
    maxPopulation: 1000000,
    mines: 0,
    factories: 0,
    defenses: 0,
    research: 0,
    scanner: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    resources: 0,
    buildQueue: [],
  };

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    const mockShipDesignResolver = jasmine.createSpyObj('ShipDesignResolverService', ['resolve']);
    // Mock resolve to return a design with cargo capacity
    mockShipDesignResolver.resolve.and.callFake((designId: string) => ({
      id: designId,
      name: 'Freighter',
      cargoCapacity: 100,
      mass: 50,
      fuelCapacity: 200,
    }));
    service = new FleetCargoService(mockLoggingService, mockShipDesignResolver);
  });

  describe('loadCargo', () => {
    let mockGame: GameState;
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Cargo Fleet',
        location: { type: 'orbit', starId: 'star1' },
        ships: [{ designId: 'freighter', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 100,
        orders: [],
      };

      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [mockPlanet],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [fleet],
        shipDesigns: [
          {
            id: 'freighter',
            name: 'Freighter',
            hullId: 'Freighter',
            slots: [],
            createdTurn: 0,
            playerId: 'p1',
            spec: {
              cargoCapacity: 100,
              mass: 50,
              fuelCapacity: 200,
            } as any,
          },
        ],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };
    });

    it('should load specific amounts of minerals', () => {
      const result = service.loadCargo(mockGame, 'f1', 'star1', {
        ironium: 50,
        boranium: 30,
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.minerals.ironium).toBe(50);
      expect(resultFleet.cargo.minerals.boranium).toBe(30);
      expect(resultFleet.cargo.minerals.germanium).toBe(0);
      expect(resultPlanet.surfaceMinerals.ironium).toBe(450);
      expect(resultPlanet.surfaceMinerals.boranium).toBe(270);
    });

    it('should load all available minerals when requested', () => {
      const result = service.loadCargo(mockGame, 'f1', 'star1', {
        ironium: 'all',
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.minerals.ironium).toBe(100); // Limited by cargo capacity
      expect(resultPlanet.surfaceMinerals.ironium).toBe(400);
    });

    it('should respect cargo capacity limits', () => {
      const result = service.loadCargo(mockGame, 'f1', 'star1', {
        ironium: 'fill',
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.minerals.ironium).toBe(100); // Cargo capacity limit
      expect(resultPlanet.surfaceMinerals.ironium).toBe(400);
    });

    it('should load resources', () => {
      const result = service.loadCargo(mockGame, 'f1', 'star1', {
        resources: 200,
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.resources).toBe(100); // Limited by capacity
      expect(resultPlanet.resources).toBe(900);
    });

    it('should load colonists', () => {
      const result = service.loadCargo(mockGame, 'f1', 'star1', {
        colonists: 50000, // 50 kT worth - but planet only has 10,000
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.colonists).toBe(10000); // Only 10,000 available
      expect(resultPlanet.population).toBe(0); // All colonists loaded
    });

    it('should handle non-existent fleet gracefully', () => {
      const result = service.loadCargo(mockGame, 'nonexistent', 'star1', {
        ironium: 50,
      });

      expect(result).toBe(mockGame);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('unloadCargo', () => {
    let mockGame: GameState;
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Cargo Fleet',
        location: { type: 'orbit', starId: 'star1' },
        ships: [{ designId: 'freighter', count: 1, damage: 0 }],
        cargo: {
          resources: 50,
          minerals: { ironium: 30, boranium: 20, germanium: 10 },
          colonists: 5000,
        },
        fuel: 100,
        orders: [],
      };

      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [mockPlanet],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [fleet],
        shipDesigns: [],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };
    });

    it('should unload specific amounts of minerals', () => {
      const result = service.unloadCargo(mockGame, 'f1', 'star1', {
        ironium: 20,
        boranium: 10,
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.minerals.ironium).toBe(10);
      expect(resultFleet.cargo.minerals.boranium).toBe(10);
      expect(resultPlanet.surfaceMinerals.ironium).toBe(520);
      expect(resultPlanet.surfaceMinerals.boranium).toBe(310);
    });

    it('should unload all cargo when requested', () => {
      const result = service.unloadCargo(mockGame, 'f1', 'star1', {
        resources: 'all',
        colonists: 'all',
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.resources).toBe(0);
      expect(resultFleet.cargo.colonists).toBe(0);
      expect(resultPlanet.resources).toBe(1050);
      expect(resultPlanet.population).toBe(15000);
    });

    it('should handle amounts exceeding available cargo', () => {
      const result = service.unloadCargo(mockGame, 'f1', 'star1', {
        ironium: 100, // More than available (30)
      });

      const resultFleet = result.fleets.find((f) => f.id === 'f1')!;
      const resultPlanet = result.stars[0];

      expect(resultFleet.cargo.minerals.ironium).toBe(0);
      expect(resultPlanet.surfaceMinerals.ironium).toBe(530);
    });

    it('should log unloading operations', () => {
      service.unloadCargo(mockGame, 'f1', 'star1', {
        resources: 25,
      });

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Unloading cargo to star star1',
        jasmine.any(Object),
      );
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        'Cargo unloading completed for fleet Cargo Fleet',
        jasmine.any(Object),
      );
    });
  });
});