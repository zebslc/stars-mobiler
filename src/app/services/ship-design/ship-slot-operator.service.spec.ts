import { TestBed } from '@angular/core/testing';
import { ShipSlotOperatorService } from './ship-slot-operator.service';
import { ShipDesignOperationsService } from './ship-design-operations.service';
import type { ShipDesign } from '../../models/game.model';
import type { ComponentStats } from '../../data/tech-atlas.types';

describe('ShipSlotOperatorService', () => {
  let service: ShipSlotOperatorService;
  let mockOperations: jasmine.SpyObj<ShipDesignOperationsService>;

  const mockShipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Test Design',
    hullId: 'hull-1',
    playerId: 'player-1',
    createdTurn: 1,
    slots: [
      { slotId: 'slot-1', components: [{ componentId: 'component-1', count: 1 }] },
    ],
    spec: {} as any,
  };

  const mockComponent: ComponentStats = {
    id: 'component-1',
    name: 'Test Component',
    type: 'Engine',
    mass: 10,
    cost: { ironium: 10, boranium: 5, germanium: 5, resources: 50 },
    stats: {},
    tech: { Energy: 1, Kinetics: 0, Propulsion: 1, Construction: 0 },
    description: 'Test component',
  };

  beforeEach(() => {
    mockOperations = jasmine.createSpyObj('ShipDesignOperationsService', [
      'setSlotComponent',
      'addComponent',
      'removeComponent',
      'clearSlot',
    ]);

    // Return new design instances to satisfy immutability expectations in tests.
    const clone = (design: ShipDesign) => ({ ...design, slots: [...design.slots] });
    mockOperations.setSlotComponent.and.callFake((design) => clone(design));
    mockOperations.addComponent.and.callFake((design) => clone(design));
    mockOperations.removeComponent.and.callFake((design) => clone(design));
    mockOperations.clearSlot.and.callFake((design) => clone(design));

    TestBed.configureTestingModule({
      providers: [
        ShipSlotOperatorService,
        { provide: ShipDesignOperationsService, useValue: mockOperations },
      ],
    });
    service = TestBed.inject(ShipSlotOperatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setSlotComponent', () => {
    it('should set component in slot', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot-1', mockComponent, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockShipDesign.id);
    });

    it('should return new design instance', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot-1', mockComponent, 1);

      expect(result).not.toBe(mockShipDesign);
    });

    it('should replace existing component', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot-1', { ...mockComponent, id: 'component-2' }, 2);

      expect(result.slots.length).toBeGreaterThan(0);
    });

    it('should handle multiple component count', () => {
      const result = service.setSlotComponent(mockShipDesign, 'slot-1', mockComponent, 5);

      expect(result).toBeDefined();
    });
  });

  describe('addComponent', () => {
    it('should add component to slot', () => {
      const result = service.addComponent(mockShipDesign, 'slot-1', mockComponent, 2);

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.addComponent(mockShipDesign, 'slot-1', mockComponent, 1);

      expect(result).not.toBe(mockShipDesign);
    });
  });

  describe('removeComponent', () => {
    it('should remove component from slot', () => {
      const result = service.removeComponent(mockShipDesign, 'slot-1', 'component-1');

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.removeComponent(mockShipDesign, 'slot-1', 'component-1');

      expect(result).not.toBe(mockShipDesign);
    });

    it('should handle removing from non-existent slot', () => {
      const result = service.removeComponent(mockShipDesign, 'non-existent-slot', 'component-1');

      expect(result).toBeDefined();
    });
  });

  describe('clearSlot', () => {
    it('should clear slot component', () => {
      const result = service.clearSlot(mockShipDesign, 'slot-1');

      expect(result).toBeDefined();
    });

    it('should return new design instance', () => {
      const result = service.clearSlot(mockShipDesign, 'slot-1');

      expect(result).not.toBe(mockShipDesign);
    });

    it('should handle clearing non-existent slot', () => {
      const result = service.clearSlot(mockShipDesign, 'non-existent-slot');

      expect(result).toBeDefined();
    });
  });
});

