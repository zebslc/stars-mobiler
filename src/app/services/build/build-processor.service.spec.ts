import { BuildProcessorService } from './build-processor.service';
import { PlanetUtilityService } from '../colony/planet-utility.service';
import { BuildQueueService } from './build-queue.service';
import { BuildPaymentService, ResourceAmount } from './build-payment.service';
import { BuildProjectService } from './build-project.service';
import { StarbaseUpgradeService, StarbaseUpgradeInfo } from '../ship-design/starbase-upgrade.service';
import { BuildItem, GameState, Planet, Player, Star } from '../../models/game.model';

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
    ownedPlanetIds: ['planet1'],
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy'
  };

  const zeroResources = (): ResourceAmount => ({
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0
  });

  const emptyStarbaseInfo = (): StarbaseUpgradeInfo => ({
    scrapCredit: zeroResources(),
    existingStarbaseIndex: -1,
    existingFleet: null
  });

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

  const createGameState = (planets: Planet[]): GameState => {
    const stars: Star[] = [{
      id: 'star1',
      name: 'Sol',
      position: { x: 0, y: 0 },
      planets
    }];

    return {
      id: 'game1',
      seed: 123,
      turn: 1,
      settings: {} as any,
      stars,
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
    mockBuildQueue = jasmine.createSpyObj('BuildQueueService', [
      'addToBuildQueue',
      'removeFromQueue',
      'handleQueueProgression'
    ]);
    mockBuildPayment = jasmine.createSpyObj('BuildPaymentService', [
      'initializeItemPayment',
      'calculateTotalCost',
      'calculateRemainingCost',
      'processItemPayment',
      'handleExcessRefunds'
    ]);
    mockBuildProject = jasmine.createSpyObj('BuildProjectService', [
      'executeBuildProject'
    ]);
    mockStarbaseUpgrade = jasmine.createSpyObj('StarbaseUpgradeService', [
      'handleStarbaseUpgrade',
      'removeOldStarbase'
    ]);

    service = new BuildProcessorService(
      mockPlanetUtility,
      mockBuildQueue,
      mockBuildPayment,
      mockBuildProject,
      mockStarbaseUpgrade
    );
  });

  describe('processBuildQueues', () => {
    it('should process only owned planets', () => {
      const ownedPlanet = createPlanet({ id: 'planet1', ownerId: 'p1', buildQueue: [] });
      const enemyPlanet = createPlanet({ id: 'planet2', ownerId: 'enemy', buildQueue: [] });
      const game = createGameState([ownedPlanet, enemyPlanet]);

      service.processBuildQueues(game);

      // Only owned planet should be processed
      expect(ownedPlanet.buildQueue).toEqual([]);
      expect(enemyPlanet.buildQueue).toEqual([]);
    });

    it('should process build queue for planet with items', () => {
      const item = createBuildItem();
      const planet = createPlanet({ buildQueue: [item] });
      const game = createGameState([planet]);

      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true
      });
      // Must shift queue to avoid infinite loop
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        planet.buildQueue!.shift();
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
      const planet = createPlanet({ buildQueue: [item1, item2] });
      const game = createGameState([planet]);

      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: { resources: 50, ironium: 25, boranium: 15, germanium: 10 },
        isComplete: false // Not enough resources
      });

      service.processBuildQueues(game);

      // Should only attempt first item since resources ran out
      expect(mockBuildPayment.initializeItemPayment).toHaveBeenCalledTimes(1);
      expect(mockBuildProject.executeBuildProject).not.toHaveBeenCalled();
    });

    it('should process multiple items when resources available', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const planet = createPlanet({ buildQueue: [item1, item2] });
      const game = createGameState([planet]);

      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true
      });
      // Simulate queue being emptied after each item
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        planet.buildQueue!.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildPayment.initializeItemPayment).toHaveBeenCalledTimes(2);
      expect(mockBuildProject.executeBuildProject).toHaveBeenCalledTimes(2);
    });

    it('should handle empty build queue', () => {
      const planet = createPlanet({ buildQueue: [] });
      const game = createGameState([planet]);

      service.processBuildQueues(game);

      expect(mockBuildPayment.initializeItemPayment).not.toHaveBeenCalled();
      expect(mockBuildProject.executeBuildProject).not.toHaveBeenCalled();
    });

    it('should handle undefined build queue', () => {
      const planet = createPlanet();
      delete (planet as any).buildQueue;
      const game = createGameState([planet]);

      expect(() => service.processBuildQueues(game)).not.toThrow();
    });

    it('should apply scrap credit for starbase upgrades', () => {
      const item = createBuildItem({
        project: 'ship',
        shipDesignId: 'starbase',
        paid: zeroResources() // Initialize paid
      });
      const planet = createPlanet({ buildQueue: [item] });
      const game = createGameState([planet]);

      const totalCost: ResourceAmount = { resources: 500, ironium: 100, boranium: 100, germanium: 100 };
      const scrapCredit: ResourceAmount = { resources: 0, ironium: 75, boranium: 75, germanium: 75 };
      const remaining: ResourceAmount = { resources: 500, ironium: 25, boranium: 25, germanium: 25 };
      const starbaseInfo: StarbaseUpgradeInfo = {
        scrapCredit,
        existingStarbaseIndex: 0,
        existingFleet: { id: 'fleet1', ships: [] }
      };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(starbaseInfo);
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: remaining,
        isComplete: true
      });
      mockBuildQueue.handleQueueProgression.and.callFake(() => {
        planet.buildQueue!.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildPayment.calculateRemainingCost).toHaveBeenCalledWith(
        totalCost,
        zeroResources(),
        scrapCredit
      );
      expect(mockStarbaseUpgrade.removeOldStarbase).toHaveBeenCalledWith(
        game,
        starbaseInfo.existingFleet,
        0
      );
      expect(mockBuildPayment.handleExcessRefunds).toHaveBeenCalled();
    });

    it('should process multiple planets', () => {
      const item1 = createBuildItem({ project: 'mine' });
      const item2 = createBuildItem({ project: 'factory' });
      const planet1 = createPlanet({ id: 'planet1', buildQueue: [item1] });
      const planet2 = createPlanet({ id: 'planet2', buildQueue: [item2] });
      const game = createGameState([planet1, planet2]);

      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      mockBuildPayment.calculateTotalCost.and.returnValue(totalCost);
      mockStarbaseUpgrade.handleStarbaseUpgrade.and.returnValue(emptyStarbaseInfo());
      mockBuildPayment.calculateRemainingCost.and.returnValue(remaining);
      mockBuildPayment.processItemPayment.and.returnValue({
        paid: totalCost,
        isComplete: true
      });
      mockBuildQueue.handleQueueProgression.and.callFake((item: BuildItem, queue: BuildItem[]) => {
        queue.shift();
      });

      service.processBuildQueues(game);

      expect(mockBuildProject.executeBuildProject).toHaveBeenCalledTimes(2);
    });
  });
});
