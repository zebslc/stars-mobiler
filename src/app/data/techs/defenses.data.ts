import { ComponentStats } from '../tech-atlas.types';

export const SHIELD_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_mole_skin',
    name: 'Mole-skin Shield',
    type: 'Shield',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 1, bor: 0, germ: 1, res: 4 },
    stats: { shield: 25 },
    img: 'def-shield-mole',
    description: 'Basic energy barrier.'
  },
  {
    id: 'def_cow_hide',
    name: 'Cow-hide Shield',
    type: 'Shield',
    tech: { Energy: 3, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 2, bor: 0, germ: 2, res: 5 },
    stats: { shield: 40 },
    img: 'def-shield-cow',
    description: 'Improved magnetic containment.'
  },
  {
    id: 'def_wolverine',
    name: 'Wolverine Diffuse Shield',
    type: 'Shield',
    tech: { Energy: 6, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 3, bor: 0, germ: 3, res: 6 },
    stats: { shield: 60 },
    img: 'def-shield-wolf',
    description: 'Diffuse shield technology.'
  },
  {
    id: 'def_croby_sharmor',
    name: 'Croby Sharmor',
    type: 'Shield',
    tech: { Energy: 7, Weapons: 0, Propulsion: 0, Construction: 4, Electronics: 0, BioTech: 0 },
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
    tech: { Energy: 7, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 3, BioTech: 0 },
    mass: 2,
    cost: { iron: 3, bor: 0, germ: 3, res: 7 },
    stats: { shield: 75 },
    img: 'def-shield-shadow',
    description: 'Cloaking-enhanced shield matrix.'
  },
  {
    id: 'def_bear_neutrino',
    name: 'Bear Neutrino Barrier',
    type: 'Shield',
    tech: { Energy: 10, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 4, bor: 0, germ: 4, res: 8 },
    stats: { shield: 100 },
    img: 'def-shield-bear',
    description: 'Neutrino particle barrier.'
  },
  {
    id: 'def_gorilla',
    name: 'Gorilla Delagator',
    type: 'Shield',
    tech: { Energy: 14, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 5, bor: 0, germ: 6, res: 11 },
    stats: { shield: 175 },
    img: 'def-shield-gorilla',
    description: 'Heavy-duty deflector array.'
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
    tech: { Energy: 18, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
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
    tech: { Energy: 22, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 1,
    cost: { iron: 12, bor: 0, germ: 15, res: 20 },
    stats: { shield: 500 },
    img: 'def-shield-phase',
    description: 'Complete phased energy barrier.'
  }
];

export const ARMOR_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_tritanium',
    name: 'Tritanium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 60,
    cost: { iron: 5, bor: 0, germ: 0, res: 10 },
    stats: { armor: 50 },
    img: 'def-armor-tri',
    description: 'Standard composite plating.'
  },
  {
    id: 'def_crobmnium',
    name: 'Crobmnium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 3, Electronics: 0, BioTech: 0 },
    mass: 56,
    cost: { iron: 6, bor: 0, germ: 0, res: 13 },
    stats: { armor: 75 },
    img: 'def-armor-crob',
    description: 'Crystalline lattice armor.'
  },
  {
    id: 'def_carbonic',
    name: 'Carbonic Armor',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 4 },
    mass: 25,
    cost: { iron: 0, bor: 0, germ: 5, res: 15 },
    stats: { armor: 100 },
    img: 'def-armor-carbonic',
    description: 'Bio-engineered carbon fiber armor.'
  },
  {
    id: 'def_strobnium',
    name: 'Strobnium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 6, Electronics: 0, BioTech: 0 },
    mass: 54,
    cost: { iron: 8, bor: 0, germ: 0, res: 18 },
    stats: { armor: 120 },
    img: 'def-armor-strobnium',
    description: 'Advanced metallic compound.'
  },
  {
    id: 'def_organic',
    name: 'Organic Armor',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 7 },
    mass: 15,
    cost: { iron: 0, bor: 0, germ: 6, res: 20 },
    stats: { armor: 175 },
    img: 'def-armor-organic',
    description: 'Living armor that adapts to damage.'
  },
  {
    id: 'def_kelarium',
    name: 'Kelarium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 9, Electronics: 0, BioTech: 0 },
    mass: 50,
    cost: { iron: 9, bor: 1, germ: 0, res: 25 },
    stats: { armor: 180 },
    img: 'def-armor-kelarium',
    description: 'Dense crystalline armor plating.'
  },
  {
    id: 'def_fielded_kelarium',
    name: 'Fielded Kelarium',
    type: 'Armor',
    tech: { Energy: 4, Weapons: 0, Propulsion: 0, Construction: 10, Electronics: 0, BioTech: 0 },
    mass: 50,
    cost: { iron: 10, bor: 0, germ: 2, res: 28 },
    stats: { armor: 175 },
    img: 'def-armor-fielded-kelarium',
    description: 'Energy-reinforced kelarium.'
  },
  {
    id: 'def_depleted_neutronium',
    name: 'Depleted Neutronium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 10, Electronics: 3, BioTech: 0 },
    mass: 50,
    cost: { iron: 10, bor: 0, germ: 2, res: 28 },
    stats: { armor: 200 },
    img: 'def-armor-depleted-neutronium',
    description: 'Processed neutron star matter.'
  },
  {
    id: 'def_neutronium',
    name: 'Neutronium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 12, Electronics: 0, BioTech: 0 },
    mass: 45,
    cost: { iron: 11, bor: 2, germ: 1, res: 30 },
    stats: { armor: 275 },
    img: 'def-armor-neu',
    description: 'Collapsed matter plating. Very heavy.'
  },
  {
    id: 'def_valanium',
    name: 'Valanium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 16, Electronics: 0, BioTech: 0 },
    mass: 40,
    cost: { iron: 15, bor: 0, germ: 0, res: 50 },
    stats: { armor: 500 },
    img: 'def-armor-val',
    description: 'Ultimate material science.'
  },
  {
    id: 'def_superlatanium',
    name: 'Superlatanium',
    type: 'Armor',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 24, Electronics: 0, BioTech: 0 },
    mass: 30,
    cost: { iron: 25, bor: 0, germ: 0, res: 100 },
    stats: { armor: 1500 },
    img: 'def-armor-superlatanium',
    description: 'The ultimate armor technology.'
  }
];
