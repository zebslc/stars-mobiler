import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GalaxyFleetStationService } from './galaxy-fleet-station.service';
import { GameStateService } from '../../../services/game/game-state.service';
import { Fleet, GameState, ShipDesign } from '../../../models/game.model';

describe('GalaxyFleetStationService', () => {
  let service: GalaxyFleetStationService;

  const customDesign: ShipDesign = {
    id: 'design-station',
    name: 'Custom Station',
    hullId: 'custom-hull',
    createdTurn: 1,
    playerId: 'player-1',
    slots: [],
    spec: {
      warpSpeed: 0,
      fuelCapacity: 0,
      fuelEfficiency: 100,
      idealWarp: 0,
      isRamscoop: false,
      firepower: 0,
      maxWeaponRange: 0,
      armor: 0,
      shields: 0,
      accuracy: 0,
      initiative: 0,
      cargoCapacity: 0,
      colonistCapacity: 0,
      scanRange: 0,
      penScanRange: 0,
      canDetectCloaked: false,
      miningRate: 0,
      terraformRate: 0,
      bombing: { kill: 0, destroy: 0 },
      massDriver: { speed: 0, catch: 0 },
      mass: 100,
      cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
      hasEngine: false,
      hasColonyModule: false,
      isStarbase: true,
      isValid: true,
      validationErrors: [],
      components: [],
    },
  };

  const fleets: Fleet[] = [
    {
      id: 'fleet-custom',
      name: 'Custom Base',
      ownerId: 'player-1',
      location: { type: 'orbit', starId: 'star-1' },
      ships: [{ designId: 'design-station', count: 1, damage: 0 }],
      fuel: 0,
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      orders: [],
    },
    {
      id: 'fleet-compiled',
      name: 'Compiled Base',
      ownerId: 'player-1',
      location: { type: 'orbit', starId: 'star-2' },
      ships: [{ designId: 'space_station', count: 1, damage: 0 }],
      fuel: 0,
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      orders: [],
    },
    {
      id: 'fleet-mobile',
      name: 'Scout Wing',
      ownerId: 'player-1',
      location: { type: 'space', x: 10, y: 10 },
      ships: [{ designId: 'scout', count: 1, damage: 0 }],
      fuel: 0,
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      orders: [],
    },
  ];

  const gameState: GameState = {
    id: 'game-1',
    seed: 0,
    turn: 1,
    settings: {} as any,
    stars: [] as any,
    humanPlayer: {} as any,
    aiPlayers: [],
    fleets,
    playerEconomy: {} as any,
    shipDesigns: [customDesign],
  };

  const gameSignal = signal<GameState | null>(gameState);

  beforeEach(() => {
    gameSignal.set(gameState);

    TestBed.configureTestingModule({
      providers: [
        GalaxyFleetStationService,
        { provide: GameStateService, useValue: { game: gameSignal } },
      ],
    });

    service = TestBed.inject(GalaxyFleetStationService);
  });

  it('identifies custom starbase designs', () => {
    const result = service.isStation(fleets[0]);
    expect(result).toBeTrue();
  });

  it('builds a station map with resolved names', () => {
    const map = service.stationByStarId();
    expect(map.get('star-1')).toBe('Custom Station');
    expect(map.get('star-2')).toBe('Space Station');
  });

  it('returns false for mobile fleets', () => {
    expect(service.isStation(fleets[2])).toBeFalse();
  });
});
