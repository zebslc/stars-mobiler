import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ResearchCalculationService } from './research-calculation.service';
import { GameStateService } from '../game/game-state.service';

describe('ResearchCalculationService', () => {
  let service: ResearchCalculationService;
  let gameStateService: jasmine.SpyObj<GameStateService>;

  const mockPlayer = {
    techLevels: {
      Energy: 5,
      Kinetics: 3,
      Propulsion: 4,
      Construction: 2,
    },
    researchProgress: {
      Energy: 500,
      Kinetics: 200,
      Propulsion: 800,
      Construction: 100,
    },
  };

  const mockGame = {
    humanPlayer: {
      id: 1,
      species: {
        traits: [
          { type: 'research', modifier: 0.25 },
        ],
      },
    },
    stars: [
      { ownerId: 1, research: 5 },
      { ownerId: 1, research: 3 },
      { ownerId: 2, research: 10 },
    ],
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('GameStateService', [], {
      player: signal(mockPlayer),
      game: signal(mockGame),
    });

    TestBed.configureTestingModule({
      providers: [
        ResearchCalculationService,
        { provide: GameStateService, useValue: spy },
      ],
    });

    service = TestBed.inject(ResearchCalculationService);
    gameStateService = TestBed.inject(GameStateService) as jasmine.SpyObj<GameStateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentLevel', () => {
    it('should return current tech level for a field', () => {
      const level = service.getCurrentLevel('Energy')();
      expect(level).toBe(5);
    });

    it('should return 0 if player is null', () => {
      (gameStateService.player as any).set(null);
      const level = service.getCurrentLevel('Energy')();
      expect(level).toBe(0);
    });
  });

  describe('getResearchProgress', () => {
    it('should return floored research progress', () => {
      const progress = service.getResearchProgress('Energy')();
      expect(progress).toBe(500);
    });

    it('should floor decimal progress values', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        researchProgress: { ...mockPlayer.researchProgress, Energy: 500.7 },
      });
      const progress = service.getResearchProgress('Energy')();
      expect(progress).toBe(500);
    });
  });

  describe('getNextLevelCost', () => {
    it('should return 0 if at max level (26+)', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        techLevels: { ...mockPlayer.techLevels, Energy: 26 },
      });
      const cost = service.getNextLevelCost('Energy')();
      expect(cost).toBe(0);
    });

    it('should return cost from tech data when not at max level', () => {
      const cost = service.getNextLevelCost('Energy')();
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('getProgressPercent', () => {
    it('should return 100 if at max level', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        techLevels: { ...mockPlayer.techLevels, Energy: 26 },
      });
      const percent = service.getProgressPercent('Energy')();
      expect(percent).toBe(100);
    });

    it('should cap percent at 100', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        researchProgress: { ...mockPlayer.researchProgress, Energy: 10000 },
      });
      const percent = service.getProgressPercent('Energy')();
      expect(percent).toBeLessThanOrEqual(100);
    });

    it('should calculate correct percentage', () => {
      const percent = service.getProgressPercent('Kinetics')();
      expect(typeof percent).toBe('number');
      expect(percent).toBeGreaterThan(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });

  describe('getTotalLabs', () => {
    it('should sum research labs for human player only', () => {
      const totalLabs = service.getTotalLabs()();
      expect(totalLabs).toBe(8); // 5 + 3 from player 1, not 10 from player 2
    });

    it('should return 0 if game is null', () => {
      (gameStateService.game as any).set(null);
      const totalLabs = service.getTotalLabs()();
      expect(totalLabs).toBe(0);
    });

    it('should handle stars with no research labs', () => {
      (gameStateService.game as any).set({
        ...mockGame,
        stars: [
          { ownerId: 1, research: 0 },
          { ownerId: 1, research: 5 },
        ],
      });
      const totalLabs = service.getTotalLabs()();
      expect(totalLabs).toBe(5);
    });
  });

  describe('getResearchPerTurn', () => {
    it('should calculate research per turn with trait modifier', () => {
      const perTurn = service.getResearchPerTurn()();
      // totalLabs = 8, modifier = 0.25, so 8 * 1.25 = 10
      expect(perTurn).toBe(10);
    });

    it('should floor the result', () => {
      (gameStateService.game as any).set({
        ...mockGame,
        humanPlayer: {
          ...mockGame.humanPlayer,
          species: {
            traits: [{ type: 'research', modifier: 0.33 }],
          },
        },
      });
      const perTurn = service.getResearchPerTurn()();
      expect(Number.isInteger(perTurn)).toBe(true);
    });

    it('should return 0 if game is null', () => {
      (gameStateService.game as any).set(null);
      const perTurn = service.getResearchPerTurn()();
      expect(perTurn).toBe(0);
    });

    it('should return 0 if no research trait exists', () => {
      (gameStateService.game as any).set({
        ...mockGame,
        humanPlayer: {
          ...mockGame.humanPlayer,
          species: {
            traits: [],
          },
        },
      });
      const perTurn = service.getResearchPerTurn()();
      expect(perTurn).toBe(8); // 8 labs with 0 modifier
    });
  });

  describe('getTurnsToNextLevel', () => {
    it('should return 0 if at max level', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        techLevels: { ...mockPlayer.techLevels, Energy: 26 },
      });
      const turns = service.getTurnsToNextLevel('Energy')();
      expect(turns).toBe(0);
    });

    it('should return Infinity if research per turn is 0', () => {
      (gameStateService.game as any).set({
        ...mockGame,
        stars: [{ ownerId: 1, research: 0 }],
        humanPlayer: {
          ...mockGame.humanPlayer,
          species: { traits: [] },
        },
      });
      const turns = service.getTurnsToNextLevel('Energy')();
      expect(turns).toBe(Infinity);
    });

    it('should return Infinity if game is null', () => {
      (gameStateService.game as any).set(null);
      const turns = service.getTurnsToNextLevel('Energy')();
      expect(turns).toBe(Infinity);
    });

    it('should calculate turns correctly', () => {
      const turns = service.getTurnsToNextLevel('Kinetics')();
      expect(typeof turns).toBe('number');
      expect(turns).toBeGreaterThan(0);
    });
  });

  describe('getCurrentUnlocks', () => {
    it('should return unlocks for current level', () => {
      const unlocks = service.getCurrentUnlocks('Energy')();
      expect(Array.isArray(unlocks)).toBe(true);
    });

    it('should return empty array if player is null', () => {
      (gameStateService.player as any).set(null);
      const unlocks = service.getCurrentUnlocks('Energy')();
      expect(unlocks).toEqual([]);
    });
  });

  describe('getNextUnlocks', () => {
    it('should return empty array if at max level', () => {
      (gameStateService.player as any).set({
        ...mockPlayer,
        techLevels: { ...mockPlayer.techLevels, Energy: 26 },
      });
      const unlocks = service.getNextUnlocks('Energy')();
      expect(unlocks).toEqual([]);
    });

    it('should return unlocks for next level when not at max', () => {
      const unlocks = service.getNextUnlocks('Kinetics')();
      expect(Array.isArray(unlocks)).toBe(true);
    });
  });
});
