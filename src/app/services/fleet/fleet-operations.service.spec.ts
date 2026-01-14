import { FleetOperationsService } from './fleet-operations.service';
import { FleetNamingService } from './fleet-naming.service';
import { FleetValidationService } from './fleet-validation.service';
import { LoggingService } from '../core/logging.service';
import { GameState, Player, Fleet, ShipDesign, Star } from '../../models/game.model';
import { ValidationResult } from '../../models/service-interfaces.model';

describe('FleetOperationsService', () => {
  let service: FleetOperationsService;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockNamingService: jasmine.SpyObj<FleetNamingService>;
  let mockValidationService: jasmine.SpyObj<FleetValidationService>;

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
    population: 10000,
    maxPopulation: 1000000,
    resources: 1000,
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
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
      mass: 10,
      fuelCapacity: 100,
      hasColonyModule: false,
    } as any,
  };

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    mockNamingService = jasmine.createSpyObj('FleetNamingService', ['generateFleetName']);
    mockValidationService = jasmine.createSpyObj('FleetValidationService', [
      'validateShipAddition',
    ]);

    service = new FleetOperationsService(
      mockLoggingService,
      mockNamingService,
      mockValidationService,
    );
  });

  describe('createFleet', () => {
    let mockGame: GameState;

    beforeEach(() => {
      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [],
        shipDesigns: [mockDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      mockNamingService.generateFleetName.and.returnValue('Scout-1');
    });

    it('should create a fleet with valid parameters', () => {
      const location = { type: 'orbit' as const, starId: 'planet1' };

      const fleet = service.createFleet(mockGame, location, 'p1', 'scout');

      expect(fleet).toBeDefined();
      expect(fleet.name).toBe('Scout-1');
      expect(fleet.ownerId).toBe('p1');
      expect(fleet.location).toEqual(location);
      expect(fleet.ships).toEqual([]);
      expect(fleet.fuel).toBe(0);
      expect(mockGame.fleets).toContain(fleet);
      expect(mockNamingService.generateFleetName).toHaveBeenCalledWith(mockGame, 'p1', 'scout');
    });

    it('should throw error when fleet limit exceeded', () => {
      // Fill up fleets to limit
      for (let i = 0; i < 512; i++) {
        mockGame.fleets.push({
          id: `f${i}`,
          ownerId: 'p1',
          name: `Fleet ${i}`,
          location: { type: 'orbit', starId: 'planet1' },
          ships: [],
          cargo: {
            resources: 0,
            minerals: { ironium: 0, boranium: 0, germanium: 0 },
            colonists: 0,
          },
          fuel: 0,
          orders: [],
        });
      }

      expect(() => {
        service.createFleet(mockGame, { type: 'orbit', starId: 'planet1' }, 'p1', 'scout');
      }).toThrowError(/Maximum of 512 fleets/);
    });

    it('should log fleet creation', () => {
      const location = { type: 'orbit' as const, starId: 'planet1' };

      service.createFleet(mockGame, location, 'p1', 'scout');

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Creating new fleet',
        jasmine.any(Object),
      );
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        'Fleet created: Scout-1',
        jasmine.any(Object),
      );
    });
  });

  describe('addShipToFleet', () => {
    let mockGame: GameState;
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Fleet 1',
        location: { type: 'orbit', starId: 'planet1' },
        ships: [],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 0,
        orders: [],
      };

      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [fleet],
        shipDesigns: [mockDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      mockValidationService.validateShipAddition.and.returnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should add ships to existing fleet', () => {
      service.addShipToFleet(mockGame, mockPlanet, 'scout', 5);

      expect(fleet.ships.length).toBe(1);
      expect(fleet.ships[0].designId).toBe('scout');
      expect(fleet.ships[0].count).toBe(5);
      expect(fleet.ships[0].damage).toBe(0);
      expect(fleet.fuel).toBe(500); // 5 ships * 100 fuel capacity
    });

    it('should add to existing ship stack', () => {
      fleet.ships.push({ designId: 'scout', count: 3, damage: 0 });

      service.addShipToFleet(mockGame, mockPlanet, 'scout', 2);

      expect(fleet.ships.length).toBe(1);
      expect(fleet.ships[0].count).toBe(5);
    });

    it('should throw error when validation fails', () => {
      mockValidationService.validateShipAddition.and.returnValue({
        isValid: false,
        errors: ['Test validation error'],
        warnings: [],
      });

      expect(() => {
        service.addShipToFleet(mockGame, mockPlanet, 'scout', 5);
      }).toThrowError('Test validation error');
    });

    it('should throw error when exceeding ship limit per design', () => {
      fleet.ships.push({ designId: 'scout', count: 32000, damage: 0 });

      expect(() => {
        service.addShipToFleet(mockGame, mockPlanet, 'scout', 1);
      }).toThrowError(/Max: 32000/);
    });

    it('should log ship addition', () => {
      service.addShipToFleet(mockGame, mockPlanet, 'scout', 5);

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Adding 5 ships of design scout to fleet',
        jasmine.any(Object),
      );
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        'Added 5 ships of design scout to fleet Fleet 1',
        jasmine.any(Object),
      );
    });
  });

  describe('validateFleetLimits', () => {
    let mockGame: GameState;

    beforeEach(() => {
      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [],
        shipDesigns: [mockDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };
    });

    it('should return true when under fleet limit', () => {
      // Add some fleets but stay under limit
      for (let i = 0; i < 10; i++) {
        mockGame.fleets.push({
          id: `f${i}`,
          ownerId: 'p1',
          name: `Fleet ${i}`,
          location: { type: 'orbit', starId: 'planet1' },
          ships: [],
          cargo: {
            resources: 0,
            minerals: { ironium: 0, boranium: 0, germanium: 0 },
            colonists: 0,
          },
          fuel: 0,
          orders: [],
        });
      }

      const result = service.validateFleetLimits(mockGame, 'p1');

      expect(result).toBe(true);
    });

    it('should return false when at fleet limit', () => {
      // Fill up to exactly the limit
      for (let i = 0; i < 512; i++) {
        mockGame.fleets.push({
          id: `f${i}`,
          ownerId: 'p1',
          name: `Fleet ${i}`,
          location: { type: 'orbit', starId: 'planet1' },
          ships: [],
          cargo: {
            resources: 0,
            minerals: { ironium: 0, boranium: 0, germanium: 0 },
            colonists: 0,
          },
          fuel: 0,
          orders: [],
        });
      }

      const result = service.validateFleetLimits(mockGame, 'p1');

      expect(result).toBe(false);
    });

    it('should only count fleets for the specified owner', () => {
      // Add fleets for different owners
      for (let i = 0; i < 10; i++) {
        mockGame.fleets.push({
          id: `f${i}`,
          ownerId: 'p1',
          name: `Fleet ${i}`,
          location: { type: 'orbit', starId: 'planet1' },
          ships: [],
          cargo: {
            resources: 0,
            minerals: { ironium: 0, boranium: 0, germanium: 0 },
            colonists: 0,
          },
          fuel: 0,
          orders: [],
        });
      }

      for (let i = 0; i < 500; i++) {
        mockGame.fleets.push({
          id: `f2${i}`,
          ownerId: 'p2',
          name: `Fleet ${i}`,
          location: { type: 'orbit', starId: 'planet1' },
          ships: [],
          cargo: {
            resources: 0,
            minerals: { ironium: 0, boranium: 0, germanium: 0 },
            colonists: 0,
          },
          fuel: 0,
          orders: [],
        });
      }

      const result = service.validateFleetLimits(mockGame, 'p1');

      expect(result).toBe(true); // Only 10 fleets for p1, well under limit
    });
  });
});