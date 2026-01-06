import { ComponentStats } from '../tech-atlas.types';

export const ORBITAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'orb_dock',
    name: 'Space Dock',
    type: 'Orbital',
    tech: { Construction: 2 },
    mass: 0,
    cost: { ironium: 50, boranium: 0, germanium: 50, resources: 100 },
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
    cost: { ironium: 10, boranium: 0, germanium: 20, resources: 50 },
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
    cost: { ironium: 20, boranium: 20, germanium: 20, resources: 80 },
    stats: { shield: 500, armor: 500 },
    img: 'orb-shield',
    description: 'Reinforced structure for starbases.'
  }
];
