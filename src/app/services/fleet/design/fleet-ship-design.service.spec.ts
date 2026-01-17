import { TestBed } from '@angular/core/testing';
import { FleetShipDesignService } from './fleet-ship-design.service';

describe('FleetShipDesignService', () => {
  let service: FleetShipDesignService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetShipDesignService],
    });
    service = TestBed.inject(FleetShipDesignService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

