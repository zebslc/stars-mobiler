import { BuildProcessorService } from './build-processor.service';
import { PlanetUtilityService } from '../colony/planet-utility.service';
import { BuildQueueService } from './build-queue.service';
import { BuildPaymentService, ResourceAmount } from './build-payment.service';
import { BuildProjectService } from './build-project.service';
import { StarbaseUpgradeService, StarbaseUpgradeInfo } from '../ship-design/starbase-upgrade.service';
import { BuildItem, GameState, Player, Star } from '../../models/game.model';

describe('BuildProcessorService', () => {
  let service: BuildProcessorService;
  let mockPlanetUtility: jasmine.SpyObj<PlanetUtilityService>;
  let mockBuildQueue: jasmine.SpyObj<BuildQueueService>;
  let mockBuildPayment: jasmine.SpyObj<BuildPaymentService>;
  let mockBuildProject: jasmine.SpyObj<BuildProjectService>;
  let mockStarbaseUpgrade: jasmine.SpyObj<StarbaseUpgradeService>;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const zeroResources = (): ResourceAmount => ({
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0,
  });

  const emptyStarbaseInfo = (): StarbaseUpgradeInfo => ({
    scrapCredit: zeroResources(),
    existingStarbaseIndex: -1,
    existingFleet: null,
  });

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'planet1',
    name: 'Test Planet',
    position: { x: 0, y: 0 },
    temperature: 40,
    atmosphere: 40,
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    ownerId: 'p1',
    population: 10000,
    maxPopulation: 1000000,
    mines: 10,
    factories: 10,
    defenses: 5,
    research: 0,
    scanner: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    resources: 500,
    buildQueue: [],
    ...overrides,
  });

  const createBuildItem = (overrides: Partial<BuildItem> = {}): BuildItem => ({
    project: 'mine',
    cost: { resources: 100 },
    paid: zeroResources(),
    ...overrides,
  });

  const createGameState = (stars: Star[] = []): GameState => ({
    id: 'game1',
    seed: 123,
    turn: 1,
    settings: {} as any,
    stars,
    humanPlayer: mockPlayer,
    aiPlayers: [],
    fleets: [],
    shipDesigns: [],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  });

  beforeEach(() => {
    mockPlanetUtility = jasmine.createSpyObj('PlanetUtilityService', [
      'getOwnedStar',
      'updateGameState',
    ]);
    mockBuildQueue = jasmine.createSpyObj('BuildQueueService', [
      'addToBuildQueue',
      'removeFromQueue',
      'handleQueueProgression',
    ]);
    mockBuildPayment = jasmine.createSpyObj('BuildPaymentService', [
      'initializeItemPayment',
      'calculateTotalCost',
      'calculateRemainingCost',
      'processItemPayment',
      'handleExcessRefunds',
    ]);
    mockBuildProject = jasmine.createSpyObj('BuildProjectService', ['executeBuildProject']);
    mockStarbaseUpgrade = jasmine.createSpyObj('StarbaseUpgradeService', [
      'handleStarbaseUpgrade',
      'removeOldStarbase',
    ]);

    service = new BuildProcessorService(
      mockPlanetUtility,
      mockBuildQueue,
      mockBuildPayment,
      mockBuildProject,
      mockStarbaseUpgrade,
    );
  });

  describe('processBuildQueues', () => {
    it('should process only owned planets', () => {
      const ownedPlanet = createStar({ id: 'planet1', ownerId: 'p1', buildQueue: [] });
      const enemyPlanet = createStar({ id: 'planet2', ownerId: 'enemy', buildQueue: [] });
      const game = createGameState([ownedPlanet, enemyPlanet]);

      service.processBuildQueues(game);

      // Only owned planet should be processed
      expect(ownedPlanet.buildQueue).toEqual([]);
      expect(enemyPlanet.buildQueue).toEqual([]);
    });

    it('should process build queue for planet with items', () => {
      const item = createBuildItem();
      const star = createStar({ buildQueue: [item] });
      const game = createGameState([star]);

      const totalCost: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };
      const remaining: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true,
      });
      // Must shift queue to avoid infinite loop
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        star.buildQueue!.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildPayment.initializeItemPayment).toHaveBeenCalledWith(item);
      expect(mockBuildPayment.calculateTotalCost).toHaveBeenCalledWith(item);
      expect(mockStarbaseUpgrade.handleStarbaseUpgrade).toHaveBeenCalled();
      expect(mockBuildProject.executeBuildProject).toHaveBeenCalled();
      expect(mockBuildQueue.handleQueueProgression).toHaveBeenCalled();
    });

    it('should stop processing when resources run out', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const star = createStar({ buildQueue: [item1, item2] });
      const game = createGameState([star]);

      const totalCost: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };
      const remaining: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: { resources: 50, ironium: 25, boranium: 15, germanium: 10 },
        isComplete: false, // Not enough resources
      });

      service.processBuildQueues(game);

      // Should only attempt first item since resources ran out
      expect(mockBuildPayment.initializeItemPayment).toHaveBeenCalledTimes(1);
      expect(mockBuildProject.executeBuildProject).not.toHaveBeenCalled();
    });

    it('should process multiple items when resources available', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const star = createStar({ buildQueue: [item1, item2] });
      const game = createGameState([star]);

      const totalCost: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };
      const remaining: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true,
      });
      // Simulate queue being emptied after each item
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        star.buildQueue!.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildPayment.initializeItemPayment).toHaveBeenCalledTimes(2);
      expect(mockBuildProject.executeBuildProject).toHaveBeenCalledTimes(2);
    });

    it('should handle empty build queue', () => {
      const star = createStar({ buildQueue: [] });
      const game = createGameState([star]);

      service.processBuildQueues(game);

      expect(mockBuildPayment.initializeItemPayment).not.toHaveBeenCalled();
      expect(mockBuildProject.executeBuildProject).not.toHaveBeenCalled();
    });

    it('should handle undefined build queue', () => {
      const star = createStar();
      delete ((star as any)).buildQueue;
      const game = createGameState([star]);

      expect(() => service.processBuildQueues(game)).not.toThrow();
    });

    it('should apply scrap credit for starbase upgrades', () => {
      const item = createBuildItem({
        project: 'ship',
        shipDesignId: 'starbase',
        paid: zeroResources(), // Initialize paid
      });
      const star = createStar({ buildQueue: [item] });
      const game = createGameState([star]);

      const totalCost: ResourceAmount = {
        resources: 500,
        ironium: 100,
        boranium: 100,
        germanium: 100,
      };
      const scrapCredit: ResourceAmount = {
        resources: 0,
        ironium: 75,
        boranium: 75,
        germanium: 75,
      };
      const remaining: ResourceAmount = {
        resources: 500,
        ironium: 25,
        boranium: 25,
        germanium: 25,
      };
      const starbaseInfo: StarbaseUpgradeInfo = {
        scrapCredit,
        existingStarbaseIndex: 0,
        existingFleet: {
          id: 'fleet1',
          name: 'Starbase Fleet',
          ownerId: 'player1',
          location: { type: 'orbit', starId: 'star1' },
          ships: [],
          fuel: 0,
          cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
          orders: [],
        },
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(starbaseInfo);
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: remaining,
        isComplete: true,
      });
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        star.buildQueue!.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildPayment.calculateRemainingCost).toHaveBeenCalledWith(
        totalCost,
        zeroResources(),
        scrapCredit,
      );
      expect(mockStarbaseUpgrade.removeOldStarbase).toHaveBeenCalledWith(
        game,
        starbaseInfo.existingFleet,
        0,
      );
      expect(mockBuildPayment.handleExcessRefunds).toHaveBeenCalled();
    });

    it('should process multiple planets', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const planet1 = createStar({ id: 'planet1', buildQueue: [item1] });
      const planet2 = createStar({ id: 'planet2', buildQueue: [item2] });
      const game = createGameState([planet1, planet2]);

      const totalCost: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };
      const remaining: ResourceAmount = {
        resources: 100,
        ironium: 50,
        boranium: 30,
        germanium: 20,
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true,
      });
      mockBuildQueue.handleQueueProgression.and.callFake((item: BuildItem, queue: BuildItem[]) => {
        queue.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildProject.executeBuildProject).toHaveBeenCalledTimes(2);
    });
  });
});
