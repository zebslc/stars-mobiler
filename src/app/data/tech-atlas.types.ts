// ==========================================
// Stars! Tech Atlas - Type Definitions
// Based on official Stars! hull-templates.json
// ==========================================

import { logInternalWarn } from '../services/core/internal-logger.service';

// ==========================================
// Racial Trait Types
// ==========================================

export type PrimaryRacialTrait =
  | 'Hyper Expansion'
  | 'Super Stealth'
  | 'War Monger'
  | 'Claim Adjuster'
  | 'Inner Strength'
  | 'Space Demolition'
  | 'Packet Physics'
  | 'Interstellar Traveler'
  | 'Alternate Reality'
  | 'Jack of All Trades';

export type LesserRacialTrait =
  | 'Improved Fuel Efficiency'
  | 'Total Terraforming'
  | 'Advanced Remote Mining'
  | 'Improved Starbases'
  | 'Generalized Research'
  | 'Ultimate Recycling'
  | 'Mineral Alchemy'
  | 'No Ramscoop Engines'
  | 'Cheap Engines'
  | 'Only Basic Remote Mining'
  | 'No Advanced Sensors'
  | 'Low Starting Population'
  | 'Bleeding Edge Technology'
  | 'Regenerating Shields';

// ==========================================
// Core Data Structures
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
  Allowed: Array<string>;
  Max?: number;
  Required?: boolean;
  Editable?: boolean;
  Size?: number | 'Unlimited';
}

export interface HullTemplate {
  // Official hull-templates.json structure
  Name: string;
  Structure: Array<string>;
  Slots: Array<SlotDefinition>;
  Cost: ResourceCost;
  Stats: ShipStats;

