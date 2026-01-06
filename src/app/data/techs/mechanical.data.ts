import { ComponentStats } from '../tech-atlas.types';

export const MECHANICAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'mech_fuel_tank',
    name: 'Fuel Tank',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 3,
    cost: { ironium: 6, boranium: 0, germanium: 0, resources: 4 },
    stats: { cap: 250 },
    img: 'mech-fuel-tank',
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
    img: 'mech-super-tank',
    description: 'High-pressure containment.'
  },
  {
    id: 'mech_colony',
    name: 'Colony Module',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 32,
    cost: { ironium: 12, boranium: 10, germanium: 10, resources: 10 },
    stats: { terraform: 0 },
    img: 'mech-colony-mod',
    description: 'Cryogenic suspension pods.'
  },
  {
    id: 'mech_maneuver',
    name: 'Maneuvering Jet',
    type: 'Mechanical',
    tech: { Propulsion: 3, Energy: 2 },
    mass: 5,
    cost: { ironium: 5, boranium: 0, germanium: 5, resources: 10 },
    stats: { initiative: 1 },
    img: 'mech-maneuver-jet',
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
    img: 'mech-overthruster',
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
    img: 'mech-robo-miner',
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
    img: 'mech-auto-miner',
    description: 'High-yield extraction unit.'
  }
];
