import { TestBed } from '@angular/core/testing';
import { ShipDesignValidationService } from './ship-design-validation.service';

describe('ShipDesignValidationService', () => {
  let service: ShipDesignValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignValidationService],
    });
    service = TestBed.inject(ShipDesignValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

