import { TestBed } from '@angular/core/testing';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { GalaxyWaypointOrderService } from './galaxy-waypoint-order.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyWaypointStateService } from './galaxy-waypoint-state.service';
import type { DraggedWaypoint, SnapTarget } from './galaxy-waypoint.models';
import type {
  Fleet,
  FleetOrder,
  GameSettings,
  GameState,
  Player,
  PlayerEconomy,
  Species,
  Star,
} from '../../../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../../../models/fleet-order.constants';

class WaypointStateStub implements Partial<GalaxyWaypointStateService> {
  readonly draggedWaypoint = signal<DraggedWaypoint | null>(null);
  readonly snapTarget = signal<SnapTarget | null>(null);
  readonly navigationModeFleetId = signal<string | null>(null);
  readonly clearDragState = jasmine
    .createSpy('clearDragState')
    .and.callFake(() => {
      this.draggedWaypoint.set(null);
      this.snapTarget.set(null);
    });
  readonly setNavigationMode = jasmine
    .createSpy('setNavigationMode')
    .and.callFake((fleetId: string | null) => {
      this.navigationModeFleetId.set(fleetId);
    });
}

describe('GalaxyWaypointOrderService', () => {
  let service: GalaxyWaypointOrderService;
  let setFleetOrders: jasmine.Spy;
  let logging: jasmine.SpyObj<LoggingService>;
  let state: WaypointStateStub;
  let gameSignal: WritableSignal<GameState | null>;
  let playerSignal: WritableSignal<Player | undefined>;

  const species: Species = {
    id: 'species-1',
    name: 'Humans',
    habitat: { idealTemperature: 0, idealAtmosphere: 0, toleranceRadius: 100 },
    traits: [],
  };

  const player: Player = {
    id: 'player-1',
    name: 'Admiral',
    species,
    ownedStarIds: [],
    techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
  };

  const settings: GameSettings = {
    galaxySize: 'small',
    aiCount: 0,
    aiDifficulty: 'easy',
    seed: 1,
    speciesId: species.id,
  };

  const playerEconomy: PlayerEconomy = {
    freighterCapacity: 0,
    research: 0,
  };

  function buildFleet(overrides: Partial<Fleet>): Fleet {
    return {
      id: 'fleet-1',
      name: 'Survey',
      ownerId: player.id,
      location: { type: 'space', x: 0, y: 0 },
      ships: [],
      fuel: 0,
      cargo: {
        resources: 0,
        colonists: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
      },
      orders: [],
      ...overrides,
    };
  }

  function buildGame(fleets: Array<Fleet>, stars: Array<Star> = []): GameState {
    return {
      id: 'game-1',
      seed: 1,
      turn: 1,
      settings,
      stars,
      humanPlayer: player,
      aiPlayers: [],
      fleets,
      playerEconomy,
      shipDesigns: [],
    };
  }

  beforeEach(() => {
    gameSignal = signal<GameState | null>(buildGame([]));
    playerSignal = signal<Player | undefined>(player);
    setFleetOrders = jasmine.createSpy('setFleetOrders');

    logging = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    state = new WaypointStateStub();

    const gameStateStub: Pick<GameStateService, 'game' | 'player' | 'setFleetOrders'> = {
      game: gameSignal,
      player: playerSignal,
      setFleetOrders,
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyWaypointOrderService,
        { provide: GameStateService, useValue: gameStateStub },
        { provide: LoggingService, useValue: logging },
        { provide: GalaxyWaypointStateService, useValue: state },
      ],
    });

    service = TestBed.inject(GalaxyWaypointOrderService);
  });

  it('finalizeWaypoint merges orbit order with existing warp speed', () => {
    const star: Star = {
      id: 'star-1',
      name: 'Rigel',
      position: { x: 100, y: 200 },
      temperature: 0,
      atmosphere: 0,
      mineralConcentrations: { ironium: 0, boranium: 0, germanium: 0 },
      surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
      ownerId: null,
      population: 0,
      maxPopulation: 0,
      mines: 0,
      factories: 0,
      defenses: 0,
      research: 0,
      scanner: 0,
      terraformOffset: { temperature: 0, atmosphere: 0 },
      resources: 0,
    };

    const fleet = buildFleet({
      id: 'fleet-merge',
      orders: [
        {
          type: FLEET_ORDER_TYPE.MOVE,
          destination: { x: 50, y: 60 },
          warpSpeed: 7,
        },
      ],
    });

    const gameWithStar = buildGame([fleet], [star]);
    gameSignal.set(gameWithStar);

    state.draggedWaypoint.set({
      fleetId: 'fleet-merge',
      startX: 10,
      startY: 20,
      currentX: 40,
      currentY: 50,
      orderIndex: 0,
    });

    state.snapTarget.set({ type: 'star', id: 'star-1', x: 100, y: 200 });

    const result = service.finalizeWaypoint();

    const expectedOrder: FleetOrder = {
      type: FLEET_ORDER_TYPE.ORBIT,
      starId: 'star-1',
      warpSpeed: 7,
    };

    expect(setFleetOrders).toHaveBeenCalledWith('fleet-merge', [expectedOrder]);
    expect(state.clearDragState).toHaveBeenCalled();
    expect(result).toEqual({
      fleetId: 'fleet-merge',
      orderIndex: 0,
      order: expectedOrder,
    });
  });

  it('setWaypointSpeed cycles warp speed for move orders', () => {
    const fleet = buildFleet({
      id: 'fleet-speed',
      orders: [
        {
          type: FLEET_ORDER_TYPE.MOVE,
          destination: { x: 10, y: 10 },
          warpSpeed: 9,
        },
      ],
    });

    gameSignal.set(buildGame([fleet]));

    service.setWaypointSpeed('fleet-speed', 0);

    expect(setFleetOrders).toHaveBeenCalledWith('fleet-speed', [
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 10, y: 10 },
        warpSpeed: 1,
      },
    ]);
  });

  it('setWaypointSpeed ignores colonize orders', () => {
    const fleet = buildFleet({
      id: 'fleet-colonize',
      orders: [
        {
          type: FLEET_ORDER_TYPE.COLONIZE,
          starId: 'star-1',
        },
      ],
    });

    gameSignal.set(buildGame([fleet]));

    service.setWaypointSpeed('fleet-colonize', 0);

    expect(setFleetOrders).not.toHaveBeenCalled();
  });

  it('deleteWaypoint removes the targeted order', () => {
    const fleet = buildFleet({
      id: 'fleet-delete',
      orders: [
        {
          type: FLEET_ORDER_TYPE.MOVE,
          destination: { x: 1, y: 1 },
        },
        {
          type: FLEET_ORDER_TYPE.MOVE,
          destination: { x: 2, y: 2 },
        },
      ],
    });

    gameSignal.set(buildGame([fleet]));

    service.deleteWaypoint('fleet-delete', 0);

    expect(setFleetOrders).toHaveBeenCalledWith('fleet-delete', [
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 2, y: 2 },
      },
    ]);
  });
});
