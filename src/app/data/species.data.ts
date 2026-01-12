import { Species } from '../models/game.model';

export const SPECIES: Species[] = [
  {
    id: 'terrans',
    name: 'Terrans',
    habitat: { idealTemperature: 20, idealAtmosphere: 50, toleranceRadius: 40 },
    traits: [],
    primaryTraits: ['Jack of All Trades'],
    lesserTraits: [
      'Generalized Research',
      'Improved Starbases',
      'Cheap Engines',
      'Low Starting Population',
    ],
  },
  {
    id: 'crystallids',
    name: 'Crystallids',
    habitat: { idealTemperature: -40, idealAtmosphere: 20, toleranceRadius: 35 },
    traits: [{ type: 'mining', modifier: 0.2 }, { type: 'growth', modifier: -0.1 }],
    primaryTraits: ['Inner Strength'],
    lesserTraits: [
      'Advanced Remote Mining',
      'Ultimate Recycling',
      'Only Basic Remote Mining',
      'No Advanced Sensors',
    ],
  },
  {
    id: 'pyreans',
    name: 'Pyreans',
    habitat: { idealTemperature: 70, idealAtmosphere: 70, toleranceRadius: 30 },
    traits: [{ type: 'research', modifier: 0.15 }, { type: 'mining', modifier: -0.1 }],
    primaryTraits: ['Super Stealth'],
    lesserTraits: [
      'Generalized Research',
      'Improved Fuel Efficiency',
      'Bleeding Edge Technology',
      'Low Starting Population',
    ],
  },
  {
    id: 'voidborn',
    name: 'Voidborn',
    habitat: { idealTemperature: 0, idealAtmosphere: 10, toleranceRadius: 50 },
    traits: [{ type: 'shipCost', modifier: -0.2 }, { type: 'growth', modifier: -0.15 }],
    primaryTraits: ['Interstellar Traveler'],
    lesserTraits: [
      'Improved Fuel Efficiency',
      'Total Terraforming',
      'No Ramscoop Engines',
      'Mineral Alchemy',
    ],
  },
];

