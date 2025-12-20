import { ComponentStats } from '../tech-atlas.types';

export const BOMB_COMPONENTS: ComponentStats[] = [
  {
    id: 'bomb_lady',
    name: 'Lady Finger',
    type: 'Bomb',
    tech: { Kinetics: 1 },
    mass: 40,
    cost: { iron: 1, bor: 20, germ: 0, res: 5 },
    stats: { kill: 0.6, struct: 2 },
    img: 'weap-bomb-lady',
    description: 'Basic orbital bomb.'
  },
  {
    id: 'bomb_smart',
    name: 'Smart Bomb',
    type: 'Bomb',
    tech: { Kinetics: 3, Energy: 2 },
    mass: 50,
    cost: { iron: 1, bor: 22, germ: 5, res: 27 },
    stats: { kill: 1.3, struct: 0 },
    img: 'weap-bomb-smart',
    description: 'Anti-personnel weapon. Saves factories.'
  },
  {
    id: 'bomb_neutron',
    name: 'Neutron Bomb',
    type: 'Bomb',
    tech: { Kinetics: 8, Energy: 4 },
    mass: 50,
    cost: { iron: 1, bor: 40, germ: 5, res: 50 },
    stats: { kill: 2.2, struct: 0 },
    img: 'weap-bomb-neutron',
    description: 'Enhanced radiation weapon.'
  },
  {
    id: 'bomb_cherry',
    name: 'Cherry Bomb',
    type: 'Bomb',
    tech: { Kinetics: 10 },
    mass: 52,
    cost: { iron: 1, bor: 25, germ: 0, res: 11 },
    stats: { kill: 2.5, struct: 10 },
    img: 'weap-bomb-cherry',
    description: 'High yield nuke. Destroys everything.'
  },
  {
    id: 'bomb_annihilator',
    name: 'Annihilator Bomb',
    type: 'Bomb',
    tech: { Kinetics: 24, Energy: 16 },
    mass: 20,
    cost: { iron: 5, bor: 100, germ: 20, res: 200 },
    stats: { kill: 6.0, struct: 40 },
    img: 'weap-bomb-annihilator',
    description: 'Planetary glassing device.'
  }
];
