import { TestBed } from '@angular/core/testing';
import { FleetService } from './fleet.service';
import { SettingsService } from './settings.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';
import { GameState, Player, Planet, Fleet, ShipDesign } from '../models/game.model';

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
});
