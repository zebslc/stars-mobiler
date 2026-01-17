import { TestBed } from '@angular/core/testing';
import { StarbaseUpgradeService } from './starbase-upgrade.service';
import type { GameState, Star, BuildItem } from '../../models/game.model';

describe('StarbaseUpgradeService', () => {
  let service: StarbaseUpgradeService;

  const mockPlanet: Star = {
    id: 'planet-1',
    name: 'Test Planet',
    position: { x: 0, y: 0 },
    ownerId: 'player-1',
    population: 100000,
    maxPopulation: 1000000,
    resources: 1000,
    surfaceMinerals: { ironium: 1000, boranium: 800, germanium: 600 },
    mineralConcentrations: { ironium: 100, boranium: 80, germanium: 60 },
    mines: 50,
    factories: 100,
    defenses: 10,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
  };

  const mockGameState: GameState = {
    id: 'game-1',
    seed: 12345,
    turn: 1,
    settings: {} as any,
    stars: [mockPlanet],
    humanPlayer: {} as any,
    aiPlayers: [],
    fleets: [],
    shipDesigns: [],
    playerEconomy: { freighterCapacity: 0, research: 0 },
  };

  const mockBuildItem: BuildItem = {
    project: 'ship',
    shipDesignId: 'design-1',
    cost: { resources: 500, ironium: 100, boranium: 80, germanium: 60 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StarbaseUpgradeService],
    });
    service = TestBed.inject(StarbaseUpgradeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleStarbaseUpgrade', () => {
    it('should return empty upgrade info for non-ship projects', () => {
      const nonShipItem: BuildItem = {
        project: 'mine',
        cost: { resources: 100 },
      };

      const result = service.handleStarbaseUpgrade(mockGameState, mockPlanet, nonShipItem);

      expect(result.existingStarbaseIndex).toBe(-1);
      expect(result.scrapCredit.resources).toBe(0);
    });

    it('should handle ship project items', () => {
      const result = service.handleStarbaseUpgrade(mockGameState, mockPlanet, mockBuildItem);

      expect(result).toBeDefined();
      expect(typeof result.existingStarbaseIndex).toBe('number');
      expect(result.scrapCredit).toBeDefined();
    });

    it('should return valid scrap credit structure', () => {
      const result = service.handleStarbaseUpgrade(mockGameState, mockPlanet, mockBuildItem);

      expect(typeof result.scrapCredit.resources).toBe('number');
      expect(typeof result.scrapCredit.ironium).toBe('number');
      expect(typeof result.scrapCredit.boranium).toBe('number');
      expect(typeof result.scrapCredit.germanium).toBe('number');
    });

    it('should handle missing ship design', () => {
      const gameWithoutDesign: GameState = {
        ...mockGameState,
        shipDesigns: [],
      };

      const result = service.handleStarbaseUpgrade(gameWithoutDesign, mockPlanet, mockBuildItem);

      expect(result.existingStarbaseIndex).toBe(-1);
    });

    it('should handle non-starbase ship designs', () => {
      const nonStarbaseDesign = {
        id: 'design-1',
        name: 'Regular Ship',
        hullId: 'hull-1',
        playerId: 'player-1',
        createdTurn: 1,
        slots: [],
        spec: { isStarbase: false } as any,
      };

      const gameWithDesign: GameState = {
        ...mockGameState,
        shipDesigns: [nonStarbaseDesign],
      };

      const result = service.handleStarbaseUpgrade(gameWithDesign, mockPlanet, mockBuildItem);

      expect(result.existingStarbaseIndex).toBe(-1);
    });

    it('should calculate scrap credit for existing starbase', () => {
      const starbaseDesign = {
        id: 'design-1',
        name: 'Starbase',
        hullId: 'hull-1',
        playerId: 'player-1',
        createdTurn: 1,
        slots: [],
        spec: { isStarbase: true, cost: { ironium: 100, boranium: 80, germanium: 60, resources: 500 } } as any,
      };

      const gameWithStarbase: GameState = {
        ...mockGameState,
        shipDesigns: [starbaseDesign],
        fleets: [
          {
            id: 'fleet-1',
            name: 'Starbase Fleet',
            ownerId: 'player-1',
            location: { type: 'orbit', starId: 'planet-1' },
            ships: [
              { designId: 'design-1', count: 1, damage: 0 },
            ],
            fuel: 0,
            cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
            orders: [],
          },
        ],
      };

      const result = service.handleStarbaseUpgrade(gameWithStarbase, mockPlanet, mockBuildItem);

      expect(result).toBeDefined();
    });
  });
});

