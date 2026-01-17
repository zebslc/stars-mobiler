import { TestBed } from '@angular/core/testing';
import { ShipyardService } from './shipyard.service';
import { DataAccessService } from '../data/data-access.service';
import { ShipDesignRegistry } from '../data/ship-design-registry.service';
import { LoggingService } from '../core/logging.service';
import type { GameState, ShipDesign, Player } from '../../models/game.model';
import { MockPlayerFactory } from '../../testing/mock-player.factory';

describe('ShipyardService', () => {
  let service: ShipyardService;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockRegistry: jasmine.SpyObj<ShipDesignRegistry>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  const mockPlayer = MockPlayerFactory.withTechLevels({
    Energy: 5,
    Kinetics: 3,
    Propulsion: 7,
    Construction: 2,
  });

  const mockShipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Test Design',
    hullId: 'hull-1',
    playerId: 'test-player',
    createdTurn: 1,
    slots: [],
    spec: {} as any,
  };

  const mockGameState: GameState = {
    id: 'game-1',
    seed: 12345,
    turn: 1,
    settings: {} as any,
    stars: [],
    humanPlayer: mockPlayer,
    aiPlayers: [],
    fleets: [],
    shipDesigns: [mockShipDesign],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  beforeEach(() => {
    mockDataAccess = jasmine.createSpyObj('DataAccessService', [
      'getHull',
      'getComponentsLookup',
      'getTechFieldLookup',
      'getRequiredLevelLookup',
    ]);
    mockRegistry = jasmine.createSpyObj('ShipDesignRegistry', ['register', 'unregister']);
    mockLogging = jasmine.createSpyObj('LoggingService', ['debug', 'error', 'warn', 'log']);

    mockDataAccess.getComponentsLookup.and.returnValue({});
    mockDataAccess.getTechFieldLookup.and.returnValue({});
    mockDataAccess.getRequiredLevelLookup.and.returnValue({});

    TestBed.configureTestingModule({
      providers: [
        ShipyardService,
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: ShipDesignRegistry, useValue: mockRegistry },
        { provide: LoggingService, useValue: mockLogging },
      ],
    });

    service = TestBed.inject(ShipyardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveShipDesign', () => {
    it('should save new design to game state', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const result = service.saveShipDesign(mockGameState, mockShipDesign);

      expect(result).toBeDefined();
      expect(result.shipDesigns).toBeDefined();
    });

    it('should update existing design in game state', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const updatedDesign = { ...mockShipDesign, name: 'Updated Design' };
      const result = service.saveShipDesign(mockGameState, updatedDesign);

      expect(result).toBeDefined();
    });

    it('should not modify game state directly', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const originalLength = mockGameState.shipDesigns.length;
      service.saveShipDesign(mockGameState, mockShipDesign);

      expect(mockGameState.shipDesigns.length).toBe(originalLength);
    });

    it('should preserve other game state properties', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const result = service.saveShipDesign(mockGameState, mockShipDesign);

      expect(result.id).toBe(mockGameState.id);
      expect(result.humanPlayer).toEqual(mockGameState.humanPlayer);
    });
  });

  describe('deleteShipDesign', () => {
    it('should remove design from game state', () => {
      const result = service.deleteShipDesign(mockGameState, 'design-1');

      expect(result.shipDesigns.some((d) => d.id === 'design-1')).toBe(false);
    });

    it('should not affect other designs', () => {
      const twoDesignState = {
        ...mockGameState,
        shipDesigns: [
          mockShipDesign,
          { ...mockShipDesign, id: 'design-2', name: 'Another Design' },
        ],
      };

      const result = service.deleteShipDesign(twoDesignState, 'design-1');

      expect(result.shipDesigns.length).toBe(1);
      expect(result.shipDesigns[0].id).toBe('design-2');
    });

    it('should not modify original game state', () => {
      const originalLength = mockGameState.shipDesigns.length;
      service.deleteShipDesign(mockGameState, 'design-1');

      expect(mockGameState.shipDesigns.length).toBe(originalLength);
    });

    it('should unregister dynamic designs from registry', () => {
      service.deleteShipDesign(mockGameState, 'design-1');

      expect(mockRegistry.unregister).toHaveBeenCalled();
    });
  });

  describe('getPlayerShipDesigns', () => {
    it('should return designs for player', () => {
      const designs = service.getPlayerShipDesigns(mockGameState);

      expect(Array.isArray(designs)).toBe(true);
    });

    it('should filter by player ID', () => {
      const multiPlayerState = {
        ...mockGameState,
        shipDesigns: [
          { ...mockShipDesign, playerId: 'test-player' },
          { ...mockShipDesign, id: 'design-2', playerId: 'other-player' },
        ],
      };

      const designs = service.getPlayerShipDesigns(multiPlayerState);

      expect(designs.every((d) => d.playerId === 'test-player')).toBe(true);
    });

    it('should return empty array for null game state', () => {
      const designs = service.getPlayerShipDesigns(null as any);

      expect(designs).toEqual([]);
    });

    it('should return all player designs', () => {
      const multiDesignState = {
        ...mockGameState,
        shipDesigns: [
          { ...mockShipDesign, playerId: 'test-player' },
          { ...mockShipDesign, id: 'design-2', playerId: 'test-player' },
          { ...mockShipDesign, id: 'design-3', playerId: 'other-player' },
        ],
      };

      const designs = service.getPlayerShipDesigns(multiDesignState);

      expect(designs.length).toBe(2);
    });
  });

  describe('getShipCost', () => {
    it('should return cost object', () => {
      const cost = service.getShipCost(mockShipDesign);

      expect(cost).toBeDefined();
      expect(typeof cost.resources).toBe('number');
      expect(typeof cost.ironium).toBe('number');
    });

    it('should calculate cost with tech levels', () => {
      const techLevels = { Energy: 5, Kinetics: 3, Propulsion: 7, Construction: 2 };
      const cost = service.getShipCost(mockShipDesign, techLevels);

      expect(cost).toBeDefined();
    });

    it('should handle design with no components', () => {
      const simpleDesign = { ...mockShipDesign, slots: [] };
      const cost = service.getShipCost(simpleDesign);

      expect(typeof cost.resources).toBe('number');
    });
  });
});

