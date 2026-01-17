import { TestBed } from '@angular/core/testing';
import { ShipDesignerService } from './ship-designer.service';
import { ShipDesignAvailabilityService } from './ship-design-availability.service';
import { ShipDesignComponentService } from './ship-design-component.service';
import { ShipDesignStateService } from './ship-design-state.service';
import { signal } from '@angular/core';
import type { ShipDesign, PlayerTech, Species } from '../../models/game.model';

describe('ShipDesignerService', () => {
  let service: ShipDesignerService;
  let mockStateService: jasmine.SpyObj<ShipDesignStateService>;
  let mockComponentService: jasmine.SpyObj<ShipDesignComponentService>;
  let mockAvailabilityService: jasmine.SpyObj<ShipDesignAvailabilityService>;

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
    traits: [],
  };

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
    mockStateService = jasmine.createSpyObj(
      'ShipDesignStateService',
      ['setTechLevels', 'setPlayerSpecies', 'startNewDesign', 'loadDesign', 'setDesignName', 'clearDesign'],
      {
        currentDesign: signal(mockShipDesign),
        techLevels: signal(mockTechLevels),
        currentHull: signal(null),
        compiledStats: signal(null),
      }
    );

    mockComponentService = jasmine.createSpyObj('ShipDesignComponentService', [
      'setSlotComponent',
      'addComponent',
      'installComponent',
      'removeComponent',
      'clearSlot',
    ]);

    mockAvailabilityService = jasmine.createSpyObj('ShipDesignAvailabilityService', [
      'getAvailableComponentsForSlot',
      'getAvailableHulls',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ShipDesignerService,
        { provide: ShipDesignStateService, useValue: mockStateService },
        { provide: ShipDesignComponentService, useValue: mockComponentService },
        { provide: ShipDesignAvailabilityService, useValue: mockAvailabilityService },
      ],
    });

    service = TestBed.inject(ShipDesignerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose currentDesign signal from state service', () => {
    expect(service.currentDesign()).toEqual(mockShipDesign);
  });

  it('should expose techLevels signal from state service', () => {
    expect(service.techLevels()).toEqual(mockTechLevels);
  });

  describe('setTechLevels', () => {
    it('should delegate to state service', () => {
      const newTechLevels: PlayerTech = {
        Energy: 10,
        Kinetics: 8,
        Propulsion: 6,
        Construction: 4,
      };

      service.setTechLevels(newTechLevels);

      expect(mockStateService.setTechLevels).toHaveBeenCalledWith(newTechLevels);
    });
  });

  describe('setPlayerSpecies', () => {
    it('should delegate to state service', () => {
      service.setPlayerSpecies(mockSpecies);

      expect(mockStateService.setPlayerSpecies).toHaveBeenCalledWith(mockSpecies);
    });
  });

  describe('startNewDesign', () => {
    it('should delegate to state service with correct parameters', () => {
      service.startNewDesign('hull-2', 'player-2', 5);

      expect(mockStateService.startNewDesign).toHaveBeenCalledWith('hull-2', 'player-2', 5);
    });
  });

  describe('loadDesign', () => {
    it('should delegate to state service', () => {
      const design: ShipDesign = { ...mockShipDesign, name: 'Loaded Design' };

      service.loadDesign(design);

      expect(mockStateService.loadDesign).toHaveBeenCalledWith(design);
    });
  });

  describe('setDesignName', () => {
    it('should delegate to state service', () => {
      service.setDesignName('My Custom Design');

      expect(mockStateService.setDesignName).toHaveBeenCalledWith('My Custom Design');
    });
  });

  describe('setSlotComponent', () => {
    it('should delegate to component service', () => {
      mockComponentService.setSlotComponent.and.returnValue(true);

      const result = service.setSlotComponent('slot-1', 'component-1', 2);

      expect(mockComponentService.setSlotComponent).toHaveBeenCalledWith('slot-1', 'component-1', 2);
      expect(result).toBe(true);
    });

    it('should default count to 1 if not provided', () => {
      mockComponentService.setSlotComponent.and.returnValue(true);

      service.setSlotComponent('slot-1', 'component-1');

      expect(mockComponentService.setSlotComponent).toHaveBeenCalledWith('slot-1', 'component-1', 1);
    });
  });

  describe('addComponent', () => {
    it('should delegate to component service', () => {
      mockComponentService.addComponent.and.returnValue(true);

      const result = service.addComponent('slot-1', 'component-1', 3);

      expect(mockComponentService.addComponent).toHaveBeenCalledWith('slot-1', 'component-1', 3);
      expect(result).toBe(true);
    });
  });

  describe('installComponent', () => {
    it('should delegate to component service', () => {
      mockComponentService.installComponent.and.returnValue(true);

      const result = service.installComponent('slot-1', 'component-1', 1);

      expect(mockComponentService.installComponent).toHaveBeenCalledWith('slot-1', 'component-1', 1);
      expect(result).toBe(true);
    });
  });

  describe('removeComponent', () => {
    it('should delegate to component service', () => {
      service.removeComponent('slot-1', 'component-1');

      expect(mockComponentService.removeComponent).toHaveBeenCalledWith('slot-1', 'component-1');
    });
  });

  describe('clearSlot', () => {
    it('should delegate to component service', () => {
      service.clearSlot('slot-1');

      expect(mockComponentService.clearSlot).toHaveBeenCalledWith('slot-1');
    });
  });

  describe('getAvailableComponentsForSlot', () => {
    it('should delegate to availability service', () => {
      const mockComponents = [{ id: 'comp-1' }];
      mockAvailabilityService.getAvailableComponentsForSlot.and.returnValue(mockComponents as any);

      const result = service.getAvailableComponentsForSlot('slot-1');

      expect(mockAvailabilityService.getAvailableComponentsForSlot).toHaveBeenCalledWith('slot-1');
      expect(result).toBeDefined();
    });
  });

  describe('getAvailableHulls', () => {
    it('should delegate to availability service', () => {
      const mockHulls = [{ id: 'hull-1', Name: 'Small Hull' }];
      mockAvailabilityService.getAvailableHulls.and.returnValue(mockHulls as any);

      const result = service.getAvailableHulls();

      expect(mockAvailabilityService.getAvailableHulls).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('clearDesign', () => {
    it('should delegate to state service', () => {
      service.clearDesign();

      expect(mockStateService.clearDesign).toHaveBeenCalled();
    });
  });
});

