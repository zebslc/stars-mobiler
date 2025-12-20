import { ComponentStats } from '../tech-atlas.types';

export const COMPUTER_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_comp_bat',
    name: 'Battle Computer',
    type: 'Computer',
    tech: { Energy: 1 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 15, res: 6 },
    stats: { initiative: 1, accuracy: 20 },
    img: 'elec-comp-bat',
    description: 'Tactical analysis system.'
  }
];

export const ELECTRICAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_jammer10',
    name: 'Jammer 10',
    type: 'Electrical',
    tech: { Energy: 2 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 2, res: 6 },
    stats: { jamming: 10 },
    img: 'elec-jammer-10',
    description: 'Reduces incoming torpedo accuracy.'
  }
];

export const CLOAK_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_cloak',
    name: 'Stealth Cloak',
    type: 'Cloak',
    tech: { Energy: 2 },
    mass: 2,
    cost: { iron: 2, bor: 0, germ: 2, res: 5 },
    stats: { cloak: 70 },
    img: 'elec-cloak-stealth',
    description: 'Bends light around the hull.'
  }
];
