import { ComponentStats } from '../tech-atlas.types';

export const WEAPON_COMPONENTS: ComponentStats[] = [
  {
    id: 'weap_laser',
    name: 'Laser',
    type: 'Weapon',
    tech: { Energy: 0 },
    mass: 1,
    cost: { iron: 0, bor: 6, germ: 0, res: 5 },
    stats: { power: 10, range: 1, initiative: 1 },
    img: 'weap-laser',
    description: 'Standard beam weapon.'
  },
  {
    id: 'weap_phasor',
    name: 'Phasor',
    type: 'Weapon',
    tech: { Energy: 7 },
    mass: 2,
    cost: { iron: 0, bor: 14, germ: 0, res: 18 },
    stats: { power: 120, range: 3, initiative: 7 },
    img: 'weap-phasor',
    description: 'Long range sniper beam.'
  },
  {
    id: 'weap_alpha',
    name: 'Alpha Torp',
    type: 'Weapon',
    tech: { Kinetics: 2 },
    mass: 25,
    cost: { iron: 9, bor: 3, germ: 3, res: 5 },
    stats: { power: 12, accuracy: 65, range: 4, initiative: 0 },
    img: 'weap-torp-alpha',
    description: 'Basic guided missile.'
  }
];
