import type { Player, Species } from '../models/game.model';

/**
 * Factory for creating mock Player objects with all required properties.
 * Use this in tests to avoid TypeScript errors from missing properties.
 */
export class MockPlayerFactory {
  /**
   * Creates a mock Player with default values
   */
  static create(overrides: Partial<Player> = {}): Player {
    const defaultPlayer: Player = {
      id: 'test-player',
      name: 'Test Player',
      species: {
        id: 'species-1',
        name: 'Human',
        habitat: {
          idealTemperature: 50,
          idealAtmosphere: 50,
          toleranceRadius: 15,
        },
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
    };

    return { ...defaultPlayer, ...overrides };
  }

  /**
   * Creates a mock Player with tech level overrides
   */
  static withTechLevels(
    techOverrides: Partial<Player['techLevels']> = {},
    overrides: Partial<Player> = {}
  ): Player {
    return MockPlayerFactory.create({
      techLevels: {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
        ...techOverrides,
      },
      ...overrides,
    });
  }

  /**
   * Creates a mock Player with owned stars
   */
  static withOwnedStars(starIds: string[], overrides: Partial<Player> = {}): Player {
    return MockPlayerFactory.create({
      ownedStarIds: starIds,
      ...overrides,
    });
  }

  /**
   * Creates a mock Player with custom species
   */
  static withSpecies(species: Species, overrides: Partial<Player> = {}): Player {
    return MockPlayerFactory.create({
      species,
      ...overrides,
    });
  }
}
