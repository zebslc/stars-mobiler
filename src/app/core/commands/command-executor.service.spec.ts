import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CommandExecutorService } from './command-executor.service';
import type { GameCommand, GameCommandWithResult } from './game-command.interface';
import type { GameState } from '../../models/game.model';

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Mock command implementations for testing
class MockCommand implements GameCommand {
  constructor(private newTurn: number) {}
  
  execute(game: GameState): GameState {
    return { ...game, turn: this.newTurn };
  }
}

class MockCommandWithResult implements GameCommandWithResult<string> {
  constructor(private newTurn: number, private result: string) {}
  
  execute(game: GameState): [GameState, string] {
    return [{ ...game, turn: this.newTurn }, this.result];
  }
}

describe('CommandExecutorService', () => {
  let service: CommandExecutorService;
  let mockGameState: GameState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CommandExecutorService
      ]
    });
    service = TestBed.inject(CommandExecutorService);
    
    mockGameState = {
      turn: 1,
      stars: [],
      humanPlayer: {
        id: 'player1',
        name: 'Test Player',
        species: {
          name: 'Terrans',
          traits: {
            growthRate: 1.0,
            miningRate: 1.0,
            researchRate: 1.0,
            shipCost: 1.0,
          },
          habitability: {
            temperature: { min: 0, max: 100 },
            atmosphere: { min: 0, max: 100 },
          },
        },
        techLevels: {
          Energy: 1,
          Kinetics: 1,
          Propulsion: 1,
          Construction: 1,
        },
        researchField: 'Energy',
        shipDesigns: [],
      },
      playerEconomy: {
        resources: 1000,
        ironium: 500,
        boranium: 500,
        germanium: 500,
        researchPoints: 100,
      },
    } as unknown as GameState;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get game state', () => {
    service.setGame(mockGameState);
    expect(service.getCurrentGame()).toEqual(mockGameState);
    expect(service.game()).toEqual(mockGameState);
  });

  it('should execute command and update state', () => {
    service.setGame(mockGameState);
    const command = new MockCommand(5);
    
    service.execute(command);
    
    const updatedGame = service.getCurrentGame();
    expect(updatedGame?.turn).toBe(5);
  });

  it('should execute command with result', () => {
    service.setGame(mockGameState);
    const command = new MockCommandWithResult(10, 'test-result');
    
    const result = service.executeWithResult(command);
    
    expect(result).toBe('test-result');
    expect(service.getCurrentGame()?.turn).toBe(10);
  });

  it('should handle null game state gracefully', () => {
    const command = new MockCommand(5);
    
    service.execute(command);
    
    expect(service.getCurrentGame()).toBeNull();
  });

  it('should return null for command with result when game is null', () => {
    const command = new MockCommandWithResult(10, 'test-result');
    
    const result = service.executeWithResult(command);
    
    expect(result).toBeNull();
  });
});