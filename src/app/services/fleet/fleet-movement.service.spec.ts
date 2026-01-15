import { FleetMovementService } from './fleet-movement.service';
import { LoggingService } from '../core/logging.service';
import { GameState, Fleet, Player, Star } from '../../models/game.model';
import { FleetLocation } from '../../models/service-interfaces.model';
import { FleetMovementOrderService } from './fleet-movement-order.service';
import { FleetMovementStatsService } from './fleet-movement-stats.service';
import { FleetFuelCalculatorService } from './fleet-fuel-calculator.service';
import { FleetMovementValidatorService } from './fleet-movement-validator.service';
import { FleetShipDesignService } from './fleet-ship-design.service';

describe('FleetMovementService', () => {
  let service: FleetMovementService;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let orderService: FleetMovementOrderService;
  let shipDesignService: FleetShipDesignService;
  let statsService: FleetMovementStatsService;
  let fuelCalculator: FleetFuelCalculatorService;
  let validator: FleetMovementValidatorService;
  let designSpy: jasmine.Spy;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const mockStar: Star = {
    id: 'planet1',
    name: 'Sol',
    position: { x: 100, y: 200 },
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    ownerId: 'p1',
    population: 10000,
    maxPopulation: 1000000,
    resources: 1000,
    mines: 10,
    factories: 10,
    defenses: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    buildQueue: [],
    scanner: 0,
    research: 0,
  };

  beforeEach(() => {
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    orderService = new FleetMovementOrderService();
    shipDesignService = new FleetShipDesignService(mockLoggingService);
    designSpy = spyOn(shipDesignService, 'getDesign').and.callFake((designId: string) => ({
      id: designId,
      warpSpeed: 5,
      idealWarp: 5,
      mass: 10,
      fuelCapacity: 20,
      fuelEfficiency: 100,
      engine: { id: 'eng_fuel_mizer' },
    }));
    statsService = new FleetMovementStatsService(shipDesignService);
    fuelCalculator = new FleetFuelCalculatorService(mockLoggingService, shipDesignService);
    validator = new FleetMovementValidatorService(fuelCalculator);

    service = new FleetMovementService(
      mockLoggingService,
      orderService,
      statsService,
      fuelCalculator,
      validator,
    );
  });

  describe('moveFleet', () => {
    let mockGame: GameState;
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Test Fleet',
        location: { type: 'space', x: 0, y: 0 },
        ships: [{ designId: 'scout', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 100,
        orders: []
      };

      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [mockStar],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [fleet],
        shipDesigns: [],
        playerEconomy: { freighterCapacity: 0, research: 0 }
      };
    });

    it('should add move order to space destination', () => {
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      service.moveFleet(mockGame, 'f1', destination);

      expect(fleet.orders.length).toBe(1);
      expect(fleet.orders[0].type).toBe('move');
      expect(fleet.orders[0]).toEqual({
        type: 'move',
        destination: { x: 50, y: 75 }
      });
    });

    it('should add move order to orbit destination', () => {
      const destination: FleetLocation = { type: 'orbit', starId: 'planet1' };
      
      service.moveFleet(mockGame, 'f1', destination);

      expect(fleet.orders.length).toBe(1);
      expect(fleet.orders[0].type).toBe('move');
      expect(fleet.orders[0]).toEqual({
        type: 'move',
        destination: { x: 100, y: 200 } // Star position
      });
    });

    it('should handle non-existent fleet gracefully', () => {
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      service.moveFleet(mockGame, 'nonexistent', destination);

      expect(mockLoggingService.error).toHaveBeenCalledWith(
        'Fleet not found: nonexistent',
        jasmine.any(Object)
      );
    });

    it('should log fleet movement', () => {
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      service.moveFleet(mockGame, 'f1', destination);

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Moving fleet f1 to destination',
        jasmine.any(Object)
      );
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        'Fleet Test Fleet ordered to move to space location',
        jasmine.any(Object)
      );
    });
  });

  describe('calculateFuelConsumption', () => {
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Test Fleet',
        location: { type: 'space', x: 0, y: 0 },
        ships: [{ designId: 'scout', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 100,
        orders: []
      };
    });

    it('should calculate fuel consumption for distance', () => {
      const consumption = service.calculateFuelConsumption(fleet, 100);

      expect(consumption).toBeGreaterThan(0);
      expect(typeof consumption).toBe('number');
    });

    it('should return 0 for fleet with no ships', () => {
      fleet.ships = [];
      
      const consumption = service.calculateFuelConsumption(fleet, 100);

      expect(consumption).toBe(0);
      expect(mockLoggingService.warn).toHaveBeenCalledWith(
        'Fleet has no ships for fuel calculation',
        jasmine.any(Object)
      );
    });

    it('should scale consumption with distance', () => {
      const consumption50 = service.calculateFuelConsumption(fleet, 50);
      const consumption100 = service.calculateFuelConsumption(fleet, 100);

      expect(consumption100).toBeCloseTo(consumption50 * 2, 1);
    });

    it('should log fuel calculation', () => {
      service.calculateFuelConsumption(fleet, 100);

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Calculating fuel consumption for 100 LY',
        jasmine.any(Object)
      );
    });

    it('should throw when engine data is missing', () => {
      designSpy.and.callFake(() => ({
        id: 'no-engine',
        warpSpeed: 5,
        idealWarp: 5,
        mass: 10,
        fuelCapacity: 0,
        fuelEfficiency: 100,
        engine: undefined,
      }));

      expect(() => service.calculateFuelConsumption(fleet, 10)).toThrowError(
        /missing engine configuration/i,
      );
    });
  });

  describe('validateMovement', () => {
    let fleet: Fleet;

    beforeEach(() => {
      fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Test Fleet',
        location: { type: 'space', x: 0, y: 0 },
        ships: [{ designId: 'scout', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: 1000,
        orders: []
      };
    });

    it('should validate valid movement', () => {
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      const result = service.validateMovement(fleet, destination);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.fuelAvailable).toBe(1000);
      expect(result.fuelRequired).toBeGreaterThan(0);
    });

    it('should detect fleet with no ships', () => {
      fleet.ships = [];
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      const result = service.validateMovement(fleet, destination);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Fleet has no ships');
    });

    it('should detect invalid space destination', () => {
      const destination: FleetLocation = { type: 'space' }; // Missing x, y
      
      const result = service.validateMovement(fleet, destination);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Space destination requires x and y coordinates');
    });

    it('should detect invalid orbit destination', () => {
      const destination: FleetLocation = { type: 'orbit' }; // Missing planetId
      
      const result = service.validateMovement(fleet, destination);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Orbit destination requires starId');
    });

    it('should warn about insufficient fuel', () => {
      fleet.fuel = 1; // Very low fuel
      const destination: FleetLocation = { type: 'space', x: 1000, y: 1000 }; // Far destination
      
      const result = service.validateMovement(fleet, destination);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Insufficient fuel');
      expect(result.canMove).toBe(false);
    });

    it('should set canMove correctly', () => {
      const destination: FleetLocation = { type: 'space', x: 10, y: 10 }; // Close destination
      
      const result = service.validateMovement(fleet, destination);

      expect(result.isValid).toBe(true);
      expect(result.canMove).toBe(true);
    });

    it('should log validation process', () => {
      const destination: FleetLocation = { type: 'space', x: 50, y: 75 };
      
      service.validateMovement(fleet, destination);

      expect(mockLoggingService.debug).toHaveBeenCalledWith(
        'Validating fleet movement',
        jasmine.any(Object)
      );
    });
  });
});