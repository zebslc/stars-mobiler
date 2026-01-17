import { TestBed } from '@angular/core/testing';
import { HullSlotOperationsService } from './hull-slot-operations.service';

describe('HullSlotOperationsService', () => {
  let service: HullSlotOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HullSlotOperationsService],
    });
    service = TestBed.inject(HullSlotOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

