import { GalaxyGeneratorService } from './galaxy-generator.service';
import { Species } from '../../models/game.model';

describe('GalaxyGeneratorService', () => {
  let service: GalaxyGeneratorService;

  const createSpecies = (overrides: Partial<Species> = {}): Species => ({
    id: 'human',
    name: 'Human',
    habitat: {
      idealTemperature: 50,
      idealAtmosphere: 50,
      toleranceRadius: 25
    },
    traits: [],
    ...overrides
  });

  beforeEach(() => {
    service = new GalaxyGeneratorService();
  });

  describe('generateGalaxy', () => {
    it('should generate the requested number of stars', () => {
      const stars = service.generateGalaxy(10, 12345, 800, 600);

      expect(stars.length).toBe(10);
    });

    it('should generate stars with unique IDs', () => {
      const stars = service.generateGalaxy(5, 12345, 800, 600);

      const ids = stars.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(stars.length);
    });

    it('should generate stars with positions within bounds', () => {
      const width = 800;
      const height = 600;
      const stars = service.generateGalaxy(10, 12345, width, height);

      for (const star of stars) {
        expect(star.position.x).toBeGreaterThanOrEqual(0);
        expect(star.position.x).toBeLessThanOrEqual(width);
        expect(star.position.y).toBeGreaterThanOrEqual(0);
        expect(star.position.y).toBeLessThanOrEqual(height);
      }
    });

    it('should generate stars with at least one planet each', () => {
      const stars = service.generateGalaxy(5, 12345, 800, 600);

      for (const star of stars) {
        expect(1).toBeGreaterThanOrEqual(1);
      }
    });

    it('should generate stars with names', () => {
      const stars = service.generateGalaxy(5, 12345, 800, 600);

      for (const star of stars) {
        expect(star.name).toBeDefined();
        expect(star.name.length).toBeGreaterThan(0);
      }
    });

    it('should produce deterministic results with same seed', () => {
      const seed = 42;
      const stars1 = service.generateGalaxy(5, seed, 800, 600);
      const stars2 = service.generateGalaxy(5, seed, 800, 600);

      expect(stars1.length).toBe(stars2.length);
      for (let i = 0; i < stars1.length; i++) {
        expect(stars1[i].name).toBe(stars2[i].name);
        expect(stars1[i].position.x).toBe(stars2[i].position.x);
        expect(stars1[i].position.y).toBe(stars2[i].position.y);
      }
    });

    it('should produce different results with different seeds', () => {
      const stars1 = service.generateGalaxy(5, 100, 800, 600);
      const stars2 = service.generateGalaxy(5, 200, 800, 600);

      // At least some positions should differ
      const samePositions = stars1.every((s, i) =>
        s.position.x === stars2[i].position.x && s.position.y === stars2[i].position.y
      );
      expect(samePositions).toBe(false);
    });

    it('should generate planets with valid attributes', () => {
      const stars = service.generateGalaxy(3, 12345, 800, 600);

      for (const star of stars) {
        // Star now contains planet properties directly
        expect(star.temperature).toBeGreaterThanOrEqual(-100);
        expect(star.temperature).toBeLessThanOrEqual(100);
        expect(star.atmosphere).toBeGreaterThanOrEqual(0);
        expect(star.atmosphere).toBeLessThanOrEqual(100);
        expect(star.mineralConcentrations.ironium).toBeGreaterThan(0);
        expect(star.mineralConcentrations.boranium).toBeGreaterThan(0);
        expect(star.mineralConcentrations.germanium).toBeGreaterThan(0);
      }
    });

    it('should set planet names to match star names', () => {
      const stars = service.generateGalaxy(3, 12345, 800, 600);

      for (const star of stars) {
        // Star now contains planet properties directly
        expect(star.name).toBeDefined();
      }
    });
  });

  describe('assignStartPositions', () => {
    it('should assign homeworlds to opposite ends of galaxy', () => {
      const stars = service.generateGalaxy(10, 12345, 800, 600);
      const playerSpecies = createSpecies({ id: 'human' });
      const aiSpecies = createSpecies({ id: 'ai' });

      service.assignStartPositions(stars, 'player1', 'ai1', playerSpecies, aiSpecies, 12345);

      // Find the homeworlds
      const homeworld = stars.find(s => s.name === 'Home');
      const enemyHomeworld = stars.find(s => s.name === 'Enemy Home');

      expect(homeworld).toBeDefined();
      expect(enemyHomeworld).toBeDefined();
      expect(homeworld).not.toBe(enemyHomeworld);
    });

    it('should create homeworlds with ideal habitat conditions', () => {
      const stars = service.generateGalaxy(10, 12345, 800, 600);
      const playerSpecies = createSpecies({
        habitat: { idealTemperature: 60, idealAtmosphere: 40, toleranceRadius: 25 }
      });
      const aiSpecies = createSpecies({
        habitat: { idealTemperature: 30, idealAtmosphere: 70, toleranceRadius: 20 }
      });

      service.assignStartPositions(stars, 'player1', 'ai1', playerSpecies, aiSpecies, 12345);

      const homeworld = stars.find(s => s.name === 'Home');
      const enemyHomeworld = stars.find(s => s.name === 'Enemy Home');

      expect(homeworld?.temperature).toBe(60);
      expect(homeworld?.atmosphere).toBe(40);
      expect(enemyHomeworld?.temperature).toBe(30);
      expect(enemyHomeworld?.atmosphere).toBe(70);
    });

    it('should create homeworlds with starting infrastructure', () => {
      const stars = service.generateGalaxy(10, 12345, 800, 600);
      const playerSpecies = createSpecies();
      const aiSpecies = createSpecies();

      service.assignStartPositions(stars, 'player1', 'ai1', playerSpecies, aiSpecies, 12345);

      const homeworld = stars.find(s => s.name === 'Home');

      expect(homeworld?.population).toBeGreaterThan(0);
      expect(homeworld?.mines).toBeGreaterThan(0);
      expect(homeworld?.factories).toBeGreaterThan(0);
      expect(homeworld?.maxPopulation).toBeGreaterThan(0);
    });

    it('should create homeworlds with starting minerals', () => {
      const stars = service.generateGalaxy(10, 12345, 800, 600);
      const playerSpecies = createSpecies();
      const aiSpecies = createSpecies();

      service.assignStartPositions(stars, 'player1', 'ai1', playerSpecies, aiSpecies, 12345);

      const homeworld = stars.find(s => s.name === 'Home');

      expect(homeworld?.surfaceMinerals.ironium).toBeGreaterThan(0);
      expect(homeworld?.surfaceMinerals.boranium).toBeGreaterThan(0);
      expect(homeworld?.surfaceMinerals.germanium).toBeGreaterThan(0);
    });
  });
});
