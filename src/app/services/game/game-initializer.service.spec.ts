import { TestBed } from '@angular/core/testing';
import { GameInitializerService } from './game-initializer.service';

describe('GameInitializerService', () => {
  let service: GameInitializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameInitializerService],
    });
    service = TestBed.inject(GameInitializerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

