import { TestBed } from '@angular/core/testing';
import { PlanetUtilityService } from './planet-utility.service';

describe('PlanetUtilityService', () => {
  let service: PlanetUtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanetUtilityService],
    });
    service = TestBed.inject(PlanetUtilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

