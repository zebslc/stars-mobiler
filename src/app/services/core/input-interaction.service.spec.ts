import { TestBed } from '@angular/core/testing';
import { InputInteractionService } from './input-interaction.service';

describe('InputInteractionService', () => {
  let service: InputInteractionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputInteractionService],
    });
    service = TestBed.inject(InputInteractionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

