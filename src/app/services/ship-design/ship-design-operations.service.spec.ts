import { TestBed } from '@angular/core/testing';
import { ShipDesignOperationsService } from './ship-design-operations.service';

describe('ShipDesignOperationsService', () => {
  let service: ShipDesignOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignOperationsService],
    });
    service = TestBed.inject(ShipDesignOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

