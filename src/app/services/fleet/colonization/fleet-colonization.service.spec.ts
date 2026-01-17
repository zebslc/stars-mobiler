import { TestBed } from '@angular/core/testing';
import { FleetColonizationService } from './fleet-colonization.service';

describe('FleetColonizationService', () => {
  let service: FleetColonizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetColonizationService],
    });
    service = TestBed.inject(FleetColonizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

