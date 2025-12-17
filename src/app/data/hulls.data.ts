// Stars! Ship Hull Database
// Based on the original game specifications

export type SlotType = 'engine' | 'weapon' | 'shield' | 'general' | 'electronics' | 'cargo';

export interface HullSlot {
  id: string; // Slot identifier (0-9, a-f)
  type: SlotType;
  allowedTypes: SlotType[]; // Some slots allow multiple component types
}

export interface Hull {
  id: string;
  name: string;
  mass: number; // kT
  fuelCapacity: number; // mg (milligrams)
  baseCost: {
    ironium: number;
    boranium: number;
    germanium: number;
  };
  techRequired: {
    construction: number;
  };
  slots: HullSlot[];
  visualGrid: string; // ASCII template from the game
  role: string;
  armor: number; // Base armor value
  cargoCapacity?: number; // If has cargo holds (# slots)
}

// Slot type definitions based on the visual grid numbers
const SLOT_DEFINITIONS: Record<string, SlotType[]> = {
  '0': ['engine'], // Engine slots
  '1': ['electronics', 'general'], // Scanner/Computer slots
  '2': ['shield', 'general'], // Shield slots
  '3': ['weapon'], // Weapon slots
  '4': ['weapon', 'general'], // Weapon or general
  '5': ['weapon', 'shield'], // Weapon or shield
  '6': ['shield', 'general'], // Shield or armor
  '7': ['weapon'], // Weapon slots
  '8': ['shield', 'general'], // Shield/armor
  '9': ['weapon'], // Weapon slots
  'a': ['weapon', 'shield'], // Weapon or shield
  'b': ['shield', 'general'], // Shield or general
  'c': ['weapon'], // Weapon
  'd': ['electronics', 'general'], // Electronics
  'e': ['weapon'], // Weapon
  'f': ['shield', 'general'], // Shield/general
  '#': ['cargo'], // Cargo (fixed, not customizable)
};

function parseHullTemplate(template: string): HullSlot[] {
  const slots: HullSlot[] = [];
  const seenSlots = new Set<string>();

  // Remove dots and spaces, get unique slot IDs
  const chars = template.replace(/[·\s]/g, '').split('');

  for (const char of chars) {
    if (char !== '·' && char !== ' ' && !seenSlots.has(char)) {
      seenSlots.add(char);
      const allowedTypes = SLOT_DEFINITIONS[char] || ['general'];
      slots.push({
        id: char,
        type: allowedTypes[0], // Default type
        allowedTypes,
      });
    }
  }

  return slots;
}

