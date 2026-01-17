import { TestBed } from '@angular/core/testing';
import { ShipyardService } from './shipyard.service';

describe('ShipyardService', () => {
  let service: ShipyardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipyardService],
    });
    service = TestBed.inject(ShipyardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

