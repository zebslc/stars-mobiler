import { TestBed } from '@angular/core/testing';
import { FleetMovementValidatorService } from './fleet-movement-validator.service';

describe('FleetMovementValidatorService', () => {
  let service: FleetMovementValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetMovementValidatorService],
    });
    service = TestBed.inject(FleetMovementValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

