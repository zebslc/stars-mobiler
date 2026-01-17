
export interface ScanReport {
  starId: string;
  turn: number; // Turn number when the scan was taken
  
  // Snapshot of the planet's state at the time of scan
  ownerId: string | null;
  population: number;
  maxPopulation: number;
  
  // Structures
  mines: number;
  factories: number;
  defenses: number;
  
  // Resources
  mineralConcentrations: { ironium: number; boranium: number; germanium: number };
  surfaceMinerals: { ironium: number; boranium: number; germanium: number };
  
  // Environment
  temperature: number;
  atmosphere: number;
  resources: number;
}

export interface VisibilityState {
  starId: string;
  isExplored: boolean;
  scanReport?: ScanReport;
}

export interface StarVisibility {
  status: 'visible' | 'fog' | 'unexplored';
  scan?: ScanReport;
  age: number;
}
