import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TechStatusService } from './tech-status.service';
import { GameStateService } from '../game/game-state.service';
import { TechService } from './tech.service';

describe('TechStatusService', () => {
  let service: TechStatusService;
  let gameStateService: jasmine.SpyObj<GameStateService>;
  let techService: jasmine.SpyObj<TechService>;

  const mockPlayer = {
    techLevels: {
      Energy: 5,
      Kinetics: 3,
      Propulsion: 7,
      Construction: 2,
    },
  };

  const mockHull = {
    id: 'hull-1',
    name: 'Small Hull',
    techReq: {
      Construction: 1,
      Kinetics: 2,
    },
  };

  const mockComponent = {
    id: 'comp-1',
    name: 'Plasma Gun',
    tech: {
      Energy: 5,
      Kinetics: 3,
    },
  };

  beforeEach(() => {
    const gameStateSpy = jasmine.createSpyObj('GameStateService', [], {
      player: signal(mockPlayer),
    });

    const techSpy = jasmine.createSpyObj('TechService', [
      'getHullByName',
      'getComponentByName',
    ]);

    TestBed.configureTestingModule({
      providers: [
        TechStatusService,
        { provide: GameStateService, useValue: gameStateSpy },
        { provide: TechService, useValue: techSpy },
      ],
    });

    service = TestBed.inject(TechStatusService);
    gameStateService = TestBed.inject(GameStateService) as jasmine.SpyObj<GameStateService>;
    techService = TestBed.inject(TechService) as jasmine.SpyObj<TechService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getExternalDependenciesWithStatus', () => {
    it('should return empty array if item not found', () => {
      techService.getHullByName.and.returnValue(null);
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Unknown', 'Energy');
      expect(deps).toEqual([]);
    });

    it('should return empty array if player is null', () => {
      (gameStateService.player as any).set(null);
      techService.getHullByName.and.returnValue(mockHull);

      const deps = service.getExternalDependenciesWithStatus('Small Hull', 'Energy');
      expect(deps).toEqual([]);
    });

    it('should find hull and return external dependencies', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Small Hull', 'Energy');
      expect(deps.length).toBeGreaterThan(0);
      expect(deps[0]).toEqual({
        label: 'Cons 1',
        status: 'met',
      });
    });

    it('should mark dependency as met when current level meets requirement', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Small Hull', 'Energy');
      const consDep = deps.find((d) => d.label.includes('Cons'));
      expect(consDep?.status).toBe('met'); // Construction at 2, needs 1
    });

    it('should mark dependency as close when 1-2 levels away', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);
      // Kinetics needs 2, player has 3, so met
      // But if we change to need 5, player has 3, diff = 2, so close
      const customHull = {
        ...mockHull,
        techReq: { Kinetics: 5 },
      };
      techService.getHullByName.and.returnValue(customHull);

      const deps = service.getExternalDependenciesWithStatus('Small Hull', 'Energy');
      const kinDep = deps.find((d) => d.label.includes('Kin'));
      expect(kinDep?.status).toBe('close'); // Kinetics diff = 2
    });

    it('should mark dependency as far when more than 2 levels away', () => {
      const customHull = {
        id: 'hull-1',
        name: 'Big Hull',
        techReq: {
          Construction: 10, // Player has 2, diff = 8
        },
      };
      techService.getHullByName.and.returnValue(customHull);
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Big Hull', 'Energy');
      const consDep = deps.find((d) => d.label.includes('Cons'));
      expect(consDep?.status).toBe('far');
    });

    it('should find component and return external dependencies', () => {
      techService.getHullByName.and.returnValue(null);
      techService.getComponentByName.and.returnValue(mockComponent);

      const deps = service.getExternalDependenciesWithStatus('Plasma Gun', 'Kinetics');
      expect(deps.length).toBeGreaterThan(0);
    });

    it('should filter out requirements for the selected field', () => {
      techService.getHullByName.and.returnValue({
        id: 'hull-1',
        name: 'Hull',
        techReq: {
          Energy: 3,
          Kinetics: 2,
        },
      });
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Hull', 'Energy');
      const energyDep = deps.find((d) => d.label.includes('Ener'));
      expect(energyDep).toBeUndefined(); // Energy should be filtered out
    });

    it('should return empty array if no tech requirements', () => {
      techService.getHullByName.and.returnValue({
        id: 'hull-1',
        name: 'Hull',
      });
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Hull', 'Energy');
      expect(deps).toEqual([]);
    });

    it('should ignore zero-level requirements', () => {
      techService.getHullByName.and.returnValue({
        id: 'hull-1',
        name: 'Hull',
        techReq: {
          Construction: 0,
          Kinetics: 2,
        },
      });
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Hull', 'Energy');
      const consDep = deps.find((d) => d.label.includes('Cons'));
      expect(consDep).toBeUndefined(); // Construction 0 should be filtered
    });

    it('should format labels correctly', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);

      const deps = service.getExternalDependenciesWithStatus('Small Hull', 'Energy');
      deps.forEach((dep) => {
        expect(dep.label).toMatch(/^[A-Z]{4} \d+$/); // Format: "XXXX #"
      });
    });
  });

  describe('getComputedExternalDependencies', () => {
    it('should return a computed signal', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);

      const computed = service.getComputedExternalDependencies('Small Hull', 'Energy');
      expect(computed).toBeTruthy();
      // Call it to verify it returns an array
      const result = computed();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should update when dependencies change', () => {
      techService.getHullByName.and.returnValue(mockHull);
      techService.getComponentByName.and.returnValue(null);

      const computed = service.getComputedExternalDependencies('Small Hull', 'Energy');
      const initial = computed();

      // Change player tech levels
      (gameStateService.player as any).set({
        ...mockPlayer,
        techLevels: {
          ...mockPlayer.techLevels,
          Construction: 5, // Now meets requirement with room to spare
        },
      });

      const updated = computed();
      // First dep should still be met but dependency chain may update
      expect(updated[0]?.status).toBeDefined();
    });
  });
});
