import { HullStats, ComponentStats, TECH_ATLAS } from './tech-atlas.data';

export type TechField = 'Energy' | 'Kinetics' | 'Propulsion' | 'Construction';

export interface TechLevel {
  level: number;
  name: string;
  cost: number;
  unlocks: string[];
}

export interface TechFieldInfo {
  id: TechField;
  name: string;
  description: string;
  icon: string;
  levels: TechLevel[];
}

// Standard Stars! Cost Curve: 50 * (1.75 ^ (Level - 1))
function calculateLevelCost(level: number): number {
  if (level === 0) return 0;
  // Reduced scaling factor slightly for mobile (1.6 vs 1.75) to make late game reachable
  return Math.floor(50 * Math.pow(1.6, level - 1));
}

function generateLevels(unlocksByLevel: Record<number, string[]>): TechLevel[] {
  const levels: TechLevel[] = [];
  // Extended to Level 24 to match the new distribution
  for (let i = 0; i <= 24; i++) {
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
    levels: generateLevels({
      0: ['Viewer 50', 'Mole-Skin', 'Laser'],
      1: ['Rhino Scanner'],
      2: ['X-Ray Laser'],
      3: ['Cow-Hide'],
      4: ['Mole Scanner'],
      5: ['Disruptor', 'Wolverine'],
      6: ['Snooper 320'],
      7: ['Phasor'],
      8: ['Eagle Eye'],
      10: ['Phase Shield'],
      12: ['Heavy Blaster'],
      14: ['Phasor Bazooka'], // Re-mapped
      16: ['Possum Scanner'],
      20: ['Big Mutha Cannon'],
      24: ['Langston Shell'] // High level shield
    }),
  },
  Kinetics: {
    id: 'Kinetics',
    name: 'Kinetics & Ballistics',
    description: 'Torpedoes, missiles, and planetary bombardment.',
    icon: '🚀',
    levels: generateLevels({
      1: ['Alpha Torp'],
      2: ['Smart Bomb'],
      4: ['Beta Torp'], // Filler torp
      5: ['Rho Torp'],
      7: ['Cherry Bomb'],
      8: ['Anti-Matter Torp'],
      10: ['Neutron Bomb'],
      12: ['Epsilon Torp'],
      15: ['Enriched Neutron Bomb'],
      18: ['Omega Torp'],
      22: ['Armageddon Missile']
    }),
  },
  Propulsion: {
    id: 'Propulsion',
    name: 'Propulsion',
    description: 'Engines, maneuvering jets, and fuel efficiency.',
    icon: '✈️',
    levels: generateLevels({
      0: ["Settler's Drive"],
      2: ['Fuel Mizer'],
      4: ['Maneuvering Jet'],
      6: ['Trans-Galactic'],
      9: ['Fuel Tank'],
      12: ['Ramscoop'],
      14: ['Super Fuel Tank'],
      16: ['Overthruster'],
      20: ['Radiating Hydro-Ram'] // Advanced engine
    }),
  },
  Construction: {
    id: 'Construction',
    name: 'Construction',
    description: 'Ship hulls, armor, and mechanical structures.',
    icon: '🏗️',
    levels: generateLevels({
      0: ['Small Freighter', 'Scout', 'Tritanium'],
      1: ['Frigate'],
      2: ['Colony Ship', 'Orbital Fort'],
      3: ['Medium Freighter'],
      4: ['Destroyer', 'Privateer'],
      5: ['Crobmnium'],
      6: ['Large Freighter'],
      7: ['Cruiser', 'Rogue'],
      8: ['Galleon'],
      9: ['Battle Cruiser'],
      10: ['Neutronium', 'Space Station'],
      12: ['Battleship'],
      14: ['Valanium'],
      16: ['Dreadnought'],
      20: ['Super Freighter'] // Late game logistics
    }),
  },
};

export const TECH_FIELD_LIST: TechField[] = [
  'Energy',
  'Kinetics',
  'Propulsion',
  'Construction',
];