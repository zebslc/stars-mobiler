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
  isStarbase?: boolean;
  type?: 'warship' | 'freighter' | 'scout' | 'colonizer' | 'miner' | 'starbase' | 'utility' | 'bomber' | 'mine-layer';
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
}

export interface ComponentCost {
  ironium: number;
  boranium: number;
  germanium: number;
  resources: number;
}

export type SlotType =
  | 'Engine'
  | 'Scanner'
  | 'Shield'
  | 'Armor'
  | 'Weapon'
  | 'Bomb'
  | 'Mine'
  | 'Mining'
  | 'Mechanical'
  | 'Electrical'
  | 'Computer'
  | 'Cloak'
  | 'Cargo'
  | 'Orbital'
  | 'Stargate'
  | 'MassDriver'
  | 'Planetary'
  | 'Terraforming'
  | 'Starbase'
  | 'General';

export type TraitType =
  | 'damage_dealer'
  | 'propulsion'
  | 'storage'
  | 'sensor'
  | 'cloak'
  | 'mining'
  | 'terraform'
  | 'repair'
  | 'bomb'
  | 'minesweeping'
  | 'settler';

export interface ComponentTrait {
  type: TraitType;
  properties: Record<string, number | string | boolean>;
  isMajor: boolean;
}

export type ValidationRuleType =
  | 'max_per_hull'
  | 'exclusive_to_hull_type'
  | 'requires_trait'
  | 'mutually_exclusive';

export interface ValidationRule {
  type: ValidationRuleType;
  params: unknown;
  errorMessage: string;
}

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
    maxWarp?: number;
    fuelUsage?: {
      warp1?: number;
      warp2?: number;
      warp3?: number;
      warp4?: number;
      warp5?: number;
      warp6?: number;
      warp7?: number;
      warp8?: number;
      warp9?: number;
      warp10?: number;
    };
    fuelEff?: number;
    kill?: number;
    struct?: number;
    scan?: number;
    pen?: number;
    mining?: number;
    mines?: number;
    fuelGen?: number;
    cap?: number;
    jamming?: number;
    cloak?: number;
    cloaking?: number;
    terraform?: number;
    gateRange?: number;
    gateMass?: number;
    driverSpeed?: number;
    driverCatch?: number;
    defense?: number;
    energyBonus?: number;
    energyGen?: number;
    dampening?: number;
    detection?: number;
    dockCapacity?: number;
  };
  img: string;
  description: string;
  isRamscoop?: boolean;
  categoryId?: string;
  traits?: ComponentTrait[];
  constraints?: ValidationRule[];
  metadata?: {
    icon: string;
    color?: string;
    description: string;
  };
}

export interface ComponentCategory {
  id?: string;
  name?: string;
  allowedSlots?: string[];
  displayOrder?: number;
  category: string;
  items: ComponentStats[];
}
