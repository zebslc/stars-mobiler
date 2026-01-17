import { TestBed } from '@angular/core/testing';
import { HabitabilityService } from './habitability.service';

describe('HabitabilityService', () => {
  let service: HabitabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HabitabilityService],
    });
    service = TestBed.inject(HabitabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

