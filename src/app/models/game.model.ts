export interface GameSettings {
  galaxySize: 'small' | 'medium' | 'large';
  aiCount: number;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  seed: number;
  speciesId: string;
}

export interface GameState {
  id: string;
  seed: number;
  turn: number;
  settings: GameSettings;
  stars: Star[];
  humanPlayer: Player;
  aiPlayers: AIPlayer[];
  fleets: Fleet[];
  playerEconomy: PlayerEconomy;
  shipDesigns: ShipDesign[];
}

export interface ShipDesign {
  id: string;
  name: string;
  hullId: string;
  slots: SlotAssignment[];
  createdTurn: number;
  playerId: string;
  spec?: CompiledShipStats;
}

export interface CompiledShipStats {
  // Movement
  warpSpeed: number;
  fuelCapacity: number;
  fuelEfficiency?: number;
  idealWarp: number;
  isRamscoop: boolean;

  // Combat
  firepower: number;
  maxWeaponRange: number;
  armor: number;
  shields: number;
  accuracy: number;
  initiative: number;

  // Utility
  cargoCapacity: number;
  colonistCapacity: number;
  scanRange: number;
  penScanRange: number;
  canDetectCloaked: boolean;
  miningRate: number;
  terraformRate: number;

  // Special Abilities
  bombing: {
    kill: number;
    destroy: number;
  };
  massDriver: {
    speed: number;
    catch: number;
  };

  // Mass and cost
  mass: number;
  cost: {
    ironium: number;
    boranium: number;
    germanium: number;
    resources: number;
  };

  // Flags
  hasEngine: boolean;
  hasColonyModule: boolean;
  isStarbase: boolean; // warpSpeed === 0

  // Validation
  isValid: boolean;
  validationErrors: string[];

  // Installed Components Summary
  components: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

export interface SlotAssignment {
  slotId: string;
  components: ComponentAssignment[];
}

export interface ComponentAssignment {
  componentId: string;
  count: number;
}

// Updated to match new tech-atlas.json 4-stream system
export interface PlayerTech {
  Energy: number;
  Kinetics: number;
  Propulsion: number;
  Construction: number;
}

export interface Player {
  id: string;
  name: string;
  species: Species;
  ownedPlanetIds: string[];
  techLevels: PlayerTech;
  researchProgress: PlayerTech; // Accumulated RP toward next level
  selectedResearchField: 'Energy' | 'Kinetics' | 'Propulsion' | 'Construction';
}

export interface AIPlayer extends Player {
  brain: {
    personality: 'expansionist' | 'militarist';
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export interface Star {
  id: string;
  name: string;
  position: { x: number; y: number };
  planets: Planet[];
}

export interface Planet {
  id: string;
  name: string;
  starId: string;
  temperature: number;
  atmosphere: number;
  mineralConcentrations: { ironium: number; boranium: number; germanium: number };
  surfaceMinerals: { ironium: number; boranium: number; germanium: number };
  ownerId: string | null;
  population: number;
  maxPopulation: number;
  mines: number;
  factories: number;
  defenses: number;
  research: number;
  scanner: number;
  terraformOffset: { temperature: number; atmosphere: number };
  resources: number;
  buildQueue?: BuildItem[];
  governor?: PlanetGovernor;
}

export interface Species {
  id: string;
  name: string;
  habitat: {
    idealTemperature: number;
    idealAtmosphere: number;
    toleranceRadius: number;
  };
  traits: Array<
    | { type: 'growth'; modifier: number }
    | { type: 'mining'; modifier: number }
    | { type: 'research'; modifier: number }
    | { type: 'shipCost'; modifier: number }
  >;
}

export interface ShipStack {
  designId: string;
  count: number;
  damage: number;
}

export type FleetOrder =
  | { type: 'move'; destination: { x: number; y: number } }
  | { type: 'colonize'; planetId: string }
  | { type: 'attack'; targetFleetId: string };

export type Fleet = {
  id: string;
  name: string;
  ownerId: string;
  location: { type: 'orbit'; planetId: string } | { type: 'space'; x: number; y: number };
  ships: ShipStack[];
  fuel: number;
  cargo: {
    resources: number;
    minerals: { ironium: number; boranium: number; germanium: number };
    colonists: number;
  };
  orders: FleetOrder[];
};

export interface PlayerEconomy {
  freighterCapacity: number;
  research: number;
}

export type BuildProject = 'mine' | 'factory' | 'defense' | 'research' | 'terraform' | 'scanner' | 'ship';
export interface BuildItem {
  project: BuildProject;
  cost: { resources: number; ironium?: number; boranium?: number; germanium?: number };
  paid?: { resources: number; ironium: number; boranium: number; germanium: number };
  shipDesignId?: string;
  isAuto?: boolean;
  count?: number;
}

export type GovernorType = 'balanced' | 'mining' | 'industrial' | 'military' | 'research' | 'manual';
export interface PlanetGovernor {
  type: GovernorType;
  shipDesignId?: string;
  buildLimit?: number;
}
