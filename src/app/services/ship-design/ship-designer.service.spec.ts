import { TestBed } from '@angular/core/testing';
import { ShipDesignerService } from './ship-designer.service';

describe('ShipDesignerService', () => {
  let service: ShipDesignerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignerService],
    });
    service = TestBed.inject(ShipDesignerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

