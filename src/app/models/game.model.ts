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
}

export interface PlayerTech {
  energy: number;
  weapons: number;
  propulsion: number;
  construction: number;
  electronics: number;
  biotechnology: number;
}

export interface Player {
  id: string;
  name: string;
  species: Species;
  ownedPlanetIds: string[];
  techLevels: PlayerTech;
  researchProgress: PlayerTech; // Accumulated RP toward next level
  selectedResearchField: 'energy' | 'weapons' | 'propulsion' | 'construction' | 'electronics' | 'biotechnology';
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
  mineralConcentrations: { iron: number; boranium: number; germanium: number };
  surfaceMinerals: { iron: number; boranium: number; germanium: number };
  ownerId: string | null;
  population: number;
  maxPopulation: number;
  mines: number;
  factories: number;
  defenses: number;
  research: number;
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
  ownerId: string;
  location: { type: 'orbit'; planetId: string } | { type: 'space'; x: number; y: number };
  ships: ShipStack[];
  fuel: number;
  cargo: {
    resources: number;
    minerals: { iron: number; boranium: number; germanium: number };
    colonists: number;
  };
  orders: FleetOrder[];
};

export interface PlayerEconomy {
  transferRange: number;
  freighterCapacity: number;
  research: number;
}

export type BuildProject =
  | 'mine'
  | 'factory'
  | 'defense'
  | 'research'
  | 'terraform'
  | 'ship';
export interface BuildItem {
  project: BuildProject;
  cost: { resources: number; iron?: number; boranium?: number; germanium?: number };
  shipDesignId?: string;
  isAuto?: boolean;
  count?: number;
}

export type GovernorType =
  | 'balanced'
  | 'mining'
  | 'industrial'
  | 'military'
  | 'shipyard'
  | 'manual';
export interface PlanetGovernor {
  type: GovernorType;
  shipDesignId?: string;
  buildLimit?: number;
}
