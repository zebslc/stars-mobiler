import { TestBed } from '@angular/core/testing';
import { StarbaseUpgradeService } from './starbase-upgrade.service';

describe('StarbaseUpgradeService', () => {
  let service: StarbaseUpgradeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StarbaseUpgradeService],
    });
    service = TestBed.inject(StarbaseUpgradeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

