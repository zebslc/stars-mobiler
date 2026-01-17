import { TestBed } from '@angular/core/testing';
import { ShipSlotOperatorService } from './ship-slot-operator.service';

describe('ShipSlotOperatorService', () => {
  let service: ShipSlotOperatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipSlotOperatorService],
    });
    service = TestBed.inject(ShipSlotOperatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

