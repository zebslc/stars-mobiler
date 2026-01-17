import { TestBed } from '@angular/core/testing';
import { ShipDesignRegistry } from './ship-design-registry.service';

describe('ShipDesignRegistry', () => {
  let service: ShipDesignRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignRegistry],
    });
    service = TestBed.inject(ShipDesignRegistry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

