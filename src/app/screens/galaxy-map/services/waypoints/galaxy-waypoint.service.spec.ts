import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GalaxyWaypointService } from './galaxy-waypoint.service';
import { GameStateService } from '../../../../services/game/game-state.service';
import { LoggingService } from '../../../../services/core/logging.service';
import { GalaxyFleetPositionService } from '../galaxy-fleet-position.service';
import {
  Fleet,
  FleetOrder,
  GameState,
  GameSettings,
  Player,
  PlayerEconomy,
  ShipDesign,
  Species,
  Star,
} from '../../../../models/game.model';
import { FLEET_ORDER_TYPE } from '../../../../models/fleet-order.constants';

class LoggingStub {
  debug(): void {}
  info(): void {}
}

class FleetPositionStub {
  private positions = new Map<string, { x: number; y: number }>();

  setPosition(fleetId: string, pos: { x: number; y: number }): void {
    this.positions.set(fleetId, pos);
  }

  fleetPos(id: string): { x: number; y: number } {
    return this.positions.get(id) ?? { x: 0, y: 0 };
  }
}

describe('GalaxyWaypointService', () => {
  let service: GalaxyWaypointService;
  let fleetPositions: FleetPositionStub;
  let setFleetOrdersSpy: jasmine.Spy;

  const species: Species = {
    id: 'species-1',
    name: 'Humans',
    habitat: {
      idealTemperature: 0,
      idealAtmosphere: 0,
      toleranceRadius: 10,
    },
    traits: [],
  };

  const player: Player = {
    id: 'player-1',
    name: 'Commander',
    species,
    ownedStarIds: ['star-1'],
    techLevels: { Energy: 1, Kinetics: 1, Propulsion: 1, Construction: 1 },
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
  };

  const star: Star = {
    id: 'star-1',
    name: 'Sol',
    position: { x: 100, y: 200 },
    ownerId: 'player-1',
    population: 0,
    maxPopulation: 0,
    resources: 0,
    surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
    mineralConcentrations: { ironium: 0, boranium: 0, germanium: 0 },
    mines: 0,
    factories: 0,
    defenses: 0,
    temperature: 0,
    atmosphere: 0,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
  };

  const scoutDesign: ShipDesign = {
    id: 'scout-design',
    name: 'Scout',
    hullId: 'scout',
    slots: [],
    createdTurn: 0,
    playerId: 'player-1',
    spec: {
      warpSpeed: 7,
      fuelCapacity: 100,
      fuelEfficiency: 1,
      idealWarp: 5,
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

  const playerFleet: Fleet = {
    id: 'fleet-1',
    name: 'Explorers',
    ownerId: 'player-1',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: scoutDesign.id, count: 2, damage: 0 }],
    fuel: 100,
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    orders: [
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 50, y: 50 },
        warpSpeed: 7,
      },
    ],
  };

  const targetFleet: Fleet = {
    id: 'fleet-2',
    name: 'Target',
    ownerId: 'player-2',
    location: { type: 'space', x: 150, y: 250 },
    ships: [{ designId: scoutDesign.id, count: 1, damage: 0 }],
    fuel: 100,
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    orders: [],
  };

  const settings: GameSettings = {
    galaxySize: 'small',
    aiCount: 0,
    aiDifficulty: 'easy',
    seed: 1,
    speciesId: species.id,
  };

  const economy: PlayerEconomy = {
    freighterCapacity: 0,
    research: 0,
  };

  const gameTemplate: GameState = {
    id: 'game-1',
    seed: 1,
    turn: 1,
    settings,
    stars: [star],
    humanPlayer: player,
    aiPlayers: [],
    fleets: [playerFleet, targetFleet],
    playerEconomy: economy,
    shipDesigns: [scoutDesign],
  };

  const gameSignal = signal<GameState | null>(gameTemplate);
  const playerSignal = signal<Player | null>(player);

  const updateGameState = (mutator: (state: GameState) => void): void => {
    const current = gameSignal();
    if (!current) {
      throw new Error('Game state not initialised');
    }
    const clone = structuredClone(current) as GameState;
    mutator(clone);
    gameSignal.set(clone);
  };

  beforeEach(() => {
    gameSignal.set(structuredClone(gameTemplate));
    playerSignal.set(player);

    setFleetOrdersSpy = jasmine.createSpy('setFleetOrders').and.callFake((fleetId: string, orders: FleetOrder[]) => {
      updateGameState((state) => {
        const fleet = state.fleets.find((f) => f.id === fleetId);
        if (fleet) {
          fleet.orders = orders;
        }
      });
    });
    fleetPositions = new FleetPositionStub();
    fleetPositions.setPosition('fleet-1', { x: 0, y: 0 });
    fleetPositions.setPosition('fleet-2', { x: 150, y: 250 });

    TestBed.configureTestingModule({
      providers: [
        GalaxyWaypointService,
        { provide: GalaxyFleetPositionService, useValue: fleetPositions },
        { provide: LoggingService, useClass: LoggingStub },
        {
          provide: GameStateService,
          useValue: {
            game: gameSignal,
            player: () => playerSignal(),
            setFleetOrders: setFleetOrdersSpy,
          },
        },
      ],
    });

    service = TestBed.inject(GalaxyWaypointService);
  });

  it('computes waypoints for player fleets', () => {
    const waypoints = service.fleetWaypoints();
    expect(waypoints.length).toBe(1);
    const [entry] = waypoints;
    expect(entry.fleetId).toBe('fleet-1');
    expect(entry.segments.length).toBe(1);
    expect(entry.segments[0].type).toBe(FLEET_ORDER_TYPE.MOVE);
    expect(entry.segments[0].distance).toBeGreaterThan(0);
  });

  it('creates orbit order when snapping to a star', () => {
    service.startDrag(playerFleet);
    service.updateDragPosition(100, 200);
    const snap = service.checkSnap(100, 200, 1);
    expect(snap?.type).toBe('star');

    const result = service.finalizeWaypoint();

    expect(result).toEqual({
      fleetId: 'fleet-1',
      orderIndex: 1,
      order: jasmine.objectContaining({
        type: FLEET_ORDER_TYPE.ORBIT,
        starId: 'star-1',
      }),
    });
    expect('warpSpeed' in (result?.order ?? {})).toBeTrue();
    expect((result?.order as FleetOrder & { warpSpeed?: number }).warpSpeed).toBeUndefined();

    const [fleetId, orders] = setFleetOrdersSpy.calls.mostRecent().args as [string, FleetOrder[]];
    expect(fleetId).toBe('fleet-1');
    expect(orders).toEqual([
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 50, y: 50 },
        warpSpeed: 7,
      },
      {
        type: FLEET_ORDER_TYPE.ORBIT,
        starId: 'star-1',
        warpSpeed: undefined,
      },
    ]);
  });

  it('creates move order when no snap target exists', () => {
    service.startDrag(playerFleet);
    service.updateDragPosition(120, 80);
    const result = service.finalizeWaypoint();

    expect(result?.order.type).toBe(FLEET_ORDER_TYPE.MOVE);
    expect((result?.order as Extract<FleetOrder, { destination: any }>).destination).toEqual({ x: 120, y: 80 });

    const [fleetId, orders] = setFleetOrdersSpy.calls.mostRecent().args as [string, FleetOrder[]];
    expect(fleetId).toBe('fleet-1');
    expect(orders).toEqual([
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 50, y: 50 },
        warpSpeed: 7,
      },
      {
        type: FLEET_ORDER_TYPE.MOVE,
        destination: { x: 120, y: 80 },
        warpSpeed: undefined,
      },
    ]);
  });

  it('cycles waypoint speed while ignoring colonize orders', () => {
    updateGameState((state) => {
      const fleet = state.fleets.find((f) => f.id === 'fleet-1');
      if (fleet) {
        fleet.orders = [
          { type: FLEET_ORDER_TYPE.MOVE, destination: { x: 20, y: 20 }, warpSpeed: 2 },
          { type: FLEET_ORDER_TYPE.COLONIZE, starId: 'star-1' },
        ];
      }
    });

    service.setWaypointSpeed('fleet-1', 0);
    expect(setFleetOrdersSpy).toHaveBeenCalledWith('fleet-1', [
      { type: FLEET_ORDER_TYPE.MOVE, destination: { x: 20, y: 20 }, warpSpeed: 3 },
      { type: FLEET_ORDER_TYPE.COLONIZE, starId: 'star-1' },
    ]);

    setFleetOrdersSpy.calls.reset();
    service.setWaypointSpeed('fleet-1', 1);
    expect(setFleetOrdersSpy).not.toHaveBeenCalled();
  });

  it('clears navigation mode on exit while finalizing drag', () => {
    service.startDrag(playerFleet);
    service.updateDragPosition(75, 90);
    const result = service.exitNavigationMode();

    expect(result?.order.type).toBe(FLEET_ORDER_TYPE.MOVE);
    expect(service.navigationModeFleetId()).toBeNull();
    expect(service.draggedWaypoint()).toBeNull();
    expect(service.snapTarget()).toBeNull();
  });
});
