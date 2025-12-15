import { Species } from '../models/game.model';

export const SPECIES: Species[] = [
  {
    id: 'terrans',
    name: 'Terrans',
    habitat: { idealTemperature: 20, idealAtmosphere: 50, toleranceRadius: 40 },
    traits: []
  },
  {
    id: 'crystallids',
    name: 'Crystallids',
    habitat: { idealTemperature: -40, idealAtmosphere: 20, toleranceRadius: 35 },
    traits: [{ type: 'mining', modifier: 0.2 }, { type: 'growth', modifier: -0.1 }]
  },
  {
    id: 'pyreans',
    name: 'Pyreans',
    habitat: { idealTemperature: 70, idealAtmosphere: 70, toleranceRadius: 30 },
    traits: [{ type: 'research', modifier: 0.15 }, { type: 'mining', modifier: -0.1 }]
  },
  {
    id: 'voidborn',
    name: 'Voidborn',
    habitat: { idealTemperature: 0, idealAtmosphere: 10, toleranceRadius: 50 },
    traits: [{ type: 'shipCost', modifier: -0.2 }, { type: 'growth', modifier: -0.15 }]
  }
];

