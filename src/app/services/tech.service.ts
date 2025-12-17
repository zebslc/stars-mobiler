import { Injectable } from '@angular/core';
import * as techs from '@app/shared/techs.json';
import {
    Tech,
    TechHull,
    TechHullComponent,
    TechPlanetary,
    TechPlanetaryScanner,
    TechDefense,
    TechTerraform,
    TechCategory
} from '@app/models/tech.model';

@Injectable({
    providedIn: 'root'
})
export class TechService {
    private allTechs: Tech[] = [];
    private techsByCategory: Map<TechCategory, Tech[]> = new Map();

    constructor() {
        this.loadAllTechs();
    }

    private loadAllTechs() {
        const techData = techs as any;

        // Initialize the map
        for (const category of Object.values(TechCategory)) {
            this.techsByCategory.set(category, []);
        }

        const processTechArray = (techArray: { tech: Tech }[]) => {
            if (techArray) {
                for (const item of techArray) {
                    this.allTechs.push(item.tech);
                    const category = item.tech.category;
                    if (this.techsByCategory.has(category)) {
                        this.techsByCategory.get(category)!.push(item.tech);
                    }
                }
            }
        };

        processTechArray(techData.planetaryScanners);
        processTechArray(techData.terraforms);
        processTechArray(techData.defenses);
        processTechArray(techData.planetaries);
        processTechArray(techData.hulls);
        processTechArray(techData.hullComponents);
    }

    getAllTechs(): Tech[] {
        return this.allTechs;
    }

    getTechsByCategory(category: TechCategory): Tech[] {
        return this.techsByCategory.get(category) || [];
    }

    getTechByName(name: string): Tech | undefined {
        return this.allTechs.find(t => t.name === name);
    }

    getHullComponents(): TechHullComponent[] {
        return (techs as any).hullComponents;
    }

    getHulls(): TechHull[] {
        return (techs as any).hulls;
    }

    getPlanetaryScanners(): TechPlanetaryScanner[] {
        return (techs as any).planetaryScanners;
    }

    getDefenses(): TechDefense[] {
        return (techs as any).defenses;
    }

    getTerraforms(): TechTerraform[] {
        return (techs as any).terraforms;
    }

    getPlanetaries(): TechPlanetary[] {
        return (techs as any).planetaries;
    }
}
