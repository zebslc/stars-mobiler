import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GalaxyFleetFilterService } from './galaxy-fleet-filter.service';
import { GameStateService } from '../../../services/game/game-state.service';
import { SettingsService } from '../../../services/core/settings.service';
import { GalaxyFleetStationService } from './galaxy-fleet-station.service';
import { Fleet, GameState, Player } from '../../../models/game.model';

describe('GalaxyFleetFilterService', () => {
  let service: GalaxyFleetFilterService;
  const player: Player = {
    id: 'player-1',
    name: 'Player',
    species: {} as any,
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
  };

  const fleets: Fleet[] = [
    {
      id: 'fleet-1',
      name: 'Scout Wing',
      ownerId: 'player-2',
      location: { type: 'space', x: 10, y: 20 },
      ships: [{ designId: 'scout', count: 5, damage: 0 }],
      fuel: 100,
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      orders: [],
    },
    {
      id: 'fleet-2',
      name: 'Starbase',
      ownerId: 'player-2',
      location: { type: 'orbit', starId: 'star-1' },
      ships: [{ designId: 'space_station', count: 1, damage: 0 }],
      fuel: 100,
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
    humanPlayer: player,
    aiPlayers: [],
    fleets,
    playerEconomy: {} as any,
    shipDesigns: [],
  };

  const gameSignal = signal<GameState | null>(gameState);
  const playerSignal = signal<Player | null>(player);
  const filterSignal = signal<Set<string>>(new Set(['warship']));
  const showEnemySignal = signal<boolean>(false);

  beforeEach(() => {
    gameSignal.set(gameState);
    playerSignal.set(player);
    filterSignal.set(new Set(['warship']));
    showEnemySignal.set(false);

    const stationSpy = jasmine.createSpy('isStation').and.callFake((fleetParam: Fleet) => {
      return fleetParam.id === 'fleet-2';
    });

    TestBed.configureTestingModule({
      providers: [
        GalaxyFleetFilterService,
        { provide: GameStateService, useValue: { game: gameSignal, player: playerSignal } },
        {
          provide: SettingsService,
          useValue: {
            fleetFilter: filterSignal,
            showEnemyFleets: showEnemySignal,
          },
        },
        { provide: GalaxyFleetStationService, useValue: { isStation: stationSpy } },
      ],
    });

    service = TestBed.inject(GalaxyFleetFilterService);
  });

  it('filters out stations and zero-count fleets', () => {
    const visible = service.filteredFleets();
    expect(visible.length).toBe(1);
    expect(visible[0].id).toBe('fleet-1');
  });

  it('excludes friendly fleets when showing enemies only', () => {
    const enemyFleet: Fleet = {
      ...fleets[0],
      id: 'fleet-friendly',
      ownerId: 'player-1',
      ships: [{ designId: 'scout', count: 3, damage: 0 }],
    };

    gameSignal.set({ ...gameState, fleets: [enemyFleet] });
    showEnemySignal.set(true);

    const visible = service.filteredFleets();
    expect(visible.length).toBe(0);
  });
});
