import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FleetMathService } from './fleet-math.service';
import { GameStateService } from '../game/game-state.service';
import { ShipDesignResolverService } from '../ship-design';
import type { Fleet } from '../../models/game.model';

describe('FleetMathService', () => {
  let service: FleetMathService;
  let gameStateService: jasmine.SpyObj<GameStateService>;
  let shipDesignResolver: jasmine.SpyObj<ShipDesignResolverService>;

  const createFleet = (overrides: Partial<Fleet> = {}): Fleet =>
    ({
      id: 'fleet-1',
      name: 'Test Fleet',
      ownerId: 'player-1',
      location: { type: 'space', x: 0, y: 0 },
      fuel: 100,
      cargo: {
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
        colonists: 0,
      },
      ships: [],
      orders: [],
      ...overrides,
    }) as Fleet;

  beforeEach(() => {
    const gameSignal = signal<any | null>(null);

    gameStateService = jasmine.createSpyObj(
      'GameStateService',
      [],
      { game: gameSignal },
    );

    shipDesignResolver = jasmine.createSpyObj('ShipDesignResolverService', ['resolve']);

    TestBed.configureTestingModule({
      providers: [
        FleetMathService,
        { provide: GameStateService, useValue: gameStateService },
        { provide: ShipDesignResolverService, useValue: shipDesignResolver },
      ],
    });

    service = TestBed.inject(FleetMathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('totalShipCount should return 0 for null fleet', () => {
    expect(service.totalShipCount(null)).toBe(0);
  });

  it('totalShipCount should sum ship counts', () => {
    const fleet = createFleet({
      ships: [
        { designId: 'd1', count: 3, damage: 0 },
        { designId: 'd2', count: 2, damage: 0 },
      ],
    });
    expect(service.totalShipCount(fleet)).toBe(5);
  });
});

