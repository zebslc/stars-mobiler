import { TestBed } from '@angular/core/testing';
import { TechAtlasService } from './tech-atlas.service';

describe('TechAtlasService', () => {
  let service: TechAtlasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TechAtlasService],
    });
    service = TestBed.inject(TechAtlasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

