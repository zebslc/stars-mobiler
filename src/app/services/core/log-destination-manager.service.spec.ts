import { TestBed } from '@angular/core/testing';
import { LogDestinationManager } from './log-destination-manager.service';

describe('LogDestinationManager', () => {
  let service: LogDestinationManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogDestinationManager],
    });
    service = TestBed.inject(LogDestinationManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

