// ==========================================
// Stars! Tech Atlas - Type Definitions
// Based on official Stars! hull-templates.json
// ==========================================

export interface ResourceCost {
  Ironium: number;
  Boranium: number;
  Germanium: number;
  Resources: number;
}

export interface ShipStats {
  Mass: number;
  'Max Fuel': number;
  Armor: number;
  Cargo: number;
  Initiative: number;
  GenFuel?: number;
  Heal?: number;
  MineEfficiency?: number;
  DockCapacity?: number | 'Unlimited';
  CanBuildShips?: boolean;
}

export interface SlotDefinition {
  Code: string;
  Allowed: string[];
  Max?: number;
  Required?: boolean;
  Editable?: boolean;
  Size?: number | 'Unlimited';
}

export interface HullTemplate {
  // Official hull-templates.json structure
  Name: string;
  Structure: string[];
  Slots: SlotDefinition[];
  Cost: ResourceCost;
  Stats: ShipStats;

  // Additional metadata for game engine
  id?: string;
  role?: string;
  techReq?: TechRequirement;
  img?: string;
  description?: string;
  note?: string;
}

// Compatibility alias for legacy code
export type HullStats = HullTemplate;

// ==========================================
// Component System Types
// ==========================================

export interface TechRequirement {
  Energy?: number;
  Kinetics?: number;
  Propulsion?: number;
  Construction?: number;
  Electronics?: number;
  Biotechnology?: number;
}

export interface ComponentCost {
  iron: number;
  bor: number;
  germ: number;
  res: number;
}

export type SlotType =
  | 'Engine'
  | 'Scanner'
  | 'Shield'
  | 'Armor'
  | 'Weapon'
  | 'Bomb'
  | 'Mining'
  | 'Mechanical'
  | 'Electrical'
  | 'Computer'
  | 'Cloak'
  | 'Cargo'
  | 'General';

export interface ComponentStats {
  id: string;
  name: string;
  type: SlotType;
  tech: TechRequirement;
  mass: number;
  cost: ComponentCost;
  stats: {
    power?: number;
    range?: number;
    accuracy?: number;
    initiative?: number;
    shield?: number;
    armor?: number;
    warp?: number;
    fuelEff?: number;
    kill?: number;
    struct?: number;
    scan?: number;
    pen?: number;
    mining?: number;
    fuelGen?: number;
    cap?: number;
    jamming?: number;
    cloak?: number;
    terraform?: number;
  };
  img: string;
  description: string;
}

export interface ComponentCategory {
  category: string;
  items: ComponentStats[];
}
