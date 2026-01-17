import { TestBed } from '@angular/core/testing';
import { FleetMovementStatsService } from './fleet-movement-stats.service';

describe('FleetMovementStatsService', () => {
  let service: FleetMovementStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetMovementStatsService],
    });
    service = TestBed.inject(FleetMovementStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

