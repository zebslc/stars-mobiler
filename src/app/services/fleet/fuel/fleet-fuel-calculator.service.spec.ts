import { TestBed } from '@angular/core/testing';
import { FleetFuelCalculatorService } from './fleet-fuel-calculator.service';

describe('FleetFuelCalculatorService', () => {
  let service: FleetFuelCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FleetFuelCalculatorService],
    });
    service = TestBed.inject(FleetFuelCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

