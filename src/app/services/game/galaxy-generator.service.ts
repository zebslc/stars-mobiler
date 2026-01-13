import { Injectable } from '@angular/core';
import { Planet, Species, Star } from '../../models/game.model';
import { mulberry32, randInt, choice } from '../util/random.util';
import { GALAXY_PADDING } from '../../core/constants/galaxy.constants';

@Injectable({ providedIn: 'root' })
export class GalaxyGeneratorService {
  generateGalaxy(starCount: number, seed: number, width: number, height: number): Star[] {
    const rng = mulberry32(seed);
    const positions: Array<{ x: number; y: number }> = [];
    const minDistance = (width / Math.sqrt(starCount)) * 0.6;
    let attempts = 0;
    while (positions.length < starCount && attempts < starCount * 2000) {
      attempts++;
      const candidate = {
        x: randInt(rng, GALAXY_PADDING, width - GALAXY_PADDING),
        y: randInt(rng, GALAXY_PADDING, height - GALAXY_PADDING),
      };
      if (positions.every((p) => this.distance(p, candidate) >= minDistance)) {
        positions.push(candidate);
      }
    }
    const stars: Star[] = positions.map((pos, i) => {
      const name = this.starName(seed, i);
      const planets = this.generatePlanets(1, rng);
      planets.forEach((p) => (p.name = name));
      return {
        id: `star-${i}`,
        name,
        position: pos,
        planets,
      };
    });
    return stars;
  }

  assignStartPositions(
    stars: Star[],
    playerId: string,
    aiId: string,
    playerSpecies: Species,
    aiSpecies: Species,
    seed: number,
  ) {
    const sorted = [...stars].sort((a, b) => a.position.x - b.position.x);
    const homeHuman = sorted[0];
    const homeAI = sorted[sorted.length - 1];
    homeHuman.planets = [this.createHomeworld(homeHuman.id, playerSpecies, seed, 'Home')];
    homeAI.planets = [this.createHomeworld(homeAI.id, aiSpecies, seed + 1, 'Enemy Home')];
  }

  private generatePlanets(count: number, rng: () => number): Planet[] {
    const planets: Planet[] = [];
    for (let i = 0; i < count; i++) {
      const id = `planet-${Math.floor(rng() * 1e9)}`;
      planets.push({
        id,
        name: `SR-${Math.floor(rng() * 900 + 100)}`,
        starId: '',
        temperature: Math.floor(rng() * 201) - 100,
        atmosphere: Math.floor(rng() * 101),
        mineralConcentrations: {
          ironium: randInt(rng, 10, 90),
          boranium: randInt(rng, 10, 90),
          germanium: randInt(rng, 5, 50),
        },
        surfaceMinerals: { ironium: 0, boranium: 0, germanium: 0 },
        ownerId: null,
        population: 0,
        maxPopulation: 0,
        mines: 0,
        factories: 0,
        defenses: 0,
        terraformOffset: { temperature: 0, atmosphere: 0 },
        resources: 0,
        research: 0,
        scanner: 0,
      });
    }
    return planets;
  }

  private createHomeworld(
    starId: string,
    species: Species,
    seed: number,
    nameLabel: string,
  ): Planet {
    return {
      id: `planet-home-${seed}`,
      name: nameLabel,
      starId,
      temperature: species.habitat.idealTemperature,
      atmosphere: species.habitat.idealAtmosphere,
      mineralConcentrations: { ironium: 60, boranium: 60, germanium: 40 },
      surfaceMinerals: { ironium: 500, boranium: 300, germanium: 200 },
      ownerId: null,
      population: 100_000,
      maxPopulation: 1_000_000,
      mines: 10,
      factories: 15,
      defenses: 0,
      terraformOffset: { temperature: 0, atmosphere: 0 },
      resources: 0,
      research: 0,
      scanner: 0, // No scanner initially
    };
  }

  private distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private starName(seed: number, index: number): string {
    const names = [
      'Oxygen',
      'No Vacancy',
      'Mozart',
      'Wallaby',
      'Mohlodi',
      'Slime',
      'Hiho',
      'Hacker',
      'Prune',
      'Stove Top',
      'Shaggy Dog',
      'Alexander',
      '90210',
      'Sea Squared',
      'Red Storm',
      'Mobius',
      'Castle',
      'Dwarte',
      'Kalamazoo',
      'Bloop',
    ];

    // Use predefined names first
    if (index < names.length) {
      return names[index];
    }

    // Fall back to generated names
    const rng = mulberry32(seed + index);
    const prefixes = ['Kepler', 'Proxima', 'Vega', 'Rigel', 'Deneb', 'Altair', 'Epsilon'];
    return `${choice(rng, prefixes)}-${Math.floor(rng() * 900 + 100)}`;
  }
}
