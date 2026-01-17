import { TestBed } from '@angular/core/testing';
import { TechService } from './tech.service';
import type { Player } from '../../models/game.model';
import type { ComponentStats, PrimaryRacialTrait, LesserRacialTrait } from '../../data/tech-atlas.types';

describe('TechService', () => {
  let service: TechService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TechService],
    });
    service = TestBed.inject(TechService);
  });

  const createMockPlayer = (
    prt: Array<PrimaryRacialTrait>,
    lrt: Array<LesserRacialTrait>,
    techLevels = { Energy: 26, Kinetics: 26, Propulsion: 26, Construction: 26 },
  ): Player => ({
    id: 'test-player',
    name: 'Test Player',
    species: {
      id: 'test-species',
      name: 'Test Species',
      habitat: {
        idealTemperature: 20,
        idealAtmosphere: 50,
        toleranceRadius: 40,
      },
      traits: [],
      primaryTraits: prt,
      lesserTraits: lrt,
    },
    techLevels,
    researchProgress: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    selectedResearchField: 'Energy',
    ownedStarIds: [],
    scanReports: {},
  });

  const createMockComponent = (overrides: Partial<ComponentStats> = {}): ComponentStats =>
    ({
      id: 'test-component',
      name: 'Test Component',
      type: 'Engine',
      tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      mass: 10,
      cost: { ironium: 0, boranium: 0, germanium: 0, resources: 100 },
      stats: {},
      description: 'Test component',
      ...overrides,
    }) as ComponentStats;

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isComponentAllowedByTraits', () => {
    describe('Primary Racial Trait Required', () => {
      it('should allow component when player has required PRT', () => {
        const player = createMockPlayer(['Super Stealth'], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block component when player lacks required PRT', () => {
        const player = createMockPlayer(['Jack of All Trades'], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should block component when player has no PRTs', () => {
        const player = createMockPlayer([], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should require ALL PRTs when multiple are listed', () => {
        const player = createMockPlayer(['Super Stealth', 'Inner Strength'], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth', 'Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block when player has only SOME of multiple required PRTs', () => {
        const player = createMockPlayer(['Super Stealth'], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth', 'Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });
    });

    describe('Primary Racial Trait Unavailable', () => {
      it('should block component when player has unavailable PRT', () => {
        const player = createMockPlayer(['Inner Strength'], []);
        const component = createMockComponent({
          primaryRacialTraitUnavailable: ['Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should allow component when player lacks unavailable PRT', () => {
        const player = createMockPlayer(['Jack of All Trades'], []);
        const component = createMockComponent({
          primaryRacialTraitUnavailable: ['Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block when player has ANY of multiple unavailable PRTs', () => {
        const player = createMockPlayer(['Inner Strength'], []);
        const component = createMockComponent({
          primaryRacialTraitUnavailable: ['Inner Strength', 'Super Stealth'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should allow when player has NONE of multiple unavailable PRTs', () => {
        const player = createMockPlayer(['Jack of All Trades'], []);
        const component = createMockComponent({
          primaryRacialTraitUnavailable: ['Inner Strength', 'Super Stealth'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });
    });

    describe('Lesser Racial Trait Required', () => {
      it('should allow component when player has required LRT', () => {
        const player = createMockPlayer([], ['Improved Fuel Efficiency']);
        const component = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block component when player lacks required LRT', () => {
        const player = createMockPlayer([], ['Generalized Research']);
        const component = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should block component when player has no LRTs', () => {
        const player = createMockPlayer([], []);
        const component = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should require ALL LRTs when multiple are listed', () => {
        const player = createMockPlayer([], [
          'Improved Fuel Efficiency',
          'Total Terraforming',
        ]);
        const component = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency', 'Total Terraforming'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block when player has only SOME of multiple required LRTs', () => {
        const player = createMockPlayer([], ['Improved Fuel Efficiency']);
        const component = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency', 'Total Terraforming'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });
    });

    describe('Lesser Racial Trait Unavailable', () => {
      it('should block component when player has unavailable LRT', () => {
        const player = createMockPlayer([], ['No Ramscoop Engines']);
        const component = createMockComponent({
          lesserRacialTraitUnavailable: ['No Ramscoop Engines'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should allow component when player lacks unavailable LRT', () => {
        const player = createMockPlayer([], ['Generalized Research']);
        const component = createMockComponent({
          lesserRacialTraitUnavailable: ['No Ramscoop Engines'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block when player has ANY of multiple unavailable LRTs', () => {
        const player = createMockPlayer([], ['No Ramscoop Engines']);
        const component = createMockComponent({
          lesserRacialTraitUnavailable: ['No Ramscoop Engines', 'No Advanced Sensors'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should allow when player has NONE of multiple unavailable LRTs', () => {
        const player = createMockPlayer([], ['Generalized Research']);
        const component = createMockComponent({
          lesserRacialTraitUnavailable: ['No Ramscoop Engines', 'No Advanced Sensors'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });
    });

    describe('No Trait Restrictions', () => {
      it('should allow component with no trait requirements', () => {
        const player = createMockPlayer(['Jack of All Trades'], ['Generalized Research']);
        const component = createMockComponent();

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should allow component with no traits for player with no traits', () => {
        const player = createMockPlayer([], []);
        const component = createMockComponent();

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });
    });

    describe('Complex Trait Combinations', () => {
      it('should handle component with both required and unavailable PRTs', () => {
        const player = createMockPlayer(['Super Stealth'], []);
        const componentAllowed = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
          primaryRacialTraitUnavailable: ['Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(componentAllowed, player)).toBe(true);
      });

      it('should block when required PRT present but also has unavailable PRT', () => {
        const player = createMockPlayer(['Super Stealth', 'Inner Strength'], []);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
          primaryRacialTraitUnavailable: ['Inner Strength'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });

      it('should handle component with PRT and LRT requirements', () => {
        const player = createMockPlayer(['Super Stealth'], ['Improved Fuel Efficiency']);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(true);
      });

      it('should block when has PRT but lacks required LRT', () => {
        const player = createMockPlayer(['Super Stealth'], ['Generalized Research']);
        const component = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });

        expect(service.isComponentAllowedByTraits(component, player)).toBe(false);
      });
    });
  });

  describe('isComponentAvailable', () => {
    it('should allow component when both trait and tech requirements met', () => {
      const player = createMockPlayer(
        ['Super Stealth'],
        [],
        { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
      );
      const component = createMockComponent({
        primaryRacialTraitRequired: ['Super Stealth'],
        tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      });

      expect(service.isComponentAvailable(component, player)).toBe(true);
    });

    it('should block component when trait requirement met but tech level too low', () => {
      const player = createMockPlayer(
        ['Super Stealth'],
        [],
        { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 },
      );
      const component = createMockComponent({
        primaryRacialTraitRequired: ['Super Stealth'],
        tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      });

      expect(service.isComponentAvailable(component, player)).toBe(false);
    });

    it('should block component when tech level met but lacks required trait', () => {
      const player = createMockPlayer(
        ['Jack of All Trades'],
        [],
        { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
      );
      const component = createMockComponent({
        primaryRacialTraitRequired: ['Super Stealth'],
        tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      });

      expect(service.isComponentAvailable(component, player)).toBe(false);
    });

    it('should block component when neither trait nor tech requirements met', () => {
      const player = createMockPlayer(
        ['Jack of All Trades'],
        [],
        { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 },
      );
      const component = createMockComponent({
        primaryRacialTraitRequired: ['Super Stealth'],
        tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      });

      expect(service.isComponentAvailable(component, player)).toBe(false);
    });

    it('should allow component with no restrictions when tech level met', () => {
      const player = createMockPlayer(
        ['Jack of All Trades'],
        [],
        { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
      );
      const component = createMockComponent({
        tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
      });

      expect(service.isComponentAvailable(component, player)).toBe(true);
    });
  });

  describe('Species-Specific Component Access', () => {
    describe('Terrans (Jack of All Trades)', () => {
      const terranPlayer = createMockPlayer(
        ['Jack of All Trades'],
        ['Generalized Research', 'Improved Starbases', 'Cheap Engines', 'Low Starting Population'],
      );

      it('should have access to standard components', () => {
        const standardComponent = createMockComponent();
        expect(service.isComponentAllowedByTraits(standardComponent, terranPlayer)).toBe(true);
      });

      it('should NOT have access to Super Stealth components', () => {
        const stealthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });
        expect(service.isComponentAllowedByTraits(stealthComponent, terranPlayer)).toBe(false);
      });

      it('should NOT have access to Inner Strength components', () => {
        const innerStrengthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Inner Strength'],
        });
        expect(service.isComponentAllowedByTraits(innerStrengthComponent, terranPlayer)).toBe(
          false,
        );
      });
    });

    describe('Crystallids (Inner Strength)', () => {
      const crystallidPlayer = createMockPlayer(
        ['Inner Strength'],
        [
          'Advanced Remote Mining',
          'Ultimate Recycling',
          'Only Basic Remote Mining',
          'No Advanced Sensors',
        ],
      );

      it('should have access to Inner Strength exclusive components', () => {
        const innerStrengthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Inner Strength'],
        });
        expect(service.isComponentAllowedByTraits(innerStrengthComponent, crystallidPlayer)).toBe(
          true,
        );
      });

      it('should be blocked from Smart Bombs (Inner Strength unavailable)', () => {
        const smartBomb = createMockComponent({
          primaryRacialTraitUnavailable: ['Inner Strength'],
        });
        expect(service.isComponentAllowedByTraits(smartBomb, crystallidPlayer)).toBe(false);
      });

      it('should NOT have access to Super Stealth components', () => {
        const stealthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });
        expect(service.isComponentAllowedByTraits(stealthComponent, crystallidPlayer)).toBe(false);
      });
    });

    describe('Pyreans (Super Stealth)', () => {
      const pyreanPlayer = createMockPlayer(
        ['Super Stealth'],
        [
          'Generalized Research',
          'Improved Fuel Efficiency',
          'Bleeding Edge Technology',
          'Low Starting Population',
        ],
      );

      it('should have access to Super Stealth exclusive components', () => {
        const stealthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });
        expect(service.isComponentAllowedByTraits(stealthComponent, pyreanPlayer)).toBe(true);
      });

      it('should have access to Improved Fuel Efficiency components', () => {
        const fuelComponent = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });
        expect(service.isComponentAllowedByTraits(fuelComponent, pyreanPlayer)).toBe(true);
      });

      it('should have access to standard components', () => {
        const standardComponent = createMockComponent();
        expect(service.isComponentAllowedByTraits(standardComponent, pyreanPlayer)).toBe(true);
      });

      it('should NOT have access to Inner Strength components', () => {
        const innerStrengthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Inner Strength'],
        });
        expect(service.isComponentAllowedByTraits(innerStrengthComponent, pyreanPlayer)).toBe(
          false,
        );
      });
    });

    describe('Voidborn (Interstellar Traveler)', () => {
      const voidbornPlayer = createMockPlayer(
        ['Interstellar Traveler'],
        ['Improved Fuel Efficiency', 'Total Terraforming', 'No Ramscoop Engines', 'Mineral Alchemy'],
      );

      it('should have access to Interstellar Traveler exclusive components', () => {
        const itComponent = createMockComponent({
          primaryRacialTraitRequired: ['Interstellar Traveler'],
        });
        expect(service.isComponentAllowedByTraits(itComponent, voidbornPlayer)).toBe(true);
      });

      it('should have access to Improved Fuel Efficiency components', () => {
        const fuelComponent = createMockComponent({
          lesserRacialTraitRequired: ['Improved Fuel Efficiency'],
        });
        expect(service.isComponentAllowedByTraits(fuelComponent, voidbornPlayer)).toBe(true);
      });

      it('should be blocked from ramscoop engines (No Ramscoop Engines)', () => {
        const ramscoopEngine = createMockComponent({
          isRamscoop: true,
          lesserRacialTraitUnavailable: ['No Ramscoop Engines'],
        });
        expect(service.isComponentAllowedByTraits(ramscoopEngine, voidbornPlayer)).toBe(false);
      });

      it('should NOT have access to Super Stealth components', () => {
        const stealthComponent = createMockComponent({
          primaryRacialTraitRequired: ['Super Stealth'],
        });
        expect(service.isComponentAllowedByTraits(stealthComponent, voidbornPlayer)).toBe(false);
      });
    });
  });
});
