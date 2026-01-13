import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet.service';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';
import { GameState, Player, Fleet, ShipDesign, Star } from '../models/game.model';

describe('FleetService Movement', () => {
  let service: FleetService;
  let mockSettingsService: any;
  let mockHabitabilityService: any;
  let mockShipyardService: any;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    ownedPlanetIds: [],
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy'
  };

  const mockDesign: ShipDesign = {
    id: 'test-ship',
    name: 'Test Ship',
    hullId: 'Scout',
    slots: [],
    createdTurn: 0,
    playerId: 'p1',
    spec: {
        cost: { resources: 0 },
        isStarbase: false,
        mass: 100, // 100kT
        fuelCapacity: 1000,
        fuelEfficiency: 100, // Standard efficiency
        warpSpeed: 10,
        idealWarp: 6,
        hasColonyModule: false
    } as any
  };

  beforeEach(() => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [], {
      game: {}
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

  function createGame(fleetFuel: number, dist: number): GameState {
    const fleet: Fleet = {
        id: 'f1',
        ownerId: 'p1',
        name: 'Fleet 1',
        location: { type: 'space', x: 0, y: 0 },
        ships: [{ designId: 'test-ship', count: 1, damage: 0 }],
        cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
        fuel: fleetFuel,
        orders: [{ type: 'move', destination: { x: dist, y: 0 } }]
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
        shipDesigns: [mockDesign],
        playerEconomy: { freighterCapacity: 0, research: 0 }
    };
  }

  // Helper to calculate fuel cost (duplicating logic for verification)
  function calculateCost(mass: number, dist: number, warp: number, ideal: number, eff: number): number {
      const basePerLy = mass / 100;
      const speedRatio = warp / ideal;
      const speedMultiplier = speedRatio <= 1 ? 1 : Math.pow(speedRatio, 2.5);
      const efficiencyMultiplier = eff / 100;
      return Math.ceil(basePerLy * speedMultiplier * efficiencyMultiplier) * dist;
  }

  it('should travel at max speed if fuel allows', () => {
      const dist = 100;
      // Cost at Warp 10: 100/100 * (10/6)^2.5 * 1 = 1 * 3.59 * 1 = ~3.6 per LY. Total 360.
      // Let's give 500 fuel.
      const game = createGame(500, dist);
      
      service.processFleets(game);

      const fleet = game.fleets[0];
      // Should arrive
      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
          expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0); // Order completed
      // Fuel used should be based on Warp 10
      // Expected cost: ceil(1 * (10/6)^2.5 * 1) = ceil(3.59) = 4 per LY? 
      // Math.pow(10/6, 2.5) = 3.59. 1 * 3.59 = 3.59. Ceil -> 4.
      // Total 400.
      expect(fleet.fuel).toBeCloseTo(500 - 400, -1); // Allow some rounding diffs if my manual calc is off
  });

  it('should reduce speed to reach destination if fuel is insufficient at max speed', () => {
      const dist = 100;
      // Cost at Warp 10: ~400.
      // Cost at Warp 6 (Ideal): 1 * 1 * 1 = 1 per LY. Total 100.
      // Give 200 fuel. Enough for Warp 6, not for Warp 10.
      
      const game = createGame(200, dist);
      
      service.processFleets(game);

      const fleet = game.fleets[0];
      // Should arrive
      expect(fleet.location.type).toBe('space');
      if (fleet.location.type === 'space') {
          expect(fleet.location.x).toBe(100);
      }
      expect(fleet.orders.length).toBe(0); // Order completed
      
      // Fuel used should be less than 200.
      // It should pick highest speed possible.
      // Warp 8: (8/6)^2.5 = 2.05 -> ceil(2.05) = 3 per LY. 300 > 200. No.
      // Warp 7: (7/6)^2.5 = 1.49 -> ceil(1.49) = 2 per LY. 200 <= 200. Yes!
      // So it should pick Warp 7. Cost 200.
      // Remaining fuel ~0.
      expect(fleet.fuel).toBeGreaterThanOrEqual(0);
      expect(fleet.fuel).toBeLessThan(100); // Should use significant fuel
  });

  it('should not reduce speed below ideal warp', () => {
      const dist = 100;
      // Cost at Warp 6 (Ideal): 100.
      // Give 50 fuel. Not enough even at ideal warp.
      
      const game = createGame(50, dist);
      
      service.processFleets(game);

      const fleet = game.fleets[0];
      
      // Should NOT arrive (or at least order not complete)
      expect(fleet.orders.length).toBe(1);
      
      // Should have traveled some distance at optimal speed (Ideal Warp = 6)
      // Per turn distance at Warp 6 = 120 (6 * 20).
      // But restricted by fuel.
      // Cost per LY at Warp 6 = 1.
      // Max LY = 50.
      // So it should travel 50 LY and run out of fuel.
      
      if (fleet.location.type === 'space') {
          expect(fleet.location.x).toBe(50);
      }
      expect(fleet.fuel).toBe(0);
  });
});
