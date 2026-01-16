import { TestBed } from '@angular/core/testing';
import { ColonyService } from './colony.service';
import { BuildQueueService } from '../build/queue/build-queue.service';
import { BuildProcessorService } from '../build/processor/build-processor.service';
import { GovernorService } from './governor.service';
import type { BuildItem, GameState, Star, StarGovernor } from '../../models/game.model';

class BuildQueueStub {
  addToBuildQueueCalls: Array<{ game: GameState; starId: string; item: BuildItem }> = [];
  removeFromQueueCalls: Array<{ game: GameState; starId: string; index: number }> = [];
  queuedGame: GameState | null = null;

  addToBuildQueue(game: GameState, starId: string, item: BuildItem): GameState {
    this.addToBuildQueueCalls.push({ game, starId, item });
    this.queuedGame = game;
    return game;
  }

  removeFromQueue(game: GameState, starId: string, index: number): GameState {
    this.removeFromQueueCalls.push({ game, starId, index });
    return game;
  }
}

class BuildProcessorStub {
  processedGames: Array<GameState> = [];

  processBuildQueues(game: GameState): void {
    this.processedGames.push(game);
  }
}

class GovernorStub {
  processedGames: Array<GameState> = [];
  setCalls: Array<{ game: GameState; starId: string; governor: Star['governor'] }> = [];

  processGovernors(game: GameState): void {
    this.processedGames.push(game);
  }

  setGovernor(game: GameState, starId: string, governor: Star['governor']): GameState {
    this.setCalls.push({ game, starId, governor });
    return game;
  }
}

describe('ColonyService', () => {
  let service: ColonyService;
  let queue: BuildQueueStub;
  let processor: BuildProcessorStub;
  let governor: GovernorStub;

  beforeEach(() => {
    queue = new BuildQueueStub();
    processor = new BuildProcessorStub();
    governor = new GovernorStub();

    TestBed.configureTestingModule({
      providers: [
        ColonyService,
        { provide: BuildQueueService, useValue: queue as unknown as BuildQueueService },
        { provide: BuildProcessorService, useValue: processor as unknown as BuildProcessorService },
        { provide: GovernorService, useValue: governor as unknown as GovernorService },
      ],
    });

    service = TestBed.inject(ColonyService);
  });

  it('delegates build queue mutations to BuildQueueService', () => {
    const game = {} as GameState;
    const item = { project: 'ship' } as BuildItem;
    const addResult = service.addToBuildQueue(game, 'alpha', item);
    const removeResult = service.removeFromQueue(game, 'beta', 2);

    expect(addResult).toBe(game);
    expect(removeResult).toBe(game);
    expect(queue.addToBuildQueueCalls).toEqual([{ game, starId: 'alpha', item }]);
    expect(queue.removeFromQueueCalls).toEqual([{ game, starId: 'beta', index: 2 }]);
  });

  it('delegates processing to BuildProcessorService', () => {
    const game = {} as GameState;
    service.processBuildQueues(game);
    expect(processor.processedGames).toEqual([game]);
  });

  it('delegates governor behaviour', () => {
    const game = {} as GameState;
    service.processGovernors(game);
    const governorValue: StarGovernor = { type: 'industrial' };
    service.setGovernor(game, 'gamma', governorValue);

    expect(governor.processedGames).toEqual([game]);
    expect(governor.setCalls).toEqual([{ game, starId: 'gamma', governor: governorValue }]);
  });
});
