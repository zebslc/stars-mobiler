import type { ComponentStats } from '../tech-atlas.types';

export const MECHANICAL_COMPONENTS: Array<ComponentStats> = [
  {
    id: 'mech_fuel_tank',
    name: 'Fuel Tank',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 3,
    cost: { ironium: 6, boranium: 0, germanium: 0, resources: 4 },
    stats: { cap: 250 },
    description: 'Standard storage tank for Deuterium fuel.'
  },
  {
    id: 'mech_super_tank',
    name: 'Super Fuel Tank',
    type: 'Mechanical',
    tech: { Construction: 6, Propulsion: 4 },
    mass: 8,
    cost: { ironium: 8, boranium: 0, germanium: 0, resources: 8 },
    stats: { cap: 500 },
    description: 'High-pressure containment.'
  },
  {
    id: 'mech_colonisation_module',
    name: 'Colony Module',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 32,
    cost: { ironium: 12, boranium: 10, germanium: 10, resources: 10 },
    stats: { terraform: 0 },
    description: 'Cryogenic suspension pods.'
  },
  {
    id: 'mech_manoeuvring_jet',
    name: 'Maneuvering Jet',
    type: 'Mechanical',
    tech: { Propulsion: 3, Energy: 2 },
    mass: 5,
    cost: { ironium: 5, boranium: 0, germanium: 5, resources: 10 },
    stats: { initiative: 1 },
    description: 'Thrusters that aid in combat evasion.'
  },
  {
    id: 'mech_overthruster',
    name: 'Overthruster',
    type: 'Mechanical',
    tech: { Propulsion: 10, Energy: 6 },
    mass: 8,
    cost: { ironium: 10, boranium: 0, germanium: 10, resources: 20 },
    stats: { initiative: 2 },
    description: 'Combat drive assist.'
  },
  {
    id: 'mech_robo_miner',
    name: 'Robo-Miner',
    type: 'Mining',
    tech: { Construction: 4, Energy: 2 },
    mass: 240,
    cost: { ironium: 30, boranium: 0, germanium: 7, resources: 100 },
    stats: { mining: 12 },
    description: 'Automated extraction unit.'
  },
  {
    id: 'mech_auto_miner',
    name: 'Automated Miner',
    type: 'Mining',
    tech: { Construction: 10, Energy: 6 },
    mass: 240,
    cost: { ironium: 60, boranium: 0, germanium: 14, resources: 200 },
    stats: { mining: 25 },
    description: 'High-yield extraction unit.'
  },
  {
    id: 'mech_cargo_pod',
    name: 'Cargo Pod',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 3,
    cost: { ironium: 2, boranium: 0, germanium: 0, resources: 3 },
    stats: { cap: 70 },
    description: 'Standard cargo pod.'
  },
  {
    id: 'mech_super_cargo_pod',
    name: 'Super Cargo Pod',
    type: 'Mechanical',
    tech: { Construction: 3 },
    mass: 8,
    cost: { ironium: 5, boranium: 0, germanium: 0, resources: 8 },
    stats: { cap: 200 },
    description: 'Large capacity cargo pod.'
  },
  // Merged cargo components 
  {
    id: 'fixed_cargo_70',
    name: 'Cargo Bay (70kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 70 },
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_200',
    name: 'Cargo Bay (200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 200 },
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_1200',
    name: 'Cargo Bay (1200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 1200 },
    description: 'Massive cargo hold.'
  }
];
