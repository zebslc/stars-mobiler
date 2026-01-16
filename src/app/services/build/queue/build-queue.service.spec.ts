import { BuildQueueService } from './build-queue.service';
import type { PlanetUtilityService } from '../../colony/planet-utility.service';
import type { BuildItem, GameState, Player, Star } from '../../../models/game.model';

describe('BuildQueueService', () => {
  let service: BuildQueueService;
  let mockPlanetUtility: jasmine.SpyObj<PlanetUtilityService>;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'planet1',
    name: 'Test Planet',
    position: { x: 0, y: 0 },
    ownerId: 'p1',
    temperature: 50,
    atmosphere: 50,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    population: 10000,
    maxPopulation: 1000000,
    resources: 500,
    mines: 10,
    factories: 10,
    defenses: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
    buildQueue: [],
    ...overrides,
  });

  const createBuildItem = (overrides: Partial<BuildItem> = {}): BuildItem => ({
    project: 'mine',
    cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
    ...overrides,
  });

  const createGameState = (planet: Star): GameState => {
    const star: Star = {
      id: 'star1',
      name: 'Sol',
      position: { x: 0, y: 0 },
      temperature: 50,
      atmosphere: 50,
      mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
      surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
      ownerId: null,
      population: 0,
      maxPopulation: 1000000,
      mines: 0,
      factories: 0,
      defenses: 0,
      research: 0,
      scanner: 0,
      terraformOffset: { temperature: 0, atmosphere: 0 },
      resources: 0,
      buildQueue: [],
    };

    return {
      id: 'game1',
      seed: 123,
      turn: 1,
      settings: {} as any,
      stars: [star],
      humanPlayer: mockPlayer,
      aiPlayers: [],
      fleets: [],
      shipDesigns: [],
      playerEconomy: { freighterCapacity: 0, research: 0 },
    };
  };

  beforeEach(() => {
    mockPlanetUtility = jasmine.createSpyObj('PlanetUtilityService', [
      'getOwnedStar',
      'updateGameState',
    ]);

    service = new BuildQueueService(mockPlanetUtility);
  });

  describe('addToBuildQueue', () => {
    it('should add item to empty build queue', () => {
      const star = createStar({ buildQueue: [] });
      const game = createGameState(star);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedStar.and.returnValue(star);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', item);

      expect(star.buildQueue).toEqual([item]);
      expect(mockPlanetUtility.getOwnedStar).toHaveBeenCalledWith(game, 'planet1');
      expect(mockPlanetUtility.updateGameState).toHaveBeenCalled();
    });

    it('should append item to existing build queue', () => {
      const existingItem = createBuildItem({ project: 'factory' });
      const star = createStar({ buildQueue: [existingItem] });
      const game = createGameState(star);
      const newItem = createBuildItem({ project: 'mine' });

      mockPlanetUtility.getOwnedStar.and.returnValue(star);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', newItem);

      expect(star.buildQueue!.length).toBe(2);
      expect(star.buildQueue![0].project).toBe('factory');
      expect(star.buildQueue![1].project).toBe('mine');
    });

    it('should handle undefined build queue', () => {
      const star = createStar();
      delete ((star as any)).buildQueue;
      const game = createGameState(star);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedStar.and.returnValue(star);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', item);

      expect(star.buildQueue).toEqual([item]);
    });

    it('should return unchanged game when planet not found', () => {
      const star = createStar();
      const game = createGameState(star);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedStar.and.returnValue(null);

      const result = service.addToBuildQueue(game, 'unknown', item);

      expect(result).toBe(game);
      expect(mockPlanetUtility.updateGameState).not.toHaveBeenCalled();
    });
  });

  describe('removeFromQueue', () => {
    it('should remove item at specified index', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const item3 = createBuildItem({ project: 'defense' });
      const star = createStar({ buildQueue: [item1, item2, item3] });
      const game = createGameState(star);

      mockPlanetUtility.getOwnedStar.and.returnValue(star);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.removeFromQueue(game, 'planet1', 1);

      expect(star.buildQueue!.length).toBe(2);
      expect(star.buildQueue![0].project).toBe('mine');
      expect(star.buildQueue![1].project).toBe('defense');
    });

    it('should remove first item when index is 0', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const star = createStar({ buildQueue: [item1, item2] });
      const game = createGameState(star);

      mockPlanetUtility.getOwnedStar.and.returnValue(star);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.removeFromQueue(game, 'planet1', 0);

      expect(star.buildQueue!.length).toBe(1);
      expect(star.buildQueue![0].project).toBe('factory');
    });

    it('should return unchanged game when planet not found', () => {
      const star = createStar();
      const game = createGameState(star);

      mockPlanetUtility.getOwnedStar.and.returnValue(null);

      const result = service.removeFromQueue(game, 'unknown', 0);

      expect(result).toBe(game);
    });

    it('should return unchanged game when build queue is undefined', () => {
      const star = createStar();
      delete ((star as any)).buildQueue;
      const game = createGameState(star);

      mockPlanetUtility.getOwnedStar.and.returnValue(star);

      const result = service.removeFromQueue(game, 'planet1', 0);

      expect(result).toBe(game);
    });
  });

  describe('handleQueueProgression', () => {
    it('should decrement count and reset paid for multi-count items', () => {
      const item = createBuildItem({
        count: 3,
        paid: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
      });
      const queue = [item];

      service.handleQueueProgression(item, queue);

      expect(item.count).toBe(2);
      expect(item.paid).toBeUndefined();
      expect(queue.length).toBe(1);
    });

    it('should remove item from queue when count is 1', () => {
      const item = createBuildItem({ count: 1 });
      const queue = [item];

      service.handleQueueProgression(item, queue);

      expect(queue.length).toBe(0);
    });

    it('should remove item from queue when count is undefined', () => {
      const item = createBuildItem();
      delete (item as any).count;
      const queue = [item];

      service.handleQueueProgression(item, queue);

      expect(queue.length).toBe(0);
    });

    it('should shift first item and keep remaining items', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const queue = [item1, item2];

      service.handleQueueProgression(item1, queue);

      expect(queue.length).toBe(1);
      expect(queue[0].project).toBe('factory');
    });
  });
});
