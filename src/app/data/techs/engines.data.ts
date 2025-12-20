import { ComponentStats } from '../tech-atlas.types';

export const ENGINE_COMPONENTS: ComponentStats[] = [
  {
    id: 'eng_settler',
    name: "Settler's Drive",
    type: 'Engine',
    tech: { Propulsion: 0 },
    mass: 2,
    cost: { iron: 1, bor: 2, germ: 1, res: 10 },
    stats: { warp: 6, fuelEff: 100 },
    img: 'eng-settler',
    description: 'Standard issue fission drive.'
  },
  {
    id: 'eng_mizer',
    name: 'Fuel Mizer',
    type: 'Engine',
    tech: { Propulsion: 3 },
    mass: 6,
    cost: { iron: 8, bor: 3, germ: 0, res: 11 },
    stats: { warp: 8, fuelEff: 85 },
    img: 'eng-mizer',
    description: 'Recycles exhaust plasma for superior range.'
  },
  {
    id: 'eng_trans',
    name: 'Trans-Galactic',
    type: 'Engine',
    tech: { Propulsion: 9 },
    mass: 25,
    cost: { iron: 20, bor: 20, germ: 9, res: 50 },
    stats: { warp: 9, fuelEff: 120 },
    img: 'eng-trans',
    description: 'Military drive. Consumes fuel voraciously.'
  },
  {
    id: 'eng_ram',
    name: 'Ramscoop',
    type: 'Engine',
    tech: { Propulsion: 16, Energy: 2 },
    mass: 10,
    cost: { iron: 3, bor: 2, germ: 9, res: 8 },
    stats: { warp: 9, fuelGen: 50 },
    img: 'eng-ram',
    description: 'Harvests interstellar hydrogen. Infinite range.'
  }
];
