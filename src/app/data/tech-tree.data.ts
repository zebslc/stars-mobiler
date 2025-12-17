// Stars! Technology Tree
// Based on the original game's 6 research fields with 26 levels each

export type TechField =
  | 'energy'
  | 'weapons'
  | 'propulsion'
  | 'construction'
  | 'electronics'
  | 'biotechnology';

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
  energy: {
    id: 'energy',
    name: 'Energy',
    description: 'Shields, beam weapons, and power systems',
    icon: 'flash',
    levels: generateLevels({
      0: ['Basic Shields'],
      1: ['X-Ray Laser'],
      2: ['Mole-skin Shield'],
      3: ['Bear Neutrino Barrier'],
      4: ['Laser'],
      5: ['Gorilla Depletion Shield'],
      6: ['Elephant Dispersal Shield'],
      7: ['Gatling Gun'],
      8: ['Mini Gun'],
      9: ['Yakimora Light Phaser'],
      10: ['Mega Disruptor'],
      11: ['Big Mutha Cannon'],
      12: ['Phased Sapper'],
      13: ['Heavy Blaster'],
      14: ['Gatling Neutrino Cannon'],
      15: ['Myopic Disruptor'],
      16: ['Blunderbuss'],
      17: ['Mark IV Blaster'],
      18: ['Phaser Bazooka'],
      19: ['Pulsed Sapper'],
      20: ['Colloidal Phaser'],
      21: ['Gatling Neutrino Cannon'],
      22: ['Syncro Sapper'],
      23: ['Mega Disruptor'],
      24: ['Big Mutha Cannon'],
      25: ['Streaming Pulverizer'],
      26: ['Anti-Matter Pulverizer'],
    }),
  },
  weapons: {
    id: 'weapons',
    name: 'Weapons',
    description: 'Torpedoes, missiles, and bombs',
    icon: 'rocket',
    levels: generateLevels({
      0: ['Alpha Torpedo'],
      1: ['Beta Torpedo'],
      2: ['Delta Torpedo'],
      3: ['Epsilon Torpedo'],
      4: ['Rho Torpedo'],
      5: ['Upsilon Torpedo'],
      6: ['Omega Torpedo'],
      7: ['Jihad Missile'],
      8: ['Juggernaut Missile'],
      9: ['Doomsday Missile'],
      10: ['Armageddon Missile'],
      11: ['Lady Finger Bomb'],
      12: ['Black Cat Bomb'],
      13: ['M-70 Bomb'],
      14: ['M-80 Bomb'],
      15: ['Cherry Bomb'],
      16: ['LBU-17 Bomb'],
      17: ['LBU-32 Bomb'],
      18: ['LBU-74 Bomb'],
      19: ['Hush-a-Boom'],
      20: ['Retro Bomb'],
      21: ['Smart Bomb'],
      22: ['Neutron Bomb'],
      23: ['Enriched Neutron Bomb'],
      24: ['Peerless Bomb'],
      25: ['Annihilator Bomb'],
      26: ['Anti-Matter Bomb'],
    }),
  },
  propulsion: {
    id: 'propulsion',
    name: 'Propulsion',
    description: 'Engines and fuel efficiency',
    icon: 'airplane',
    levels: generateLevels({
      0: ['Quick Jumper 5'],
      1: ['Fuel Mizer'],
      2: ['Long Hump 6'],
      3: ['Daddy Long Legs 7'],
      4: ['Alpha Drive 8'],
      5: ['Trans-Galactic Drive'],
      6: ['Interspace 10'],
      7: ['Trans Star 10'],
      8: ['Radiating Hydro-Ram'],
      9: ['Sub-Galactic Fuel Scoop'],
      10: ['Trans-Galactic Fuel Scoop'],
      11: ['Trans-Galactic Super Scoop'],
      12: ['Trans-Galactic Mizer Scoop'],
      13: ['Galaxy Scoop'],
      14: ['Trans-Star 10 RAM'],
      15: ['Radiating Hydro-Ram Scoop'],
      16: ['Sub-Galactic Fuel Scoop'],
      17: ['Trans-Galactic Drive'],
      18: ['Interspace 10'],
      19: ['Enigma Pulsar'],
      20: ['Trans Warp Drive'],
      21: ['Stargate 100/250'],
      22: ['Stargate Any/300'],
      23: ['Stargate 100/500'],
      24: ['Stargate Any/800'],
      25: ['Stargate 100/Any'],
      26: ['Stargate Any/Any'],
    }),
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    description: 'Ship hulls, mining, and planetary improvements',
    icon: 'construct',
    levels: generateLevels({
      0: ['Scout Hull'],
      1: ['Colony Ship Hull'],
      2: ['Mini Miner'],
      3: ['Destroyer Hull'],
      4: ['Cruiser Hull'],
      5: ['Battle Cruiser Hull'],
      6: ['Battleship Hull'],
      7: ['Dreadnought Hull'],
      8: ['Super Dreadnought Hull'],
      9: ['Tritanium'],
      10: ['Crobmnium'],
      11: ['Carbonic Armor'],
      12: ['Strobnium'],
      13: ['Organic Armor'],
      14: ['Kelarium'],
      15: ['Fielded Kelarium'],
      16: ['Depleted Neutronium'],
      17: ['Neutronium'],
      18: ['Mega Poly Shell'],
      19: ['Valanium'],
      20: ['Super Valanium'],
      21: ['Ultra Miner'],
      22: ['Robo-Miner'],
      23: ['Alien Miner'],
      24: ['Orbital Adjuster'],
      25: ['Cargo Pod'],
      26: ['Super Cargo Pod'],
    }),
  },
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    description: 'Scanners, computers, and cloaking',
    icon: 'radio',
    levels: generateLevels({
      0: ['Bat Scanner'],
      1: ['Rhino Scanner'],
      2: ['Mole Scanner'],
      3: ['DNA Scanner'],
      4: ['Possum Scanner'],
      5: ['Pick Pocket Scanner'],
      6: ['Chameleon Scanner'],
      7: ['Ferret Scanner'],
      8: ['Dolphin Scanner'],
      9: ['Gazelle Scanner'],
      10: ['RNA Scanner'],
      11: ['Cheetah Scanner'],
      12: ['Elephant Scanner'],
      13: ['Eagle Eye Scanner'],
      14: ['Robber Baron Scanner'],
      15: ['Peerless Scanner'],
      16: ['Battle Computer'],
      17: ['Battle Super Computer'],
      18: ['Battle Nexus'],
      19: ['Jammer 10'],
      20: ['Jammer 20'],
      21: ['Jammer 30'],
      22: ['Jammer 50'],
      23: ['Energy Capacitor'],
      24: ['Flux Capacitor'],
      25: ['Energy Dampener'],
      26: ['Tachyon Detector'],
    }),
  },
  biotechnology: {
    id: 'biotechnology',
    name: 'Biotechnology',
    description: 'Terraforming and population growth',
    icon: 'leaf',
    levels: generateLevels({
      0: ['Total Terraform ±3'],
      1: ['Total Terraform ±5'],
      2: ['Total Terraform ±7'],
      3: ['Gravity Terraform ±3'],
      4: ['Gravity Terraform ±5'],
      5: ['Gravity Terraform ±7'],
      6: ['Temp Terraform ±3'],
      7: ['Temp Terraform ±5'],
      8: ['Temp Terraform ±7'],
      9: ['Radiation Terraform ±3'],
      10: ['Radiation Terraform ±5'],
      11: ['Radiation Terraform ±7'],
      12: ['Colonization Module'],
      13: ['Orbital Construction Module'],
      14: ['Cargo Pod'],
      15: ['Super Cargo Pod'],
      16: ['Fuel Tank'],
      17: ['Super Fuel Tank'],
      18: ['Manifest Cargo Pod'],
      19: ['Multi Cargo Pod'],
      20: ['Multi Function Pod'],
      21: ['Colonist Pod'],
      22: ['Meta Morph Seed'],
      23: ['Genesis Device'],
      24: ['Complete Terraform'],
      25: ['Total Regeneration'],
      26: ['Bio-Adapter'],
    }),
  },
};

export const TECH_FIELD_LIST: TechField[] = [
  'energy',
  'weapons',
  'propulsion',
  'construction',
  'electronics',
  'biotechnology',
];
