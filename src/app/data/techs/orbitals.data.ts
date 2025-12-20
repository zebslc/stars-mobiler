import { ComponentStats } from '../tech-atlas.types';

export const ORBITAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'orb_dock',
    name: 'Space Dock',
    type: 'Orbital',
    tech: { Construction: 2 },
    mass: 0,
    cost: { iron: 50, bor: 0, germ: 50, res: 100 },
    stats: { cap: 0 },
    img: 'orb-dock',
    description: 'Allows starbase to repair ships.'
  },
  {
    id: 'orb_sensor',
    name: 'Orbital Sensor',
    type: 'Orbital',
    tech: { Energy: 3 },
    mass: 0,
    cost: { iron: 10, bor: 0, germ: 20, res: 50 },
    stats: { scan: 200 },
    img: 'orb-sensor',
    description: 'Extends planetary sensor range.'
  },
  {
    id: 'orb_shield',
    name: 'Orbital Shielding',
    type: 'Orbital',
    tech: { Energy: 6, Construction: 4 },
    mass: 0,
    cost: { iron: 20, bor: 20, germ: 20, res: 80 },
    stats: { shield: 500, armor: 500 },
    img: 'orb-shield',
    description: 'Reinforced structure for starbases.'
  }
];
