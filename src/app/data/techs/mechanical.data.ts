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
    id: 'mech_colony',
    name: 'Colony Module',
    type: 'Mechanical',
    tech: { Construction: 0 },
    mass: 32,
    cost: { iron: 12, bor: 10, germ: 10, res: 10 },
    stats: { terraform: 0 },
    img: 'mech-colony-mod',
    description: 'Cryogenic suspension pods for colonists.'
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
  }
];
