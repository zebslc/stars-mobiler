export type CompiledDesign = {
  id: string;
  name: string;
  warpSpeed: number;
  fuelCapacity: number;
  fuelEfficiency: number; // lower is better; 0 means ramscoop
  idealWarp: number;
  firepower: number;
  armor: number;
  shields: number;
  accuracy: number; // 0-100
  initiative: number;
  cargoCapacity: number; // kT
  colonistCapacity: number; // people count
  mass: number; // kT
  colonyModule?: boolean;
};

export const COMPILED_DESIGNS: Record<string, CompiledDesign> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    warpSpeed: 6,
    fuelCapacity: 500, // Hull: 500mg
    fuelEfficiency: 100, // Settler's Delight engine
    idealWarp: 6,
    firepower: 10, // Basic laser
    armor: 20, // Hull armor
    shields: 25, // Basic shields
    accuracy: 75,
    initiative: 8,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 8 // Hull mass: 8kt
  },
  frigate: {
    id: 'frigate',
    name: 'Frigate',
    warpSpeed: 6,
    fuelCapacity: 1100, // Hull: 1100mg
    fuelEfficiency: 100, // Settler's Delight
    idealWarp: 6,
    firepower: 24, // 2x Alpha torpedoes (12 dmg each)
    armor: 30, // Hull armor
    shields: 25, // Basic shields
    accuracy: 70,
    initiative: 6,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 14 // Hull mass: 14kt
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    warpSpeed: 7,
    fuelCapacity: 3500, // Hull: 3500mg
    fuelEfficiency: 110, // Daddy Long Legs 7
    idealWarp: 6,
    firepower: 60, // 3x Beta torpedoes (20 dmg each)
    armor: 75, // Hull armor
    shields: 50, // Mole-skin shield
    accuracy: 75,
    initiative: 5,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 35 // Hull mass: 35kt
  },
  freighter: {
    id: 'freighter',
    name: 'Small Freighter',
    warpSpeed: 6,
    fuelCapacity: 2500, // Hull: 2500mg
    fuelEfficiency: 100, // Settler's Delight
    idealWarp: 6,
    firepower: 0,
    armor: 20,
    shields: 25,
    accuracy: 0,
    initiative: 4,
    cargoCapacity: 70,
    colonistCapacity: 0,
    mass: 15 // Hull mass: 15kt
  },
  super_freighter: {
    id: 'super_freighter',
    name: 'Super Freighter',
    warpSpeed: 9,
    fuelCapacity: 150000, // Hull: 150000mg
    fuelEfficiency: 120, // Trans-Galactic Drive
    idealWarp: 8,
    firepower: 0,
    armor: 150,
    shields: 0,
    accuracy: 0,
    initiative: 4,
    cargoCapacity: 3000,
    colonistCapacity: 0,
    mass: 240 // Hull mass: 240kt
  },
  tanker: {
    id: 'tanker',
    name: 'Fuel Transport',
    warpSpeed: 6,
    fuelCapacity: 2250, // Hull: 2250mg
    fuelEfficiency: 100,
    idealWarp: 6,
    firepower: 0,
    armor: 10,
    shields: 0,
    accuracy: 0,
    initiative: 4,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 12 // Hull mass: 12kt
  },
  settler: {
    id: 'settler',
    name: 'Colony Ship',
    warpSpeed: 6,
    fuelCapacity: 2500, // Hull: 2500mg
    fuelEfficiency: 0, // Ramscoop (Radiating Hydro-Ram)
    idealWarp: 6,
    firepower: 0,
    armor: 30,
    shields: 25,
    accuracy: 0,
    initiative: 4,
    cargoCapacity: 50,
    colonistCapacity: 25000,
    mass: 40, // Hull mass: 40kt
    colonyModule: true
  },
  stardock: {
    id: 'stardock',
    name: 'Starbase',
    warpSpeed: 0,
    fuelCapacity: 0,
    fuelEfficiency: 100,
    idealWarp: 0,
    firepower: 50,
    armor: 200,
    shields: 100,
    accuracy: 80,
    initiative: 1,
    cargoCapacity: 1000,
    colonistCapacity: 0,
    mass: 500
  }
};

export function getDesign(id: string): CompiledDesign {
  return COMPILED_DESIGNS[id] ?? COMPILED_DESIGNS['scout'];
}
