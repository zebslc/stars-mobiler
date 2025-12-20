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
  },
  {
    id: 'def_cow_hide',
    name: 'Cow-Hide',
    type: 'Shield',
    tech: { Energy: 3 },
    mass: 1,
    cost: { iron: 2, bor: 0, germ: 2, res: 5 },
    stats: { shield: 40 },
    img: 'def-shield-cow',
    description: 'Improved magnetic containment.'
  },
  {
    id: 'def_wolverine',
    name: 'Wolverine',
    type: 'Shield',
    tech: { Energy: 5 },
    mass: 1,
    cost: { iron: 3, bor: 0, germ: 3, res: 6 },
    stats: { shield: 75 },
    img: 'def-shield-wolf',
    description: 'Regenerative shield system.'
  },
  {
    id: 'def_phase',
    name: 'Phase Shield',
    type: 'Shield',
    tech: { Energy: 10 },
    mass: 1,
    cost: { iron: 12, bor: 0, germ: 15, res: 20 },
    stats: { shield: 500 },
    img: 'def-shield-phase',
    description: 'Phased energy barrier.'
  },
  {
    id: 'def_langston',
    name: 'Langston Shell',
    type: 'Shield',
    tech: { Energy: 24, Construction: 16 },
    mass: 2,
    cost: { iron: 20, bor: 50, germ: 50, res: 100 },
    stats: { shield: 1200 },
    img: 'def-shield-langston',
    description: 'Full spectrum energy absorption.'
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
  },
  {
    id: 'def_crob',
    name: 'Crobmnium',
    type: 'Armor',
    tech: { Construction: 5 },
    mass: 56,
    cost: { iron: 6, bor: 0, germ: 0, res: 13 },
    stats: { armor: 100 },
    img: 'def-armor-crob',
    description: 'Crystalline lattice armor.'
  },
  {
    id: 'def_neu',
    name: 'Neutronium',
    type: 'Armor',
    tech: { Construction: 10 },
    mass: 45,
    cost: { iron: 11, bor: 2, germ: 1, res: 30 },
    stats: { armor: 275 },
    img: 'def-armor-neu',
    description: 'Collapsed matter plating. Very heavy.'
  },
  {
    id: 'def_val',
    name: 'Valanium',
    type: 'Armor',
    tech: { Construction: 12 },
    mass: 40,
    cost: { iron: 15, bor: 0, germ: 0, res: 50 },
    stats: { armor: 500 },
    img: 'def-armor-val',
    description: 'Ultimate material science.'
  }
];
