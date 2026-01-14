import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet.service';
import { SettingsService } from '../core/settings.service';
import { HabitabilityService } from '../colony/habitability.service';
import { ShipyardService } from '../ship-design/shipyard.service';
import { GameState, Player, Fleet, ShipDesign, Star } from '../../models/game.model';

describe('FleetService Orbit Order', () => {
  let service: FleetService;
  let mockSettingsService: any;
  let mockHabitabilityService: any;
  let mockShipyardService: any;

  beforeEach(() => {
    mockSettingsService = jasmine.createSpyObj('SettingsService', [], {
      game: {
        fleets: [],
        designs: [],
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

  function createGameWithPlanet(dist: number): GameState {
    const mockPlayer: Player = {
      id: 'p1',
      name: 'Human',
      species: {} as any,
      techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
      researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
      selectedResearchField: 'Energy',
      ownedStarIds: [],
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
        mass: 100,
        fuelCapacity: 2000,
        fuelEfficiency: 100,
        warpSpeed: 10,
        idealWarp: 6,
        hasColonyModule: false,
      } as any,
    };

    const planet: Star = {
      id: 'planet1',
      name: 'Planet 1',
      position: { x: 0, y: 0 },
      ownerId: 'p1',
      temperature: 50,
      atmosphere: 50,
      population: 0,
      maxPopulation: 1000,
      surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
      mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
      resources: 0,
      factories: 0,
      mines: 0,
      defenses: 0,
      scanner: 0,
      research: 0,
      terraformOffset: { temperature: 0, atmosphere: 0 },
      buildQueue: []
    };

    const star: Star = {
      id: 'star1',
      name: 'Star 1',
      position: { x: dist, y: 0 },
      temperature: 50,
      atmosphere: 50,
      mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
      surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
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
      buildQueue: []
    };

    const fleet: Fleet = {
      id: 'f1',
      ownerId: 'p1',
      name: 'Fleet 1',
      location: { type: 'space', x: 0, y: 0 },
      ships: [{ designId: 'test-ship', count: 1, damage: 0 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 2000,
      orders: [{ type: 'orbit', starId: 'planet1' }],
    };

    return {
      id: 'game1',
      seed: 123,
      turn: 1,
      settings: {} as any,
      stars: [star],
      humanPlayer: mockPlayer,
      aiPlayers: [],
      fleets: [fleet],
      shipDesigns: [mockDesign],
      playerEconomy: { freighterCapacity: 0, research: 0 },
    };
  }

  it('should move towards planet when orbit order is given', () => {
    const dist = 100;
    const game = createGameWithPlanet(dist);
    const fleet = game.fleets[0];

    service.processFleets(game);

    // Should arrive in one turn (speed 10 * 20 = 200 > 100)
    expect(fleet.location.type).toBe('orbit');
    if (fleet.location.type === 'orbit') {
      expect(fleet.location.starId).toBe('planet1');
    }
    expect(fleet.orders.length).toBe(0);
  });

  it('should move partially if distance is far', () => {
    const dist = 300; // > 200 (max speed 10 * 20)
    const game = createGameWithPlanet(dist);
    const fleet = game.fleets[0];

    service.processFleets(game);

    // Should move 200 LY
    expect(fleet.location.type).toBe('space');
    if (fleet.location.type === 'space') {
      expect(fleet.location.x).toBe(200);
      expect(fleet.location.y).toBe(0);
    }
    // Order remains
    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0].type).toBe('orbit');
  });

  it('should clear order if already in orbit', () => {
    const dist = 0;
    const game = createGameWithPlanet(dist);
    const fleet = game.fleets[0];
    fleet.location = { type: 'orbit', starId: 'planet1' };

    service.processFleets(game);

    expect(fleet.orders.length).toBe(0);
    expect(fleet.location.type).toBe('orbit');
    expect((fleet.location as any).starId).toBe('planet1');
  });

  it('should inject colonize order if already at planet with action=colonize', () => {
    const game = createGameWithPlanet(0);
    const fleet = game.fleets[0];
    const planet = game.stars[0];

    fleet.location = { type: 'orbit', starId: planet.id };
    fleet.orders = [{ type: 'orbit', starId: planet.id, action: 'colonize' }];

    service.processFleets(game);

    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0].type).toBe('colonize');
    expect((fleet.orders[0] as any).starId).toBe(planet.id);
  });

  it('should inject colonize order upon arriving at planet with action=colonize', () => {
    const game = createGameWithPlanet(10);
    const fleet = game.fleets[0];
    const planet = game.stars[0];

    fleet.orders = [{ type: 'orbit', starId: planet.id, action: 'colonize', warpSpeed: 9 }];

    service.processFleets(game);

    expect(fleet.location.type).toBe('orbit');
    expect((fleet.location as any).starId).toBe(planet.id);

    expect(fleet.orders.length).toBe(1);
    expect(fleet.orders[0].type).toBe('colonize');
  });
});
