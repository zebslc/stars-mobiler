import { TurnService } from './turn.service';
import type { EconomyService } from '../colony/economy.service';
import type { ResearchService } from '../tech/research.service';
import type { ColonyService } from '../colony/colony.service';
import type { FleetService } from '../fleet/core/fleet.service';
import type { HabitabilityService } from '../colony/habitability.service';
import type { ScanningService } from './scanning.service';
import type { GameState, Star, Player } from '../../models/game.model';

describe('TurnService', () => {
  let service: TurnService;
  let mockEconomy: jasmine.SpyObj<EconomyService>;
  let mockResearch: jasmine.SpyObj<ResearchService>;
  let mockColony: jasmine.SpyObj<ColonyService>;
  let mockFleet: jasmine.SpyObj<FleetService>;
  let mockHab: jasmine.SpyObj<HabitabilityService>;

  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 'human',
    name: 'Human',
    species: {
      id: 'human',
      name: 'Human',
      habitat: { idealTemperature: 50, idealAtmosphere: 50, toleranceRadius: 25 },
      traits: [],
    },
    techLevels: { Energy: 1, Kinetics: 1, Propulsion: 1, Construction: 1 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
    scanReports: {},
    ...overrides,
  });

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'star1',
    name: 'Test Star',
    position: { x: 100, y: 100 },
    ownerId: 'human',
    population: 100000,
    maxPopulation: 1000000,
    resources: 100,
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    mineralConcentrations: { ironium: 60, boranium: 60, germanium: 40 },
    mines: 10,
    factories: 10,
    defenses: 0,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 5,
    ...overrides,
  });

  const createGameState = (stars: Array<Star>, player?: Player): GameState => {
    return {
      id: 'game1',
      seed: 123,
      turn: 1,
      settings: {} as any,
      stars: stars,
      humanPlayer: player || createPlayer(),
      aiPlayers: [],
      fleets: [],
      shipDesigns: [],
      playerEconomy: { freighterCapacity: 100, research: 0 },
    };
  };

  beforeEach(() => {
    mockEconomy = jasmine.createSpyObj('EconomyService', [
      'calculateProduction',
      'applyMiningDepletion',
      'logisticGrowth',
    ]);
    mockResearch = jasmine.createSpyObj('ResearchService', ['advanceResearch']);
    mockColony = jasmine.createSpyObj('ColonyService', ['processBuildQueues', 'processGovernors']);
    mockFleet = jasmine.createSpyObj('FleetService', ['processFleets']);
    mockHab = jasmine.createSpyObj('HabitabilityService', ['calculate']);
    const mockScanning = jasmine.createSpyObj('ScanningService', ['processScanning']);

    // Default mock returns
    mockEconomy.calculateProduction.and.returnValue({
      resources: 50,
      extraction: { ironium: 10, boranium: 8, germanium: 5 },
      operableFactories: 10,
      operableMines: 10,
    });
    mockEconomy.logisticGrowth.and.returnValue(1000);
    mockHab.calculate.and.returnValue(75);

    service = new TurnService(mockEconomy, mockResearch, mockColony, mockFleet, mockHab, mockScanning);
  });

  describe('getOwnedStars', () => {
    it('should return only planets owned by human player', () => {
      const ownedPlanet = createStar({ id: 'planet1', ownerId: 'human' });
      const enemyPlanet = createStar({ id: 'planet2', ownerId: 'enemy' });
      const neutralPlanet = createStar({ id: 'planet3', ownerId: null });
      const game = createGameState([ownedPlanet, enemyPlanet, neutralPlanet]);

      const result = service.getOwnedStars(game);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('planet1');
    });

    it('should return empty array when no owned planets', () => {
      const enemyPlanet = createStar({ id: 'planet1', ownerId: 'enemy' });
      const game = createGameState([enemyPlanet]);

      const result = service.getOwnedStars(game);

      expect(result.length).toBe(0);
    });
  });

  describe('getResearchModifier', () => {
    it('should return 0 when no research trait', () => {
      const player = createPlayer({ species: { ...createPlayer().species, traits: [] } });

      const result = service.getResearchModifier(player);

      expect(result).toBe(0);
    });

    it('should return modifier from research trait', () => {
      const player = createPlayer({
        species: {
          ...createPlayer().species,
          traits: [{ type: 'research', modifier: 0.25 }],
        },
      });

      const result = service.getResearchModifier(player);

      expect(result).toBe(0.25);
    });
  });

  describe('calculatePlanetResearch', () => {
    it('should calculate research with no modifier', () => {
      const star = createStar({ research: 5 });

      const result = service.calculatePlanetResearch(star, 0);

      expect(result).toBe(5);
    });

    it('should apply research modifier', () => {
      const star = createStar({ research: 10 });

      const result = service.calculatePlanetResearch(star, 0.5);

      expect(result).toBe(15); // 10 * 1.5
    });

    it('should handle undefined research', () => {
      const planet = createStar();
      (planet as any).research = undefined;

      const result = service.calculatePlanetResearch(planet, 0.5);

      expect(result).toBe(0);
    });
  });

  describe('processPlanetProduction', () => {
    it('should add resources to planet', () => {
      const star = createStar({ resources: 100 });
      mockEconomy.calculateProduction.and.returnValue({
        extraction: { ironium: 0, boranium: 0, germanium: 0 },
        resources: 50,
        operableFactories: 5,
        operableMines: 10,
      });

      service.processPlanetProduction(star);

      expect(star.resources).toBe(150);
      expect(mockEconomy.calculateProduction).toHaveBeenCalledWith(star);
      expect(mockEconomy.applyMiningDepletion).toHaveBeenCalled();
    });
  });

  describe('processResearch', () => {
    it('should add research to economy and advance', () => {
      const game = createGameState([createStar()]);
      game.playerEconomy.research = 10;

      service.processResearch(game, 25);

      expect(game.playerEconomy.research).toBe(35);
      expect(mockResearch.advanceResearch).toHaveBeenCalledWith(game, 25);
    });
  });

  describe('applyPopulationGrowth', () => {
    it('should update maxPopulation based on habitability', () => {
      const star = createStar({ population: 100000, maxPopulation: 500000 });

      service.applyPopulationGrowth(star, 80); // 80% habitability

      expect(star.maxPopulation).toBe(800000); // 1M * 0.8
    });

    it('should apply logistic growth', () => {
      const star = createStar({ population: 100000 });
      mockEconomy.logisticGrowth.and.returnValue(5000);

      service.applyPopulationGrowth(star, 75);

      expect(mockEconomy.logisticGrowth).toHaveBeenCalled();
      expect(star.population).toBe(105000);
    });

    it('should cap population at maxPopulation', () => {
      const star = createStar({ population: 990000, maxPopulation: 1000000 });
      mockEconomy.logisticGrowth.and.returnValue(50000);

      service.applyPopulationGrowth(star, 100);

      expect(star.population).toBe(1000000);
    });
  });

  describe('applyPopulationDecay', () => {
    it('should reduce population for negative habitability', () => {
      const star = createStar({ population: 100000 });

      service.applyPopulationDecay(star, -50);

      expect(star.population).toBeLessThan(100000);
    });

    it('should set owner to neutral when population reaches zero', () => {
      const star = createStar({ population: 1, ownerId: 'human' });

      service.applyPopulationDecay(star, -100);

      expect(star.population).toBe(0);
      expect(star.ownerId).toBe('neutral');
    });

    it('should not reduce population below zero', () => {
      const star = createStar({ population: 5 });

      service.applyPopulationDecay(star, -100);

      expect(star.population).toBeGreaterThanOrEqual(0);
    });
  });

  describe('processColonies', () => {
    it('should process build queues and governors', () => {
      const game = createGameState([createStar()]);

      service.processColonies(game);

      expect(mockColony.processBuildQueues).toHaveBeenCalledWith(game);
      expect(mockColony.processGovernors).toHaveBeenCalledWith(game);
    });
  });

  describe('processFleets', () => {
    it('should process fleet movement', () => {
      const game = createGameState([createStar()]);

      service.processFleets(game);

      expect(mockFleet.processFleets).toHaveBeenCalledWith(game);
    });
  });

  describe('createNextGameState', () => {
    it('should increment turn', () => {
      const game = createGameState([createStar()]);
      game.turn = 5;

      const result = service.createNextGameState(game);

      expect(result.turn).toBe(6);
    });

    it('should create new object references for change detection', () => {
      const game = createGameState([createStar()]);

      const result = service.createNextGameState(game);

      expect(result).not.toBe(game);
      expect(result.humanPlayer).not.toBe(game.humanPlayer);
      expect(result.stars).not.toBe(game.stars);
      expect(result.fleets).not.toBe(game.fleets);
    });
  });

  describe('endTurn', () => {
    it('should orchestrate all turn processing', () => {
      const star = createStar();
      const game = createGameState([star]);

      const result = service.endTurn(game);

      expect(mockEconomy.calculateProduction).toHaveBeenCalled();
      expect(mockResearch.advanceResearch).toHaveBeenCalled();
      expect(mockHab.calculate).toHaveBeenCalled();
      expect(mockColony.processBuildQueues).toHaveBeenCalled();
      expect(mockColony.processGovernors).toHaveBeenCalled();
      expect(mockFleet.processFleets).toHaveBeenCalled();
      expect(result.turn).toBe(2);
    });

    it('should accumulate research from production', () => {
      const star = createStar({ research: 10 });
      const game = createGameState([star]);

      service.endTurn(game);

      expect(mockResearch.advanceResearch).toHaveBeenCalledWith(game, 10);
    });

    it('should not process enemy planets', () => {
      const enemyStar = createStar({ ownerId: 'enemy' });
      const game = createGameState([enemyStar]);

      service.endTurn(game);

      expect(mockEconomy.calculateProduction).not.toHaveBeenCalled();
    });
  });
});
