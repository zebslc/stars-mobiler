import { Injectable } from '@angular/core';
import * as techAtlas from '../shared/tech-atlas.json';

// Interfaces for tech-atlas.json structure
export interface TechAtlasHull {
    name: string;
    role: string;
    techReq: Partial<Record<string, number>>;
    mass: number;
    cost: number;
    slots: string[];
    img: string;
    special?: string;
}

export interface TechAtlasComponent {
    name: string;
    tech: Partial<Record<string, number>>;
    stats: Record<string, any>;
    img: string;
    type?: string;
}

export interface TechAtlasComponentCategory {
    category: string;
    items: TechAtlasComponent[];
}

export interface TechAtlasData {
    techStreams: string[];
    hulls: TechAtlasHull[];
    components: TechAtlasComponentCategory[];
}

@Injectable({
    providedIn: 'root'
})
export class TechService {
    private techAtlasData: TechAtlasData;

    constructor() {
        this.techAtlasData = techAtlas as any as TechAtlasData;
    }

    /**
     * Get all tech streams (Energy, Kinetics, Propulsion, Construction)
     */
    getTechStreams(): string[] {
        return this.techAtlasData.techStreams;
    }

    /**
     * Get all hulls from tech atlas
     */
    getHulls(): TechAtlasHull[] {
        return this.techAtlasData.hulls;
    }

    /**
     * Get hull by name
     */
    getHullByName(name: string): TechAtlasHull | undefined {
        return this.techAtlasData.hulls.find(h => h.name === name);
    }

    /**
     * Get CSS class for hull image
     */
    getHullImageClass(hullName: string): string {
        const hull = this.getHullByName(hullName);
        return hull ? hull.img : '';
    }

    /**
     * Get all component categories
     */
    getComponentCategories(): TechAtlasComponentCategory[] {
        return this.techAtlasData.components;
    }

    /**
     * Get components by category (Engine, Scanner, Shield, Armor, Weapon)
     */
    getComponentsByCategory(category: string): TechAtlasComponent[] {
        const cat = this.techAtlasData.components.find(c => c.category === category);
        return cat ? cat.items : [];
    }

    /**
     * Get component by name
     */
    getComponentByName(name: string): TechAtlasComponent | undefined {
        for (const category of this.techAtlasData.components) {
            const component = category.items.find(item => item.name === name);
            if (component) {
                return component;
            }
        }
        return undefined;
    }

    /**
     * Get CSS class for component image
     */
    getComponentImageClass(componentName: string): string {
        const component = this.getComponentByName(componentName);
        return component ? component.img : '';
    }

    /**
     * Check if player meets tech requirements for a hull
     */
    meetsHullRequirements(hull: TechAtlasHull, playerTechLevels: Record<string, number>): boolean {
        for (const [techStream, requiredLevel] of Object.entries(hull.techReq)) {
            if (requiredLevel !== undefined && (playerTechLevels[techStream] || 0) < requiredLevel) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if player meets tech requirements for a component
     */
    meetsComponentRequirements(component: TechAtlasComponent, playerTechLevels: Record<string, number>): boolean {
        for (const [techStream, requiredLevel] of Object.entries(component.tech)) {
            if (requiredLevel !== undefined && (playerTechLevels[techStream] || 0) < requiredLevel) {
                return false;
            }
        }
        return true;
    }
}