export const HULLS: Record<string, Hull> = {
  // Freighters
  small_freighter: {
    id: 'small_freighter',
    name: 'Small Freighter',
    mass: 15,
    fuelCapacity: 2500,
    baseCost: { ironium: 25, boranium: 3, germanium: 2 },
    techRequired: { construction: 0 },
    slots: parseHullTemplate('·0·0·#·#·2·2·1·1'),
    visualGrid: '·0·0·#·#·2·2·1·1\n·0·0·#·#·2·2·1·1',
    role: 'Early Transport',
    armor: 20,
    cargoCapacity: 70,
  },

  medium_freighter: {
    id: 'medium_freighter',
    name: 'Medium Freighter',
    mass: 45,
    fuelCapacity: 9000,
    baseCost: { ironium: 65, boranium: 9, germanium: 6 },
    techRequired: { construction: 3 },
    slots: parseHullTemplate('0·0·#·#·#·#·2·2·1·1'),
    visualGrid: '0·0·#·#·#·#·2·2·1·1\n0·0·#·#·#·#·2·2·1·1',
    role: 'Bulk Transport',
    armor: 45,
    cargoCapacity: 210,
  },

  large_freighter: {
    id: 'large_freighter',
    name: 'Large Freighter',
    mass: 120,
    fuelCapacity: 35000,
    baseCost: { ironium: 125, boranium: 22, germanium: 13 },
    techRequired: { construction: 6 },
    slots: parseHullTemplate('0·0·#·#·#·#·1·1 · #·#·#·#·2·2'),
    visualGrid: '· #·#·#·#·1·1\n0·0·#·#·#·#·1·1\n0·0·#·#·#·#·2·2\n· #·#·#·#·2·2',
    role: 'Heavy Logistics',
    armor: 90,
    cargoCapacity: 1200,
  },

  super_freighter: {
    id: 'super_freighter',
    name: 'Super Freighter',
    mass: 240,
    fuelCapacity: 150000,
    baseCost: { ironium: 225, boranium: 45, germanium: 30 },
    techRequired: { construction: 11 },
    slots: parseHullTemplate('0·0·#·#·#·#·#·#·2·2 · #·#·#·#·#·#·3·3'),
    visualGrid: '· #·#·#·#·#·#·1·1\n· #·#·#·#·#·#·1·1\n0·0·#·#·#·#·#·#·2·2\n0·0·#·#·#·#·#·#·2·2\n· #·#·#·#·#·#·3·3\n· #·#·#·#·#·#·3·3',
    role: 'Empire Supply',
    armor: 150,
    cargoCapacity: 3000,
  },

  // Combat Ships
  scout: {
    id: 'scout',
    name: 'Scout',
    mass: 8,
    fuelCapacity: 500,
    baseCost: { ironium: 8, boranium: 1, germanium: 1 },
    techRequired: { construction: 0 },
    slots: parseHullTemplate('· ·0·0·2·2·1·1'),
    visualGrid: '· ·0·0·2·2·1·1\n· ·0·0·2·2·1·1',
    role: 'Recon / Chaff',
    armor: 20,
  },

  frigate: {
    id: 'frigate',
    name: 'Frigate',
    mass: 14,
    fuelCapacity: 1100,
    baseCost: { ironium: 22, boranium: 5, germanium: 3 },
    techRequired: { construction: 0 },
    slots: parseHullTemplate('·0·0·3·3·2·2·1·1'),
    visualGrid: '·0·0·3·3·2·2·1·1\n·0·0·3·3·2·2·1·1',
    role: 'Early Skirmish',
    armor: 30,
  },

  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    mass: 35,
    fuelCapacity: 3500,
    baseCost: { ironium: 70, boranium: 13, germanium: 7 },
    techRequired: { construction: 4 },
    slots: parseHullTemplate('· ·0·0·4·4·3·3 · · ·6·6 · · · · ·2·2'),
    visualGrid: '· · · · ·1·1\n· · ·5·5·1·1\n· · ·5·5\n· ·0·0·4·4·3·3\n· ·0·0·4·4·3·3\n· · ·6·6\n· · ·6·6·2·2\n· · · · ·2·2\n· · · · ·3·3',
    role: 'Mine Layer / Support',
    armor: 75,
  },

  cruiser: {
    id: 'cruiser',
    name: 'Cruiser',
    mass: 140,
    fuelCapacity: 15000,
    baseCost: { ironium: 165, boranium: 35, germanium: 20 },
    techRequired: { construction: 8 },
    slots: parseHullTemplate('·0·0·1·1·6·6·5·5 · · ·2·2·4·4'),
    visualGrid: '· · · · ·1·1\n· · ·1·1·3·3\n·0·0·1·1·6·6·5·5\n·0·0·2·2·6·6·5·5\n· · ·2·2·4·4\n· · · · ·4·4\n· · · · ·3·3',
    role: 'Main Battle Line',
    armor: 200,
  },

  battle_cruiser: {
    id: 'battle_cruiser',
    name: 'Battle Cruiser',
    mass: 260,
    fuelCapacity: 35000,
    baseCost: { ironium: 285, boranium: 60, germanium: 35 },
    techRequired: { construction: 11 },
    slots: parseHullTemplate('·0·0·1·1·6·6·5·5 · · ·2·2·4·4'),
    visualGrid: '· · · · ·1·1\n· · ·1·1·3·3\n·0·0·1·1·6·6·5·5\n·0·0·2·2·6·6·5·5\n· · ·2·2·4·4\n· · · · ·4·4\n· · · · ·3·3',
    role: 'Heavy Striker',
    armor: 350,
  },

  battleship: {
    id: 'battleship',
    name: 'Battleship',
    mass: 500,
    fuelCapacity: 75000,
    baseCost: { ironium: 400, boranium: 100, germanium: 50 },
    techRequired: { construction: 16 },
    slots: parseHullTemplate('0·0·9·9·8·8·2·2·1·1 · ·a·a·4·4·7·7 · ·6·6'),
    visualGrid: '· ·5·5\n· ·5·5·3·3\n· ·9·9·3·3·2·2\n0·0·9·9·8·8·2·2·1·1\n0·0·a·a·8·8·7·7·1·1\n· ·a·a·4·4·7·7\n· ·6·6·4·4\n· ·6·6',
    role: 'Capital Siege',
    armor: 500,
  },

  dreadnought: {
    id: 'dreadnought',
    name: 'Dreadnought',
    mass: 1000,
    fuelCapacity: 200000,
    baseCost: { ironium: 650, boranium: 150, germanium: 100 },
    techRequired: { construction: 20 },
    slots: parseHullTemplate('0·0·5·5·9·9·a·a·c·c 2·2·6·6·8·8·b·b · 4·4'),
    visualGrid: '· 3·3\n1·1·3·3·7·7\n1·1·5·5·7·7·a·a\n0·0·5·5·9·9·a·a·c·c\n0·0·6·6·9·9·b·b·c·c\n2·2·6·6·8·8·b·b\n2·2·4·4·8·8\n· 4·4',
    role: 'Fleet Anchor',
    armor: 1000,
  },

  // Colony Ships
  mini_colony: {
    id: 'mini_colony',
    name: 'Mini-Colony Ship',
    mass: 20,
    fuelCapacity: 1000,
    baseCost: { ironium: 15, boranium: 3, germanium: 2 },
    techRequired: { construction: 0 },
    slots: parseHullTemplate('· ·0·0·#·#·1·1'),
    visualGrid: '· ·0·0·#·#·1·1\n· ·0·0·#·#·1·1',
    role: 'Seed Ship',
    armor: 20,
    cargoCapacity: 25,
  },

  colony_ship: {
    id: 'colony_ship',
    name: 'Colony Ship',
    mass: 40,
    fuelCapacity: 2500,
    baseCost: { ironium: 30, boranium: 7, germanium: 3 },
    techRequired: { construction: 2 },
    slots: parseHullTemplate('· ·0·0·#·#·1·1'),
    visualGrid: '· ·0·0·#·#·1·1\n· ·0·0·#·#·1·1',
    role: 'Standard Colonizer',
    armor: 30,
    cargoCapacity: 50,
  },

  // Tanker
  fuel_transport: {
    id: 'fuel_transport',
    name: 'Fuel Transport',
    mass: 12,
    fuelCapacity: 2250,
    baseCost: { ironium: 10, boranium: 8, germanium: 2 },
    techRequired: { construction: 0 },
    slots: parseHullTemplate('· · ·0·0·1·1'),
    visualGrid: '· · ·0·0·1·1\n· · ·0·0·1·1',
    role: 'Tanker',
    armor: 10,
  },
};

export const HULL_LIST = Object.values(HULLS);

export function getHull(id: string): Hull | undefined {
  return HULLS[id];
}

export function getHullsByTechLevel(constructionLevel: number): Hull[] {
  return HULL_LIST.filter(h => h.techRequired.construction <= constructionLevel);
}
