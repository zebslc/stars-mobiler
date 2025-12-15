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
}

export interface Player {
  id: string;
  name: string;
  species: Species;
  ownedPlanetIds: string[];
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
  terraformOffset: { temperature: number; atmosphere: number };
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

export type Fleet = {
  id: string;
  ownerId: string;
  location: { type: 'orbit'; planetId: string } | { type: 'space'; x: number; y: number };
};

