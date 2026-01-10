import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EndTurnCommand } from './turn-commands';
import { TurnService } from '../../services/turn.service';
import { GameState } from '../../models/game.model';

describe('EndTurnCommand', () => {
  let mockTurnService: jasmine.SpyObj<TurnService>;
  let mockGameState: GameState;

  beforeEach(() => {
    const turnServiceSpy = jasmine.createSpyObj('TurnService', ['endTurn']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TurnService, useValue: turnServiceSpy }
      ]
    });

    mockTurnService = TestBed.inject(TurnService) as jasmine.SpyObj<TurnService>;
    
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
            shipCost: 1.0
          },
          habitability: {
            temperature: { min: 0, max: 100 },
            atmosphere: { min: 0, max: 100 }
          }
        },
        techLevels: {
          Energy: 1,
          Kinetics: 1,
          Propulsion: 1,
          Construction: 1
        },
        researchField: 'Energy',
        shipDesigns: []
      },
      playerEconomy: {
        resources: 1000,
        ironium: 500,
        boranium: 500,
        germanium: 500,
        researchPoints: 100
      }
    } as GameState;
  });

  it('should execute turn service endTurn method', () => {
    const expectedNewGameState = { ...mockGameState, turn: 2 };
    mockTurnService.endTurn.and.returnValue(expectedNewGameState);

    const command = new EndTurnCommand(mockTurnService);
    const result = command.execute(mockGameState);

    expect(mockTurnService.endTurn).toHaveBeenCalledWith(mockGameState);
    expect(result).toEqual(expectedNewGameState);
  });
});