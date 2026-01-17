import { TestBed } from '@angular/core/testing';
import { FleetValidationService } from './fleet-validation.service';

describe('FleetValidationService', () => {
  let service: FleetValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetValidationService],
    });
    service = TestBed.inject(FleetValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

