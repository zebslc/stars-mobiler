import { Injectable } from '@angular/core';
import { TECH_ATLAS, HullTemplate, ComponentStats, ComponentCategory } from '../data/tech-atlas.data';
import { Player, PlayerTech } from '../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class TechService {
  constructor() {}

  /**
   * Get all tech streams (Energy, Kinetics, Propulsion, Construction)
   */
  getTechStreams(): string[] {
    return TECH_ATLAS.techStreams;
  }

  /**
   * Get all hulls from tech atlas
   */
  getHulls(): HullTemplate[] {
    return TECH_ATLAS.hulls;
  }

  /**
   * Get hull by name
   */
  getHullByName(name: string): HullTemplate | undefined {
    return TECH_ATLAS.hulls.find((h) => h.Name === name);
  }

  /**
   * Get CSS class for hull image
   */
  getHullImageClass(hullName: string): string {
    const hull = this.getHullByName(hullName);
    return hull?.id ?? '';
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
    const cat = TECH_ATLAS.components.find((c) => c.category === category);
    return cat ? cat.items : [];
  }

  /**
   * Get component by name
   */
  getComponentByName(name: string): ComponentStats | undefined {
    for (const category of TECH_ATLAS.components) {
      const component = category.items.find((item) => item.name === name);
      if (component) {
        return component;
      }
    }
    return undefined;
  }

  /**
   * Get component by ID
   */
  getComponentById(id: string): ComponentStats | undefined {
    for (const category of TECH_ATLAS.components) {
      const component = category.items.find((item) => item.id === id);
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
    return component ? component.id || '' : '';
  }

  /**
   * Check if player meets tech requirements for a hull
   */
  meetsHullRequirements(
    hull: HullTemplate,
    playerTechLevels: PlayerTech | Record<string, number>,
  ): boolean {
    if (!hull.techReq) return true;
    for (const [techStream, requiredLevel] of Object.entries(hull.techReq)) {
      if (
        requiredLevel !== undefined &&
        ((playerTechLevels as any)[techStream] || 0) < Number(requiredLevel)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if player meets tech requirements for a component
   */
  meetsComponentRequirements(
    component: ComponentStats,
    playerTechLevels: PlayerTech | Record<string, number>,
  ): boolean {
    for (const [techStream, requiredLevel] of Object.entries(component.tech)) {
      if (
        requiredLevel !== undefined &&
        ((playerTechLevels as any)[techStream] || 0) < Number(requiredLevel)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if component is allowed by player traits (ignoring tech levels)
   */
  isComponentAllowedByTraits(component: ComponentStats, player: Player): boolean {
    // 1. Check Primary Racial Trait
    if (component.primaryRacialTraitRequired) {
      if (!player.species.primaryTraits?.includes(component.primaryRacialTraitRequired)) {
        return false;
      }
    }

    // 2. Check Lesser Racial Trait (Unavailable if present)
    if (component.lesserRacialTraitUnavailable) {
      if (player.species.lesserTraits?.includes(component.lesserRacialTraitUnavailable)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if component is available to player (tech levels + traits)
   */
  isComponentAvailable(component: ComponentStats, player: Player): boolean {
    // 1. Check Traits
    if (!this.isComponentAllowedByTraits(component, player)) {
      return false;
    }

    // 2. Check Tech Levels
    if (!this.meetsComponentRequirements(component, player.techLevels)) {
      return false;
    }

    return true;
  }
}
