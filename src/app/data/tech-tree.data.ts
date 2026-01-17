import type { TechRequirement } from './tech-atlas.types';

// Import raw data directly since this is a data file that generates static constants
import { FREIGHTER_HULLS } from './hulls/freighters.data';
import { WARSHIP_HULLS } from './hulls/warships.data';
import { UTILITY_HULLS } from './hulls/utility.data';
import { STARBASE_HULLS } from './hulls/starbases.data';
import { ENGINE_COMPONENTS } from './techs/engines.data';
import { SCANNER_COMPONENTS } from './techs/scanners.data';
import { COMPUTER_COMPONENTS, CAPACITOR_COMPONENTS, CLOAKING_COMPONENTS } from './techs/electronics.data';
import { MECHANICAL_COMPONENTS } from './techs/mechanical.data';
import { WEAPON_COMPONENTS } from './techs/weapons.data';
import { BOMB_COMPONENTS } from './techs/bombs.data';
import { SHIELD_COMPONENTS, ARMOR_COMPONENTS } from './techs/defenses.data';
import { ORBITAL_COMPONENTS } from './techs/orbitals.data';
import { MINE_COMPONENTS } from './techs/mines.data';

const ALL_HULLS_LOCAL = [
  ...FREIGHTER_HULLS,
  ...WARSHIP_HULLS,
  ...UTILITY_HULLS,
  ...STARBASE_HULLS,
];

const ALL_COMPONENTS_LOCAL = [
  { category: 'Engines', items: ENGINE_COMPONENTS },
  { category: 'Scanners', items: SCANNER_COMPONENTS },
  { category: 'Computers', items: COMPUTER_COMPONENTS },
  { category: 'Electrical', items: CAPACITOR_COMPONENTS },
  { category: 'Cloaking', items: CLOAKING_COMPONENTS },
  { category: 'Mechanical', items: MECHANICAL_COMPONENTS },
  { category: 'Weapons', items: WEAPON_COMPONENTS },
  { category: 'Bombs', items: BOMB_COMPONENTS },
  { category: 'Shields', items: SHIELD_COMPONENTS },
  { category: 'Armor', items: ARMOR_COMPONENTS },
  { category: 'Orbital', items: ORBITAL_COMPONENTS },
  { category: 'Mines', items: MINE_COMPONENTS },
];

export type TechField = 'Energy' | 'Kinetics' | 'Propulsion' | 'Construction';

export interface TechLevel {
  level: number;
  name: string;
  cost: number;
  unlocks: Array<string>;
}

export interface TechFieldInfo {
  id: TechField;
  name: string;
  description: string;
  icon: string;
  levels: Array<TechLevel>;
}

// Standard Stars! Cost Curve: 50 * (1.75 ^ (Level - 1))
function calculateLevelCost(level: number): number {
  if (level === 0) return 0;
  // Reduced scaling factor slightly for mobile (1.6 vs 1.75) to make late game reachable
  return Math.floor(50 * Math.pow(1.6, level - 1));
}

function getUnlocksForField(field: TechField): Record<number, Array<string>> {
  const unlocks: Record<number, Array<string>> = {};

  // Process Hulls
  ALL_HULLS_LOCAL.forEach((hull) => {
    // hull.techReq uses keys like "Construction", "Energy" etc. matching TechField
    const level = hull.techReq?.[field];
    if (level !== undefined) {
      if (!unlocks[level]) unlocks[level] = [];
      unlocks[level].push(hull.Name);
    }
  });

  // Process Components
  ALL_COMPONENTS_LOCAL.forEach((category) => {
    category.items.forEach((comp) => {
      const level = (comp.tech as TechRequirement)[field];
      if (level !== undefined) {
        if (!unlocks[level]) unlocks[level] = [];
        unlocks[level].push(comp.name);
      }
    });
  });

  return unlocks;
}

function generateLevels(field: TechField): Array<TechLevel> {
  const unlocksByLevel = getUnlocksForField(field);
  const levels: Array<TechLevel> = [];

  // Find max level defined in unlocks or default to 26
  let maxLevel = 26;
  Object.keys(unlocksByLevel).forEach((l) => {
    const level = Number(l);
    if (level > maxLevel) maxLevel = level;
  });

  for (let i = 0; i <= maxLevel; i++) {
    levels.push({
      level: i,
      name: `Level ${i}`,
      cost: calculateLevelCost(i),
      unlocks: unlocksByLevel[i] || [],
    });
  }
  return levels;
}

export const TECH_FIELDS: Record<TechField, TechFieldInfo> = {
  Energy: {
    id: 'Energy',
    name: 'Energy Physics',
    description: 'Shields, scanners, cloaking, and beam weapons.',
    icon: '⚡',
    levels: generateLevels('Energy'),
  },
  Kinetics: {
    id: 'Kinetics',
    name: 'Kinetics & Ballistics',
    description: 'Torpedoes, missiles, and planetary bombardment.',
    icon: '🚀',
    levels: generateLevels('Kinetics'),
  },
  Propulsion: {
    id: 'Propulsion',
    name: 'Propulsion',
    description: 'Engines, maneuvering jets, and fuel efficiency.',
    icon: '✈️',
    levels: generateLevels('Propulsion'),
  },
  Construction: {
    id: 'Construction',
    name: 'Construction',
    description: 'Ship hulls, armor, and mechanical structures.',
    icon: '🏗️',
    levels: generateLevels('Construction'),
  },
};

export const TECH_FIELD_LIST: Array<TechField> = ['Energy', 'Kinetics', 'Propulsion', 'Construction'];
