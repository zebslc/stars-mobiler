import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ShipDesignOverviewComponent } from './ship-design-overview.component';
import { GameStateService } from '../../services/game/game-state.service';
import { ShipDesignerService } from '../../services/ship-designer.service';
import { signal } from '@angular/core';

// Declare Jasmine globals to satisfy linter
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jasmine: any;

describe('ShipDesignOverviewComponent', () => {
  let component: ShipDesignOverviewComponent;
  let fixture: ComponentFixture<ShipDesignOverviewComponent>;
  let mockGameStateService: any;
  let mockShipDesignerService: any;

  beforeEach(async () => {
    mockGameStateService = {
      player: signal({
        id: 'p1',
        techLevels: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 }
      }),
      game: signal({
        shipDesigns: []
      }),
      turn: signal(1)
    };

    mockShipDesignerService = jasmine.createSpyObj('ShipDesignerService', ['getAvailableHulls', 'setTechLevels', 'startNewDesign']);
    mockShipDesignerService.getAvailableHulls.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [ShipDesignOverviewComponent],
      providers: [
        { provide: GameStateService, useValue: mockGameStateService },
        { provide: ShipDesignerService, useValue: mockShipDesignerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShipDesignOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
