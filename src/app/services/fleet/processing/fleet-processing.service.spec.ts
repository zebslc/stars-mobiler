import { TestBed } from '@angular/core/testing';
import { FleetProcessingService } from './fleet-processing.service';

describe('FleetProcessingService', () => {
  let service: FleetProcessingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetProcessingService],
    });
    service = TestBed.inject(FleetProcessingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

