import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GalaxyWaypointVisualService } from './galaxy-waypoint-visual.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyFleetPositionService } from '../fleet/galaxy-fleet-position.service';
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

describe('GalaxyWaypointVisualService', () => {
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
    scanReports: {},
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

  const shipDesign: ShipDesign = {
    id: 'design-1',
    name: 'Scout',
    hullId: 'hull',
    slots: [],
    createdTurn: 0,
    playerId: player.id,
    spec: {
      warpSpeed: 5,
      fuelCapacity: 0,
      idealWarp: 5,
      isRamscoop: false,
      fuelEfficiency: 0,
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
      mass: 0,
      cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
      hasEngine: true,
      hasColonyModule: false,
      isStarbase: false,
      isValid: true,
      validationErrors: [],
      components: [],
    },
  };

  const orbitStar: Star = {
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

  function playerFleet(orders: Array<FleetOrder>): Fleet {
    return {
      id: 'fleet-player',
      name: 'Voyager',
      ownerId: player.id,
      location: { type: 'space', x: 0, y: 0 },
      ships: [{ designId: shipDesign.id, count: 1, damage: 0 }],
      fuel: 0,
      cargo: {
        resources: 0,
        colonists: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
      },
      orders,
    };
  }

  function foreignFleet(): Fleet {
    return {
      id: 'fleet-foreign',
      name: 'Intruder',
      ownerId: 'other',
      location: { type: 'space', x: 400, y: 400 },
      ships: [],
      fuel: 0,
      cargo: {
        resources: 0,
        colonists: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
      },
      orders: [],
    };
  }

  function buildGame(fleets: Array<Fleet>, stars: Array<Star> = [orbitStar]): GameState {
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
      shipDesigns: [shipDesign],
    };
  }

  function initService(
    game: GameState,
    positionMap: Record<string, { x: number; y: number }>,
  ): GalaxyWaypointVisualService {
    TestBed.resetTestingModule();

    const logging = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    const fleetPositions = jasmine.createSpyObj('GalaxyFleetPositionService', ['fleetPos']);
    fleetPositions.fleetPos.and.callFake((fleetId: string) => positionMap[fleetId] ?? { x: 0, y: 0 });

    const gameSignal = signal<GameState | null>(game);
    const playerSignal = signal<Player | undefined>(player);

    const gameStateStub: Partial<GameStateService> = {
      game: gameSignal,
      player: playerSignal,
    };

    TestBed.configureTestingModule({
      providers: [
        GalaxyWaypointVisualService,
        { provide: GameStateService, useValue: gameStateStub },
        { provide: LoggingService, useValue: logging },
        { provide: GalaxyFleetPositionService, useValue: fleetPositions },
      ],
    });

    return TestBed.inject(GalaxyWaypointVisualService);
  }

  it('only exposes waypoints for the human player', () => {
    const service = initService(
      buildGame([
        playerFleet([
          {
            type: FLEET_ORDER_TYPE.ORBIT,
            starId: orbitStar.id,
            warpSpeed: 4,
          },
        ]),
        foreignFleet(),
      ]),
      {
        'fleet-player': { x: 0, y: 0 },
        'fleet-foreign': { x: 400, y: 400 },
      },
    );

    const waypoints = service.fleetWaypoints();

    expect(waypoints.length).toBe(1);
    expect(waypoints[0].fleetId).toBe('fleet-player');
  });

  it('builds segments with destination data and warnings', () => {
    const service = initService(
      buildGame([
        playerFleet([
          {
            type: FLEET_ORDER_TYPE.ORBIT,
            starId: orbitStar.id,
            warpSpeed: 4,
          },
          {
            type: FLEET_ORDER_TYPE.MOVE,
            destination: { x: 300, y: 300 },
            warpSpeed: 7,
          },
        ]),
      ]),
      {
        'fleet-player': { x: 0, y: 0 },
      },
    );

    const fleetWaypoint = service.fleetWaypointById('fleet-player');

    expect(fleetWaypoint).toBeDefined();
    expect(fleetWaypoint?.segments.length).toBe(2);

    const [first, second] = fleetWaypoint!.segments;
    expect(first.type).toBe(FLEET_ORDER_TYPE.ORBIT);
    expect(first.warning).toBeUndefined();
    expect(first.color).toBe('#2ecc71');
    expect(first.x1).toBe(0);
    expect(first.x2).toBe(orbitStar.position.x);

    expect(second.type).toBe(FLEET_ORDER_TYPE.MOVE);
    expect(second.warning).toBe('Speed too high');
    expect(second.color).toBe('#f1c40f');
    expect(second.x2).toBe(300);
    expect(fleetWaypoint?.lastPos).toEqual({ x: 300, y: 300 });
  });

  it('does not show speed warning when warp speed is not set', () => {
    const service = initService(
      buildGame([
        playerFleet([
          {
            type: FLEET_ORDER_TYPE.MOVE,
            destination: { x: 100, y: 100 },
          },
        ]),
      ]),
      {
        'fleet-player': { x: 0, y: 0 },
      },
    );

    const fleetWaypoint = service.fleetWaypointById('fleet-player');

    expect(fleetWaypoint).toBeDefined();
    expect(fleetWaypoint?.segments.length).toBe(1);

    const [segment] = fleetWaypoint!.segments;
    expect(segment.warning).toBeUndefined();
    expect(segment.color).toBe('#3498db');
  });

  it('falls back to fleet positions when no waypoints exist', () => {
    const service = initService(
      buildGame([playerFleet([])]),
      {
        'fleet-player': { x: 5, y: 6 },
      },
    );

    const refreshed = service.fleetWaypointById('fleet-player');

    expect(refreshed?.segments.length).toBe(0);
    expect(refreshed?.lastPos).toEqual({ x: 5, y: 6 });
  });
});
