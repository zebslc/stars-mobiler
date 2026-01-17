import { TestBed } from '@angular/core/testing';
import type { WritableSignal } from '@angular/core';
import { signal } from '@angular/core';
import { GalaxyWaypointStateService } from './galaxy-waypoint-state.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyFleetPositionService } from '../fleet/galaxy-fleet-position.service';
import { GalaxyWaypointVisualService } from './galaxy-waypoint-visual.service';
import type {
  Fleet,
  FleetOrder,
  GameSettings,
  GameState,
  Player,
  PlayerEconomy,
  ShipDesign,
  Species,
  Star,
} from '../../../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../../../models/fleet-order.constants';

interface FleetPositionMap {
  [fleetId: string]: { x: number; y: number };
}

describe('GalaxyWaypointStateService', () => {
  let service: GalaxyWaypointStateService;
  let logging: jasmine.SpyObj<LoggingService>;
  let visual: jasmine.SpyObj<GalaxyWaypointVisualService>;
  let fleetPositions: jasmine.SpyObj<GalaxyFleetPositionService>;
  let positionMap: FleetPositionMap;
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

  const design: ShipDesign = {
    id: 'design-1',
    name: 'Scout',
    hullId: 'hull',
    slots: [],
    createdTurn: 0,
    playerId: player.id,
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

  beforeEach(() => {
    positionMap = {};
    const baseGame: GameState = {
      id: 'game-1',
      seed: 1,
      turn: 1,
      settings,
      stars: [],
      humanPlayer: player,
      aiPlayers: [],
      fleets: [],
      playerEconomy,
      shipDesigns: [design],
    };

    gameSignal = signal<GameState | null>(baseGame);
    playerSignal = signal<Player | undefined>(player);

    logging = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    visual = jasmine.createSpyObj('GalaxyWaypointVisualService', ['lastKnownPosition', 'fleetWaypointById']);
    fleetPositions = jasmine.createSpyObj('GalaxyFleetPositionService', ['fleetPos']);

    visual.lastKnownPosition.and.callFake((fleetId: string) => positionMap[fleetId] ?? { x: 0, y: 0 });
    fleetPositions.fleetPos.and.callFake((fleetId: string) => positionMap[fleetId] ?? { x: 0, y: 0 });

    const gameStateStub: Partial<GameStateService> = {
      game: gameSignal,
      player: playerSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyWaypointStateService,
        { provide: GameStateService, useValue: gameStateStub },
        { provide: LoggingService, useValue: logging },
        { provide: GalaxyFleetPositionService, useValue: fleetPositions },
        { provide: GalaxyWaypointVisualService, useValue: visual },
      ],
    });

    service = TestBed.inject(GalaxyWaypointStateService);
  });

  it('startDrag creates drag state from last known position', () => {
    const fleet = buildFleet({ id: 'fleet-drag' });
    positionMap[fleet.id] = { x: 100, y: 200 };

    service.startDrag(fleet);

    expect(service.draggedWaypoint()).toEqual({
      startX: 100,
      startY: 200,
      currentX: 100,
      currentY: 200,
      fleetId: 'fleet-drag',
    });
    expect(service.navigationModeFleetId()).toBe('fleet-drag');
  });

  it('checkSnap prefers stars within threshold', () => {
    const star: Star = {
      id: 'star-1',
      name: 'Rigel',
      position: { x: 110, y: 210 },
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

    const gameWithStar: GameState = {
      ...(gameSignal() as GameState),
      stars: [star],
      fleets: [],
    };
    gameSignal.set(gameWithStar);

    const snap = service.checkSnap(112, 212, 1);

    expect(snap).toEqual({ type: 'star', id: 'star-1', x: 110, y: 210 });
    expect(service.snapTarget()).toEqual(snap);
  });

  it('checkSnap falls back to fleet positions when no star matches', () => {
    const otherFleet = buildFleet({ id: 'fleet-2' });
    positionMap[otherFleet.id] = { x: 300, y: 400 };

    const gameWithFleet: GameState = {
      ...(gameSignal() as GameState),
      stars: [],
      fleets: [otherFleet],
    };
    gameSignal.set(gameWithFleet);

    const snap = service.checkSnap(302, 402, 1);

    expect(snap).toEqual({ type: 'fleet', id: 'fleet-2', x: 300, y: 400 });
    expect(service.snapTarget()).toEqual(snap);
  });

  it('moveWaypoint seeds drag state from existing segment', () => {
    const order: FleetOrder = {
      type: FLEET_ORDER_TYPE.MOVE,
      destination: { x: 30, y: 40 },
    };

    visual.fleetWaypointById.and.returnValue({
      fleetId: 'fleet-1',
      lastPos: { x: 0, y: 0 },
      segments: [
        {
          x1: 10,
          y1: 20,
          x2: 30,
          y2: 40,
          distance: 0,
          type: order.type,
          order,
          color: '#fff',
        },
      ],
    });

    service.moveWaypoint('fleet-1', 0);

    expect(service.draggedWaypoint()).toEqual({
      startX: 10,
      startY: 20,
      currentX: 30,
      currentY: 40,
      fleetId: 'fleet-1',
      orderIndex: 0,
    });
  });
});
