import { TestBed } from '@angular/core/testing';
import { ShipDesignComponentService } from './ship-design-component.service';

describe('ShipDesignComponentService', () => {
  let service: ShipDesignComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignComponentService],
    });
    service = TestBed.inject(ShipDesignComponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

