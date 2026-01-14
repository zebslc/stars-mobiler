import { BuildQueueService } from './build-queue.service';
import { PlanetUtilityService } from '../colony/planet-utility.service';
import { BuildItem, GameState, Planet, Player, Star } from '../../models/game.model';

describe('BuildQueueService', () => {
  let service: BuildQueueService;
  let mockPlanetUtility: jasmine.SpyObj<PlanetUtilityService>;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    ownedPlanetIds: ['planet1'],
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy'
  };

  const createPlanet = (overrides: Partial<Planet> = {}): Planet => ({
    id: 'planet1',
    name: 'Test Planet',
    starId: 'star1',
    ownerId: 'p1',
    population: 10000,
    maxPopulation: 1000000,
    resources: 500,
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    mines: 10,
    factories: 10,
    defenses: 0,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
    buildQueue: [],
    ...overrides
  });

  const createBuildItem = (overrides: Partial<BuildItem> = {}): BuildItem => ({
    project: 'mine',
    cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
    ...overrides
  });

  const createGameState = (planet: Planet): GameState => {
    const star: Star = {
      id: 'star1',
      name: 'Sol',
      position: { x: 0, y: 0 },
      planets: [planet]
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
      playerEconomy: { freighterCapacity: 0, research: 0 }
    };
  };

  beforeEach(() => {
    mockPlanetUtility = jasmine.createSpyObj('PlanetUtilityService', [
      'getOwnedPlanet',
      'updateGameState'
    ]);

    service = new BuildQueueService(mockPlanetUtility);
  });

  describe('addToBuildQueue', () => {
    it('should add item to empty build queue', () => {
      const planet = createPlanet({ buildQueue: [] });
      const game = createGameState(planet);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', item);

      expect(planet.buildQueue).toEqual([item]);
      expect(mockPlanetUtility.getOwnedPlanet).toHaveBeenCalledWith(game, 'planet1');
      expect(mockPlanetUtility.updateGameState).toHaveBeenCalled();
    });

    it('should append item to existing build queue', () => {
      const existingItem = createBuildItem({ project: 'factory' });
      const planet = createPlanet({ buildQueue: [existingItem] });
      const game = createGameState(planet);
      const newItem = createBuildItem({ project: 'mine' });

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', newItem);

      expect(planet.buildQueue!.length).toBe(2);
      expect(planet.buildQueue![0].project).toBe('factory');
      expect(planet.buildQueue![1].project).toBe('mine');
    });

    it('should handle undefined build queue', () => {
      const planet = createPlanet();
      delete (planet as any).buildQueue;
      const game = createGameState(planet);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.addToBuildQueue(game, 'planet1', item);

      expect(planet.buildQueue).toEqual([item]);
    });

    it('should return unchanged game when planet not found', () => {
      const planet = createPlanet();
      const game = createGameState(planet);
      const item = createBuildItem();

      mockPlanetUtility.getOwnedPlanet.and.returnValue(null);

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
      const planet = createPlanet({ buildQueue: [item1, item2, item3] });
      const game = createGameState(planet);

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.removeFromQueue(game, 'planet1', 1);

      expect(planet.buildQueue!.length).toBe(2);
      expect(planet.buildQueue![0].project).toBe('mine');
      expect(planet.buildQueue![1].project).toBe('defense');
    });

    it('should remove first item when index is 0', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const planet = createPlanet({ buildQueue: [item1, item2] });
      const game = createGameState(planet);

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);
      mockPlanetUtility.updateGameState.and.callFake((g: GameState) => ({ ...g }));

      service.removeFromQueue(game, 'planet1', 0);

      expect(planet.buildQueue!.length).toBe(1);
      expect(planet.buildQueue![0].project).toBe('factory');
    });

    it('should return unchanged game when planet not found', () => {
      const planet = createPlanet();
      const game = createGameState(planet);

      mockPlanetUtility.getOwnedPlanet.and.returnValue(null);

      const result = service.removeFromQueue(game, 'unknown', 0);

      expect(result).toBe(game);
    });

    it('should return unchanged game when build queue is undefined', () => {
      const planet = createPlanet();
      delete (planet as any).buildQueue;
      const game = createGameState(planet);

      mockPlanetUtility.getOwnedPlanet.and.returnValue(planet);

      const result = service.removeFromQueue(game, 'planet1', 0);

      expect(result).toBe(game);
    });
  });

  describe('handleQueueProgression', () => {
    it('should decrement count and reset paid for multi-count items', () => {
      const item = createBuildItem({
        count: 3,
        paid: { resources: 100, ironium: 50, boranium: 30, germanium: 20 }
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
