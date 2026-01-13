import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet.service';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';
import { GameState, Player, Fleet, ShipDesign, Star } from '../models/game.model';
import { ENGINE_COMPONENTS } from '../data/techs/engines.data';

describe('FleetService Movement NEW', () => {
  let service: FleetService;
  let mockSettingsService: any;
  let mockHabitabilityService: any;
  let mockShipyardService: any;

  beforeEach(() => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [], {
      game: {
        fleets: [],
        designs: [],
        planets: [],
      },
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
    const mockPlayer: Player = {
      id: 'p1',
      name: 'Human',
      species: {} as any,
      techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
      ownedPlanetIds: [],
      researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
      selectedResearchField: 'Energy',
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
        hasColonyModule: false,
      } as any,
    };

    const fleet: Fleet = {
      id: 'f1',
      ownerId: 'p1',
      name: 'Fleet 1',
      location: { type: 'space', x: 0, y: 0 },
      ships: [{ designId: 'test-ship', count: 1, damage: 0 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: fleetFuel,
      orders: [{ type: 'move', destination: { x: dist, y: 0 } }],
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
      playerEconomy: { freighterCapacity: 0, research: 0 },
    };
  }

  it('should travel at Warp 2 with Quick Jump 5 engine for 100 LY (cost < 50 fuel)', () => {
    // 1. Setup specific mock data for this test
    // Setup Scout with Quick Jump 5
    // Mass 8 (Hull) + 4 (Engine) = 12 kT
    // Quick Jump 5 at Warp 2 = 25 mg/engine/LY (Table value)
    // Stars! Formula: (Mass * Dist * TableVal) / 2000
    // Cost = (12 * 100 * 25) / 2000 = 30000 / 2000 = 15 fuel.
    // Scout Max Fuel = 50.
    // 15 < 50, so it should work.

    const dist = 100;
    const game = createGame(50, dist);
    const fleet = game.fleets[0];

    const design = game.shipDesigns[0];
    design.hullId = 'hull-scout'; // Scout
    (design.spec as any).mass = 12; // 8 + 4
    (design.spec as any).fuelCapacity = 50;

    // Use slots to ensure proper engine lookup
    design.slots = [
      {
        slotId: '1',
        components: [
          {
            componentId: 'eng_quick_jump_5',
            count: 1,
          },
        ],
      },
    ];

    // Set order to Warp 2
    (fleet.orders[0] as any).warpSpeed = 2;

    service.processFleets(game);

    // Expect to arrive
    if (fleet.location.type === 'space') {
      expect(fleet.location.x).toBe(40); // Warp 2 * 20 = 40 LY per turn
    }

    // Fuel used:
    // 40 LY traveled.
    // Cost = (12 * 40 * 25) / 2000 = 12000 / 2000 = 6.
    // Remaining = 50 - 6 = 44.
    expect(fleet.fuel).toBe(44);
  });

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
    // Expected cost: 1 * (10/6)^2.5 * 1 = 3.59 per LY.
    // Total cost for 100 LY = 359.
    // Remaining: 500 - 359 = 141.
    expect(fleet.fuel).toBeCloseTo(141, -1);
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

  it('should reduce speed to 1 if fuel is insufficient even at ideal warp', () => {
    const dist = 100;
    // Cost at Warp 6 (Ideal): 100.
    // Give 50 fuel. Not enough even at ideal warp.

    const game = createGame(50, dist);

    service.processFleets(game);

    const fleet = game.fleets[0];

    // Should NOT arrive (or at least order not complete)
    expect(fleet.orders.length).toBe(1);

    // Since we can't reach the destination at any speed with current fuel,
    // the logic falls back to Warp 1 to conserve fuel per turn (giving player time to react).
    // Per turn distance at Warp 1 = 20.
    // Cost per LY at Warp 1 = 1.
    // Fuel used = 20 * 1 = 20.
    // Remaining fuel = 50 - 20 = 30.

    if (fleet.location.type === 'space') {
      expect(fleet.location.x).toBe(20);
    }
    expect(fleet.fuel).toBe(30);
  });
});
