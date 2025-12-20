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
import { STARBASE_HULLS } from './starbases/orbital-structures.data';

// Component imports
import { CARGO_COMPONENTS } from './techs/cargo.data';
import { ENGINE_COMPONENTS } from './techs/engines.data';
import { SCANNER_COMPONENTS } from './techs/scanners.data';
import { COMPUTER_COMPONENTS, ELECTRICAL_COMPONENTS, CLOAK_COMPONENTS } from './techs/electronics.data';
import { MECHANICAL_COMPONENTS } from './techs/mechanical.data';
import { WEAPON_COMPONENTS } from './techs/weapons.data';
import { BOMB_COMPONENTS } from './techs/bombs.data';
import { SHIELD_COMPONENTS, ARMOR_COMPONENTS } from './techs/defenses.data';

import { HullTemplate, ComponentCategory } from './tech-atlas.types';

// ==========================================
// Unified Exports
// ==========================================

export const ALL_HULLS: HullTemplate[] = [
  ...FREIGHTER_HULLS,
  ...WARSHIP_HULLS,
  ...UTILITY_HULLS,
  ...STARBASE_HULLS
];

export const ALL_COMPONENTS: ComponentCategory[] = [
  { category: 'Cargo', items: CARGO_COMPONENTS },
  { category: 'Engines', items: ENGINE_COMPONENTS },
  { category: 'Scanners', items: SCANNER_COMPONENTS },
  { category: 'Computers', items: COMPUTER_COMPONENTS },
  { category: 'Electrical', items: ELECTRICAL_COMPONENTS },
  { category: 'Cloaking', items: CLOAK_COMPONENTS },
  { category: 'Mechanical', items: MECHANICAL_COMPONENTS },
  { category: 'Weapons', items: WEAPON_COMPONENTS },
  { category: 'Bombs', items: BOMB_COMPONENTS },
  { category: 'Shields', items: SHIELD_COMPONENTS },
  { category: 'Armor', items: ARMOR_COMPONENTS }
];

// ==========================================
// Legacy compatibility export
// ==========================================

export const TECH_ATLAS = {
  techStreams: ['Energy', 'Kinetics', 'Propulsion', 'Construction'],
  hulls: ALL_HULLS,
  components: ALL_COMPONENTS
};
