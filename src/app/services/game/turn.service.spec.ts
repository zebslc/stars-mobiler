import { TurnService } from './turn.service';
import { EconomyService } from '../colony/economy.service';
import { ResearchService } from '../tech/research.service';
import { ColonyService } from '../colony/colony.service';
import { FleetService } from '../fleet/fleet.service';
import { HabitabilityService } from '../colony/habitability.service';
import { GameState, Planet, Player, Star } from '../../models/game.model';

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
      traits: []
    },
    ownedPlanetIds: ['planet1'],
    techLevels: { Energy: 1, Kinetics: 1, Propulsion: 1, Construction: 1 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ...overrides
  });

  const createPlanet = (overrides: Partial<Planet> = {}): Planet => ({
    id: 'planet1',
    name: 'Test Planet',
    starId: 'star1',
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
    ...overrides
  });

  const createGameState = (planets: Planet[], player?: Player): GameState => {
    const star: Star = {
      id: 'star1',
      name: 'Sol',
      position: { x: 0, y: 0 },
      planets
    };

    return {
      id: 'game1',
      seed: 123,
      turn: 1,
      settings: {} as any,
      stars: [star],
      humanPlayer: player || createPlayer(),
      aiPlayers: [],
      fleets: [],
      shipDesigns: [],
      playerEconomy: { freighterCapacity: 100, research: 0 }
    };
  };

  beforeEach(() => {
    mockEconomy = jasmine.createSpyObj('EconomyService', [
      'calculateProduction',
      'applyMiningDepletion',
      'logisticGrowth'
    ]);
    mockResearch = jasmine.createSpyObj('ResearchService', ['advanceResearch']);
    mockColony = jasmine.createSpyObj('ColonyService', ['processBuildQueues', 'processGovernors']);
    mockFleet = jasmine.createSpyObj('FleetService', ['processFleets']);
    mockHab = jasmine.createSpyObj('HabitabilityService', ['calculate']);

    // Default mock returns
    mockEconomy.calculateProduction.and.returnValue({
      resources: 50,
      extraction: { ironium: 10, boranium: 8, germanium: 5 },
      operableFactories: 10,
      operableMines: 10
    });
    mockEconomy.logisticGrowth.and.returnValue(1000);
    mockHab.calculate.and.returnValue(75);

    service = new TurnService(mockEconomy, mockResearch, mockColony, mockFleet, mockHab);
  });

  describe('getOwnedPlanets', () => {
    it('should return only planets owned by human player', () => {
      const ownedPlanet = createPlanet({ id: 'planet1', ownerId: 'human' });
      const enemyPlanet = createPlanet({ id: 'planet2', ownerId: 'enemy' });
      const neutralPlanet = createPlanet({ id: 'planet3', ownerId: null });
      const game = createGameState([ownedPlanet, enemyPlanet, neutralPlanet]);

      const result = service.getOwnedPlanets(game);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('planet1');
    });

    it('should return empty array when no owned planets', () => {
      const enemyPlanet = createPlanet({ id: 'planet1', ownerId: 'enemy' });
      const game = createGameState([enemyPlanet]);

      const result = service.getOwnedPlanets(game);

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
          traits: [{ type: 'research', modifier: 0.25 }]
        }
      });

      const result = service.getResearchModifier(player);

      expect(result).toBe(0.25);
    });
  });

  describe('calculatePlanetResearch', () => {
    it('should calculate research with no modifier', () => {
      const planet = createPlanet({ research: 5 });

      const result = service.calculatePlanetResearch(planet, 0);

      expect(result).toBe(5);
    });

    it('should apply research modifier', () => {
      const planet = createPlanet({ research: 10 });

      const result = service.calculatePlanetResearch(planet, 0.5);

      expect(result).toBe(15); // 10 * 1.5
    });

    it('should handle undefined research', () => {
      const planet = createPlanet();
      (planet as any).research = undefined;

      const result = service.calculatePlanetResearch(planet, 0.5);

      expect(result).toBe(0);
    });
  });

  describe('processPlanetProduction', () => {
    it('should add resources to planet', () => {
      const planet = createPlanet({ resources: 100 });
      mockEconomy.calculateProduction.and.returnValue({
        resources: 50,
        extraction: { ironium: 0, boranium: 0, germanium: 0 },
        operableFactories: 10,
        operableMines: 10
      });

      service.processPlanetProduction(planet);

      expect(planet.resources).toBe(150);
      expect(mockEconomy.calculateProduction).toHaveBeenCalledWith(planet);
      expect(mockEconomy.applyMiningDepletion).toHaveBeenCalled();
    });
  });

  describe('processResearch', () => {
    it('should add research to economy and advance', () => {
      const game = createGameState([createPlanet()]);
      game.playerEconomy.research = 10;

      service.processResearch(game, 25);

      expect(game.playerEconomy.research).toBe(35);
      expect(mockResearch.advanceResearch).toHaveBeenCalledWith(game, 25);
    });
  });

  describe('applyPopulationGrowth', () => {
    it('should update maxPopulation based on habitability', () => {
      const planet = createPlanet({ population: 100000, maxPopulation: 500000 });

      service.applyPopulationGrowth(planet, 80); // 80% habitability

      expect(planet.maxPopulation).toBe(800000); // 1M * 0.8
    });

    it('should apply logistic growth', () => {
      const planet = createPlanet({ population: 100000 });
      mockEconomy.logisticGrowth.and.returnValue(5000);

      service.applyPopulationGrowth(planet, 75);

      expect(mockEconomy.logisticGrowth).toHaveBeenCalled();
      expect(planet.population).toBe(105000);
    });

    it('should cap population at maxPopulation', () => {
      const planet = createPlanet({ population: 990000, maxPopulation: 1000000 });
      mockEconomy.logisticGrowth.and.returnValue(50000);

      service.applyPopulationGrowth(planet, 100);

      expect(planet.population).toBe(1000000);
    });
  });

  describe('applyPopulationDecay', () => {
    it('should reduce population for negative habitability', () => {
      const planet = createPlanet({ population: 100000 });

      service.applyPopulationDecay(planet, -50);

      expect(planet.population).toBeLessThan(100000);
    });

    it('should set owner to neutral when population reaches zero', () => {
      const planet = createPlanet({ population: 10, ownerId: 'human' });

      service.applyPopulationDecay(planet, -100);

      expect(planet.population).toBe(0);
      expect(planet.ownerId).toBe('neutral');
    });

    it('should not reduce population below zero', () => {
      const planet = createPlanet({ population: 5 });

      service.applyPopulationDecay(planet, -100);

      expect(planet.population).toBeGreaterThanOrEqual(0);
    });
  });

  describe('processColonies', () => {
    it('should process build queues and governors', () => {
      const game = createGameState([createPlanet()]);

      service.processColonies(game);

      expect(mockColony.processBuildQueues).toHaveBeenCalledWith(game);
      expect(mockColony.processGovernors).toHaveBeenCalledWith(game);
    });
  });

  describe('processFleets', () => {
    it('should process fleet movement', () => {
      const game = createGameState([createPlanet()]);

      service.processFleets(game);

      expect(mockFleet.processFleets).toHaveBeenCalledWith(game);
    });
  });

  describe('createNextGameState', () => {
    it('should increment turn', () => {
      const game = createGameState([createPlanet()]);
      game.turn = 5;

      const result = service.createNextGameState(game);

      expect(result.turn).toBe(6);
    });

    it('should create new object references for change detection', () => {
      const game = createGameState([createPlanet()]);

      const result = service.createNextGameState(game);

      expect(result).not.toBe(game);
      expect(result.humanPlayer).not.toBe(game.humanPlayer);
      expect(result.stars).not.toBe(game.stars);
      expect(result.fleets).not.toBe(game.fleets);
    });
  });

  describe('endTurn', () => {
    it('should orchestrate all turn processing', () => {
      const planet = createPlanet();
      const game = createGameState([planet]);

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
      const planet = createPlanet({ research: 10 });
      const game = createGameState([planet]);

      service.endTurn(game);

      expect(mockResearch.advanceResearch).toHaveBeenCalledWith(game, 10);
    });

    it('should not process enemy planets', () => {
      const enemyPlanet = createPlanet({ ownerId: 'enemy' });
      const game = createGameState([enemyPlanet]);

      service.endTurn(game);

      expect(mockEconomy.calculateProduction).not.toHaveBeenCalled();
    });
  });
});
