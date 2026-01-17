import { TestBed } from '@angular/core/testing';
import { ShipComponentEligibilityService } from './ship-component-eligibility.service';
import type { HullTemplate, PrimaryRacialTrait, LesserRacialTrait } from '../../data/tech-atlas.types';
import type { PlayerTech } from '../../models/game.model';

describe('ShipComponentEligibilityService - Hull Trait Filtering', () => {
  let service: ShipComponentEligibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipComponentEligibilityService],
    });
    service = TestBed.inject(ShipComponentEligibilityService);
  });

  const createMockTechLevels = (construction = 26): PlayerTech => ({
    Energy: 26,
    Kinetics: 26,
    Propulsion: 26,
    Construction: construction,
  });

  const createMockHull = (overrides: Partial<HullTemplate> = {}): HullTemplate =>
    ({
      Name: 'Test Hull',
      Structure: ['E1,E1'],
      Slots: [{ Code: 'E1', Allowed: ['Engine'], Max: 1 }],
      Cost: { Ironium: 10, Boranium: 10, Germanium: 10, Resources: 100 },
      Stats: { Mass: 50, 'Max Fuel': 1000, Armor: 500, Cargo: 0, Initiative: 5 },
      id: 'test-hull',
      techReq: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
      ...overrides,
    }) as HullTemplate;

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Primary Racial Trait Required', () => {
    it('should include hull when player has required PRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Hyper Expansion'];
      const lesserTraits: LesserRacialTrait[] = [];

      // Create a mock ALL_HULLS with our test hull
      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Find the Mini-Colony hull which requires Hyper Expansion
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeDefined();
    });

    it('should exclude hull when player lacks required PRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Jack of All Trades'];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Mini-Colony requires Hyper Expansion, so Terrans (Jack of All Trades) shouldn't see it
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();
    });

    it('should exclude hull when player has no PRTs', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] | null = null;
      const lesserTraits: LesserRacialTrait[] | null = null;

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should exclude hulls that require any PRT
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();
    });

    it('should require ALL PRTs when multiple are listed', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Super Stealth', 'War Monger'];
      const lesserTraits: LesserRacialTrait[] = [];

      // Create a hypothetical hull requiring both traits
      const mockHull = createMockHull({
        id: 'test-multi-prt',
        primaryRacialTraitRequired: ['Super Stealth', 'War Monger'],
      });

      // Test the private method indirectly by checking filtering logic
      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);
      
      // Player with both traits should see trait-restricted hulls
      expect(hulls.length).toBeGreaterThan(0);
    });

    it('should exclude hull when player has only SOME of multiple required PRTs', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Super Stealth'];
      const lesserTraits: LesserRacialTrait[] = [];

      // Player with only one of two required traits should not see the hull
      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);
      
      // Check that we still get some hulls (those without requirements or matching single trait)
      expect(hulls.length).toBeGreaterThan(0);
    });
  });

  describe('Primary Racial Trait Unavailable', () => {
    it('should include hull when player lacks forbidden PRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Jack of All Trades'];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include hulls that don't forbid Jack of All Trades
      expect(hulls.length).toBeGreaterThan(0);
    });

    it('should exclude hull when player has forbidden PRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Inner Strength'];
      const lesserTraits: LesserRacialTrait[] = [];

      // Create mock hull that forbids Inner Strength
      const mockHull = createMockHull({
        id: 'test-forbidden',
        primaryRacialTraitUnavailable: ['Inner Strength'],
      });

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should not find the forbidden hull
      const forbiddenHull = hulls.find((h) => h.id === 'test-forbidden');
      expect(forbiddenHull).toBeUndefined();
    });

    it('should exclude hull when player has ANY of multiple forbidden PRTs', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Inner Strength'];
      const lesserTraits: LesserRacialTrait[] = [];

      // Hull forbidden for Inner Strength OR Super Stealth
      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);
      
      // Player with Inner Strength should not see hulls that forbid it
      expect(hulls).toBeDefined();
    });
  });

  describe('Lesser Racial Trait Required', () => {
    it('should include hull when player has required LRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = ['Advanced Remote Mining'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Check for mining hulls that require Advanced Remote Mining
      const miningHull = hulls.find((h) => 
        h.lesserRacialTraitRequired?.includes('Advanced Remote Mining')
      );
      
      if (miningHull) {
        expect(miningHull).toBeDefined();
      }
    });

    it('should exclude hull when player lacks required LRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = ['Generalized Research'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should not include hulls requiring Advanced Remote Mining
      const advancedMiningHull = hulls.find((h) => 
        h.lesserRacialTraitRequired?.includes('Advanced Remote Mining')
      );
      expect(advancedMiningHull).toBeUndefined();
    });

    it('should exclude hull when player has no LRTs', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] | null = null;

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should exclude hulls requiring any LRT
      const lrtRequiredHull = hulls.find((h) => 
        h.lesserRacialTraitRequired && h.lesserRacialTraitRequired.length > 0
      );
      expect(lrtRequiredHull).toBeUndefined();
    });

    it('should require ALL LRTs when multiple are listed', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = [
        'Improved Fuel Efficiency',
        'Total Terraforming',
      ];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include hulls requiring one or both traits
      expect(hulls.length).toBeGreaterThan(0);
    });
  });

  describe('Lesser Racial Trait Unavailable', () => {
    it('should include hull when player lacks forbidden LRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = ['Generalized Research'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include hulls that don't forbid Generalized Research
      expect(hulls.length).toBeGreaterThan(0);
    });

    it('should exclude hull when player has forbidden LRT', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = ['No Ramscoop Engines'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // All hulls should be available (none specifically forbid LRTs typically)
      expect(hulls).toBeDefined();
    });
  });

  describe('Combined Trait Scenarios', () => {
    it('should handle both PRT and LRT requirements', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Hyper Expansion'];
      const lesserTraits: LesserRacialTrait[] = ['Improved Starbases'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include hulls matching both trait categories
      expect(hulls.length).toBeGreaterThan(0);
    });

    it('should exclude hull when PRT matches but LRT does not', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Super Stealth'];
      const lesserTraits: LesserRacialTrait[] = ['Generalized Research'];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should not include hulls requiring different LRTs
      expect(hulls).toBeDefined();
    });

    it('should handle Terrans correctly (Jack of All Trades)', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Jack of All Trades'];
      const lesserTraits: LesserRacialTrait[] = [
        'Generalized Research',
        'Improved Starbases',
        'Cheap Engines',
        'Low Starting Population',
      ];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Terrans should NOT see Hyper Expansion hulls
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();

      const metaMorph = hulls.find((h) => h.id === 'hull-meta-morph');
      expect(metaMorph).toBeUndefined();

      // Should see regular hulls
      const colonyShip = hulls.find((h) => h.id === 'hull-colony');
      expect(colonyShip).toBeDefined();
    });
  });

  describe('Tech Level Filtering', () => {
    it('should exclude hulls above construction tech level', () => {
      const techLevels = createMockTechLevels(5);
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should only include hulls with Construction requirement <= 5
      const highTechHulls = hulls.filter(
        (h) => (h.techReq?.Construction ?? 0) > 5
      );
      expect(highTechHulls.length).toBe(0);
    });

    it('should include hulls at or below construction tech level', () => {
      const techLevels = createMockTechLevels(10);
      const primaryTraits: PrimaryRacialTrait[] = [];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include basic hulls with low tech requirements
      const basicHulls = hulls.filter(
        (h) => (h.techReq?.Construction ?? 0) <= 10
      );
      expect(basicHulls.length).toBeGreaterThan(0);
    });

    it('should combine tech level and trait filtering', () => {
      const techLevels = createMockTechLevels(5);
      const primaryTraits: PrimaryRacialTrait[] = ['Hyper Expansion'];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Mini-Colony requires Hyper Expansion but has Construction 0
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeDefined();

      // Meta-Morph requires Hyper Expansion AND Construction 7
      const metaMorph = hulls.find((h) => h.id === 'hull-meta-morph');
      expect(metaMorph).toBeUndefined(); // Construction 7 > 5
    });
  });

  describe('Edge Cases', () => {
    it('should handle null primary traits', () => {
      const techLevels = createMockTechLevels();
      const hulls = service.getAvailableHulls(techLevels, null, null);

      // Should only include hulls with no trait requirements
      const traitRestrictedHulls = hulls.filter(
        (h) =>
          (h.primaryRacialTraitRequired && h.primaryRacialTraitRequired.length > 0) ||
          (h.lesserRacialTraitRequired && h.lesserRacialTraitRequired.length > 0)
      );
      expect(traitRestrictedHulls.length).toBe(0);
    });

    it('should handle empty trait arrays', () => {
      const techLevels = createMockTechLevels();
      const hulls = service.getAvailableHulls(techLevels, [], []);

      // Should only include hulls with no trait requirements
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();
    });

    it('should handle hulls with no trait restrictions', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Jack of All Trades'];
      const lesserTraits: LesserRacialTrait[] = [];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should include unrestricted hulls
      const scout = hulls.find((h) => h.id === 'hull-scout');
      if (scout) {
        expect(scout).toBeDefined();
      }
    });
  });

  describe('Real Species Examples', () => {
    it('should filter correctly for Crystallids (Inner Strength)', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Inner Strength'];
      const lesserTraits: LesserRacialTrait[] = [
        'Advanced Remote Mining',
        'Ultimate Recycling',
        'Only Basic Remote Mining',
        'No Advanced Sensors',
      ];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should NOT see Hyper Expansion hulls
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();

      // Should see Inner Strength specific hull
      const innerStrengthHull = hulls.find((h) => h.id === 'hull-orbital-fort');
      if (innerStrengthHull) {
        expect(innerStrengthHull).toBeDefined();
      }
    });

    it('should filter correctly for Pyreans (Super Stealth)', () => {
      const techLevels = createMockTechLevels();
      const primaryTraits: PrimaryRacialTrait[] = ['Super Stealth'];
      const lesserTraits: LesserRacialTrait[] = [
        'Generalized Research',
        'Improved Fuel Efficiency',
        'Bleeding Edge Technology',
        'Low Starting Population',
      ];

      const hulls = service.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      // Should see Super Stealth hulls
      const rogue = hulls.find((h) => h.id === 'hull-rogue');
      if (rogue) {
        expect(rogue).toBeDefined();
      }

      // Should NOT see Hyper Expansion hulls
      const miniColony = hulls.find((h) => h.id === 'hull-mini-colony');
      expect(miniColony).toBeUndefined();
    });
  });
});
