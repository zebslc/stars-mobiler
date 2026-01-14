import { TestBed } from '@angular/core/testing';
import { GalaxyVisibilityService } from './galaxy-visibility.service';
import { GameStateService } from '../../../services/game/game-state.service';
import { SettingsService } from '../../../services/core/settings.service';
import { GalaxyFleetService } from './galaxy-fleet.service';
import { Fleet, GameState, Player, ShipDesign, Star } from '../../../models/game.model';
import { signal } from '@angular/core';

describe('GalaxyVisibilityService', () => {
  let service: GalaxyVisibilityService;
  let mockGameStateService: any;
  let mockSettingsService: any;
  let mockGalaxyFleetService: any;

  const mockPlayer: Player = {
    id: 'p1',
    name: 'Human',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'star1',
    name: 'Test Star',
    position: { x: 100, y: 100 },
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
    scanner: 0,
    research: 0,
    ...overrides,
  });

  const mockStar: Star = createStar({
    id: 'star1',
    name: 'Sol',
    position: { x: 100, y: 100 },
  });

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
      scanRange: 50, // 50 ly scanner
      canDetectCloaked: false,
    } as any,
  };

  const mockFleet: Fleet = {
    id: 'fleet1',
    name: 'Scout Fleet',
    ownerId: 'p1',
    location: { type: 'orbit', starId: 'star1' },
    ships: [{ designId: 'scout', count: 1, damage: 0 }],
    fuel: 100,
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    orders: [],
  };

  beforeEach(() => {
    mockGameStateService = {
      game: signal<GameState>({
        id: 'game1',
        seed: 123,
        turn: 1,
        settings: {} as any,
        stars: [mockStar],
        humanPlayer: mockPlayer,
        aiPlayers: [],
        fleets: [mockFleet],
        playerEconomy: {} as any,
        shipDesigns: [mockDesign],
      }),
      stars: signal([mockStar]),
      player: signal(mockPlayer),
    };

    mockSettingsService = {
      showScannerRanges: signal(true),
      scannerRangePct: signal(100),
      showCloakedRanges: signal(true),
    };

    mockGalaxyFleetService = {
      getFleetPosition: (f: Fleet) => {
        if (f.location.type === 'orbit') {
          return { x: 100, y: 100 }; // Star position
        }
        return null;
      },
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyVisibilityService,
        GalaxyFleetService,
        { provide: GameStateService, useValue: mockGameStateService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    });
    service = TestBed.inject(GalaxyVisibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate fleet scan capabilities correctly', () => {
    const caps = service.getFleetScanCapabilities(mockFleet);
    expect(caps.scanRange).toBe(50);
  });

  it('should show scanner ring for fleet in orbit', () => {
    const ranges = service.scannerRanges();
    expect(ranges.length).toBeGreaterThan(0);
    const fleetRange = ranges.find((r) => r.type === 'fleet');
    expect(fleetRange).toBeDefined();
    expect(fleetRange?.r).toBe(50);
    expect(fleetRange?.x).toBe(100);
    expect(fleetRange?.y).toBe(100);
  });
});
