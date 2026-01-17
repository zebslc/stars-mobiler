import { TestBed } from '@angular/core/testing';
import { HullSlotValidationService } from './hull-slot-validation.service';

describe('HullSlotValidationService', () => {
  let service: HullSlotValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HullSlotValidationService],
    });
    service = TestBed.inject(HullSlotValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

