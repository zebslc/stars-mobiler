import { ComponentStats } from '../tech-atlas.types';

export const BOMB_COMPONENTS: ComponentStats[] = [
  {
    id: 'bomb_lady',
    name: 'Lady Finger',
    type: 'Bomb',
    tech: { Kinetics: 2 },
    mass: 40,
    cost: { ironium: 1, boranium: 20, germanium: 0, resources: 5 },
    stats: { kill: 0.6, struct: 2 },
    img: 'weap-bomb-lady',
    description: 'Basic orbital bomb.'
  },
  {
    id: 'bomb_black_cat',
    name: 'Black Cat',
    type: 'Bomb',
    tech: { Kinetics: 5 },
    mass: 45,
    cost: { ironium: 1, boranium: 22, germanium: 0, resources: 7 },
    stats: { kill: 0.9, struct: 4 },
    img: 'weap-bomb-black-cat',
    description: 'Improved explosive charge.'
  },
  {
    id: 'bomb_m70',
    name: 'M-70',
    type: 'Bomb',
    tech: { Kinetics: 8 },
    mass: 50,
    cost: { ironium: 1, boranium: 24, germanium: 0, resources: 9 },
    stats: { kill: 1.2, struct: 6 },
    img: 'weap-bomb-m70',
    description: 'Military grade munition.'
  },
  {
    id: 'bomb_m80',
    name: 'M-80',
    type: 'Bomb',
    tech: { Kinetics: 11 },
    mass: 55,
    cost: { ironium: 1, boranium: 25, germanium: 0, resources: 12 },
    stats: { kill: 1.7, struct: 7 },
    img: 'weap-bomb-m80',
    description: 'High-yield conventional warhead.'
  },
  {
    id: 'bomb_cherry',
    name: 'Cherry Bomb',
    type: 'Bomb',
    tech: { Kinetics: 14 },
    mass: 52,
    cost: { ironium: 1, boranium: 25, germanium: 0, resources: 11 },
    stats: { kill: 2.5, struct: 10 },
    img: 'weap-bomb-cherry',
    description: 'High yield nuke. Destroys everything.'
  },
  {
    id: 'bomb_lbu17',
    name: 'LBU-17',
    type: 'Bomb',
    tech: { Kinetics: 5, Energy: 8 },
    mass: 30,
    cost: { ironium: 1, boranium: 15, germanium: 15, resources: 7 },
    stats: { kill: 0.2, struct: 16 },
    img: 'weap-bomb-lbu17',
    description: 'Structure-focused demolition device.'
  },
  {
    id: 'bomb_lbu32',
    name: 'LBU-32',
    type: 'Bomb',
    tech: { Kinetics: 10, Energy: 10 },
    mass: 35,
    cost: { ironium: 1, boranium: 24, germanium: 15, resources: 10 },
    stats: { kill: 0.3, struct: 28 },
    img: 'weap-bomb-lbu32',
    description: 'Enhanced bunker buster.'
  },
  {
    id: 'bomb_lbu74',
    name: 'LBU-74',
    type: 'Bomb',
    tech: { Kinetics: 15, Energy: 12 },
    mass: 45,
    cost: { ironium: 1, boranium: 33, germanium: 12, resources: 14 },
    stats: { kill: 0.4, struct: 4.5 },
    img: 'weap-bomb-lbu74',
    description: 'Ultimate installation destroyer.'
  },
  {
    id: 'bomb_retro',
    name: 'Retro Bomb',
    type: 'Bomb',
    tech: { Kinetics: 10, Energy: 12 },
    mass: 45,
    cost: { ironium: 15, boranium: 15, germanium: 10, resources: 50 },
    stats: { kill: 0.0, struct: 0.0 },
    img: 'weap-bomb-retro',
    description: 'Terraforming weapon. Reduces planet habitability.'
  },
  {
    id: 'bomb_smart',
    name: 'Smart Bomb',
    type: 'Bomb',
    tech: { Kinetics: 5, Energy: 7 },
    mass: 50,
    cost: { ironium: 1, boranium: 22, germanium: 0, resources: 27 },
    stats: { kill: 1.3, struct: 0 },
    img: 'weap-bomb-smart',
    description: 'Anti-personnel weapon. Saves factories.'
  },
  {
    id: 'bomb_neutron',
    name: 'Neutron Bomb',
    type: 'Bomb',
    tech: { Kinetics: 10, Energy: 10 },
    mass: 57,
    cost: { ironium: 1, boranium: 30, germanium: 0, resources: 30 },
    stats: { kill: 2.2, struct: 0 },
    img: 'weap-bomb-neutron',
    description: 'Enhanced radiation weapon.'
  },
  {
    id: 'bomb_enriched_neutron',
    name: 'Enriched Neutron',
    type: 'Bomb',
    tech: { Kinetics: 15, Energy: 12 },
    mass: 64,
    cost: { ironium: 1, boranium: 36, germanium: 0, resources: 25 },
    stats: { kill: 3.5, struct: 0 },
    img: 'weap-bomb-enriched-neutron',
    description: 'Enhanced neutron radiation device.'
  },
  {
    id: 'bomb_peerless',
    name: 'Peerless Bomb',
    type: 'Bomb',
    tech: { Kinetics: 22, Energy: 15 },
    mass: 55,
    cost: { ironium: 1, boranium: 33, germanium: 0, resources: 32 },
    stats: { kill: 5.0, struct: 0 },
    img: 'weap-bomb-peerless',
    description: 'Superior anti-population weapon.'
  },
  {
    id: 'bomb_annihilator',
    name: 'Annihilator',
    type: 'Bomb',
    tech: { Kinetics: 26, Energy: 17 },
    mass: 50,
    cost: { ironium: 1, boranium: 30, germanium: 0, resources: 28 },
    stats: { kill: 7.0, struct: 0 },
    img: 'weap-bomb-annihilator',
    description: 'The ultimate population killer.'
  }
];
