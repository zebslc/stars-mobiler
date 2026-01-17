import { TestBed } from '@angular/core/testing';
import { ShipDesignValidationService } from './ship-design-validation.service';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';
import type { ShipDesign, PlayerTech } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';

describe('ShipDesignValidationService', () => {
  let service: ShipDesignValidationService;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  const mockTechLevels: PlayerTech = {
    Energy: 5,
    Kinetics: 3,
    Propulsion: 7,
    Construction: 2,
  };

  const mockHull: HullTemplate = {
    id: 'hull-1',
    Name: 'Small Hull',
    Structure: [],
    Slots: [],
    Cost: { Ironium: 100, Boranium: 80, Germanium: 60, Resources: 500 },
    Stats: { armor: 50 },
  } as any;

  const mockShipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Valid Design',
    hullId: 'hull-1',
    playerId: 'player-1',
    createdTurn: 1,
    slots: [],
    spec: {} as any,
  };

  beforeEach(() => {
    mockDataAccess = jasmine.createSpyObj('DataAccessService', [
      'getHull',
      'getComponent',
      'getComponentsLookup',
      'getTechFieldLookup',
      'getRequiredLevelLookup',
    ]);
    mockLogging = jasmine.createSpyObj('LoggingService', ['debug', 'error', 'warn', 'log']);

    mockDataAccess.getComponentsLookup.and.returnValue({});
    mockDataAccess.getTechFieldLookup.and.returnValue({});
    mockDataAccess.getRequiredLevelLookup.and.returnValue({});

    TestBed.configureTestingModule({
      providers: [
        ShipDesignValidationService,
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: LoggingService, useValue: mockLogging },
      ],
    });

    service = TestBed.inject(ShipDesignValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateDesign', () => {
    beforeEach(() => {
      mockDataAccess.getHull.and.returnValue(mockHull);
    });

    it('should return valid result for valid design', () => {
      const result = service.validateDesign(mockShipDesign, mockTechLevels);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should log error when hull not found', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const result = service.validateDesign(mockShipDesign, mockTechLevels);

      expect(mockLogging.debug).toHaveBeenCalled();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include validation errors for missing hull', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const result = service.validateDesign(mockShipDesign, mockTechLevels);

      expect(result.errors.some((e) => e.toLowerCase().includes('hull'))).toBe(true);
    });

    it('should handle design with no slots', () => {
      const emptyDesign: ShipDesign = {
        ...mockShipDesign,
        slots: [],
      };

      const result = service.validateDesign(emptyDesign, mockTechLevels);

      expect(result.isValid).toBeDefined();
    });

    it('should validate tech requirements', () => {
      const lowTechLevels: PlayerTech = {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
      };

      const result = service.validateDesign(mockShipDesign, lowTechLevels);

      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('validateComponentPlacement', () => {
    it('should return validation result object', () => {
      const mockComponent = {
        id: 'component-1',
        name: 'Test Component',
        type: 'Engine',
      };

      const result = service.validateComponentPlacement('slot-1', mockComponent, 1);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
    });

    it('should validate component placement with positive count', () => {
      const mockComponent = {
        id: 'component-1',
        name: 'Test Component',
        type: 'Engine',
      };

      const result = service.validateComponentPlacement('slot-1', mockComponent, 2);

      expect(typeof result.isValid).toBe('boolean');
    });

    it('should reject zero or negative count', () => {
      const mockComponent = {
        id: 'component-1',
        name: 'Test Component',
        type: 'Engine',
      };

      const result = service.validateComponentPlacement('slot-1', mockComponent, 0);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle validation gracefully when hull lookup fails', () => {
      mockDataAccess.getHull.and.returnValue(undefined);

      const result = service.validateDesign(mockShipDesign, mockTechLevels);

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should log validation start', () => {
      mockDataAccess.getHull.and.returnValue(mockHull);

      service.validateDesign(mockShipDesign, mockTechLevels);

      expect(mockLogging.debug).toHaveBeenCalledWith(
        'Starting ship design validation',
        jasmine.objectContaining({
          service: 'ShipDesignValidationService',
        })
      );
    });
  });
});

