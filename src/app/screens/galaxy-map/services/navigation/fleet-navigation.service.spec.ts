import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FleetNavigationService } from './fleet-navigation.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { MapViewportService } from './map-viewport.service';

describe('FleetNavigationService', () => {
  let service: FleetNavigationService;
  let routerSpy: jasmine.SpyObj<Router>;
  let gameStateServiceSpy: jasmine.SpyObj<GameStateService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let viewportServiceSpy: jasmine.SpyObj<MapViewportService>;

  beforeEach(() => {
    const routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const gameStateMock = jasmine.createSpyObj('GameStateService', ['stars']);
    const loggingMock = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn']);
    const viewportMock = jasmine.createSpyObj('MapViewportService', ['centerOnPoint', 'getDefaultViewportDimensions']);
    viewportMock.getDefaultViewportDimensions.and.returnValue({ width: 1000, height: 800 });

    TestBed.configureTestingModule({
      providers: [
        FleetNavigationService,
        GalaxyMapStateService,
        { provide: Router, useValue: routerMock },
        { provide: GameStateService, useValue: gameStateMock },
        { provide: LoggingService, useValue: loggingMock },
        { provide: MapViewportService, useValue: viewportMock },
      ],
    });

    service = TestBed.inject(FleetNavigationService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    gameStateServiceSpy = TestBed.inject(GameStateService) as jasmine.SpyObj<GameStateService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    viewportServiceSpy = TestBed.inject(MapViewportService) as jasmine.SpyObj<MapViewportService>;
  });

  describe('openFleet', () => {
    it('should navigate to fleet detail by ID', () => {
      service.openFleet('fleet-123');

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/fleet/fleet-123');
    });

    it('should log the open operation', () => {
      service.openFleet('fleet-456');

      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Opening fleet detail',
        jasmine.objectContaining({
          service: 'FleetNavigationService',
          operation: 'openFleet',
          entityId: 'fleet-456',
          entityType: 'fleet',
        })
      );
    });
  });

  describe('centerOnFleet', () => {
    it('should warn when fleet location type is unknown', () => {
      const mockFleetWithUnknownLocation = {
        id: 'fleet-1',
        location: { type: 'unknown' },
      } as any;

      service.centerOnFleet(mockFleetWithUnknownLocation);

      expect(loggingServiceSpy.warn).toHaveBeenCalledWith(
        'Unknown fleet location type',
        jasmine.anything()
      );
    });

    it('should log the centering operation', () => {
      const mockFleetInSpace = {
        id: 'fleet-1',
        location: { type: 'space', x: 100, y: 200 },
      } as any;

      service.centerOnFleet(mockFleetInSpace);

      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Centering map on fleet',
        jasmine.anything()
      );
    });
  });
});
