import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ShipDesignAvailabilityService } from './ship-design-availability.service';
import { ShipComponentEligibilityService } from './ship-component-eligibility.service';
import { ShipDesignStateService } from './ship-design-state.service';
import type { PlayerTech, Species, ShipDesign } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';

describe('ShipDesignAvailabilityService', () => {
  let service: ShipDesignAvailabilityService;
  let mockEligibility: jasmine.SpyObj<ShipComponentEligibilityService>;
  let mockState: jasmine.SpyObj<ShipDesignStateService>;

  const mockHull: HullTemplate = {
    id: 'hull-1',
    Name: 'Small Hull',
    mass: 1000,
    Cost: { ironium: 100, boranium: 80, germanium: 60, resources: 500 },
    Stats: { armor: 50 },
    Slots: [],
    Structure: [],
  } as any;

  const mockTechLevels: PlayerTech = {
    Energy: 5,
    Kinetics: 3,
    Propulsion: 7,
    Construction: 2,
  };

  const mockSpecies: Species = {
    id: 'species-1',
    name: 'Test Species',
    habitat: {
      idealTemperature: 50,
      idealAtmosphere: 50,
      toleranceRadius: 40,
    },
    traits: [],
    primaryTraits: [{ type: 'research', modifier: 0.1 }],
    lesserTraits: [],
  } as any;

  beforeEach(() => {
    mockEligibility = jasmine.createSpyObj('ShipComponentEligibilityService', [
      'getAvailableComponentsForSlot',
      'getAvailableHulls',
    ]);

    mockState = jasmine.createSpyObj(
      'ShipDesignStateService',
      ['getTechLevelSnapshot', 'getSpeciesSnapshot', 'currentHull'],
      {},
    );
    (mockState.currentHull as any) = () => mockHull;

    mockState.getTechLevelSnapshot.and.returnValue(mockTechLevels);
    mockState.getSpeciesSnapshot.and.returnValue({ ...mockSpecies });

    TestBed.configureTestingModule({
      providers: [
        ShipDesignAvailabilityService,
        { provide: ShipComponentEligibilityService, useValue: mockEligibility },
        { provide: ShipDesignStateService, useValue: mockState },
      ],
    });

    service = TestBed.inject(ShipDesignAvailabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAvailableComponentsForSlot', () => {
    it('should delegate to eligibility service', () => {
      mockEligibility.getAvailableComponentsForSlot.and.returnValue([]);

      const result = service.getAvailableComponentsForSlot('slot-1');

      expect(mockEligibility.getAvailableComponentsForSlot).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should pass current hull to eligibility service', () => {
      mockEligibility.getAvailableComponentsForSlot.and.returnValue([]);

      service.getAvailableComponentsForSlot('slot-1');

      expect(mockEligibility.getAvailableComponentsForSlot).toHaveBeenCalledWith(
        mockHull,
        'slot-1',
        jasmine.any(Object),
        jasmine.any(Object)
      );
    });

    it('should pass tech levels to eligibility service', () => {
      mockEligibility.getAvailableComponentsForSlot.and.returnValue([]);

      service.getAvailableComponentsForSlot('slot-1');

      expect(mockEligibility.getAvailableComponentsForSlot).toHaveBeenCalledWith(
        jasmine.any(Object),
        'slot-1',
        mockTechLevels,
        jasmine.any(Object)
      );
    });

    it('should return empty array when no components available', () => {
      mockEligibility.getAvailableComponentsForSlot.and.returnValue([]);

      const result = service.getAvailableComponentsForSlot('slot-1');

      expect(result).toEqual([]);
    });

    it('should return multiple components when available', () => {
      const mockComponents = [
        { id: 'comp-1', name: 'Component 1' },
        { id: 'comp-2', name: 'Component 2' },
        { id: 'comp-3', name: 'Component 3' },
      ];
      mockEligibility.getAvailableComponentsForSlot.and.returnValue(mockComponents as any);

      const result = service.getAvailableComponentsForSlot('slot-1');

      expect(result.length).toBe(3);
    });
  });

  describe('getAvailableHulls', () => {
    it('should delegate to eligibility service', () => {
      const mockHulls = [mockHull];
      mockEligibility.getAvailableHulls.and.returnValue(mockHulls);

      const result = service.getAvailableHulls();

      expect(mockEligibility.getAvailableHulls).toHaveBeenCalled();
      expect(result).toEqual(mockHulls);
    });

    it('should pass tech levels to eligibility service', () => {
      mockEligibility.getAvailableHulls.and.returnValue([]);

      service.getAvailableHulls();

      expect(mockEligibility.getAvailableHulls).toHaveBeenCalledWith(
        mockTechLevels,
        mockSpecies.primaryTraits,
        mockSpecies.lesserTraits,
      );
    });

    it('should return empty array when no hulls available', () => {
      mockEligibility.getAvailableHulls.and.returnValue([]);

      const result = service.getAvailableHulls();

      expect(result).toEqual([]);
    });

    it('should return multiple hulls when available', () => {
      const mockHulls = [
        { ...mockHull, id: 'hull-1', name: 'Small Hull' },
        { ...mockHull, id: 'hull-2', name: 'Medium Hull' },
      ];
      mockEligibility.getAvailableHulls.and.returnValue(mockHulls);

      const result = service.getAvailableHulls();

      expect(result.length).toBe(2);
    });

    it('should handle null species gracefully', () => {
      mockState.getSpeciesSnapshot.and.returnValue(null);

      const result = service.getAvailableHulls();

      expect(mockEligibility.getAvailableHulls).toHaveBeenCalledWith(
        mockTechLevels,
        null,
        null
      );
    });
  });
});

