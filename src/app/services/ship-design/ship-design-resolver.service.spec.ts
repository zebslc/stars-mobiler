import { TestBed } from '@angular/core/testing';
import { ShipDesignResolverService } from './ship-design-resolver.service';

describe('ShipDesignResolverService', () => {
  let service: ShipDesignResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignResolverService],
    });
    service = TestBed.inject(ShipDesignResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

