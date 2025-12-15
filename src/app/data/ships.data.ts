export type CompiledDesign = {
  id: string;
  name: string;
  warpSpeed: number;
  fuelCapacity: number;
  fuelEfficiency: number; // lower is better; 0 means ramscoop
  firepower: number;
  armor: number;
  shields: number;
  accuracy: number; // 0-100
  initiative: number;
  colonyModule?: boolean;
};

export const COMPILED_DESIGNS: Record<string, CompiledDesign> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    warpSpeed: 7,
    fuelCapacity: 50,
    fuelEfficiency: 80,
    firepower: 5,
    armor: 5,
    shields: 0,
    accuracy: 60,
    initiative: 8
  },
  frigate: {
    id: 'frigate',
    name: 'Frigate',
    warpSpeed: 8,
    fuelCapacity: 120,
    fuelEfficiency: 70,
    firepower: 20,
    armor: 20,
    shields: 10,
    accuracy: 70,
    initiative: 6
  },
  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    warpSpeed: 8,
    fuelCapacity: 160,
    fuelEfficiency: 60,
    firepower: 35,
    armor: 30,
    shields: 20,
    accuracy: 75,
    initiative: 5
  },
  settler: {
    id: 'settler',
    name: 'Colony Ship',
    warpSpeed: 7,
    fuelCapacity: 140,
    fuelEfficiency: 75,
    firepower: 0,
    armor: 10,
    shields: 0,
    accuracy: 0,
    initiative: 4,
    colonyModule: true
  }
};

export function getDesign(id: string): CompiledDesign {
  return COMPILED_DESIGNS[id] ?? COMPILED_DESIGNS['scout'];
}

