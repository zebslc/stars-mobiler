// ==========================================
// Stars! Tech Atlas - Barrel Export
// Single source of truth for all game data
// ==========================================

// Re-export types
export * from './tech-atlas.types';

// Hull imports
import { FREIGHTER_HULLS } from './hulls/freighters.data';
import { WARSHIP_HULLS } from './hulls/warships.data';
import { UTILITY_HULLS } from './hulls/utility.data';
import { STARBASE_HULLS } from './hulls/starbases.data';

// Component imports
import { CARGO_COMPONENTS } from './techs/cargo.data';
import { ENGINE_COMPONENTS } from './techs/engines.data';
import { SCANNER_COMPONENTS } from './techs/scanners.data';
import { COMPUTER_COMPONENTS, CAPACITOR_COMPONENTS, CLOAK_COMPONENTS } from './techs/electronics.data';
import { MECHANICAL_COMPONENTS } from './techs/mechanical.data';
import { WEAPON_COMPONENTS } from './techs/weapons.data';
import { BOMB_COMPONENTS } from './techs/bombs.data';
import { SHIELD_COMPONENTS, ARMOR_COMPONENTS } from './techs/defenses.data';
import { STARGATE_COMPONENTS } from './techs/stargates.data';
import { MASS_DRIVER_COMPONENTS } from './techs/mass-drivers.data';
import { ORBITAL_COMPONENTS } from './techs/orbitals.data';
import { MINE_COMPONENTS } from './techs/mines.data';

import { HullTemplate, ComponentCategory } from './tech-atlas.types';

// ==========================================
// Unified Exports
// ==========================================

export const ALL_HULLS: HullTemplate[] = [
  ...FREIGHTER_HULLS,
  ...WARSHIP_HULLS,
  ...UTILITY_HULLS,
  ...STARBASE_HULLS,
];

export const ALL_COMPONENTS: ComponentCategory[] = [
  {
    id: 'cargo',
    name: 'Cargo',
    allowedSlots: ['Cargo'],
    displayOrder: 0,
    category: 'Cargo',
    items: CARGO_COMPONENTS,
  },
  {
    id: 'engines',
    name: 'Engines',
    allowedSlots: ['Engine'],
    displayOrder: 1,
    category: 'Engines',
    items: ENGINE_COMPONENTS,
  },
  {
    id: 'scanners',
    name: 'Scanners',
    allowedSlots: ['Scanner'],
    displayOrder: 2,
    category: 'Scanners',
    items: SCANNER_COMPONENTS,
  },
  {
    id: 'computers',
    name: 'Computers',
    allowedSlots: ['Computer', 'Elect'],
    displayOrder: 3,
    category: 'Computers',
    items: COMPUTER_COMPONENTS,
  },
  {
    id: 'electrical',
    name: 'Electrical',
    allowedSlots: ['Electrical', 'Elect'],
    displayOrder: 4,
    category: 'Electrical',
    items: CAPACITOR_COMPONENTS,
  },
  {
    id: 'cloaking',
    name: 'Cloaking',
    allowedSlots: ['Cloak', 'Elect'],
    displayOrder: 5,
    category: 'Cloaking',
    items: CLOAK_COMPONENTS,
  },
  {
    id: 'mechanical',
    name: 'Mechanical',
    allowedSlots: ['Mechanical', 'Mech'],
    displayOrder: 6,
    category: 'Mechanical',
    items: MECHANICAL_COMPONENTS,
  },
  {
    id: 'weapons',
    name: 'Weapons',
    allowedSlots: ['Weapon'],
    displayOrder: 7,
    category: 'Weapons',
    items: WEAPON_COMPONENTS,
  },
  {
    id: 'bombs',
    name: 'Bombs',
    allowedSlots: ['Bomb'],
    displayOrder: 8,
    category: 'Bombs',
    items: BOMB_COMPONENTS,
  },
  {
    id: 'shields',
    name: 'Shields',
    allowedSlots: ['Shield'],
    displayOrder: 9,
    category: 'Shields',
    items: SHIELD_COMPONENTS,
  },
  {
    id: 'armor',
    name: 'Armor',
    allowedSlots: ['Armor'],
    displayOrder: 10,
    category: 'Armor',
    items: ARMOR_COMPONENTS,
  },
  {
    id: 'stargates',
    name: 'Stargates',
    allowedSlots: ['Stargate'],
    displayOrder: 11,
    category: 'Stargates',
    items: STARGATE_COMPONENTS,
  },
  {
    id: 'mass_drivers',
    name: 'Mass Drivers',
    allowedSlots: ['MassDriver'],
    displayOrder: 12,
    category: 'Mass Drivers',
    items: MASS_DRIVER_COMPONENTS,
  },
  {
    id: 'orbital',
    name: 'Orbital',
    allowedSlots: ['Orbital'],
    displayOrder: 13,
    category: 'Orbital',
    items: ORBITAL_COMPONENTS,
  },
  {
    id: 'mines',
    name: 'Mines',
    allowedSlots: ['Mine'],
    displayOrder: 14,
    category: 'Mines',
    items: MINE_COMPONENTS,
  },
];

// ==========================================
// Legacy compatibility export
// ==========================================

export const TECH_ATLAS = {
  techStreams: ['Energy', 'Kinetics', 'Propulsion', 'Construction'],
  hulls: ALL_HULLS,
  components: ALL_COMPONENTS
};
