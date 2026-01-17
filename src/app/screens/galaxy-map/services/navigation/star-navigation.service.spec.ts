import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StarNavigationService } from './star-navigation.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyMapStateService } from '../state/galaxy-map-state.service';
import { GalaxyCoordinateService } from './galaxy-coordinate.service';
import { MapViewportService } from './map-viewport.service';

describe('StarNavigationService', () => {
  let service: StarNavigationService;
  let routerSpy: jasmine.SpyObj<Router>;
  let gameStateServiceSpy: jasmine.SpyObj<GameStateService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let coordinateServiceSpy: jasmine.SpyObj<GalaxyCoordinateService>;
  let viewportServiceSpy: jasmine.SpyObj<MapViewportService>;

  beforeEach(() => {
    const routerMock = jasmine.createSpyObj('Router', ['navigateByUrl']);
    const gameStateMock = jasmine.createSpyObj('GameStateService', ['player', 'stars']);
    const loggingMock = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn']);
    const coordinateMock = jasmine.createSpyObj('GalaxyCoordinateService', [
      'calculateFitZoom',
      'calculateBoundsCenter',
    ]);
    const viewportMock = jasmine.createSpyObj('MapViewportService', ['centerOnPoint', 'getDefaultViewportDimensions']);
    viewportMock.getDefaultViewportDimensions.and.returnValue({ width: 1000, height: 800 });

    TestBed.configureTestingModule({
      providers: [
        StarNavigationService,
        GalaxyMapStateService,
        { provide: Router, useValue: routerMock },
        { provide: GameStateService, useValue: gameStateMock },
        { provide: LoggingService, useValue: loggingMock },
        { provide: GalaxyCoordinateService, useValue: coordinateMock },
        { provide: MapViewportService, useValue: viewportMock },
      ],
    });

    service = TestBed.inject(StarNavigationService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    gameStateServiceSpy = TestBed.inject(GameStateService) as jasmine.SpyObj<GameStateService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    coordinateServiceSpy = TestBed.inject(GalaxyCoordinateService) as jasmine.SpyObj<GalaxyCoordinateService>;
    viewportServiceSpy = TestBed.inject(MapViewportService) as jasmine.SpyObj<MapViewportService>;
  });

  describe('openStar', () => {
    it('should navigate to star detail by ID', () => {
      service.openStar('star-123');

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/star/star-123');
    });

    it('should log the open operation', () => {
      service.openStar('star-456');

      expect(loggingServiceSpy.debug).toHaveBeenCalledWith(
        'Opening star detail',
        jasmine.objectContaining({
          service: 'StarNavigationService',
          operation: 'openStar',
          entityId: 'star-456',
        })
      );
    });
  });

  describe('centerOnHomeStar', () => {
    it('should warn when no player found', () => {
      gameStateServiceSpy.player.and.returnValue(undefined);
      gameStateServiceSpy.stars.and.returnValue([]);

      service.centerOnHomeStar();

      expect(loggingServiceSpy.warn).toHaveBeenCalledWith(
        'No player found for home star centering',
        jasmine.anything()
      );
    });

    it('should warn when no home star available', () => {
      gameStateServiceSpy.player.and.returnValue({
        id: 'player-1',
        ownedStarIds: [],
      } as any);
      gameStateServiceSpy.stars.and.returnValue([]);

      service.centerOnHomeStar();

      expect(loggingServiceSpy.warn).toHaveBeenCalledWith(
        'No home star available to center on',
        jasmine.anything()
      );
    });
  });

  describe('fitGalaxyToView', () => {
    it('should warn when no stars found', () => {
      gameStateServiceSpy.stars.and.returnValue([]);

      service.fitGalaxyToView();

      expect(loggingServiceSpy.warn).toHaveBeenCalledWith(
        'No stars found for galaxy fit',
        jasmine.anything()
      );
    });

    it('should log fitting operation', () => {
      const mockStar = {
        id: 'star-1',
        position: { x: 0, y: 0 },
      };
      gameStateServiceSpy.stars.and.returnValue([mockStar] as any);
      coordinateServiceSpy.calculateFitZoom.and.returnValue(1);
      coordinateServiceSpy.calculateBoundsCenter.and.returnValue({ x: 0, y: 0 });

      service.fitGalaxyToView();

      expect(loggingServiceSpy.info).toHaveBeenCalledWith(
        'Galaxy fitted to viewport',
        jasmine.anything()
      );
    });
  });
});
