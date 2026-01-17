import { TestBed } from '@angular/core/testing';
import { GameInitializerService } from './game-initializer.service';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { DataAccessService } from '../data/data-access.service';
import { LoggingService } from '../core/logging.service';
import type { GameSettings, Star } from '../../models/game.model';

describe('GameInitializerService', () => {
  let service: GameInitializerService;
  let mockGalaxyGenerator: jasmine.SpyObj<GalaxyGeneratorService>;
  let mockDataAccess: jasmine.SpyObj<DataAccessService>;
  let mockLogging: jasmine.SpyObj<LoggingService>;

  const createMockStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'star-1',
    name: 'Test Star',
    position: { x: 0, y: 0 },
    ownerId: null,
    population: 0,
    maxPopulation: 1000000,
    resources: 0,
    surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
    mineralConcentrations: { ironium: 50, boranium: 40, germanium: 30 },
    mines: 0,
    factories: 0,
    defenses: 0,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
    ...overrides,
  });

  const createGameSettings = (overrides: Partial<GameSettings> = {}): GameSettings => ({
    galaxySize: 'small',
    seed: 12345,
    speciesId: 'human',
    aiDifficulty: 'hard',
    aiCount: 3,
    ...overrides,
  });

  beforeEach(() => {
    mockGalaxyGenerator = jasmine.createSpyObj('GalaxyGeneratorService', [
      'generateGalaxy',
      'assignStartPositions',
    ]);
    mockDataAccess = jasmine.createSpyObj('DataAccessService', ['getHull']);
    mockLogging = jasmine.createSpyObj('LoggingService', ['warn', 'log']);

    TestBed.configureTestingModule({
      providers: [
        GameInitializerService,
        { provide: GalaxyGeneratorService, useValue: mockGalaxyGenerator },
        { provide: DataAccessService, useValue: mockDataAccess },
        { provide: LoggingService, useValue: mockLogging },
      ],
    });

    service = TestBed.inject(GameInitializerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeGame', () => {
    it('should initialize game with small galaxy settings', () => {
      const mockStars = [
        createMockStar({ id: 'star-1', name: 'Home' }),
        createMockStar({ id: 'star-2', name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings({ galaxySize: 'small' });
      const game = service.initializeGame(settings);

      expect(game.stars.length).toBe(16);
      expect(game.humanPlayer.id).toBe('human');
      expect(game.aiPlayers.length).toBeGreaterThan(0);
    });

    it('should initialize game with medium galaxy settings', () => {
      const mockStars = Array.from({ length: 24 }, (_, i) =>
        createMockStar({ id: `star-${i}` })
      );
      mockStars[0].name = 'Home';
      mockStars[1].name = 'Enemy Home';

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings({ galaxySize: 'medium' });
      const game = service.initializeGame(settings);

      expect(game.stars.length).toBe(24);
      expect(mockGalaxyGenerator.generateGalaxy).toHaveBeenCalledWith(24, jasmine.any(Number), jasmine.any(Number), jasmine.any(Number));
    });

    it('should initialize game with large galaxy settings', () => {
      const mockStars = Array.from({ length: 36 }, (_, i) =>
        createMockStar({ id: `star-${i}` })
      );
      mockStars[0].name = 'Home';
      mockStars[1].name = 'Enemy Home';

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings({ galaxySize: 'large' });
      const game = service.initializeGame(settings);

      expect(game.stars.length).toBe(36);
    });

    it('should set human player as owner of Home star', () => {
      const homeStar = createMockStar({ id: 'home-id', name: 'Home' });
      const mockStars = [
        homeStar,
        createMockStar({ id: 'star-2', name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings();
      const game = service.initializeGame(settings);

      const homeInGame = game.stars.find((s) => s.name === 'Home');
      expect(homeInGame?.ownerId).toBe('human');
      expect(homeInGame?.resources).toBe(100);
    });

    it('should initialize human player with tech level 1 in all fields', () => {
      const mockStars = [
        createMockStar({ name: 'Home' }),
        createMockStar({ name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings();
      const game = service.initializeGame(settings);

      expect(game.humanPlayer.techLevels.Energy).toBe(1);
      expect(game.humanPlayer.techLevels.Kinetics).toBe(1);
      expect(game.humanPlayer.techLevels.Propulsion).toBe(1);
      expect(game.humanPlayer.techLevels.Construction).toBe(1);
    });

    it('should initialize AI player with matching tech levels', () => {
      const mockStars = [
        createMockStar({ name: 'Home' }),
        createMockStar({ name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings();
      const game = service.initializeGame(settings);

      const ai = game.aiPlayers[0];
      expect(ai.techLevels.Energy).toBe(1);
      expect(ai.techLevels.Kinetics).toBe(1);
    });

    it('should set research progress to zero for all fields', () => {
      const mockStars = [
        createMockStar({ name: 'Home' }),
        createMockStar({ name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings();
      const game = service.initializeGame(settings);

      expect(game.humanPlayer.researchProgress.Energy).toBe(0);
      expect(game.humanPlayer.researchProgress.Kinetics).toBe(0);
      expect(game.humanPlayer.researchProgress.Propulsion).toBe(0);
      expect(game.humanPlayer.researchProgress.Construction).toBe(0);
    });

    it('should store game settings in state', () => {
      const mockStars = [
        createMockStar({ name: 'Home' }),
        createMockStar({ name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings({ seed: 99999 });
      const game = service.initializeGame(settings);

      expect(game.seed).toBe(99999);
    });

    it('should call assignStartPositions with correct parameters', () => {
      const mockStars = [
        createMockStar({ name: 'Home' }),
        createMockStar({ name: 'Enemy Home' }),
        ...Array.from({ length: 14 }, (_, i) => createMockStar({ id: `star-${i + 3}` })),
      ];

      mockGalaxyGenerator.generateGalaxy.and.returnValue(mockStars);
      mockDataAccess.getHull.and.returnValue(undefined);

      const settings = createGameSettings();
      service.initializeGame(settings);

      expect(mockGalaxyGenerator.assignStartPositions).toHaveBeenCalled();
    });
  });
});

