import { EconomyService } from './economy.service';
import type { Star } from '../../models/game.model';

describe('EconomyService', () => {
  let service: EconomyService;

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'star1',
    name: 'Test Planet',
    position: { x: 0, y: 0 },
    population: 1000,
    maxPopulation: 1000000,
    resources: 5000,
    surfaceMinerals: { ironium: 1000, boranium: 800, germanium: 600 },
    mineralConcentrations: { ironium: 100, boranium: 80, germanium: 60 },
    mines: 50,
    factories: 100,
    defenses: 10,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
    ownerId: 'player1',
    ...overrides,
  });

  beforeEach(() => {
    service = new EconomyService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateProduction', () => {
    it('should calculate production with factories limited by population', () => {
      const star = createStar({ population: 100, factories: 50 });
      const result = service.calculateProduction(star);

      expect(result.operableFactories).toBe(10); // Math.min(50, 100/10)
      expect(result.resources).toBe(10);
    });

    it('should calculate mining extraction based on concentrations', () => {
      const star = createStar({ 
        population: 1000, 
        mines: 100,
        mineralConcentrations: { ironium: 100, boranium: 50, germanium: 25 }
      });
      const result = service.calculateProduction(star);

      expect(result.operableMines).toBe(100); // Math.min(100, 1000/10)
      expect(result.extraction.ironium).toBe(100 * (100 / 100)); // 100
      expect(result.extraction.boranium).toBe(100 * (50 / 100)); // 50
      expect(result.extraction.germanium).toBe(100 * (25 / 100)); // 25
    });

    it('should limit mines by population', () => {
      const star = createStar({ population: 50, mines: 100 });
      const result = service.calculateProduction(star);

      expect(result.operableMines).toBe(5); // Math.min(100, 50/10)
    });

    it('should handle zero population', () => {
      const star = createStar({ population: 0, factories: 50, mines: 50 });
      const result = service.calculateProduction(star);

      expect(result.operableFactories).toBe(0);
      expect(result.operableMines).toBe(0);
      expect(result.resources).toBe(0);
    });

    it('should extract zero minerals when concentrations are zero', () => {
      const star = createStar({ 
        population: 1000,
        mines: 50,
        mineralConcentrations: { ironium: 0, boranium: 0, germanium: 0 }
      });
      const result = service.calculateProduction(star);

      expect(result.extraction.ironium).toBe(0);
      expect(result.extraction.boranium).toBe(0);
      expect(result.extraction.germanium).toBe(0);
    });
  });

  describe('applyMiningDepletion', () => {
    it('should increase surface minerals from extraction', () => {
      const star = createStar({ 
        surfaceMinerals: { ironium: 100, boranium: 100, germanium: 100 }
      });
      const extraction = { ironium: 50, boranium: 30, germanium: 20 };

      service.applyMiningDepletion(star, extraction);

      expect(star.surfaceMinerals.ironium).toBe(150);
      expect(star.surfaceMinerals.boranium).toBe(130);
      expect(star.surfaceMinerals.germanium).toBe(120);
    });

    it('should deplete concentrations by extraction rate', () => {
      const star = createStar({
        mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 }
      });
      const extraction = { ironium: 50, boranium: 30, germanium: 20 };

      service.applyMiningDepletion(star, extraction);

      expect(star.mineralConcentrations.ironium).toBeLessThan(100);
      expect(star.mineralConcentrations.boranium).toBeLessThan(100);
      expect(star.mineralConcentrations.germanium).toBeLessThan(100);
    });

    it('should not allow negative concentrations', () => {
      const star = createStar({
        mineralConcentrations: { ironium: 5, boranium: 5, germanium: 5 }
      });
      const extraction = { ironium: 1000, boranium: 1000, germanium: 1000 };

      service.applyMiningDepletion(star, extraction);

      expect(star.mineralConcentrations.ironium).toBeGreaterThanOrEqual(0);
      expect(star.mineralConcentrations.boranium).toBeGreaterThanOrEqual(0);
      expect(star.mineralConcentrations.germanium).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logisticGrowth', () => {
    it('should calculate growth with logistic formula', () => {
      const growth = service.logisticGrowth(1000, 1000000, 0.1);
      expect(growth).toBeGreaterThan(0);
    });

    it('should return 0 when at max population', () => {
      const growth = service.logisticGrowth(1000000, 1000000, 0.1);
      expect(growth).toBe(0);
    });

    it('should return 0 when population is zero', () => {
      const growth = service.logisticGrowth(0, 1000000, 0.1);
      expect(growth).toBe(0);
    });

    it('should increase with higher growth rate', () => {
      const growth1 = service.logisticGrowth(500, 1000000, 0.1);
      const growth2 = service.logisticGrowth(500, 1000000, 0.2);
      expect(growth2).toBeGreaterThan(growth1);
    });

    it('should slow growth as population approaches max', () => {
      const veryLowPopGrowth = service.logisticGrowth(10, 1000000, 0.1);
      const lowPopGrowth = service.logisticGrowth(100, 1000000, 0.1);
      const midPopGrowth = service.logisticGrowth(500000, 1000000, 0.1);
      const veryHighPopGrowth = service.logisticGrowth(999000, 1000000, 0.1);
      // Growth should increase with population up to midpoint then decrease near max
      expect(lowPopGrowth).toBeGreaterThan(veryLowPopGrowth);
      expect(midPopGrowth).toBeGreaterThan(lowPopGrowth);
      expect(veryHighPopGrowth).toBeLessThan(midPopGrowth);
    });
  });

  describe('spend', () => {
    it('should spend resources when sufficient funds available', () => {
      const star = createStar({ resources: 1000, surfaceMinerals: { ironium: 500, boranium: 300, germanium: 200 } });
      const success = service.spend(star, { resources: 100, ironium: 50, boranium: 30 });

      expect(success).toBe(true);
      expect(star.resources).toBe(900);
      expect(star.surfaceMinerals.ironium).toBe(450);
      expect(star.surfaceMinerals.boranium).toBe(270);
    });

    it('should not spend if resources insufficient', () => {
      const star = createStar({ resources: 50 });
      const success = service.spend(star, { resources: 100 });

      expect(success).toBe(false);
      expect(star.resources).toBe(50);
    });

    it('should not spend if ironium insufficient', () => {
      const star = createStar({ resources: 1000, surfaceMinerals: { ironium: 10, boranium: 300, germanium: 200 } });
      const success = service.spend(star, { resources: 0, ironium: 50 });

      expect(success).toBe(false);
      expect(star.surfaceMinerals.ironium).toBe(10);
    });

    it('should not spend if boranium insufficient', () => {
      const star = createStar({ resources: 1000, surfaceMinerals: { ironium: 500, boranium: 10, germanium: 200 } });
      const success = service.spend(star, { resources: 0, boranium: 50 });

      expect(success).toBe(false);
      expect(star.surfaceMinerals.boranium).toBe(10);
    });

    it('should not spend if germanium insufficient', () => {
      const star = createStar({ resources: 1000, surfaceMinerals: { ironium: 500, boranium: 300, germanium: 10 } });
      const success = service.spend(star, { resources: 0, germanium: 50 });

      expect(success).toBe(false);
      expect(star.surfaceMinerals.germanium).toBe(10);
    });

    it('should spend only resources when minerals not specified', () => {
      const star = createStar({ resources: 1000 });
      const success = service.spend(star, { resources: 200 });

      expect(success).toBe(true);
      expect(star.resources).toBe(800);
    });

    it('should handle spending zero cost', () => {
      const star = createStar();
      const oldResources = star.resources;
      const success = service.spend(star, { resources: 0 });

      expect(success).toBe(true);
      expect(star.resources).toBe(oldResources);
    });
  });
});

