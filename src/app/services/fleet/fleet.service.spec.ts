import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet.service';
import { SettingsService } from '../core/settings.service';
import { HabitabilityService } from '../colony/habitability.service';
import { ShipyardService } from '../ship-design/shipyard.service';
import { GameState, Player, Planet, Fleet, ShipDesign } from '../../models/game.model';

describe('FleetService', () => {
  let service: FleetService;
  let mockSettingsService: any;
  let mockHabitabilityService: any;
  let mockShipyardService: any;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    ownedPlanetIds: ['planet1'],
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy'
  };

  const mockPlanet: Planet = {
    id: 'planet1',
    name: 'Earth',
    starId: 'star1',
    ownerId: 'p1',
    population: 10000,
    maxPopulation: 1000000,
    resources: 1000,
    surfaceMinerals: { ironium: 1000, boranium: 1000, germanium: 1000 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    mines: 10,
    factories: 10,
    defenses: 0,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    buildQueue: [],
    scanner: 0,
    research: 0
  };

  const mockDesign: ShipDesign = {
    id: 'scout',
    name: 'Scout',
    hullId: 'Scout',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: {
        cost: { resources: 50, ironium: 10, boranium: 0, germanium: 0 },
        isStarbase: false,
        mass: 10,
        fuelCapacity: 100
    } as any
  };

  beforeEach(() => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [], {
      game: {
        
      }
    });
    mockHabitabilityService = jasmine.createSpyObj('HabitabilityService', ['getGrowthRate']);
    mockShipyardService = jasmine.createSpyObj('ShipyardService', ['getShipCost']);

    TestBed.configureTestingModule({
      providers: [
        FleetService,
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: HabitabilityService, useValue: mockHabitabilityService },
        { provide: ShipyardService, useValue: mockShipyardService },
      ],
    });
    service = TestBed.inject(FleetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Fleet Limits', () => {
    let mockGame: GameState;

    beforeEach(() => {
      mockGame = {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [],
        shipDesigns: [mockDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 }
      };
    });

    it('should throw error when creating fleet exceeds 512 fleets', () => {
      // Fill up fleets to limit
      for (let i = 0; i < 512; i++) {
        mockGame.fleets.push({
          id: `f${i}`,
          ownerId: 'p1',
          name: `Fleet ${i}`,
          location: { type: 'orbit', planetId: 'planet1' },
          ships: [],
          cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
          fuel: 0,
          orders: []
        });
      }

      expect(() => {
        service.createFleet(mockGame, { type: 'orbit', planetId: 'planet1' }, 'p1', 'scout');
      }).toThrowError(/Maximum of 512 fleets/);
    });

    it('should throw error when adding ships exceeds 32000 per design', () => {
        // Create a fleet with max ships
        const fleet: Fleet = {
            id: 'f1',
            ownerId: 'p1',
            name: 'Fleet 1',
            location: { type: 'orbit', planetId: 'planet1' },
            ships: [{ designId: 'scout', count: 32000, damage: 0 }],
            cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
            fuel: 0,
            orders: []
        };
        mockGame.fleets.push(fleet);

        expect(() => {
            service.addShipToFleet(mockGame, mockPlanet, 'scout', 1);
        }).toThrowError(/Max: 32000/);
    });

    it('should allow adding ships up to limit', () => {
         const fleet: Fleet = {
            id: 'f1',
            ownerId: 'p1',
            name: 'Fleet 1',
            location: { type: 'orbit', planetId: 'planet1' },
            ships: [{ designId: 'scout', count: 31999, damage: 0 }],
            cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
            fuel: 0,
            orders: []
        };
        mockGame.fleets.push(fleet);

        service.addShipToFleet(mockGame, mockPlanet, 'scout', 1);
        
        const stack = fleet.ships.find(s => s.designId === 'scout');
        expect(stack?.count).toBe(32000);
    });
  });

  describe('Movement Logic', () => {
    const movementDesign: ShipDesign = {
      id: 'move-ship',
      name: 'Move Ship',
      hullId: 'Scout',
      slots: [],
      createdTurn: 0,
      playerId: 'p1',
      spec: {
        cost: { resources: 0 },
        isStarbase: false,
        mass: 100,
        fuelCapacity: 1000,
        fuelEfficiency: 100,
        warpSpeed: 10,
        idealWarp: 6,
        hasColonyModule: false,
      } as any,
    };

    function createGame(fleetFuel: number, dist: number, orderSpeed?: number): GameState {
      const fleet: Fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Fleet 1',
        location: { type: 'space', x: 0, y: 0 },
        ships: [{ designId: 'move-ship', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: fleetFuel,
        orders: [{ type: 'move', destination: { x: dist, y: 0 }, warpSpeed: orderSpeed }],
      };

      return {
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [fleet],
        shipDesigns: [movementDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 },
      };
    }

    it('should travel at max speed if fuel allows', () => {
      const game = createGame(500, 100);
      service.processFleets(game);
      const fleet = game.fleets[0];
      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      // Warp 10 cost ~3.6/ly -> 360 total.
      expect(fleet.fuel).toBeLessThan(200);
    });

    it('should reduce speed to reach destination if fuel is insufficient at max speed', () => {
      const game = createGame(200, 100);
      service.processFleets(game);
      const fleet = game.fleets[0];
      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      // Should use Warp 7 (cost ~2/ly = 200). Warp 8 cost ~300.
      // Fuel used: ~146. Remaining: ~54.
      expect(fleet.fuel).toBeLessThan(60);
    });

    it('should respect requested warp speed if sufficient fuel', () => {
      // Request Warp 5. Ideal is 6.
      // Cost at Warp 5 is same as Warp 6 (1/ly).
      // Total cost 100.
      const game = createGame(500, 100, 5);
      service.processFleets(game);
      const fleet = game.fleets[0];

      // Travel at Warp 5 = 100ly/turn (5*20).
      // Arrives.
      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      // Fuel used: 100. Remainder: 400.
      expect(fleet.fuel).toBeCloseTo(400, -1);
    });

    it('should respect requested warp speed but reduce if fuel insufficient', () => {
      // Request Warp 9. Cost ~3/ly?
      // Warp 9: (9/6)^2.5 = 2.75 -> 3/ly. Total 300.
      // Give 200 fuel. Not enough for Warp 9.
      // Can do Warp 7 (cost 200).
      const game = createGame(200, 100, 9);
      service.processFleets(game);
      const fleet = game.fleets[0];

      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
        expect(fleet.location.x).toBe(100);
      }
      // Should use Warp 7. Fuel ~54.
      expect(fleet.fuel).toBeLessThan(60);
    });
  });
});
