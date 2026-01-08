import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FleetDetailComponent } from './fleet-detail.component';
import { GameStateService } from '../../services/game-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { TechService } from '../../services/tech.service';
import { signal } from '@angular/core';

// Declare Jasmine globals
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jasmine: any;

describe('FleetDetailComponent', () => {
  let component: FleetDetailComponent;
  let fixture: ComponentFixture<FleetDetailComponent>;
  let mockGameStateService: any;

  beforeEach(async () => {
    mockGameStateService = {
      game: signal<any>(null),
      player: signal<any>(null),
      turn: signal(1),
      stars: signal([]),
      habitabilityFor: () => 0,
      issueFleetOrder: jasmine.createSpy('issueFleetOrder'),
    };

    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: () => 'fleet1',
        },
      },
    };

    const mockRouter = {
      navigate: jasmine.createSpy('navigate'),
      navigateByUrl: jasmine.createSpy('navigateByUrl'),
    };

    const mockToastService = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
    };

    const mockTechService = {};

    await TestBed.configureTestingModule({
      imports: [FleetDetailComponent],
      providers: [
        { provide: GameStateService, useValue: mockGameStateService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ToastService, useValue: mockToastService },
        { provide: TechService, useValue: mockTechService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FleetDetailComponent);
    component = fixture.componentInstance;
  });

  it('should filter out starbases from otherFleets', () => {
    const fleet1 = {
      id: 'fleet1',
      ownerId: 'p1',
      name: 'Fleet 1',
      location: { type: 'orbit', planetId: 'p1' },
      ships: [{ designId: 'scout', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 100,
      orders: [],
    };

    const fleet2 = {
      id: 'fleet2',
      ownerId: 'p1',
      name: 'Fleet 2',
      location: { type: 'orbit', planetId: 'p1' }, // Same location
      ships: [{ designId: 'scout', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 100,
      orders: [],
    };

    const starbase = {
      id: 'sb1',
      ownerId: 'p1',
      name: 'Starbase',
      location: { type: 'orbit', planetId: 'p1' }, // Same location
      ships: [{ designId: 'sb_design', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 0,
      orders: [],
    };

    const designs = [
      { id: 'scout', name: 'Scout', spec: { isStarbase: false } },
      { id: 'sb_design', name: 'Starbase', spec: { isStarbase: true } },
    ];

    mockGameStateService.game.set({
      fleets: [fleet1, fleet2, starbase],
      shipDesigns: designs,
    });
    mockGameStateService.player.set({ id: 'p1' });

    // Trigger change detection
    fixture.detectChanges();

    const others = component.otherFleets();
    
    // Should find fleet2 but not starbase
    expect(others.length).toBe(1);
    expect(others[0].id).toBe('fleet2');
  });

  it('should include fleets at the same deep space location', () => {
    const fleet1 = {
      id: 'fleet1',
      ownerId: 'p1',
      name: 'Fleet 1',
      location: { type: 'space', x: 100, y: 100 },
      ships: [{ designId: 'scout', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 100,
      orders: [],
    };

    const fleet2 = {
      id: 'fleet2',
      ownerId: 'p1',
      name: 'Fleet 2',
      location: { type: 'space', x: 100, y: 100 }, // Same location
      ships: [{ designId: 'scout', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 100,
      orders: [],
    };

    const fleet3 = {
      id: 'fleet3',
      ownerId: 'p1',
      name: 'Fleet 3',
      location: { type: 'space', x: 200, y: 200 }, // Different location
      ships: [{ designId: 'scout', count: 1 }],
      cargo: { resources: 0, minerals: { ironium: 0, boranium: 0, germanium: 0 }, colonists: 0 },
      fuel: 100,
      orders: [],
    };

    const designs = [
      { id: 'scout', name: 'Scout', spec: { isStarbase: false } },
    ];

    mockGameStateService.game.set({
      fleets: [fleet1, fleet2, fleet3],
      shipDesigns: designs,
    });
    mockGameStateService.player.set({ id: 'p1' });

    fixture.detectChanges();

    const others = component.otherFleets();
    
    expect(others.length).toBe(1);
    expect(others[0].id).toBe('fleet2');
  });
});
