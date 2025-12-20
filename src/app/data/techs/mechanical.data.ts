import { ComponentStats } from '../tech-atlas.types';

export const MECHANICAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'mech_fuel_tank',
    name: 'Fuel Tank',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 3,
    cost: { iron: 6, bor: 0, germ: 0, res: 4 },
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
    cost: { iron: 8, bor: 0, germ: 0, res: 8 },
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
    cost: { iron: 12, bor: 10, germ: 10, res: 10 },
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
    cost: { iron: 5, bor: 0, germ: 5, res: 10 },
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
    cost: { iron: 10, bor: 0, germ: 10, res: 20 },
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
    cost: { iron: 30, bor: 0, germ: 7, res: 100 },
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
    cost: { iron: 60, bor: 0, germ: 14, res: 200 },
    stats: { mining: 25 },
    img: 'mech-auto-miner',
    description: 'High-yield extraction unit.'
  }
];
