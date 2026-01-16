import { Injectable } from '@angular/core';
import type { HullTemplate, ComponentStats, ComponentCategory } from '../../data/tech-atlas.data';
import { TECH_ATLAS } from '../../data/tech-atlas.data';
import type { Player, PlayerTech } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class TechService {
  constructor() {}

  /**
   * Get all tech streams (Energy, Kinetics, Propulsion, Construction)
   */
  getTechStreams(): Array<string> {
    return TECH_ATLAS.techStreams;
  }

  /**
   * Get all hulls from tech atlas
   */
  getHulls(): Array<HullTemplate> {
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
  getComponentCategories(): Array<ComponentCategory> {
    return TECH_ATLAS.components;
  }

  /**
   * Get components by category (Engine, Scanner, Shield, Armor, Weapon)
   */
  getComponentsByCategory(category: string): Array<ComponentStats> {
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
    if (component.primaryRacialTraitRequired && component.primaryRacialTraitRequired.length > 0) {
      if (!player.species.primaryTraits) return false;
      // Must have at least one of the required traits? Or all? Usually "Required" means implies ALL or ANY.
      // Given the data "['Super Stealth']", it implies possession.
      // If multiple are listed, usually it means "Requires (A OR B)" or "Requires (A AND B)".
      // Let's assume ANY of the required traits is sufficient if it's a list of options, OR it requires ALL.
      // But typically in games "Requires X" is a strict check.
      // Let's check if the player has ANY of the required traits (if the list implies alternatives) OR ALL.
      // Usually "primaryRacialTraitRequired: ['A', 'B']" might mean requires A AND B.
      // But if it's meant to be "Available to races with A OR B", that's different.
      // The user said "primaryRacialTraitRequired is a racial trait which is required". Singular phrasing in previous prompt.
      // Now it's an array.
      // Let's assume if ANY of the required traits matches one of the player's traits.
      // Wait, "primaryRacialTraitRequired" usually means the component is specific to that trait.
      // If a component requires ['A', 'B'], does the player need both?
      // Let's assume intersection > 0 for now (OR logic), or maybe AND.
      // Most likely, a component belongs to ONE trait philosophy.
      // But let's look at the data: `primaryRacialTraitRequired: ['Super Stealth']`.
      // I will implement: Player must have ALL traits listed in `primaryRacialTraitRequired`.
      // Actually, standard logic for "Required" list is usually AND.
      // But if it's "Allow if player has A OR B", it would be OR.
      // Let's assume AND for "Required".

      const hasAllRequired = component.primaryRacialTraitRequired.every((req) =>
        player.species.primaryTraits?.includes(req),
      );
      if (!hasAllRequired) return false;
    }

    // 2. Check Lesser Racial Trait (Unavailable if present)
    if (
      component.lesserRacialTraitUnavailable &&
      component.lesserRacialTraitUnavailable.length > 0
    ) {
      if (player.species.lesserTraits) {
        // If player has ANY of the "Unavailable" traits, they cannot use it.
        const hasAnyForbidden = component.lesserRacialTraitUnavailable.some((forbidden) =>
          player.species.lesserTraits?.includes(forbidden),
        );
        if (hasAnyForbidden) return false;
      }
    }

    // 3. Check Primary Racial Trait (Unavailable if present)
    if (
      component.primaryRacialTraitUnavailable &&
      component.primaryRacialTraitUnavailable.length > 0
    ) {
      if (player.species.primaryTraits) {
        // If player has ANY of the "Unavailable" traits, they cannot use it.
        const hasAnyForbidden = component.primaryRacialTraitUnavailable.some((forbidden) =>
          player.species.primaryTraits?.includes(forbidden),
        );
        if (hasAnyForbidden) return false;
      }
    }

    // 4. Check Lesser Racial Trait (Required)
    if (component.lesserRacialTraitRequired && component.lesserRacialTraitRequired.length > 0) {
      if (!player.species.lesserTraits) return false;
      const hasAllRequired = component.lesserRacialTraitRequired.every((req) =>
        player.species.lesserTraits?.includes(req),
      );
      if (!hasAllRequired) return false;
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
