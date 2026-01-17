import { TestBed } from '@angular/core/testing';
import { FleetTransferService } from './fleet-transfer.service';

describe('FleetTransferService', () => {
  let service: FleetTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetTransferService],
    });
    service = TestBed.inject(FleetTransferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

