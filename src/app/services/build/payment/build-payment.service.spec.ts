import type { ResourceAmount } from './build-payment.service';
import { BuildPaymentService } from './build-payment.service';
import type { BuildItem, Star } from '../../../models/game.model';

describe('BuildPaymentService', () => {
  let service: BuildPaymentService;

  beforeEach(() => {
    service = new BuildPaymentService();
  });

  const createStar = (overrides: Partial<Star> = {}): Star => ({
    id: 'star1',
    name: 'Test Star',
    position: { x: 100, y: 100 },
    ownerId: 'p1',
    population: 10000,
    maxPopulation: 1000000,
    resources: 500,
    surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
    mineralConcentrations: { ironium: 100, boranium: 100, germanium: 100 },
    mines: 10,
    factories: 10,
    defenses: 0,
    temperature: 50,
    atmosphere: 50,
    terraformOffset: { temperature: 0, atmosphere: 0 },
    scanner: 0,
    research: 0,
    ...overrides,
  });

  const createBuildItem = (overrides: Partial<BuildItem> = {}): BuildItem => ({
    project: 'mine',
    cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
    ...overrides
  });

  const zeroResources = (): ResourceAmount => ({
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0
  });

  describe('initializeItemPayment', () => {
    it('should initialize paid property when undefined', () => {
      const item = createBuildItem();
      expect(item.paid).toBeUndefined();

      service.initializeItemPayment(item);

      expect(item.paid).toEqual({ resources: 0, ironium: 0, boranium: 0, germanium: 0 });
    });

    it('should not overwrite existing paid property', () => {
      const item = createBuildItem({
        paid: { resources: 50, ironium: 25, boranium: 15, germanium: 10 }
      });

      service.initializeItemPayment(item);

      expect(item.paid).toEqual({ resources: 50, ironium: 25, boranium: 15, germanium: 10 });
    });
  });

  describe('calculateTotalCost', () => {
    it('should return all cost values with defaults for undefined', () => {
      const item = createBuildItem({
        cost: { resources: 100 }
      });

      const result = service.calculateTotalCost(item);

      expect(result).toEqual({ resources: 100, ironium: 0, boranium: 0, germanium: 0 });
    });

    it('should return exact cost values when all defined', () => {
      const item = createBuildItem({
        cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 }
      });

      const result = service.calculateTotalCost(item);

      expect(result).toEqual({ resources: 100, ironium: 50, boranium: 30, germanium: 20 });
    });
  });

  describe('calculateRemainingCost', () => {
    it('should calculate remaining costs correctly', () => {
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const paid: ResourceAmount = { resources: 30, ironium: 10, boranium: 5, germanium: 0 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.calculateRemainingCost(totalCost, paid, scrapCredit);

      expect(result).toEqual({ resources: 70, ironium: 40, boranium: 25, germanium: 20 });
    });

    it('should apply scrap credits to minerals', () => {
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const paid: ResourceAmount = { resources: 50, ironium: 20, boranium: 10, germanium: 5 };
      const scrapCredit: ResourceAmount = { resources: 0, ironium: 15, boranium: 10, germanium: 5 };

      const result = service.calculateRemainingCost(totalCost, paid, scrapCredit);

      expect(result).toEqual({ resources: 50, ironium: 15, boranium: 10, germanium: 10 });
    });

    it('should not return negative values', () => {
      const totalCost: ResourceAmount = { resources: 50, ironium: 25, boranium: 15, germanium: 10 };
      const paid: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.calculateRemainingCost(totalCost, paid, scrapCredit);

      expect(result).toEqual({ resources: 0, ironium: 0, boranium: 0, germanium: 0 });
    });
  });

  describe('calculateAffordablePayment', () => {
    it('should return remaining amount when planet has enough', () => {
      const star = createStar({
        resources: 500,
        surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
      });
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      const result = service.calculateAffordablePayment(star, remaining);

      expect(result).toEqual({ resources: 100, ironium: 50, boranium: 30, germanium: 20 });
    });

    it('should return planet resources when less than remaining', () => {
      const star = createStar({
        resources: 50,
        surfaceMinerals: { ironium: 30, boranium: 20, germanium: 10 },
      });
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      const result = service.calculateAffordablePayment(star, remaining);

      expect(result).toEqual({ resources: 50, ironium: 30, boranium: 20, germanium: 10 });
    });
  });

  describe('deductFromPlanet', () => {
    it('should deduct affordable amounts from planet', () => {
      const star = createStar({
        resources: 500,
        surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
      });
      const affordable: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      service.deductFromPlanet(star, affordable);

      expect(star.resources).toBe(400);
      expect(star.surfaceMinerals.ironium).toBe(150);
      expect(star.surfaceMinerals.boranium).toBe(120);
      expect(star.surfaceMinerals.germanium).toBe(80);
    });
  });

  describe('addToPaidAmount', () => {
    it('should add affordable amounts to item paid', () => {
      const item = createBuildItem({
        paid: { resources: 10, ironium: 5, boranium: 3, germanium: 2 }
      });
      const affordable: ResourceAmount = { resources: 40, ironium: 20, boranium: 12, germanium: 8 };

      service.addToPaidAmount(item, affordable);

      expect(item.paid).toEqual({ resources: 50, ironium: 25, boranium: 15, germanium: 10 });
    });
  });

  describe('checkPaymentCompletion', () => {
    it('should return true when fully paid', () => {
      const paid: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.checkPaymentCompletion(paid, totalCost, scrapCredit);

      expect(result).toBe(true);
    });

    it('should return true when paid plus scrap credit meets cost', () => {
      const paid: ResourceAmount = { resources: 100, ironium: 30, boranium: 20, germanium: 10 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = { resources: 0, ironium: 20, boranium: 10, germanium: 10 };

      const result = service.checkPaymentCompletion(paid, totalCost, scrapCredit);

      expect(result).toBe(true);
    });

    it('should return false when not fully paid', () => {
      const paid: ResourceAmount = { resources: 80, ironium: 40, boranium: 25, germanium: 15 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.checkPaymentCompletion(paid, totalCost, scrapCredit);

      expect(result).toBe(false);
    });

    it('should return false when resources are insufficient', () => {
      const paid: ResourceAmount = { resources: 50, ironium: 50, boranium: 30, germanium: 20 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.checkPaymentCompletion(paid, totalCost, scrapCredit);

      expect(result).toBe(false);
    });
  });

  describe('processItemPayment', () => {
    it('should process full payment when planet has enough resources', () => {
      const star = createStar({
        resources: 500,
        surfaceMinerals: { ironium: 200, boranium: 150, germanium: 100 },
      });
      const item = createBuildItem({
        cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
        paid: { resources: 0, ironium: 0, boranium: 0, germanium: 0 }
      });
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.processItemPayment(star, item, remaining, totalCost, scrapCredit);

      expect(result.isComplete).toBe(true);
      expect(result.paid).toEqual({ resources: 100, ironium: 50, boranium: 30, germanium: 20 });
      expect(star.resources).toBe(400);
    });

    it('should process partial payment when planet has insufficient resources', () => {
      const star = createStar({
        resources: 50,
        surfaceMinerals: { ironium: 30, boranium: 20, germanium: 10 },
      });
      const item = createBuildItem({
        cost: { resources: 100, ironium: 50, boranium: 30, germanium: 20 },
        paid: { resources: 0, ironium: 0, boranium: 0, germanium: 0 }
      });
      const remaining: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();

      const result = service.processItemPayment(star, item, remaining, totalCost, scrapCredit);

      expect(result.isComplete).toBe(false);
      expect(result.paid).toEqual({ resources: 50, ironium: 30, boranium: 20, germanium: 10 });
      expect(star.resources).toBe(0);
    });
  });

  describe('handleExcessRefunds', () => {
    it('should refund excess minerals from scrap credits', () => {
      const star = createStar({
        surfaceMinerals: { ironium: 100, boranium: 100, germanium: 100 },
      });
      const paid: ResourceAmount = { resources: 100, ironium: 40, boranium: 25, germanium: 15 };
      const scrapCredit: ResourceAmount = { resources: 0, ironium: 20, boranium: 15, germanium: 10 };
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      service.handleExcessRefunds(star, paid, scrapCredit, totalCost);

      expect(star.surfaceMinerals.ironium).toBe(110); // 100 + (40+20-50)
      expect(star.surfaceMinerals.boranium).toBe(110); // 100 + (25+15-30)
      expect(star.surfaceMinerals.germanium).toBe(105); // 100 + (15+10-20)
    });

    it('should not refund when no excess', () => {
      const star = createStar({
        surfaceMinerals: { ironium: 100, boranium: 100, germanium: 100 },
      });
      const paid: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };
      const scrapCredit: ResourceAmount = zeroResources();
      const totalCost: ResourceAmount = { resources: 100, ironium: 50, boranium: 30, germanium: 20 };

      service.handleExcessRefunds(star, paid, scrapCredit, totalCost);

      expect(star.surfaceMinerals.ironium).toBe(100);
      expect(star.surfaceMinerals.boranium).toBe(100);
      expect(star.surfaceMinerals.germanium).toBe(100);
    });
  });
});
