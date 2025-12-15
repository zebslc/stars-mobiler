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
    warpSpeed: 7,
    fuelCapacity: 50,
    fuelEfficiency: 80,
    idealWarp: 6,
    firepower: 5,
    armor: 5,
    shields: 0,
    accuracy: 60,
    initiative: 8,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 20
  },
  frigate: {
    id: 'frigate',
    name: 'Frigate',
    warpSpeed: 8,
    fuelCapacity: 120,
    fuelEfficiency: 70,
    idealWarp: 6,
    firepower: 20,
    armor: 20,
    shields: 10,
    accuracy: 70,
    initiative: 6,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 80
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    warpSpeed: 8,
    fuelCapacity: 160,
    fuelEfficiency: 60,
    idealWarp: 6,
    firepower: 35,
    armor: 30,
    shields: 20,
    accuracy: 75,
    initiative: 5,
    cargoCapacity: 0,
    colonistCapacity: 0,
    mass: 120
  },
  settler: {
    id: 'settler',
    name: 'Colony Ship',
    warpSpeed: 7,
    fuelCapacity: 140,
    fuelEfficiency: 0,
    idealWarp: 6,
    firepower: 0,
    armor: 10,
    shields: 0,
    accuracy: 0,
    initiative: 4,
    cargoCapacity: 25,
    colonistCapacity: 25000,
    mass: 100,
    colonyModule: true
  }
};

export function getDesign(id: string): CompiledDesign {
  return COMPILED_DESIGNS[id] ?? COMPILED_DESIGNS['scout'];
}
