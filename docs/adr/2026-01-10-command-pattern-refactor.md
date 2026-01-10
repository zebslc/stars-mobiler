# ADR: Command Pattern Refactor for GameStateService

**Date:** 2026-01-10  
**Status:** Implemented  
**Context:** Code Review Section 3 - God Classes & Service Responsibilities

## Problem

The `GameStateService` was identified as a god class with the following issues:

1. **Too many responsibilities** - 20+ public methods covering game initialization, turn processing, colony management, fleet operations, research, and ship design
2. **Single point of failure** - any change affects everything
3. **Testing complexity** - requires mocking 8 dependencies
4. **Unclear responsibilities** - unclear if it's state, orchestrator, or API

## Decision

Implemented the **Command Pattern** to refactor the GameStateService while maintaining the facade pattern for API consistency.

### Architecture

```
GameStateService (Facade)
    ↓
CommandFactoryService (Creates commands)
    ↓
CommandExecutorService (Executes commands & manages state)
    ↓
Individual Command Classes (Encapsulate operations)
    ↓
Business Logic Services (Unchanged)
```

### Key Components

1. **GameCommand Interface** - Defines contract for all game operations
2. **CommandExecutorService** - Centralized state management and command execution
3. **CommandFactoryService** - Creates command instances with proper DI
4. **Command Classes** - Encapsulate individual operations (AddToBuildQueueCommand, etc.)
5. **GameStateService** - Simplified facade that delegates to commands

## Benefits

### ✅ Separation of Concerns
- **GameStateService**: Clean API facade
- **CommandExecutorService**: State management only
- **Command Classes**: Single operation each
- **Business Services**: Unchanged, focused logic

### ✅ Testability
- Commands can be tested in isolation
- No need to mock 8+ services for each test
- Clear input/output contracts

### ✅ Extensibility
- Easy to add new operations (create new command)
- Future features like undo/redo, command queuing, logging
- Command composition and chaining

### ✅ Maintainability
- Changes to operations are isolated to specific command classes
- Clear responsibility boundaries
- Reduced coupling between facade and business logic

## Implementation Details

### Command Structure

```typescript
// Simple command
interface GameCommand {
  execute(game: GameState): GameState;
}

// Command with return value
interface GameCommandWithResult<T> {
  execute(game: GameState): [GameState, T];
}
```

### Example Usage

```typescript
// Before (in GameStateService)
addToBuildQueue(planetId: string, item: BuildItem): boolean {
  const game = this._game();
  if (!game) return false;
  const nextGame = this.colonyService.addToBuildQueue(game, planetId, item);
  if (nextGame !== game) {
    this._game.set(nextGame);
    return true;
  }
  return false;
}

// After (using commands)
addToBuildQueue(planetId: string, item: BuildItem): boolean {
  const command = this.commandFactory.createAddToBuildQueueCommand(planetId, item);
  const currentGame = this.commandExecutor.getCurrentGame();
  if (!currentGame) return false;
  
  const originalGame = currentGame;
  this.commandExecutor.execute(command);
  
  return this.commandExecutor.getCurrentGame() !== originalGame;
}
```

### Command Categories

- **Colony Commands**: AddToBuildQueueCommand, SetGovernorCommand, RemoveFromQueueCommand
- **Fleet Commands**: IssueFleetOrderCommand, ColonizeNowCommand, SplitFleetCommand, etc.
- **Research Commands**: SetResearchFieldCommand
- **Shipyard Commands**: SaveShipDesignCommand, DeleteShipDesignCommand
- **Turn Commands**: EndTurnCommand

## Migration Strategy

### Phase 1: ✅ Completed
- Created command infrastructure
- Refactored GameStateService to use commands
- Maintained existing API for backward compatibility

### Phase 2: Future
- Add command logging/auditing
- Implement undo/redo functionality
- Add command validation pipeline
- Performance optimizations (command batching)

## Alternatives Considered

### Option 2: Feature Stores
Split into domain-specific stores (ColonyStateService, FleetStateService, etc.)

**Rejected because:**
- Would break existing API contracts
- More complex migration path
- Doesn't align with current facade pattern usage

### Option 3: Keep but Document
Document the god class as intentional architectural decision

**Rejected because:**
- Doesn't solve the underlying issues
- Testing and maintenance problems remain
- Goes against "No god classes" guardrail

## Compliance with Guardrails

✅ **Signals-first**: CommandExecutorService uses signals for state management  
✅ **No god classes**: Responsibilities now distributed across focused command classes  
✅ **Strong typing**: All commands are strongly typed with clear interfaces  
✅ **DRY and YAGNI**: No speculative abstractions, focused on current needs  
✅ **Folder structure**: Commands placed in `app/core/commands` as cross-cutting concern

## Testing Strategy

### Command Testing
```typescript
describe('AddToBuildQueueCommand', () => {
  it('should add item to build queue', () => {
    const command = new AddToBuildQueueCommand(colonyService, 'planet1', mockItem);
    const result = command.execute(mockGameState);
    expect(result.stars[0].planets[0].buildQueue).toContain(mockItem);
  });
});
```

### Integration Testing
```typescript
describe('GameStateService', () => {
  it('should execute add to build queue command', () => {
    service.addToBuildQueue('planet1', mockItem);
    expect(service.game()?.stars[0].planets[0].buildQueue).toContain(mockItem);
  });
});
```

## Performance Impact

- **Minimal overhead**: Command creation is lightweight
- **Same execution path**: Business logic unchanged
- **Memory efficient**: Commands are short-lived objects
- **Future optimizations**: Command batching, memoization possible

## Conclusion

The Command Pattern refactor successfully addresses the god class issues while:
- Maintaining API compatibility
- Improving testability and maintainability
- Enabling future extensibility features
- Following established architectural patterns
- Complying with project guardrails

The GameStateService is now a clean facade that delegates to focused, testable command objects.