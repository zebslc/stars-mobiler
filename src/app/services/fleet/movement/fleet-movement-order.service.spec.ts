import { TestBed } from '@angular/core/testing';
import { FleetMovementOrderService } from './fleet-movement-order.service';

describe('FleetMovementOrderService', () => {
  let service: FleetMovementOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetMovementOrderService],
    });
    service = TestBed.inject(FleetMovementOrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