  // Additional metadata for game engine
  id: string;
  role?: string;
  techReq?: TechRequirement;
  description?: string;
  note?: string;
  isStarbase?: boolean;
  type?:
    | 'warship'
    | 'freighter'
    | 'scout'
    | 'colonizer'
    | 'miner'
    | 'starbase'
    | 'utility'
    | 'bomber'
    | 'mine-layer';
  primaryRacialTraitRequired?: Array<PrimaryRacialTrait>;
  primaryRacialTraitUnavailable?: Array<PrimaryRacialTrait>;
  lesserRacialTraitRequired?: Array<LesserRacialTrait>;
  lesserRacialTraitUnavailable?: Array<LesserRacialTrait>;
  requiresPrimaryRacialTrait?: Array<PrimaryRacialTrait>;
  notAvailableForRaceDisadvantage?: Array<string>;
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

// ==========================================
// Component Type Registry - Data-Driven System
// ==========================================

export interface ComponentTypeConfig {
  slotType: string;
  category: string;
  aliases?: Array<string>;
  description?: string;
}

export interface TraitTypeConfig {
  id: string;
  name: string;
  category: string;
  description?: string;
  isImplemented: boolean;
}

// Component Type Registry - Extensible configuration
export const COMPONENT_TYPE_REGISTRY: Record<string, ComponentTypeConfig> = {
  Engine: { slotType: 'Engine', category: 'Propulsion' },
  Scanner: { slotType: 'Scanner', category: 'Electronics', aliases: ['sensor'] },
  Shield: { slotType: 'Shield', category: 'Defense' },
  Armor: { slotType: 'Armor', category: 'Defense' },
  Weapon: { slotType: 'Weapon', category: 'Offense' },
  Bomb: { slotType: 'Bomb', category: 'Offense' },
  Mine: { slotType: 'Mine', category: 'Offense' },
  Mining: { slotType: 'Mining', category: 'Utility' },
  Mechanical: { slotType: 'Mechanical', category: 'Utility', aliases: ['mech'] },
  Electrical: {
    slotType: 'Electrical',
    category: 'Electronics',
    aliases: ['electronics', 'computer', 'elect'],
  },
  Computer: { slotType: 'Electrical', category: 'Electronics' },
  Cloak: { slotType: 'Cloak', category: 'Special' },
  Cargo: { slotType: 'Cargo', category: 'Utility' },
  Orbital: { slotType: 'Orbital', category: 'Special' },
  Stargate: { slotType: 'Stargate', category: 'Special' },
  MassDriver: { slotType: 'MassDriver', category: 'Special' },
  Planetary: { slotType: 'Planetary', category: 'Special' },
  Terraforming: { slotType: 'Terraforming', category: 'Utility' },
  Starbase: { slotType: 'Starbase', category: 'Special' },
  General: { slotType: 'General', category: 'General' },
};

// Trait Type Registry - Extensible configuration
export const TRAIT_TYPE_REGISTRY: Record<string, TraitTypeConfig> = {
  damage_dealer: {
    id: 'damage_dealer',
    name: 'Damage Dealer',
    category: 'Combat',
    isImplemented: true,
  },
  propulsion: { id: 'propulsion', name: 'Propulsion', category: 'Movement', isImplemented: true },
  storage: { id: 'storage', name: 'Storage', category: 'Utility', isImplemented: true },
  sensor: { id: 'sensor', name: 'Sensor', category: 'Detection', isImplemented: true },
  cloak: { id: 'cloak', name: 'Cloaking', category: 'Stealth', isImplemented: false },
  mining: { id: 'mining', name: 'Mining', category: 'Resource', isImplemented: true },
  terraform: { id: 'terraform', name: 'Terraforming', category: 'Planetary', isImplemented: true },
  repair: { id: 'repair', name: 'Repair', category: 'Utility', isImplemented: false },
  bomb: { id: 'bomb', name: 'Bombing', category: 'Combat', isImplemented: true },
  minesweeping: {
    id: 'minesweeping',
    name: 'Mine Sweeping',
    category: 'Combat',
    description: 'Ability to clear enemy minefields',
    isImplemented: false,
  },
  settler: { id: 'settler', name: 'Colonization', category: 'Expansion', isImplemented: true },
};

// Derived types for backward compatibility
export type SlotType = keyof typeof COMPONENT_TYPE_REGISTRY;
export type TraitType = keyof typeof TRAIT_TYPE_REGISTRY;

// ==========================================
// Registry Utility Functions
// ==========================================

/**
 * Get slot type for a component type, with alias support
 */
export function getSlotTypeForComponentType(componentType: string): SlotType {
  const normalizedType = componentType.toLowerCase();

  // Direct match
  const directMatch = Object.keys(COMPONENT_TYPE_REGISTRY).find(
    (key) => key.toLowerCase() === normalizedType,
  );
  if (directMatch) {
    return directMatch as SlotType;
  }

  // Check aliases
  const aliasMatch = Object.entries(COMPONENT_TYPE_REGISTRY).find(([_, config]) =>
    config.aliases?.some((alias) => alias.toLowerCase() === normalizedType),
  );
  if (aliasMatch) {
    return aliasMatch[0] as SlotType;
  }

  // Fallback to General
  logInternalWarn('Unknown component type encountered', { componentType }, 'TechAtlasRegistry');
  return 'General';
}

/**
 * Check if a trait type is implemented
 */
export function isTraitImplemented(traitType: TraitType): boolean {
  return TRAIT_TYPE_REGISTRY[traitType]?.isImplemented ?? false;
}

/**
 * Get all implemented trait types
 */
export function getImplementedTraitTypes(): Array<TraitType> {
  return Object.entries(TRAIT_TYPE_REGISTRY)
    .filter(([_, config]) => config.isImplemented)
    .map(([key, _]) => key as TraitType);
}

/**
 * Get all available slot types
 */
export function getAllSlotTypes(): Array<SlotType> {
  return Object.keys(COMPONENT_TYPE_REGISTRY) as Array<SlotType>;
}

/**
 * Validate component type exists in registry
 */
export function isValidComponentType(componentType: string): boolean {
  const normalizedType = componentType.toLowerCase();

  // Check direct match
  const hasDirectMatch = Object.keys(COMPONENT_TYPE_REGISTRY).some(
    (key) => key.toLowerCase() === normalizedType,
  );
  if (hasDirectMatch) return true;

  // Check aliases
  return Object.values(COMPONENT_TYPE_REGISTRY).some((config) =>
    config.aliases?.some((alias) => alias.toLowerCase() === normalizedType),
  );
}

/**
 * Check if a validation rule type is implemented
 */
export function isValidationRuleImplemented(ruleType: ValidationRuleType): boolean {
  return VALIDATION_RULE_REGISTRY[ruleType]?.isImplemented ?? false;
}

/**
 * Get all implemented validation rule types
 */
export function getImplementedValidationRuleTypes(): Array<ValidationRuleType> {
  return Object.entries(VALIDATION_RULE_REGISTRY)
    .filter(([_, config]) => config.isImplemented)
    .map(([key, _]) => key as ValidationRuleType);
}

export interface ComponentTrait {
  type: TraitType;
  properties: Record<string, number | string | boolean>;
  isMajor: boolean;
}

// Validation Rule Registry - Extensible configuration
export const VALIDATION_RULE_REGISTRY: Record<
  string,
  { name: string; description: string; isImplemented: boolean }
> = {
  max_per_hull: {
    name: 'Max Per Hull',
    description: 'Limits the maximum number of this component per hull',
    isImplemented: true,
  },
  exclusive_to_hull_type: {
    name: 'Exclusive to Hull Type',
    description: 'Component can only be used on specific hull types',
    isImplemented: true,
  },
  requires_trait: {
    name: 'Requires Trait',
    description: 'Component requires another component with specific trait',
    isImplemented: false,
  },
  mutually_exclusive: {
    name: 'Mutually Exclusive',
    description: 'Component cannot be used with certain other components',
    isImplemented: false,
  },
};

export type ValidationRuleType = keyof typeof VALIDATION_RULE_REGISTRY;

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
    planetScanDistance?: number;
    enemyFleetScanDistance?: number;
    cargoSteal?: boolean;
    unarmedCloak?: number;
    deflectedShieldDamageReduction?: number;
    noDefenceColonistKill?: number;
    stealth?: number;
    // Weapon-specific stats
    shieldOnlyDamage?: boolean;
    hitsAllTargets?: boolean;
    minesweeping?: number;
  };
  description: string;
  primaryRacialTraitRequired?: Array<PrimaryRacialTrait>;
  primaryRacialTraitUnavailable?: Array<PrimaryRacialTrait>;
  lesserRacialTraitRequired?: Array<LesserRacialTrait>;
  lesserRacialTraitUnavailable?: Array<LesserRacialTrait>;
  hullRestrictions?: Array<string>;
  isRamscoop?: boolean;
  categoryId?: string;
  traits?: Array<ComponentTrait>;
  constraints?: Array<ValidationRule>;
  metadata?: {
    icon: string;
    color?: string;
    description: string;
  };
}

export interface ComponentCategory {
  id?: string;
  name?: string;
  allowedSlots?: Array<string>;
  displayOrder?: number;
  category: string;
  items: Array<ComponentStats>;
}
