import { TestBed } from '@angular/core/testing';
import { ShipDesignAvailabilityService } from './ship-design-availability.service';

describe('ShipDesignAvailabilityService', () => {
  let service: ShipDesignAvailabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignAvailabilityService],
    });
    service = TestBed.inject(ShipDesignAvailabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

