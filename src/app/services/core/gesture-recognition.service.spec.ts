import { TestBed } from '@angular/core/testing';
import { GestureRecognitionService } from './gesture-recognition.service';

describe('GestureRecognitionService', () => {
  let service: GestureRecognitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GestureRecognitionService],
    });
    service = TestBed.inject(GestureRecognitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

