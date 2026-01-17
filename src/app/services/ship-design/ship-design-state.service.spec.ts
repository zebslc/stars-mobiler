import { TestBed } from '@angular/core/testing';
import { ShipDesignStateService } from './ship-design-state.service';

describe('ShipDesignStateService', () => {
  let service: ShipDesignStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignStateService],
    });
    service = TestBed.inject(ShipDesignStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

