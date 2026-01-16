import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { BrowserContextProvider } from './browser-context.provider';
import { GameContextProvider } from './game-context.provider';
import { AngularContextProvider } from './angular-context.provider';
import { GameStateService } from '../game/game-state.service';
import type { LogContext} from '../../models/logging.model';
import { BrowserContext, GameContext, AngularContext } from '../../models/logging.model';
import type { GameState } from '../../models/game.model';
import { of } from 'rxjs';

describe('Context Providers', () => {
  let browserProvider: BrowserContextProvider;
  let gameProvider: GameContextProvider;
  let angularProvider: AngularContextProvider;
  let mockGameStateService: jasmine.SpyObj<GameStateService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(() => {
    // Create mocks
    mockGameStateService = jasmine.createSpyObj('GameStateService', ['game', 'turn', 'player']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/test-route',
      events: of({})
    });
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        url: [],
        params: {},
        queryParams: {},
        fragment: null,
        data: {},
        outlet: 'primary',
        component: null
      },
      params: of({}),
      queryParams: of({}),
      fragment: of(null),
      data: of({})
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        BrowserContextProvider,
        GameContextProvider,
        AngularContextProvider,
        { provide: GameStateService, useValue: mockGameStateService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    browserProvider = TestBed.inject(BrowserContextProvider);
    gameProvider = TestBed.inject(GameContextProvider);
    angularProvider = TestBed.inject(AngularContextProvider);
  });

  describe('Comprehensive Context Capture', () => {
    /**
     * Feature: logging-service, Property 13: Comprehensive Context Capture
     * Validates: Requirements 6.1, 6.2, 6.3, 6.4
     *
     * For any log entry, the service should include browser information,
     * and when applicable, game state context, Angular context, and any custom metadata
     */
    it('should capture browser context information', () => {
      // Test browser context capture
      const browserContext = browserProvider.getContext();
      
      expect(browserContext).toBeDefined();
      expect(browserContext.userAgent).toBeDefined();
      expect(typeof browserContext.userAgent).toBe('string');
      expect(browserContext.viewport).toBeDefined();
      expect(typeof browserContext.viewport.width).toBe('number');
      expect(typeof browserContext.viewport.height).toBe('number');
      expect(browserContext.url).toBeDefined();
      expect(typeof browserContext.url).toBe('string');
      expect(browserContext.timestamp).toBeGreaterThan(0);
    });

    it('should capture game context when game is loaded', () => {
      // Mock game state with valid data
      const mockGame: Partial<GameState> = {
        id: 'test-game-123',
        turn: 42,
        seed: 12345,
        settings: {
          galaxySize: 'medium',
          aiCount: 3,
          aiDifficulty: 'medium',
          seed: 12345,
          speciesId: 'human',
        },
        humanPlayer: {
          id: 'player-456',
          name: 'Test Player',
          species: { id: 'human', name: 'Human' } as any,
          techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
          researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
          selectedResearchField: 'Energy' as const,
          ownedStarIds: [],
        },
        aiPlayers: [],
        fleets: [],
        playerEconomy: {} as any,
        shipDesigns: [],
      };
      mockGameStateService.game.and.returnValue(mockGame as GameState);
      mockGameStateService.turn.and.returnValue(42);
      mockGameStateService.player.and.returnValue(mockGame.humanPlayer);

      const gameContext = gameProvider.getContext();
      
      expect(gameContext).toBeDefined();
      expect(gameContext!.gameId).toBe('test-game-123');
      expect(gameContext!.turn).toBe(42);
      expect(gameContext!.playerId).toBe('player-456');
      expect(gameContext!.gameState).toBeDefined();
    });

    it('should return undefined game context when no game is loaded', () => {
      // Mock no game loaded
      mockGameStateService.game.and.returnValue(null);
      mockGameStateService.turn.and.returnValue(0);
      mockGameStateService.player.and.returnValue(undefined);

      const gameContext = gameProvider.getContext();
      
      expect(gameContext).toBeUndefined();
    });

    it('should capture Angular context information', () => {
      // Test Angular context capture
      const angularContext = angularProvider.getContext();
      
      expect(angularContext).toBeDefined();
      expect(angularContext.route).toBeDefined();
      expect(angularContext.component).toBeDefined();
      expect(typeof angularContext.changeDetectionCycle).toBe('number');
      expect(angularContext.changeDetectionCycle).toBeGreaterThanOrEqual(0);
    });

    it('should assemble comprehensive context correctly', () => {
      // Setup game state
      const mockGame: Partial<GameState> = {
        id: 'test-game-789',
        turn: 15,
        seed: 54321,
        settings: {
          galaxySize: 'large',
          aiCount: 2,
          aiDifficulty: 'hard',
          seed: 54321,
          speciesId: 'human',
        },
        humanPlayer: {
          id: 'player-123',
          name: 'Test Player 2',
          species: { id: 'human', name: 'Human' } as any,
          techLevels: { Energy: 1, Kinetics: 1, Propulsion: 1, Construction: 1 },
          researchProgress: { Energy: 50, Kinetics: 25, Propulsion: 75, Construction: 0 },
          selectedResearchField: 'Energy' as const,
          ownedStarIds: [],
        },
        aiPlayers: [],
        fleets: [],
        playerEconomy: {} as any,
        shipDesigns: [],
      };
      mockGameStateService.game.and.returnValue(mockGame as GameState);
      mockGameStateService.turn.and.returnValue(15);
      mockGameStateService.player.and.returnValue(mockGame.humanPlayer);

      // Get all contexts
      const browserContext = browserProvider.getContext();
      const gameContext = gameProvider.getContext();
      const angularContext = angularProvider.getContext();
      const customData = { testKey: 'testValue', timestamp: Date.now() };

      // Assemble comprehensive context
      const comprehensiveContext: LogContext = {
        browser: browserContext,
        game: gameContext,
        angular: angularContext,
        custom: customData,
      };

      // Verify all required context is present
      expect(comprehensiveContext.browser).toBeDefined();
      expect(comprehensiveContext.browser.userAgent).toBeTruthy();
      expect(comprehensiveContext.browser.viewport).toBeDefined();
      expect(comprehensiveContext.browser.url).toBeTruthy();
      expect(comprehensiveContext.browser.timestamp).toBeGreaterThan(0);

      // Verify game context
      expect(comprehensiveContext.game).toBeDefined();
      expect(comprehensiveContext.game!.gameId).toBe('test-game-789');
      expect(comprehensiveContext.game!.turn).toBe(15);

      // Verify Angular context
      expect(comprehensiveContext.angular).toBeDefined();
      expect(comprehensiveContext.angular?.component).toBeDefined();

      // Verify custom metadata
      expect(comprehensiveContext.custom).toBeDefined();
      expect(comprehensiveContext.custom?.testKey).toBe('testValue');
    });

    it('should handle edge cases gracefully', () => {
      // Test with empty user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: '',
        configurable: true,
      });

      // Test with zero viewport
      Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 0, configurable: true });

      // We can't modify window.location.href as it's not configurable,
      // but our providers should handle edge cases gracefully anyway

      // Test with null game state
      mockGameStateService.game.and.returnValue(null);
      mockGameStateService.turn.and.returnValue(0);
      mockGameStateService.player.and.returnValue(undefined);

      // All providers should handle edge cases gracefully without throwing
      expect(() => {
        const browserContext = browserProvider.getContext();
        expect(browserContext).toBeDefined();
        expect(typeof browserContext.userAgent).toBe('string');
        expect(typeof browserContext.viewport.width).toBe('number');
        expect(typeof browserContext.viewport.height).toBe('number');
        expect(typeof browserContext.url).toBe('string');
        expect(typeof browserContext.timestamp).toBe('number');
      }).not.toThrow();

      expect(() => {
        const gameContext = gameProvider.getContext();
        // Game context can be undefined when no game is loaded
        if (gameContext) {
          expect(typeof gameContext.gameId).toBe('string');
          expect(typeof gameContext.turn).toBe('number');
        }
      }).not.toThrow();

      expect(() => {
        const angularContext = angularProvider.getContext();
        expect(angularContext).toBeDefined();
        expect(typeof angularContext.changeDetectionCycle).toBe('number');
      }).not.toThrow();
    });
  });
});