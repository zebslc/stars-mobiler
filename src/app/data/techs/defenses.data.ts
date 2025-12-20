import { ComponentStats } from '../tech-atlas.types';

export const SHIELD_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_mole_skin',
    name: 'Mole-Skin',
    type: 'Shield',
    tech: { Energy: 0 },
    mass: 1,
    cost: { iron: 1, bor: 0, germ: 1, res: 4 },
    stats: { shield: 25 },
    img: 'def-shield-mole',
    description: 'Basic energy barrier.'
  }
];

export const ARMOR_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_tri',
    name: 'Tritanium',
    type: 'Armor',
    tech: { Construction: 0 },
    mass: 60,
    cost: { iron: 5, bor: 0, germ: 0, res: 10 },
    stats: { armor: 50 },
    img: 'def-armor-tri',
    description: 'Standard composite plating.'
  }
];
