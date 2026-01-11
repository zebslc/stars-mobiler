import { ComponentStats } from '../tech-atlas.types';

export const SHIELD_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_mole_skin',
    name: 'Mole-skin Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 1, boranium: 0, germanium: 1, resources: 4 },
    stats: { shield: 25 },    description: 'Basic energy barrier.'
  },
  {
    id: 'def_cow_hide',
    name: 'Cow-hide Shield',
    type: 'Shield',
    tech: { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 2, boranium: 0, germanium: 2, resources: 5 },
    stats: { shield: 40 },    description: 'Improved magnetic containment.'
  },
  {
    id: 'def_wolverine',
    name: 'Wolverine Diffuse Shield',
    type: 'Shield',
    tech: { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 3, boranium: 0, germanium: 3, resources: 6 },
    stats: { shield: 60 },    description: 'Diffuse shield technology.'
  },
  {
    id: 'def_croby_sharmor',
    name: 'Croby Sharmor',
    type: 'Shield',
    tech: { Energy: 7, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 10,
    cost: { ironium: 7, boranium: 0, germanium: 4, resources: 15 },
    stats: { shield: 60 },    description: 'Shield-armor hybrid. Heavy but effective.'
  },
  {
    id: 'def_shadow',
    name: 'Shadow Shield',
    type: 'Shield',
    tech: { Energy: 7, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 2,
    cost: { ironium: 3, boranium: 0, germanium: 3, resources: 7 },
    stats: { shield: 75 },    description: 'Cloaking-enhanced shield matrix.'
  },
  {
    id: 'def_bear_neutrino',
    name: 'Bear Neutrino Barrier',
    type: 'Shield',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 4, boranium: 0, germanium: 4, resources: 8 },
    stats: { shield: 100 },    description: 'Neutrino particle barrier.'
  },
  {
    id: 'def_gorilla',
    name: 'Gorilla Delagator',
    type: 'Shield',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 5, boranium: 0, germanium: 6, resources: 11 },
    stats: { shield: 175 },    description: 'Heavy-duty deflector array.'
  },
  {
    id: 'def_shadow',
    name: 'Shadow Shield',
    type: 'Shield',
    tech: { Energy: 7, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 2,
    cost: { ironium: 3, boranium: 0, germanium: 3, resources: 7 },
    stats: { shield: 75 },    description: 'Stealth-enhanced shielding.'
  },
  {
    id: 'def_bear',
    name: 'Bear Neutrino Barrier',
    type: 'Shield',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 4, boranium: 0, germanium: 4, resources: 8 },
    stats: { shield: 100 },    description: 'Particle deflection field.'
  },
  {
    id: 'def_gorilla',
    name: 'Gorilla Delagator',
    type: 'Shield',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 5, boranium: 0, germanium: 6, resources: 11 },
    stats: { shield: 175 },    description: 'Advanced energy distribution.'
  },
  {
    id: 'def_elephant',
    name: 'Elephant Hide Fortress',
    type: 'Shield',
    tech: { Energy: 18, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 8, boranium: 0, germanium: 10, resources: 15 },
    stats: { shield: 300 },    description: 'Fortress-grade protection.'
  },
  {
    id: 'def_phase',
    name: 'Complete Phase Shield',
    type: 'Shield',
    tech: { Energy: 22, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 12, boranium: 0, germanium: 15, resources: 20 },
    stats: { shield: 500 },    description: 'Complete phased energy barrier.'
  }
];

export const ARMOR_COMPONENTS: ComponentStats[] = [
  {
    id: 'def_tritanium',
    name: 'Tritanium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 60,
    cost: { ironium: 5, boranium: 0, germanium: 0, resources: 10 },
    stats: { armor: 50 },    description: 'Standard composite plating.'
  },
  {
    id: 'def_crobmnium',
    name: 'Crobmnium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 3 },
    mass: 56,
    cost: { ironium: 6, boranium: 0, germanium: 0, resources: 13 },
    stats: { armor: 75 },    description: 'Crystalline lattice armor.'
  },
  {
    id: 'def_carbonic',
    name: 'Carbonic Armor',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 25,
    cost: { ironium: 0, boranium: 0, germanium: 5, resources: 15 },
    stats: { armor: 100 },    description: 'Bio-engineered carbon fiber armor.'
  },
  {
    id: 'def_strobnium',
    name: 'Strobnium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 6 },
    mass: 54,
    cost: { ironium: 8, boranium: 0, germanium: 0, resources: 18 },
    stats: { armor: 120 },    description: 'Advanced metallic compound.'
  },
  {
    id: 'def_organic',
    name: 'Organic Armor',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 7 },
    mass: 15,
    cost: { ironium: 0, boranium: 0, germanium: 6, resources: 20 },
    stats: { armor: 175 },    description: 'Living armor that adapts to damage.'
  },
  {
    id: 'def_kelarium',
    name: 'Kelarium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 9 },
    mass: 50,
    cost: { ironium: 9, boranium: 1, germanium: 0, resources: 25 },
    stats: { armor: 180 },    description: 'Dense crystalline armor plating.'
  },
  {
    id: 'def_fielded_kelarium',
    name: 'Fielded Kelarium',
    type: 'Armor',
    tech: { Energy: 4, Kinetics: 0, Propulsion: 0, Construction: 10 },
    mass: 50,
    cost: { ironium: 10, boranium: 0, germanium: 2, resources: 28 },
    stats: { armor: 175 },    description: 'Energy-reinforced kelarium.'
  },
  {
    id: 'def_depleted_neutronium',
    name: 'Depleted Neutronium',
    type: 'Armor',
    tech: { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 10 },
    mass: 50,
    cost: { ironium: 10, boranium: 0, germanium: 2, resources: 28 },
    stats: { armor: 200 },    description: 'Processed neutron star matter.'
  },
  {
    id: 'def_neutronium',
    name: 'Neutronium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 12 },
    mass: 45,
    cost: { ironium: 11, boranium: 2, germanium: 1, resources: 30 },
    stats: { armor: 275 },    description: 'Collapsed matter plating. Very heavy.'
  },
  {
    id: 'def_valanium',
    name: 'Valanium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 16 },
    mass: 40,
    cost: { ironium: 15, boranium: 0, germanium: 0, resources: 50 },
    stats: { armor: 500 },    description: 'Ultimate material science.'
  },
  {
    id: 'def_superlatanium',
    name: 'Superlatanium',
    type: 'Armor',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 24 },
    mass: 30,
    cost: { ironium: 25, boranium: 0, germanium: 0, resources: 100 },
    stats: { armor: 1500 },    description: 'The ultimate armor technology.'
  }
,
  {
    id: 'def_bear_neutrino_barrier',
    name: 'Def Bear Neutrino Barrier',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_carbonic_armor',
    name: 'Def Carbonic Armor',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_complete_phase_shield',
    name: 'Def Complete Phase Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_cow_hide_shield',
    name: 'Def Cow Hide Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_elephant_hide_fortress',
    name: 'Def Elephant Hide Fortress',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_gorilla_delagator',
    name: 'Def Gorilla Delagator',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_mole_skin_shield',
    name: 'Def Mole Skin Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_organic_armor',
    name: 'Def Organic Armor',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_shadow_shield',
    name: 'Def Shadow Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'def_wolverine_diffuse_shield',
    name: 'Def Wolverine Diffuse Shield',
    type: 'Shield',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  }
];
