// Stars! Technology Tree
// Updated to use 4 research fields from tech-atlas.json

export type TechField =
  | 'Energy'
  | 'Kinetics'
  | 'Propulsion'
  | 'Construction';

export interface TechLevel {
  level: number;
  name: string;
  cost: number; // Research points needed to reach this level
  unlocks: string[]; // Component IDs or abilities unlocked
}

export interface TechFieldInfo {
  id: TechField;
  name: string;
  description: string;
  icon: string; // Icon name or path
  levels: TechLevel[];
}

// Calculate research cost for a level (exponential growth)
function calculateLevelCost(level: number): number {
  if (level === 0) return 0;
  return Math.floor(50 * Math.pow(1.75, level - 1));
}

// Generate levels 0-26 for a tech field
function generateLevels(unlocksByLevel: Record<number, string[]>): TechLevel[] {
  const levels: TechLevel[] = [];
  for (let i = 0; i <= 26; i++) {
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
    name: 'Energy',
    description: 'Scanners, shields, and beam weapons',
    icon: 'flash',
    levels: generateLevels({
      0: ['Viewer 50', 'Mole-Skin', 'Laser'],
      2: ['Rhino Scanner'],
      3: ['X-Ray Laser'],
      4: ['Cow-Hide'],
      6: ['Mole Scanner'],
      8: ['Disruptor', 'Wolverine'],
      12: ['Snooper 320'],
      14: ['Phasor'],
      18: ['Eagle Eye'],
      22: ['Phase Shield'],
    }),
  },
  Kinetics: {
    id: 'Kinetics',
    name: 'Kinetics',
    description: 'Torpedoes and bombs',
    icon: 'rocket',
    levels: generateLevels({
      2: ['Alpha Torp'],
      5: ['Smart Bomb'],
      8: ['Rho Torp'],
      10: ['Cherry Bomb'],
      14: ['Anti-Matter Torp'],
    }),
  },
  Propulsion: {
    id: 'Propulsion',
    name: 'Propulsion',
    description: 'Engines and fuel efficiency',
    icon: 'airplane',
    levels: generateLevels({
      0: ["Settler's Drive"],
      3: ['Fuel Mizer'],
      9: ['Trans-Galactic'],
      16: ['Ramscoop'],
    }),
  },
  Construction: {
    id: 'Construction',
    name: 'Construction',
    description: 'Ship hulls and armor',
    icon: 'construct',
    levels: generateLevels({
      0: ['Small Freighter', 'Scout', 'Frigate', 'Tritanium'],
      1: ['Frigate'],
      2: ['Colony Ship', 'Orbital Fort'],
      3: ['Medium Freighter'],
      4: ['Destroyer', 'Privateer'],
      5: ['Crobmnium'],
      6: ['Large Freighter'],
      8: ['Cruiser', 'Rogue'],
      10: ['Galleon'],
      11: ['Battle Cruiser'],
      12: ['Neutronium', 'Space Station'],
      16: ['Battleship'],
      20: ['Dreadnought', 'Valanium'],
    }),
  },
};

export const TECH_FIELD_LIST: TechField[] = [
  'Energy',
  'Kinetics',
  'Propulsion',
  'Construction',
];
