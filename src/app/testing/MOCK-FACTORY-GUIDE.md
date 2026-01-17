# Mock Factory Usage Guide

## Overview

A centralized `MockPlayerFactory` has been created to provide consistent mock Player objects across all test files. This eliminates TypeScript errors from missing required properties like `scanReports`.

## Location

`src/app/testing/mock-player.factory.ts`

## Basic Usage

### Simple Mock Player

```typescript
import { MockPlayerFactory } from '../../testing/mock-player.factory';

const mockPlayer = MockPlayerFactory.create();
// Returns a Player with all required properties and sensible defaults
```

### With Custom Properties

```typescript
const mockPlayer = MockPlayerFactory.create({
  id: 'player-123',
  name: 'My Player',
  ownedStarIds: ['star-1', 'star-2'],
});
```

## Factory Methods

### `MockPlayerFactory.create(overrides)`

Creates a Player with default values, optionally merged with overrides.

```typescript
const player = MockPlayerFactory.create({
  id: 'custom-player',
  ownedStarIds: ['star-1'],
});
```

### `MockPlayerFactory.withTechLevels(techOverrides, overrides)`

Creates a Player with specific tech levels.

```typescript
const player = MockPlayerFactory.withTechLevels(
  { Energy: 10, Kinetics: 8 },
  { id: 'advanced-player' }
);
```

### `MockPlayerFactory.withOwnedStars(starIds, overrides)`

Creates a Player with specific owned stars.

```typescript
const player = MockPlayerFactory.withOwnedStars(
  ['star-1', 'star-2', 'star-3']
);
```

### `MockPlayerFactory.withSpecies(species, overrides)`

Creates a Player with a custom species.

```typescript
const player = MockPlayerFactory.withSpecies(customSpecies, {
  id: 'alien-player',
});
```

## Default Values

```typescript
{
  id: 'test-player',
  name: 'Test Player',
  species: {
    id: 'species-1',
    name: 'Human',
    habitat: { /* ... */ },
    traits: [],
    primaryTraits: [],
    lesserTraits: [],
  },
  ownedStarIds: [],
  techLevels: {
    Energy: 1,
    Kinetics: 1,
    Propulsion: 1,
    Construction: 1,
  },
  researchProgress: {
    Energy: 0,
    Kinetics: 0,
    Propulsion: 0,
    Construction: 0,
  },
  selectedResearchField: 'Energy',
  scanReports: {},
}
```

## Examples in Test Files

### Before (❌ TypeScript Error)

```typescript
const mockPlayer: Player = {
  id: 'player-1',
  name: 'Test',
  species: {...},
  // ❌ Error: Property 'scanReports' is missing
};
```

### After (✅ No Error)

```typescript
import { MockPlayerFactory } from '../testing/mock-player.factory';

const mockPlayer = MockPlayerFactory.create({
  id: 'player-1',
  name: 'Test',
});
// ✅ All required properties included
```

## Migration Steps

1. Import the factory: `import { MockPlayerFactory } from '../testing/mock-player.factory';`
2. Replace manual Player object creation with `MockPlayerFactory.create()`
3. Pass any custom overrides as a single object argument

## Benefits

- ✅ Eliminates TypeScript errors from missing properties
- ✅ Consistent Player mocks across all tests
- ✅ Easy to customize with builder-like methods
- ✅ Centralized default values for easy maintenance
- ✅ Reduces test boilerplate code
