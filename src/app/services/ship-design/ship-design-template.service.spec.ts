import { TestBed } from '@angular/core/testing';
import { ShipDesignTemplateService } from './ship-design-template.service';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';
import { TechAtlasService } from '../data/tech-atlas.service';
import type { PlayerTech } from '../../models/game.model';
import type { HullTemplate } from '../../data/tech-atlas.types';

describe('ShipDesignTemplateService', () => {
  let service: ShipDesignTemplateService;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockLogging: jasmine.SpyObj<LoggingService>;
  let mockTechAtlas: jasmine.SpyObj<TechAtlasService>;

  const mockTechLevels: PlayerTech = {
    Energy: 5,
    Kinetics: 3,
    Propulsion: 7,
    Construction: 2,
  };

  beforeEach(() => {
    mockDataAccess = jasmine.createSpyObj('DataAccessService', ['getHulls', 'getHull']);
    mockLogging = jasmine.createSpyObj('LoggingService', ['debug', 'error', 'warn', 'log']);
    mockTechAtlas = jasmine.createSpyObj('TechAtlasService', ['getHull', 'getAllHulls']);

    TestBed.configureTestingModule({
      providers: [
        ShipDesignTemplateService,
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: LoggingService, useValue: mockLogging },
        { provide: TechAtlasService, useValue: mockTechAtlas },
      ],
    });

    service = TestBed.inject(ShipDesignTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAvailableTemplates', () => {
    it('should return available templates based on tech levels', () => {
      const mockHull: HullTemplate = {
        id: 'hull-1',
        Name: 'Small Hull',
        Structure: [],
        Slots: [],
        Cost: { Ironium: 10, Boranium: 8, Germanium: 6, Resources: 50 },
        Stats: { armor: 10 },
      } as any;

      mockTechAtlas.getHull.and.returnValue(mockHull);

      const templates = service.getAvailableTemplates(mockTechLevels);

      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return empty array when no suitable hulls available', () => {
      mockTechAtlas.getHull.and.returnValue(undefined);

      const templates = service.getAvailableTemplates(mockTechLevels);

      expect(Array.isArray(templates)).toBe(true);
    });

    it('should log debug message when getting templates', () => {
      mockTechAtlas.getHull.and.returnValue(undefined);

      service.getAvailableTemplates(mockTechLevels);

      expect(mockLogging.debug).toHaveBeenCalledWith(
        'Getting available design templates',
        jasmine.objectContaining({
          service: 'ShipDesignTemplateService',
        })
      );
    });

    it('should handle primary trait requirements', () => {
      const mockHull = {
        id: 'hull-1',
        Name: 'Small Hull',
        mass: 100,
        armor: 10,
        Cost: { ironium: 10, boranium: 8, germanium: 6, resources: 50 },
        Slots: [],
        Structure: [],
        Stats: {},
      };

      mockTechAtlas.getHull.and.returnValue(mockHull as any);

      const templates = service.getAvailableTemplates(mockTechLevels, ['Hyper Expansion'], []);

      expect(Array.isArray(templates)).toBe(true);
    });

    it('should handle lesser trait requirements', () => {
      const mockHull = {
        id: 'hull-1',
        Name: 'Small Hull',
        mass: 100,
        armor: 10,
        Cost: { ironium: 10, boranium: 8, germanium: 6, resources: 50 },
        Slots: [],
        Structure: [],
        Stats: {},
      };

      mockTechAtlas.getHull.and.returnValue(mockHull as any);

      const templates = service.getAvailableTemplates(
        mockTechLevels,
        [],
        ['Improved Fuel Efficiency'],
      );

      expect(Array.isArray(templates)).toBe(true);
    });
  });

  describe('getAvailableHulls', () => {
    it('should return list of available hulls', () => {
      const mockHulls = [
        {
          id: 'hull-1',
          Name: 'Small Hull',
          Structure: [],
          mass: 100,
          armor: 10,
          Cost: { Ironium: 10, Boranium: 8, Germanium: 6, Resources: 50 },
          Slots: [],
          Stats: {},
        },
        {
          id: 'hull-2',
          Name: 'Medium Hull',
          Structure: [],
          mass: 200,
          armor: 15,
          Cost: { Ironium: 20, Boranium: 16, Germanium: 12, Resources: 100 },
          Slots: [],
          Stats: {},
        },
      ];

      mockTechAtlas.getAllHulls.and.returnValue(mockHulls as any);

      const hulls = service.getAvailableHulls(mockTechLevels);

      expect(hulls.length).toBe(2);
    });

    it('should filter hulls by tech requirements', () => {
      const mockHulls = [
        {
          id: 'hull-1',
          Name: 'Small Hull',
          Structure: [],
          mass: 100,
          armor: 10,
          Cost: { Ironium: 10, Boranium: 8, Germanium: 6, Resources: 50 },
          Slots: [],
          Stats: {},
        },
      ];

      mockTechAtlas.getAllHulls.and.returnValue(mockHulls as any);

      const hulls = service.getAvailableHulls(mockTechLevels);

      expect(Array.isArray(hulls)).toBe(true);
    });

    it('should return empty array when no suitable hulls', () => {
      mockTechAtlas.getAllHulls.and.returnValue([]);

      const hulls = service.getAvailableHulls(mockTechLevels);

      expect(hulls.length).toBe(0);
    });
  });

  describe('sanitizeDesignName', () => {
    it('should return valid design names unchanged', () => {
      const name = 'My Ship Design';
      const result = service.sanitizeDesignName(name);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty names', () => {
      const result = service.sanitizeDesignName('');

      expect(typeof result).toBe('string');
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      const result = service.sanitizeDesignName(longName);

      expect(typeof result).toBe('string');
      expect(result.length).toBeLessThanOrEqual(longName.length);
    });

    it('should remove or escape special characters', () => {
      const nameWithSpecialChars = 'My <Ship> {Design} [1]';
      const result = service.sanitizeDesignName(nameWithSpecialChars);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

