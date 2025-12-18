import { Injectable } from '@angular/core';
import { TECH_ATLAS, HullStats, ComponentStats, ComponentCategory } from '../data/tech-atlas.data';

@Injectable({
    providedIn: 'root'
})
export class TechService {
    
    constructor() {
    }

    /**
     * Get all tech streams (Energy, Kinetics, Propulsion, Construction)
     */
    getTechStreams(): string[] {
        return TECH_ATLAS.techStreams;
    }

    /**
     * Get all hulls from tech atlas
     */
    getHulls(): HullStats[] {
        return TECH_ATLAS.hulls;
    }

    /**
     * Get hull by name
     */
    getHullByName(name: string): HullStats | undefined {
        return TECH_ATLAS.hulls.find(h => h.name === name);
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
    getComponentCategories(): ComponentCategory[] {
        return TECH_ATLAS.components;
    }

    /**
     * Get components by category (Engine, Scanner, Shield, Armor, Weapon)
     */
    getComponentsByCategory(category: string): ComponentStats[] {
        const cat = TECH_ATLAS.components.find(c => c.category === category);
        return cat ? cat.items : [];
    }

    /**
     * Get component by name
     */
    getComponentByName(name: string): ComponentStats | undefined {
        for (const category of TECH_ATLAS.components) {
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
    meetsHullRequirements(hull: HullStats, playerTechLevels: Record<string, number>): boolean {
        for (const [techStream, requiredLevel] of Object.entries(hull.techReq)) {
            if (requiredLevel !== undefined && (playerTechLevels[techStream] || 0) < Number(requiredLevel)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if player meets tech requirements for a component
     */
    meetsComponentRequirements(component: ComponentStats, playerTechLevels: Record<string, number>): boolean {
        for (const [techStream, requiredLevel] of Object.entries(component.tech)) {
            if (requiredLevel !== undefined && (playerTechLevels[techStream] || 0) < Number(requiredLevel)) {
                return false;
            }
        }
        return true;
    }
}
