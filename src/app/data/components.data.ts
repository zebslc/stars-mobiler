// Stars! Ship Components Database
// Based on the original game specifications

export type ComponentType = 'engine' | 'weapon' | 'shield' | 'scanner' | 'armor' | 'cargo' | 'electronics';

export interface Component {
  id: string;
  name: string;
  type: ComponentType;
  mass: number; // Base mass in kT
  cost: {
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
  techRequired: {
    field: 'energy' | 'weapons' | 'propulsion' | 'construction' | 'electronics' | 'biotechnology';
    level: number;
  };
  // Engine-specific
  warpSpeed?: number;
  fuelEfficiency?: number; // mg per ly, 0 = ramscoop
  idealWarp?: number; // Optimal warp for fuel efficiency

  // Weapon-specific
  damage?: number;
  range?: number;
  accuracy?: number; // %
  initiative?: number;

  // Shield-specific
  shieldStrength?: number; // Damage points absorbed

  // Scanner-specific
  scanRange?: number; // light years
  canDetectCloaked?: boolean;

  // Cargo-specific
  cargoCapacity?: number; // kT
}

// Engines
export const ENGINES: Record<string, Component> = {
  settler_delight: {
    id: 'settler_delight',
    name: 'Settler\'s Delight',
    type: 'engine',
    mass: 2,
    cost: { boranium: 2, germanium: 1 },
    techRequired: { field: 'propulsion', level: 0 },
    warpSpeed: 6,
    fuelEfficiency: 100, // Good efficiency
    idealWarp: 6,
  },

  quick_jumper_5: {
    id: 'quick_jumper_5',
    name: 'Quick Jumper 5',
    type: 'engine',
    mass: 4,
    cost: { boranium: 3, germanium: 1 },
    techRequired: { field: 'propulsion', level: 0 },
    warpSpeed: 5,
    fuelEfficiency: 120,
    idealWarp: 5,
  },

  fuel_mizer: {
    id: 'fuel_mizer',
    name: 'Fuel Mizer',
    type: 'engine',
    mass: 6,
    cost: { boranium: 8, germanium: 3 },
    techRequired: { field: 'propulsion', level: 2 },
    warpSpeed: 6,
    fuelEfficiency: 70, // Very efficient
    idealWarp: 6,
  },

  long_hump_6: {
    id: 'long_hump_6',
    name: 'Long Hump 6',
    type: 'engine',
    mass: 9,
    cost: { boranium: 5, germanium: 3 },
    techRequired: { field: 'propulsion', level: 3 },
    warpSpeed: 6,
    fuelEfficiency: 105,
    idealWarp: 6,
  },

  daddy_long_legs_7: {
    id: 'daddy_long_legs_7',
    name: 'Daddy Long Legs 7',
    type: 'engine',
    mass: 13,
    cost: { boranium: 11, germanium: 6 },
    techRequired: { field: 'propulsion', level: 4 },
    warpSpeed: 7,
    fuelEfficiency: 110,
    idealWarp: 6,
  },

  alpha_drive_8: {
    id: 'alpha_drive_8',
    name: 'Alpha Drive 8',
    type: 'engine',
    mass: 16,
    cost: { boranium: 16, germanium: 9 },
    techRequired: { field: 'propulsion', level: 5 },
    warpSpeed: 8,
    fuelEfficiency: 115,
    idealWarp: 7,
  },

  trans_galactic_drive: {
    id: 'trans_galactic_drive',
    name: 'Trans-Galactic Drive',
    type: 'engine',
    mass: 25,
    cost: { boranium: 25, germanium: 18 },
    techRequired: { field: 'propulsion', level: 6 },
    warpSpeed: 9,
    fuelEfficiency: 120,
    idealWarp: 8,
  },

  interspace_10: {
    id: 'interspace_10',
    name: 'Interspace 10',
    type: 'engine',
    mass: 35,
    cost: { boranium: 40, germanium: 30 },
    techRequired: { field: 'propulsion', level: 7 },
    warpSpeed: 10,
    fuelEfficiency: 125,
    idealWarp: 9,
  },

  radiating_hydro_ram: {
    id: 'radiating_hydro_ram',
    name: 'Radiating Hydro-Ram',
    type: 'engine',
    mass: 10,
    cost: { boranium: 18, germanium: 10 },
    techRequired: { field: 'propulsion', level: 9 },
    warpSpeed: 6,
    fuelEfficiency: 0, // Ramscoop - generates fuel!
    idealWarp: 6,
  },

  sub_galactic_fuel_scoop: {
    id: 'sub_galactic_fuel_scoop',
    name: 'Sub-Galactic Fuel Scoop',
    type: 'engine',
    mass: 20,
    cost: { boranium: 18, germanium: 11 },
    techRequired: { field: 'propulsion', level: 10 },
    warpSpeed: 7,
    fuelEfficiency: 0, // Ramscoop
    idealWarp: 7,
  },

  trans_galactic_fuel_scoop: {
    id: 'trans_galactic_fuel_scoop',
    name: 'Trans-Galactic Fuel Scoop',
    type: 'engine',
    mass: 25,
    cost: { boranium: 22, germanium: 13 },
    techRequired: { field: 'propulsion', level: 11 },
    warpSpeed: 8,
    fuelEfficiency: 0, // Ramscoop
    idealWarp: 8,
  },
};

// Weapons - Beams
export const BEAM_WEAPONS: Record<string, Component> = {
  laser: {
    id: 'laser',
    name: 'Laser',
    type: 'weapon',
    mass: 1,
    cost: { boranium: 2 },
    techRequired: { field: 'energy', level: 1 },
    damage: 10,
    range: 0,
    initiative: 1,
    accuracy: 75,
  },

  x_ray_laser: {
    id: 'x_ray_laser',
    name: 'X-Ray Laser',
    type: 'weapon',
    mass: 1,
    cost: { boranium: 3 },
    techRequired: { field: 'energy', level: 2 },
    damage: 16,
    range: 0,
    initiative: 1,
    accuracy: 75,
  },

  mini_gun: {
    id: 'mini_gun',
    name: 'Mini Gun',
    type: 'weapon',
    mass: 3,
    cost: { boranium: 5, germanium: 2 },
    techRequired: { field: 'energy', level: 8 },
    damage: 13,
    range: 1,
    initiative: 12,
    accuracy: 80,
  },

  yakimora_light_phaser: {
    id: 'yakimora_light_phaser',
    name: 'Yakimora Light Phaser',
    type: 'weapon',
    mass: 2,
    cost: { boranium: 7, germanium: 3 },
    techRequired: { field: 'energy', level: 9 },
    damage: 26,
    range: 1,
    initiative: 5,
    accuracy: 80,
  },

  disruptor: {
    id: 'disruptor',
    name: 'Mega Disruptor',
    type: 'weapon',
    mass: 5,
    cost: { boranium: 12, germanium: 5 },
    techRequired: { field: 'energy', level: 10 },
    damage: 35,
    range: 2,
    initiative: 4,
    accuracy: 80,
  },

  heavy_blaster: {
    id: 'heavy_blaster',
    name: 'Heavy Blaster',
    type: 'weapon',
    mass: 9,
    cost: { boranium: 38, germanium: 15 },
    techRequired: { field: 'energy', level: 13 },
    damage: 90,
    range: 1,
    initiative: 8,
    accuracy: 85,
  },

  phasor: {
    id: 'phasor',
    name: 'Phaser Bazooka',
    type: 'weapon',
    mass: 11,
    cost: { boranium: 45, germanium: 18 },
    techRequired: { field: 'energy', level: 18 },
    damage: 120,
    range: 3,
    initiative: 7,
    accuracy: 85,
  },

  big_mutha_cannon: {
    id: 'big_mutha_cannon',
    name: 'Big Mutha Cannon',
    type: 'weapon',
    mass: 40,
    cost: { boranium: 250, germanium: 100 },
    techRequired: { field: 'energy', level: 26 },
    damage: 500,
    range: 3,
    initiative: 10,
    accuracy: 90,
  },
};

// Weapons - Torpedoes
export const TORPEDO_WEAPONS: Record<string, Component> = {
  alpha_torpedo: {
    id: 'alpha_torpedo',
    name: 'Alpha Torpedo',
    type: 'weapon',
    mass: 4,
    cost: { boranium: 5 },
    techRequired: { field: 'weapons', level: 0 },
    damage: 12,
    range: 4,
    accuracy: 65,
    initiative: 0,
  },

  beta_torpedo: {
    id: 'beta_torpedo',
    name: 'Beta Torpedo',
    type: 'weapon',
    mass: 5,
    cost: { boranium: 8 },
    techRequired: { field: 'weapons', level: 1 },
    damage: 20,
    range: 4,
    accuracy: 70,
    initiative: 0,
  },

  delta_torpedo: {
    id: 'delta_torpedo',
    name: 'Delta Torpedo',
    type: 'weapon',
    mass: 5,
    cost: { boranium: 11 },
    techRequired: { field: 'weapons', level: 2 },
    damage: 30,
    range: 5,
    accuracy: 75,
    initiative: 0,
  },

  rho_torpedo: {
    id: 'rho_torpedo',
    name: 'Rho Torpedo',
    type: 'weapon',
    mass: 6,
    cost: { boranium: 15 },
    techRequired: { field: 'weapons', level: 4 },
    damage: 50,
    range: 5,
    accuracy: 85,
    initiative: 1,
  },

  omega_torpedo: {
    id: 'omega_torpedo',
    name: 'Omega Torpedo',
    type: 'weapon',
    mass: 7,
    cost: { boranium: 22 },
    techRequired: { field: 'weapons', level: 6 },
    damage: 78,
    range: 6,
    accuracy: 85,
    initiative: 2,
  },

  anti_matter_torpedo: {
    id: 'anti_matter_torpedo',
    name: 'Anti-Matter Torpedo',
    type: 'weapon',
    mass: 8,
    cost: { boranium: 45 },
    techRequired: { field: 'weapons', level: 18 },
    damage: 150,
    range: 7,
    accuracy: 90,
    initiative: 3,
  },
};

// Shields
export const SHIELDS: Record<string, Component> = {
  basic_shields: {
    id: 'basic_shields',
    name: 'Basic Shields',
    type: 'shield',
    mass: 1,
    cost: { boranium: 2 },
    techRequired: { field: 'energy', level: 0 },
    shieldStrength: 25,
  },

  mole_skin_shield: {
    id: 'mole_skin_shield',
    name: 'Mole-skin Shield',
    type: 'shield',
    mass: 2,
    cost: { boranium: 5, germanium: 2 },
    techRequired: { field: 'energy', level: 2 },
    shieldStrength: 50,
  },

  bear_neutrino_barrier: {
    id: 'bear_neutrino_barrier',
    name: 'Bear Neutrino Barrier',
    type: 'shield',
    mass: 3,
    cost: { boranium: 9, germanium: 4 },
    techRequired: { field: 'energy', level: 3 },
    shieldStrength: 90,
  },

  gorilla_depletion_shield: {
    id: 'gorilla_depletion_shield',
    name: 'Gorilla Depletion Shield',
    type: 'shield',
    mass: 5,
    cost: { boranium: 15, germanium: 7 },
    techRequired: { field: 'energy', level: 5 },
    shieldStrength: 175,
  },

  elephant_dispersal_shield: {
    id: 'elephant_dispersal_shield',
    name: 'Elephant Dispersal Shield',
    type: 'shield',
    mass: 8,
    cost: { boranium: 25, germanium: 12 },
    techRequired: { field: 'energy', level: 6 },
    shieldStrength: 300,
  },
};

// Scanners
export const SCANNERS: Record<string, Component> = {
  bat_scanner: {
    id: 'bat_scanner',
    name: 'Bat Scanner',
    type: 'scanner',
    mass: 1,
    cost: { germanium: 1 },
    techRequired: { field: 'electronics', level: 0 },
    scanRange: 50,
    canDetectCloaked: false,
  },

  rhino_scanner: {
    id: 'rhino_scanner',
    name: 'Rhino Scanner',
    type: 'scanner',
    mass: 2,
    cost: { germanium: 2 },
    techRequired: { field: 'electronics', level: 1 },
    scanRange: 75,
    canDetectCloaked: false,
  },

  mole_scanner: {
    id: 'mole_scanner',
    name: 'Mole Scanner',
    type: 'scanner',
    mass: 2,
    cost: { germanium: 3 },
    techRequired: { field: 'electronics', level: 2 },
    scanRange: 100,
    canDetectCloaked: false,
  },

  dna_scanner: {
    id: 'dna_scanner',
    name: 'DNA Scanner',
    type: 'scanner',
    mass: 3,
    cost: { germanium: 5 },
    techRequired: { field: 'electronics', level: 3 },
    scanRange: 125,
    canDetectCloaked: true,
  },

  possum_scanner: {
    id: 'possum_scanner',
    name: 'Possum Scanner',
    type: 'scanner',
    mass: 4,
    cost: { germanium: 8 },
    techRequired: { field: 'electronics', level: 4 },
    scanRange: 150,
    canDetectCloaked: true,
  },

  peerless_scanner: {
    id: 'peerless_scanner',
    name: 'Peerless Scanner',
    type: 'scanner',
    mass: 5,
    cost: { germanium: 24 },
    techRequired: { field: 'electronics', level: 15 },
    scanRange: 340,
    canDetectCloaked: true,
  },
};

// Combined component lists
export const COMPONENTS = {
  ...ENGINES,
  ...BEAM_WEAPONS,
  ...TORPEDO_WEAPONS,
  ...SHIELDS,
  ...SCANNERS,
};

export const COMPONENT_LIST = Object.values(COMPONENTS);

export function getComponent(id: string): Component | undefined {
  return COMPONENTS[id];
}

export function getComponentsByType(type: ComponentType): Component[] {
  return COMPONENT_LIST.filter(c => c.type === type);
}

export function getAvailableComponents(techLevels: Record<string, number>): Component[] {
  return COMPONENT_LIST.filter(c => {
    const reqLevel = c.techRequired.level;
    const playerLevel = techLevels[c.techRequired.field] || 0;
    return playerLevel >= reqLevel;
  });
}
