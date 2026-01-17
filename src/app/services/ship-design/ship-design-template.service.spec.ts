import { TestBed } from '@angular/core/testing';
import { ShipDesignTemplateService } from './ship-design-template.service';

describe('ShipDesignTemplateService', () => {
  let service: ShipDesignTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipDesignTemplateService],
    });
    service = TestBed.inject(ShipDesignTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

