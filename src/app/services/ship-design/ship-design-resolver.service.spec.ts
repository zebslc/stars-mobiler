import { TestBed } from '@angular/core/testing';
import { ShipDesignResolverService } from './ship-design-resolver.service';
import { ShipDesignRegistry } from '../data/ship-design-registry.service';
import { DataAccessService } from '../data/data-access.service';
import type { CompiledDesign } from '../data/ship-design-registry.service';
import type { GameState, ShipDesign } from '../../models/game.model';

describe('ShipDesignResolverService', () => {
  let service: ShipDesignResolverService;
  let mockRegistry: jasmine.SpyObj<ShipDesignRegistry>;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;

  const mockCompiledDesign: CompiledDesign = {
    id: 'design-1',
    name: 'Test Design',
    hullId: 'hull-1',
    hullName: 'Test Hull',
    mass: 1000,
    cargoCapacity: 100,
    fuelCapacity: 1000,
    fuelEfficiency: 1,
    warpSpeed: 5,
    idealWarp: 5,
    armor: 50,
    shields: 0,
    initiative: 5,
    firepower: 0,
    cost: { ironium: 100, boranium: 80, germanium: 60, resources: 500 },
    colonyModule: false,
    scannerRange: 0,
    cloakedRange: 0,
    components: [],
  } as any;

  const mockShipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Test Design',
    hullId: 'hull-1',
    playerId: 'player-1',
    createdTurn: 1,
    slots: [],
    spec: {} as any,
  };

  beforeEach(() => {
    mockRegistry = jasmine.createSpyObj('ShipDesignRegistry', ['getDesign']);
    mockDataAccess = jasmine.createSpyObj('DataAccessService', [
      'getHull',
      'getComponentsLookup',
      'getTechFieldLookup',
      'getRequiredLevelLookup',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ShipDesignResolverService,
        { provide: ShipDesignRegistry, useValue: mockRegistry },
        { provide: DataAccessService, useValue: mockDataAccess },
      ],
    });

    service = TestBed.inject(ShipDesignResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('resolve', () => {
    it('should return compiled design from static registry', () => {
      mockRegistry.getDesign.and.returnValue(mockCompiledDesign);

      const result = service.resolve('design-1');

      expect(result).toEqual(mockCompiledDesign);
      expect(mockRegistry.getDesign).toHaveBeenCalledWith('design-1');
    });

    it('should return null when design not found in registry', () => {
      mockRegistry.getDesign.and.returnValue(undefined as any);

      const result = service.resolve('non-existent-design');

      expect(result).toBeNull();
    });

    it('should resolve design from game state when provided', () => {
      const gameState: GameState = {
        id: 'game-1',
        seed: 12345,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: {
          id: 'player-1',
          name: 'Human',
          species: {} as any,
          techLevels: { Energy: 5, Kinetics: 3, Propulsion: 7, Construction: 2 },
          researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
          selectedResearchField: 'Energy',
          ownedStarIds: [],
        },
        aiPlayers: [],
        fleets: [],
        shipDesigns: [mockShipDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});

      const result = service.resolve('design-1', gameState);

      expect(result).toBeDefined();
    });

    it('should prefer dynamic design over static when both exist', () => {
      const gameState: GameState = {
        id: 'game-1',
        seed: 12345,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: {
          id: 'player-1',
          name: 'Human',
          species: {} as any,
          techLevels: { Energy: 5, Kinetics: 3, Propulsion: 7, Construction: 2 },
          researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
          selectedResearchField: 'Energy',
          ownedStarIds: [],
        },
        aiPlayers: [],
        fleets: [],
        shipDesigns: [mockShipDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      mockRegistry.getDesign.and.returnValue(mockCompiledDesign);
      mockDataAccess.getComponentsLookup.and.returnValue({});
      mockDataAccess.getTechFieldLookup.and.returnValue({});
      mockDataAccess.getRequiredLevelLookup.and.returnValue({});

      const result = service.resolve('design-1', gameState);

      // Should have used the dynamic design, not called registry
      expect(mockRegistry.getDesign).not.toHaveBeenCalled();
    });

    it('should handle null game state gracefully', () => {
      mockRegistry.getDesign.and.returnValue(mockCompiledDesign);

      const result = service.resolve('design-1', null);

      expect(result).toEqual(mockCompiledDesign);
    });

    it('should return null when design not in game state and not in registry', () => {
      const gameState: GameState = {
        id: 'game-1',
        seed: 12345,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: {} as any,
        aiPlayers: [],
        fleets: [],
        shipDesigns: [],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      mockRegistry.getDesign.and.returnValue(undefined as any);

      const result = service.resolve('non-existent-design', gameState);

      expect(result).toBeNull();
    });

    it('should handle design with pre-compiled spec', () => {
      const designWithSpec: ShipDesign = {
        ...mockShipDesign,
        spec: {
          mass: 1000,
          armor: 50,
          firepower: 10,
          warpSpeed: 8,
          fuelCapacity: 500,
          idealWarp: 8,
          isRamscoop: false,
          accuracy: 1,
          initiative: 1,
          cargoCapacity: 100,
          colonistCapacity: 0,
          scanRange: 0,
          penScanRange: 0,
          canDetectCloaked: false,
          miningRate: 0,
          terraformRate: 0,
          bombing: { kill: 0, destroy: 0 },
          massDriver: { speed: 0, catch: 0 },
          maxWeaponRange: 0,
          shields: 0,
          cost: { ironium: 100, boranium: 80, germanium: 60, resources: 500 },
          hasEngine: false,
          hasColonyModule: false,
          isStarbase: false,
          isValid: true,
          validationErrors: [],
          components: [],
        },
      };

      const gameState: GameState = {
        id: 'game-1',
        seed: 12345,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: {} as any,
        aiPlayers: [],
        fleets: [],
        shipDesigns: [designWithSpec],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };

      const result = service.resolve('design-1', gameState);

      expect(result).toBeDefined();
    });
  });
});

