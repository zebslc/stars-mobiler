import { TestBed } from '@angular/core/testing';
import { ShipDesignOperationsService } from './ship-design-operations.service';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';
import type { ShipDesign } from '../../models/game.model';
import type { ComponentData, ResourceCost } from '../../models/service-interfaces.model';

describe('ShipDesignOperationsService', () => {
  let service: ShipDesignOperationsService;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  const mockShipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Test Design',
    hullId: 'hull-1',
    playerId: 'player-1',
    createdTurn: 1,
    slots: [],
    spec: {} as any,
  };

  const mockComponent: ComponentData = {
    id: 'component-1',
    name: 'Test Component',
    type: 'Engine',
  };

  beforeEach(() => {
    mockDataAccess = jasmine.createSpyObj('DataAccessService', [
      'getComponent',
      'getHull',
      'getComponentsLookup',
    ]);
    mockLogging = jasmine.createSpyObj('LoggingService', ['debug', 'error', 'warn', 'log']);

    // Mock getHull to return a valid hull with slots accessible by index-based IDs
    mockDataAccess.getHull.and.returnValue({
      id: 'hull-1',
      Name: 'Test Hull',
      Structure: [],
      Slots: [
        { Code: 'slot_0', Allowed: ['Engine'], Max: 1 },
        { Code: 'slot_1', Allowed: ['Scanner'], Max: 2 },
      ],
      Cost: { Ironium: 0, Boranium: 0, Germanium: 0, Resources: 0 },
      Stats: { Mass: 1, 'Max Fuel': 0, Armor: 0, Cargo: 0, Initiative: 0 },
    });

    // Mock getComponent to return component data
    mockDataAccess.getComponent.and.callFake((componentId: string) => {
      if (componentId === 'component-1') {
        return {
          id: 'component-1',
          name: 'Test Component',
          type: 'Engine',
          tech: { level: 1, technology: 'Fuel Mizer' },
          cost: { Ironium: 0, Boranium: 0, Germanium: 0, Resources: 0 },
          mass: 1,
          stats: { power: 1, warp: 1 },
          description: 'Test component',
        } as any;
      }
      return undefined;
    });

    TestBed.configureTestingModule({
      providers: [
        ShipDesignOperationsService,
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: LoggingService, useValue: mockLogging },
      ],
    });

    service = TestBed.inject(ShipDesignOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setSlotComponent', () => {
    it('should handle setting component in slot', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot_0', mockComponent, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockShipDesign.id);
    });

    it('should create new design instance on operation', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot_0', mockComponent, 1);

      expect(result).not.toBe(mockShipDesign);
    });

    it('should handle multiple component counts', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot_0', mockComponent, 5);

      expect(result).toBeDefined();
    });
  });

  describe('addComponent', () => {
    it('should handle adding component to slot', () => {
      const result = service.addComponent(mockShipDesign, 'slot_0', mockComponent, 2);

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.addComponent(mockShipDesign, 'slot_0', mockComponent, 1);

      expect(result).not.toBe(mockShipDesign);
    });
  });

  describe('removeComponent', () => {
    const designWithComponent: ShipDesign = {
      ...mockShipDesign,
      slots: [
        {
          slotId: 'slot-1',
          components: [{ componentId: 'component-1', count: 2 }],
        },
      ],
    };

    it('should handle removing component from slot', () => {
      const result = service.removeComponent(designWithComponent, 'slot-1', 'component-1');

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.removeComponent(designWithComponent, 'slot-1', 'component-1');

      expect(result).not.toBe(designWithComponent);
    });

    it('should handle removing from empty slot gracefully', () => {
      const result = service.removeComponent(mockShipDesign, 'empty-slot', 'component-1');

      expect(result).toBeDefined();
    });
  });

  describe('clearSlot', () => {
    const designWithComponent: ShipDesign = {
      ...mockShipDesign,
      slots: [
        {
          slotId: 'slot-1',
          components: [{ componentId: 'component-1', count: 1 }],
        },
      ],
    };

    it('should clear component from slot', () => {
      const result = service.clearSlot(designWithComponent, 'slot-1');

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.clearSlot(designWithComponent, 'slot-1');

      expect(result).not.toBe(designWithComponent);
    });
  });

  describe('error handling', () => {
    it('should log errors that occur during operations', () => {
      mockDataAccess.getComponent.and.returnValue(undefined);

      // Try to perform operation that might fail
      try {
        service.setSlotComponent(mockShipDesign, 'invalid-slot', { id: '', name: '', type: '' }, 1);
      } catch {
        // Service throws error, which is expected
      }

      // Service should have logged error
      expect(mockLogging.error).toHaveBeenCalled();
    });
  });
});

