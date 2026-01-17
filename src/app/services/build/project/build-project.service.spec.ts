import { TestBed } from '@angular/core/testing';
import { BuildProjectService } from './build-project.service';
import { FleetService } from '../../fleet/core/fleet.service';
import type { BuildItem, GameState, Player, PlayerTech, Star } from '../../../models/game.model';
import type { TechRequirement } from '../../../data/tech-atlas.types';

describe('BuildProjectService', () => {
  let service: BuildProjectService;
  let mockFleetService: jasmine.SpyObj<FleetService>;

  const createPlayer = (techOverrides: Partial<PlayerTech> = {}): Player => ({
    id: 'test-player',
    name: 'Human',
    species: {
      id: 'human',
      name: 'Human',
      habitat: {
        idealTemperature: 50,
        idealAtmosphere: 50,
        toleranceRadius: 25,
      },
      traits: [],
    },
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0, ...techOverrides },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
    scanReports: {},
  });

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'planet1',
    name: 'Test Planet',
    ownerId: 'test-player',
    position: { x: 0, y: 0 },
    population: 10000,
    maxPopulation: 1000000,
    resources: 500,
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    mines: 10,
    factories: 10,
    defenses: 5,
    temperature: 40,
    atmosphere: 40,
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

  const createGameState = (planet: Star, player?: Player): GameState => {
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
      humanPlayer: player || createPlayer(),
      aiPlayers: [],
      fleets: [],
      shipDesigns: [],
      playerEconomy: { freighterCapacity: 0, research: 0 },
    };
  };

  beforeEach(() => {
    mockFleetService = jasmine.createSpyObj('FleetService', ['addShipToFleet']);
    TestBed.configureTestingModule({
      providers: [BuildProjectService, { provide: FleetService, useValue: mockFleetService }],
    });
    service = TestBed.inject(BuildProjectService);
  });

  describe('executeBuildProject', () => {
    describe('mine project', () => {
      it('should increment planet mines by 1', () => {
        const star = createStar({ mines: 10 });
        const game = createGameState(star);
        const item = createBuildItem({ project: 'mine' });

        service.executeBuildProject(game, star, item);

        expect(star.mines).toBe(11);
      });
    });

    describe('factory project', () => {
      it('should increment planet factories by 1', () => {
        const star = createStar({ factories: 10 });
        const game = createGameState(star);
        const item = createBuildItem({ project: 'factory' });

        service.executeBuildProject(game, star, item);

        expect(star.factories).toBe(11);
      });
    });

    describe('defense project', () => {
      it('should increment planet defenses by 1', () => {
        const star = createStar({ defenses: 5 });
        const game = createGameState(star);
        const item = createBuildItem({ project: 'defense' });

        service.executeBuildProject(game, star, item);

        expect(star.defenses).toBe(6);
      });
    });

    describe('research project', () => {
      it('should increment planet research by 1', () => {
        const star = createStar({ research: 3 });
        const game = createGameState(star);
        const item = createBuildItem({ project: 'research' });

        service.executeBuildProject(game, star, item);

        expect(star.research).toBe(4);
      });

      it('should handle undefined research', () => {
        const star = createStar();
        (star as any).research = undefined;
        const game = createGameState(star);
        const item = createBuildItem({ project: 'research' });

        service.executeBuildProject(game, star, item);

        expect(star.research).toBe(1);
      });
    });

    describe('scanner project', () => {
      it('should set scanner to default range with no tech', () => {
        const star = createStar({ scanner: 0 });
        const player = createPlayer({ Energy: 0 });
        const game = createGameState(star, player);
        const item = createBuildItem({ project: 'scanner' });

        service.executeBuildProject(game, star, item);

        expect(star.scanner).toBe(50); // Default + Viewer 50 base
      });

      it('should set scanner to best available range based on tech', () => {
        const star = createStar({ scanner: 0 });
        const player = createPlayer({ Energy: 3 }); // Unlocks Scoper 150
        const game = createGameState(star, player);
        const item = createBuildItem({ project: 'scanner' });

        service.executeBuildProject(game, star, item);

        expect(star.scanner).toBe(150);
      });
    });

    describe('terraform project', () => {
      it('should increase temperature when below ideal', () => {
        const star = createStar({ temperature: 40, atmosphere: 40 });
        const player = createPlayer();
        player.species.habitat.idealTemperature = 50;
        player.species.habitat.idealAtmosphere = 50;
        const game = createGameState(star, player);
        const item = createBuildItem({ project: 'terraform' });

        service.executeBuildProject(game, star, item);

        expect(star.temperature).toBe(41);
        expect(star.atmosphere).toBe(41);
      });

      it('should decrease temperature when above ideal', () => {
        const star = createStar({ temperature: 60, atmosphere: 60 });
        const player = createPlayer();
        player.species.habitat.idealTemperature = 50;
        player.species.habitat.idealAtmosphere = 50;
        const game = createGameState(star, player);
        const item = createBuildItem({ project: 'terraform' });

        service.executeBuildProject(game, star, item);

        expect(star.temperature).toBe(59);
        expect(star.atmosphere).toBe(59);
      });
    });

    describe('ship project', () => {
      it('should call fleet service to add ship with specified design', () => {
        const star = createStar();
        const game = createGameState(star);
        const item = createBuildItem({ project: 'ship', shipDesignId: 'destroyer' });

        service.executeBuildProject(game, star, item);

        expect(mockFleetService.addShipToFleet).toHaveBeenCalledWith(game, star, 'destroyer', 1);
      });

      it('should use scout as default ship design', () => {
        const star = createStar();
        const game = createGameState(star);
        const item = createBuildItem({ project: 'ship' });

        service.executeBuildProject(game, star, item);

        expect(mockFleetService.addShipToFleet).toHaveBeenCalledWith(game, star, 'scout', 1);
      });
    });

    describe('unknown project', () => {
      it('should handle unknown project types gracefully', () => {
        const star = createStar({ mines: 10 });
        const game = createGameState(star);
        const item = createBuildItem({ project: 'unknown' as any });

        expect(() => service.executeBuildProject(game, star, item)).not.toThrow();
        expect(star.mines).toBe(10); // Unchanged
      });
    });
  });

  describe('meetsRequirements', () => {
    it('should return true when no requirements', () => {
      const techLevels: PlayerTech = { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 };

      expect(service.meetsRequirements(techLevels, undefined)).toBe(true);
    });

    it('should return true when all requirements met', () => {
      const techLevels: PlayerTech = { Energy: 5, Kinetics: 3, Propulsion: 2, Construction: 4 };
      const requirements: TechRequirement = {
        Energy: 3,
        Kinetics: 2,
        Propulsion: 1,
        Construction: 4,
      };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(true);
    });

    it('should return false when energy requirement not met', () => {
      const techLevels: PlayerTech = { Energy: 2, Kinetics: 5, Propulsion: 5, Construction: 5 };
      const requirements: TechRequirement = { Energy: 3 };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(false);
    });

    it('should return false when kinetics requirement not met', () => {
      const techLevels: PlayerTech = { Energy: 5, Kinetics: 2, Propulsion: 5, Construction: 5 };
      const requirements: TechRequirement = { Kinetics: 3 };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(false);
    });

    it('should return false when propulsion requirement not met', () => {
      const techLevels: PlayerTech = { Energy: 5, Kinetics: 5, Propulsion: 2, Construction: 5 };
      const requirements: TechRequirement = { Propulsion: 3 };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(false);
    });

    it('should return false when construction requirement not met', () => {
      const techLevels: PlayerTech = { Energy: 5, Kinetics: 5, Propulsion: 5, Construction: 2 };
      const requirements: TechRequirement = { Construction: 3 };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(false);
    });

    it('should handle partial requirements', () => {
      const techLevels: PlayerTech = { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 };
      const requirements: TechRequirement = { Energy: 3 };

      expect(service.meetsRequirements(techLevels, requirements)).toBe(true);
    });
  });

  describe('findBestScannerRange', () => {
    it('should return 50 for base tech levels', () => {
      const techLevels: PlayerTech = { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(50); // Viewer 50 requires no tech
    });

    it('should return 90 for Energy 1', () => {
      const techLevels: PlayerTech = { Energy: 1, Kinetics: 0, Propulsion: 0, Construction: 0 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(90); // Viewer 90
    });

    it('should return 150 for Energy 3', () => {
      const techLevels: PlayerTech = { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(150); // Scoper 150
    });

    it('should return 220 for Energy 6', () => {
      const techLevels: PlayerTech = { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 0 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(220); // Scoper 220
    });

    it('should return 320 for Energy 10 + Construction 3', () => {
      const techLevels: PlayerTech = { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 3 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(320); // Snooper 320X
    });

    it('should return 620 for max tech levels', () => {
      const techLevels: PlayerTech = { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 9 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(620); // Snooper 620X
    });

    it('should not unlock advanced scanner without construction tech', () => {
      const techLevels: PlayerTech = { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 0 };

      const result = service.findBestScannerRange(techLevels);

      expect(result).toBe(280); // Scoper 280 (highest without construction requirement)
    });
  });
});
