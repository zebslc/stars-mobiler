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
    description: 'Basic orbital bomb. Low damage.'
  }
];
