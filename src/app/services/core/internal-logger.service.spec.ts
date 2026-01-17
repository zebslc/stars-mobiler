import { TestBed } from '@angular/core/testing';
import { InternalLoggerService } from './internal-logger.service';

describe('InternalLoggerService', () => {
  let service: InternalLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InternalLoggerService],
    });
    service = TestBed.inject(InternalLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

