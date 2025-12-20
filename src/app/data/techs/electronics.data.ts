import { ComponentStats } from '../tech-atlas.types';

export const COMPUTER_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_comp_bat',
    name: 'Battle Computer',
    type: 'Computer',
    tech: { Energy: 1 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 15, res: 6 },
    stats: { initiative: 1, accuracy: 20 },
    img: 'elec-comp-bat',
    description: 'Tactical analysis system.'
  },
  {
    id: 'elec_comp_cyber',
    name: 'Cybernetic Interface',
    type: 'Computer',
    tech: { Energy: 6 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 20, res: 10 },
    stats: { initiative: 2, accuracy: 35 },
    img: 'elec-comp-cyber',
    description: 'Direct neural link.'
  },
  {
    id: 'elec_comp_nexus',
    name: 'Battle Nexus',
    type: 'Computer',
    tech: { Energy: 12, Construction: 10 },
    mass: 2,
    cost: { iron: 0, bor: 0, germ: 50, res: 50 },
    stats: { initiative: 3, accuracy: 50 },
    img: 'elec-comp-nexus',
    description: 'AI combat coordinator. The ultimate tactical edge.'
  }
];

export const ELECTRICAL_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_jammer10',
    name: 'Jammer 10',
    type: 'Electrical',
    tech: { Energy: 2 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 2, res: 6 },
    stats: { jamming: 10 },
    img: 'elec-jammer-10',
    description: 'Reduces incoming torpedo accuracy.'
  },
  {
    id: 'elec_jammer20',
    name: 'Jammer 20',
    type: 'Electrical',
    tech: { Energy: 5 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 5, res: 10 },
    stats: { jamming: 20 },
    img: 'elec-jammer-20',
    description: 'Advanced ECM.'
  },
  {
    id: 'elec_jammer50',
    name: 'Jammer 50',
    type: 'Electrical',
    tech: { Energy: 16 },
    mass: 2,
    cost: { iron: 0, bor: 0, germ: 25, res: 50 },
    stats: { jamming: 50 },
    img: 'elec-jammer-50',
    description: 'Fleet-wide signal disruption.'
  },
  {
    id: 'elec_capacitor',
    name: 'Energy Capacitor',
    type: 'Electrical',
    tech: { Energy: 6 },
    mass: 4,
    cost: { iron: 2, bor: 5, germ: 2, res: 10 },
    stats: { cap: 250 },
    img: 'elec-capacitor',
    description: 'Boosts beam weapon recharge rates.'
  }
];

export const CLOAK_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_cloak',
    name: 'Stealth Cloak',
    type: 'Cloak',
    tech: { Energy: 4 },
    mass: 2,
    cost: { iron: 2, bor: 0, germ: 2, res: 5 },
    stats: { cloak: 70 },
    img: 'elec-cloak',
    description: 'Bends light around the hull.'
  },
  {
    id: 'elec_super_cloak',
    name: 'Super Stealth',
    type: 'Cloak',
    tech: { Energy: 12 },
    mass: 5,
    cost: { iron: 5, bor: 0, germ: 10, res: 20 },
    stats: { cloak: 95 },
    img: 'elec-cloak-super',
    description: 'Near-perfect invisibility.'
  }
];
