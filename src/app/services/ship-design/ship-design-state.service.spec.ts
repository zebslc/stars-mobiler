import { TestBed } from '@angular/core/testing';
import { ShipDesignStateService } from './ship-design-state.service';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';
import type { PlayerTech, Species, ShipDesign } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';

describe('ShipDesignStateService', () => {
  let service: ShipDesignStateService;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  const mockTechLevels: PlayerTech = {
    Energy: 5,
    Kinetics: 3,
    Propulsion: 7,
    Construction: 2,
  };

  const mockSpecies: Species = {
    id: 'test-species',
    name: 'Test Species',
    habitat: {
      idealTemperature: 50,
      idealAtmosphere: 50,
      toleranceRadius: 40,
    },
    traits: [
      { type: 'growth', modifier: 1.5 },
      { type: 'research', modifier: 1.2 },
    ],
  };

  const mockHull: HullTemplate = {
    id: 'hull-1',
    Name: 'Small Freighter',
    mass: 1000,
    Cost: { ironium: 100, boranium: 80, germanium: 60, resources: 500 },
    Stats: { armor: 50 },
    Slots: [],
    Structure: [],
  } as any;

  beforeEach(() => {
    mockDataAccess = jasmine.createSpyObj('DataAccessService', [
      'getHull',
      'getComponentsLookup',
      'getTechFieldLookup',
      'getRequiredLevelLookup',
    ]);
    mockLogging = jasmine.createSpyObj('LoggingService', ['debug', 'error', 'warn', 'log']);

    TestBed.configureTestingModule({
      providers: [
        ShipDesignStateService,
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: LoggingService, useValue: mockLogging },
      ],
    });

    service = TestBed.inject(ShipDesignStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setTechLevels', () => {
    it('should update tech levels signal', () => {
      service.setTechLevels(mockTechLevels);

      expect(service.techLevels()).toEqual(mockTechLevels);
    });

    it('should create a copy of tech levels', () => {
      const original = { ...mockTechLevels };
      service.setTechLevels(original);
      original.Energy = 99;

      expect(service.techLevels().Energy).toEqual(mockTechLevels.Energy);
    });

    it('should handle different tech level values', () => {
      const highTech: PlayerTech = {
        Energy: 26,
        Kinetics: 26,
        Propulsion: 26,
        Construction: 26,
      };

      service.setTechLevels(highTech);

      expect(service.techLevels().Energy).toBe(26);
    });
  });

  describe('setPlayerSpecies', () => {
    it('should update player species signal', () => {
      service.setPlayerSpecies(mockSpecies);

      expect(service.playerSpecies()).toEqual(mockSpecies);
    });

    it('should handle species with different traits', () => {
      const speciesWithTraits: Species = {
        ...mockSpecies,
        traits: [
          { type: 'mining', modifier: 1.3 },
          { type: 'shipCost', modifier: 0.8 },
        ],
      };

      service.setPlayerSpecies(speciesWithTraits);

      expect(service.playerSpecies()).toEqual(speciesWithTraits);
    });
  });

  describe('startNewDesign', () => {
    beforeEach(() => {
      mockDataAccess.getHull.and.returnValue(mockHull);
      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});
    });

    it('should create a new design with specified hull', () => {
      service.startNewDesign('hull-1', 'player-1', 1);

      expect(service.currentDesign()).toBeTruthy();
      expect(service.currentDesign()?.hullId).toBe('hull-1');
    });

    it('should set player ID on new design', () => {
      service.startNewDesign('hull-1', 'player-2', 1);

      expect(service.currentDesign()?.playerId).toBe('player-2');
    });

    it('should set turn number on new design', () => {
      service.startNewDesign('hull-1', 'player-1', 5);

      expect(service.currentDesign()?.createdTurn).toBe(5);
    });

    it('should initialize slots from hull', () => {
      const hullWithSlots: HullTemplate = {
        ...mockHull,
        Slots: [
          { id: 'slot-1', type: 'engine', count: 1 },
          { id: 'slot-2', type: 'weapon', count: 2 },
        ] as any,
      };
      mockDataAccess.getHull.and.returnValue(hullWithSlots);

      service.startNewDesign('hull-1', 'player-1', 1);

      expect(service.currentDesign()?.slots).toBeDefined();
    });

    it('should log debug message on successful design creation', () => {
      service.startNewDesign('hull-1', 'player-1', 1);

      expect(mockLogging.debug).toHaveBeenCalledWith(
        'Starting new ship design',
        jasmine.objectContaining({
          service: 'ShipDesignStateService',
          operation: 'startNewDesign',
        }),
      );
    });

    it('should log error when hull not found', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      service.startNewDesign('invalid-hull', 'player-1', 1);

      expect(mockLogging.error).toHaveBeenCalled();
    });

    it('should not update current design if hull not found', () => {
      mockDataAccess.getHull.and.returnValue(undefined);
      service.currentDesign(); // establish baseline

      service.startNewDesign('invalid-hull', 'player-1', 1);

      expect(service.currentDesign()).toBeNull();
    });
  });

  describe('currentHull computed signal', () => {
    it('should return null when no current design', () => {
      expect(service.currentHull()).toBeNull();
    });

    it('should return hull for current design', () => {
      mockDataAccess.getHull.and.returnValue(mockHull);
      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});

      service.startNewDesign('hull-1', 'player-1', 1);

      expect(service.currentHull()).toEqual(mockHull);
    });

    it('should return null if hull lookup fails', () => {
      mockDataAccess.getHull.and.returnValue(mockHull);
      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});

      service.startNewDesign('hull-1', 'player-1', 1);

      mockDataAccess.getHull.and.returnValue(undefined);
      expect(service.currentHull()).toBeNull();
    });
  });

  describe('compiledStats computed signal', () => {
    it('should return null when no current design', () => {
      expect(service.compiledStats()).toBeNull();
    });

    it('should return null when no current hull', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      expect(service.compiledStats()).toBeNull();
    });

    it('should compile stats when both design and hull exist', () => {
      mockDataAccess.getHull.and.returnValue(mockHull);
      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});

      service.startNewDesign('hull-1', 'player-1', 1);
      service.setTechLevels(mockTechLevels);

      expect(service.compiledStats()).toBeTruthy();
    });
  });
});

