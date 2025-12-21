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
    tech: { Energy: 6 },
    mass: 1,
    cost: { iron: 3, bor: 0, germ: 3, res: 6 },
    stats: { shield: 60 },
    img: 'def-shield-wolf',
    description: 'Diffuse shield technology.'
  },
  {
    id: 'def_croby_sharmor',
    name: "Crob'y Sharmor",
    type: 'Shield',
    tech: { Energy: 7, Construction: 4 },
    mass: 10,
    cost: { iron: 7, bor: 0, germ: 4, res: 15 },
    stats: { shield: 60 },
    img: 'def-shield-croby',
    description: 'Shield-armor hybrid. Heavy but effective.'
  },
  {
    id: 'def_shadow',
    name: 'Shadow Shield',
    type: 'Shield',
    tech: { Energy: 7, Electronics: 3 },
    mass: 2,
    cost: { iron: 3, bor: 0, germ: 3, res: 7 },
    stats: { shield: 75 },
    img: 'def-shield-shadow',
    description: 'Stealth-enhanced shielding.'
  },
  {
    id: 'def_bear',
    name: 'Bear Neutrino Barrier',
    type: 'Shield',
    tech: { Energy: 10 },
    mass: 1,
    cost: { iron: 4, bor: 0, germ: 4, res: 8 },
    stats: { shield: 100 },
    img: 'def-shield-bear',
    description: 'Particle deflection field.'
  },
  {
    id: 'def_gorilla',
    name: 'Gorilla Delagator',
    type: 'Shield',
    tech: { Energy: 14 },
    mass: 1,
    cost: { iron: 5, bor: 0, germ: 6, res: 11 },
    stats: { shield: 175 },
    img: 'def-shield-gorilla',
    description: 'Advanced energy distribution.'
  },
  {
    id: 'def_elephant',
    name: 'Elephant Hide Fortress',
    type: 'Shield',
    tech: { Energy: 18 },
    mass: 1,
    cost: { iron: 8, bor: 0, germ: 10, res: 15 },
    stats: { shield: 300 },
    img: 'def-shield-elephant',
    description: 'Fortress-grade protection.'
  },
  {
    id: 'def_phase',
    name: 'Complete Phase Shield',
    type: 'Shield',
    tech: { Energy: 22 },
    mass: 1,
    cost: { iron: 12, bor: 0, germ: 15, res: 20 },
    stats: { shield: 500 },
    img: 'def-shield-phase',
    description: 'Complete phased energy barrier.'
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
