export enum TechCategory {
    // Planetary
    PLANETARY_SCANNER = 'TECH_CATEGORY_PLANETARY_SCANNER',
    TERRAFORMING = 'TECH_CATEGORY_TERRAFORMING',
    PLANETARY_DEFENSE = 'TECH_CATEGORY_PLANETARY_DEFENSE',
    PLANETARY = 'TECH_CATEGORY_PLANETARY',

    // Hulls
    SHIP_HULL = 'TECH_CATEGORY_SHIP_HULL',
    STARBASE_HULL = 'TECH_CATEGORY_STARBASE_HULL',

    // Hull Components
    ENGINE = 'TECH_CATEGORY_ENGINE',
    SCANNER = 'TECH_CATEGORY_SCANNER',
    SHIELD = 'TECH_CATEGORY_SHIELD',
    ARMOR = 'TECH_CATEGORY_ARMOR',
    BEAM_WEAPON = 'TECH_CATEGORY_BEAM_WEAPON',
    TORPEDO = 'TECH_CATEGORY_TORPEDO',
    BOMB = 'TECH_CATEGORY_BOMB',
    ELECTRICAL = 'TECH_CATEGORY_ELECTRICAL',
    MECHANICAL = 'TECH_CATEGORY_MECHANICAL',
    MINING = 'TECH_CATEGORY_MINING',
    GENERAL = 'TECH_CATEGORY_GENERAL',
}

export type TechArea = 'energy' | 'weapons' | 'propulsion' | 'construction' | 'electronics' | 'biotechnology';

export interface Cost {
    ironium?: number;
    boranium?: number;
    germanium?: number;
    resources: number;
}

export interface TechRequirements {
    prtsDenied?: string[];
    prtsRequired?: string[];
    lrtsRequired?: number;
    lrtsDenied?: number;
    techLevel?: Partial<Record<TechArea, number>>;
    hullsAllowed?: string[];
    acquirable?: boolean;
}

export interface Tech {
    name: string;
    cost: Cost;
    requirements: TechRequirements;
    category: TechCategory;
    ranking?: number;
    tags?: Record<string, boolean>;
    origin?: string;
}

export interface TechHullComponent {
    tech: Tech;
    hullSlotType: number;
    mass: number;
    minefieldType?: string;
    idealSpeed?: number;
    freeSpeed?: number;
    maxSafeSpeed?: number;
    fuelUsage?: number[];
    power?: number;
    range?: number;
    damage?: number;
    salvo?: number;
    bonus?: number;
    initiative?: number;
    cloak?: number;
    scanner?: boolean;
    miningRate?: number;
    fuel?: number;
    colonists?: number;
    terraformRate?: number;
    habValue?: number;
    habType?: string;
}

export interface TechHull {
    tech: Tech;
    mass: number;
    armor: number;
    fuel: number;
    slots: string;
    cargo?: number;
    maneuver?: number;
    initiative?: number;
    stealth?: number;
    cloak?: number;
    scanner?: boolean;
    fighterBays?: number;
    heavyWeapon?: boolean;
    starbase?: boolean;
}

export interface TechPlanetary {
    tech: Tech;
    resetPlanet?: boolean;
}

export interface TechPlanetaryScanner {
    tech: Tech;
    scanRange: number;
    scanRangePen?: number;
}

export interface TechDefense {
    tech: Tech;
    defenseCoverage: number;
}

export interface TechTerraform {
    tech: Tech;
    ability: number;
    habType: string;
}
