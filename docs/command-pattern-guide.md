# Command Pattern Implementation Guide

## Overview

The Command Pattern is used in Stellar Remnants to manage complex game state operations while avoiding god classes. This guide explains how to work with the existing command infrastructure.

## Architecture

```
GameStateService (Facade)
    ↓ delegates to
CommandFactoryService (Creates commands with DI)
    ↓ creates
Command Objects (Encapsulate operations)
    ↓ executed by
CommandExecutorService (Manages state transitions)
    ↓ calls
Business Logic Services (Colony, Fleet, Research, etc.)
```

## Quick Start

### 1. Using Existing Commands

```typescript
// In a component or service
constructor(private gameState: GameStateService) {}

// Simple operation
addItemToBuildQueue(planetId: string, item: BuildItem) {
  this.gameState.addToBuildQueue(planetId, item);
}

// Operation with result
colonizePlanet(fleetId: string) {
  const planetId = this.gameState.colonizeNow(fleetId);
  if (planetId) {
    console.log(`Colonized planet ${planetId}`);
  }
}
```

### 2. Creating New Commands

#### Step 1: Define the Command Class

```typescript
// src/app/core/commands/my-domain-commands.ts
import { GameCommand } from './game-command.interface';
import { GameState } from '../../models/game.model';
import { MyService } from '../../services/my.service';

export class MyOperationCommand implements GameCommand {
  constructor(
    private myService: MyService,
    private param1: string,
    private param2: number
  ) {}

  execute(game: GameState): GameState {
    return this.myService.performOperation(game, this.param1, this.param2);
  }
}
```

#### Step 2: Add Factory Method

```typescript
// src/app/core/commands/command-factory.service.ts
export class CommandFactoryService {
  constructor(
    // ... existing services
    private myService: MyService
  ) {}

  // ... existing methods

  createMyOperationCommand(param1: string, param2: number): MyOperationCommand {
    return new MyOperationCommand(this.myService, param1, param2);
  }
}
```

#### Step 3: Add Facade Method

```typescript
// src/app/services/game-state.service.ts
export class GameStateService {
  // ... existing methods

  performMyOperation(param1: string, param2: number) {
    const command = this.commandFactory.createMyOperationCommand(param1, param2);
    this.commandExecutor.execute(command);
  }
}
```

#### Step 4: Export from Index

```typescript
// src/app/core/commands/index.ts
export * from './my-domain-commands';
```

## Command Types

### Simple Commands

For operations that only modify game state:

```typescript
interface GameCommand {
  execute(game: GameState): GameState;
}
```

### Commands with Results

For operations that return additional data:

```typescript
interface GameCommandWithResult<T> {
  execute(game: GameState): [GameState, T];
}

// Example usage
export class SplitFleetCommand implements GameCommandWithResult<string | null> {
  execute(game: GameState): [GameState, string | null] {
    return this.fleetService.splitFleet(game, this.fleetId, this.transferSpec);
  }
}
```

## Testing Commands

### Unit Testing Commands

```typescript
describe('MyOperationCommand', () => {
  let mockService: jasmine.SpyObj<MyService>;
  let command: MyOperationCommand;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('MyService', ['performOperation']);
    command = new MyOperationCommand(mockService, 'param1', 42);
  });

  it('should call service with correct parameters', () => {
    const mockGame = createMockGameState();
    const expectedResult = { ...mockGame, modified: true };
    mockService.performOperation.and.returnValue(expectedResult);

    const result = command.execute(mockGame);

    expect(mockService.performOperation).toHaveBeenCalledWith(mockGame, 'param1', 42);
    expect(result).toEqual(expectedResult);
  });
});
```

### Integration Testing

```typescript
describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(GameStateService);
  });

  it('should execute my operation', () => {
    service.newGame(mockSettings);
    
    service.performMyOperation('test', 123);
    
    const game = service.game();
    expect(game?.someProperty).toBe(expectedValue);
  });
});
```

## Best Practices

### ✅ Do

- Keep commands focused on single operations
- Use descriptive command names (AddToBuildQueueCommand, not BuildCommand)
- Handle errors gracefully in commands
- Return valid game state even on errors
- Group related commands in the same file
- Use TypeScript strict mode for strong typing

### ❌ Don't

- Mark commands as `@Injectable` (they're not services)
- Put heavy computation in command constructors
- Create commands for simple read operations
- Use commands for UI state management
- Create god commands that do multiple unrelated things
- Mutate the input game state (always return new state)

## Debugging Commands

### Command Execution Logging

```typescript
// In CommandExecutorService, add logging:
execute(command: GameCommand): void {
  const currentGame = this._game();
  if (!currentGame) return;

  console.log(`Executing command: ${command.constructor.name}`);
  const newGame = command.execute(currentGame);
  this._game.set(newGame);
  console.log(`Command completed: ${command.constructor.name}`);
}
```

### State Comparison

```typescript
// Compare game state before/after command execution
const beforeState = JSON.stringify(this.game());
this.performMyOperation('test', 123);
const afterState = JSON.stringify(this.game());
console.log('State changed:', beforeState !== afterState);
```

## Future Enhancements

The command pattern enables several advanced features:

- **Undo/Redo**: Store command history and reverse operations
- **Command Queuing**: Batch multiple commands for performance
- **Command Validation**: Pre-validate commands before execution
- **Audit Logging**: Track all game operations for debugging
- **Network Sync**: Serialize commands for multiplayer

## Reference

- **Command Interface**: `src/app/core/commands/game-command.interface.ts`
- **Command Executor**: `src/app/core/commands/command-executor.service.ts`
- **Command Factory**: `src/app/core/commands/command-factory.service.ts`
- **Example Commands**: `src/app/core/commands/colony-commands.ts`
- **ADR Document**: `docs/adr/2026-01-10-command-pattern-refactor.md`