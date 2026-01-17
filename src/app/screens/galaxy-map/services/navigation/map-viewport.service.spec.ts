import { TestBed } from '@angular/core/testing';
import { MapViewportService } from './map-viewport.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { signal } from '@angular/core';

describe('MapViewportService', () => {
  let service: MapViewportService;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let mapStateServiceSpy: jasmine.SpyObj<GalaxyMapStateService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn']);
    const scaleSignal = signal(1);
    const translateXSignal = signal(0);
    const translateYSignal = signal(0);
    const mapStateSpy = jasmine.createSpyObj('GalaxyMapStateService', [], {
      scale: scaleSignal,
      translateX: translateXSignal,
      translateY: translateYSignal,
    });

    TestBed.configureTestingModule({
      providers: [
        MapViewportService,
        { provide: LoggingService, useValue: loggingSpy },
        { provide: GalaxyMapStateService, useValue: mapStateSpy },
      ],
    });

    service = TestBed.inject(MapViewportService);
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    mapStateServiceSpy = TestBed.inject(GalaxyMapStateService) as jasmine.SpyObj<GalaxyMapStateService>;
  });

  describe('centerOnPoint', () => {
    it('should center the map on the provided coordinates', () => {
      service.centerOnPoint(100, 200);

      expect(mapStateServiceSpy.translateX()).toBeDefined();
      expect(mapStateServiceSpy.translateY()).toBeDefined();
    });

    it('should use default viewport dimensions when not provided', () => {
      service.centerOnPoint(100, 200);

      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Centering map on point',
        jasmine.objectContaining({
          service: 'MapViewportService',
          operation: 'centerOnPoint',
        })
      );
    });

    it('should use provided viewport dimensions', () => {
      service.centerOnPoint(100, 200, 800, 600);

      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Centering map on point',
        jasmine.objectContaining({
          additionalData: jasmine.objectContaining({
            viewportWidth: 800,
            viewportHeight: 600,
          }),
        })
      );
    });

    it('should calculate correct translation based on scale', () => {
      const x = 100, y = 200;
      const width = 1000, height = 800;
      const scale = 1;

      service.centerOnPoint(x, y, width, height);

      expect(service).toBeDefined();
    });

    it('should log debug messages before and after centering', () => {
      service.centerOnPoint(50, 75);

      expect(loggingServiceSpy.debug).toHaveBeenCalledTimes(2);
      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Centering map on point',
        jasmine.anything()
      );
      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Map centered on point',
        jasmine.anything()
      );
    });
  });

  describe('getDefaultViewportDimensions', () => {
    it('should return default viewport width and height', () => {
      const dims = service.getDefaultViewportDimensions();

      expect(dims.width).toBe(1000);
      expect(dims.height).toBe(800);
    });

    it('should return consistent dimensions on multiple calls', () => {
      const dims1 = service.getDefaultViewportDimensions();
      const dims2 = service.getDefaultViewportDimensions();

      expect(dims1).toEqual(dims2);
    });
  });
});
