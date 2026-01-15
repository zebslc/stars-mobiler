import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { GalaxyFleetPositionService } from './galaxy-fleet-position.service';
import { GameStateService } from '../../../services/game/game-state.service';
import { Fleet, GameState, Star } from '../../../models/game.model';

describe('GalaxyFleetPositionService', () => {
  let service: GalaxyFleetPositionService;

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

  const orbitFleet: Fleet = {
    id: 'orbit-fleet',
    name: 'Orbiter',
    ownerId: 'player-1',
    location: { type: 'orbit', starId: 'star-1' },
    ships: [{ designId: 'scout', count: 2, damage: 0 }],
    fuel: 100,
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    orders: [],
  };

  const moveFleet: Fleet = {
    id: 'move-fleet',
    name: 'Runner',
    ownerId: 'player-1',
    location: { type: 'space', x: 0, y: 0 },
    ships: [{ designId: 'scout', count: 1, damage: 0 }],
    fuel: 200,
    cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
    orders: [
      { type: 'move', destination: { x: 90, y: 0 }, warpSpeed: 6 },
    ],
  };

  const gameState: GameState = {
    id: 'game-1',
    seed: 0,
    turn: 1,
    settings: {} as any,
    stars: [star],
    humanPlayer: {} as any,
    aiPlayers: [],
    fleets: [orbitFleet, moveFleet],
    playerEconomy: {} as any,
    shipDesigns: [],
  };

  const gameSignal = signal<GameState | null>(gameState);
  const starsSignal = signal<Star[]>([star]);

  beforeEach(() => {
    gameSignal.set(gameState);
    starsSignal.set([star]);

    TestBed.configureTestingModule({
      providers: [
        GalaxyFleetPositionService,
        { provide: GameStateService, useValue: { game: gameSignal, stars: starsSignal } },
      ],
    });

    service = TestBed.inject(GalaxyFleetPositionService);
  });

  it('returns star position for orbiting fleets', () => {
    const pos = service.getFleetPosition(orbitFleet);
    expect(pos).toEqual(star.position);
  });

  it('computes orbit offsets for fleets around a star', () => {
    const pos = service.fleetOrbitPosition(orbitFleet);
    expect(pos).toBeTruthy();
    if (pos) {
      expect(pos.x).toBeCloseTo(star.position.x + 18, 1);
      expect(pos.y).toBeCloseTo(star.position.y, 1);
    }
  });

  it('returns actual coordinates for space fleets', () => {
    const pos = service.fleetPos('move-fleet');
    expect(pos).toEqual({ x: 0, y: 0 });
  });

  it('returns move destinations for order lookup', () => {
    const dest = service.orderDest('move-fleet');
    expect(dest).toEqual({ x: 90, y: 0 });
  });

  it('creates path markers using fleet speed', () => {
    const markers = service.pathMarkersTo('move-fleet', { x: 120, y: 0 });
    expect(markers.length).toBeGreaterThan(0);
    expect(markers[0].x).toBeGreaterThan(0);
    expect(markers[markers.length - 1].x).toBeLessThan(120);
  });
});
