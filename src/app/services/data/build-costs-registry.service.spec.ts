import { TestBed } from '@angular/core/testing';
import { BuildCostsRegistry } from './build-costs-registry.service';

describe('BuildCostsRegistry', () => {
  let service: BuildCostsRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BuildCostsRegistry],
    });
    service = TestBed.inject(BuildCostsRegistry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

