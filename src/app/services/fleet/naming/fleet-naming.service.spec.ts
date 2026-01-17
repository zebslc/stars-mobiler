import { TestBed } from '@angular/core/testing';
import { FleetNamingService } from './fleet-naming.service';

describe('FleetNamingService', () => {
  let service: FleetNamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetNamingService],
    });
    service = TestBed.inject(FleetNamingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

