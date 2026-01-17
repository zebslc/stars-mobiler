import { Injectable, computed, inject } from '@angular/core';
import type { ComponentStats, HullTemplate } from '../../data/tech-atlas.types';
import { TechAtlasService } from './tech-atlas.service';

/**
 * DataAccessService
 * 
 * Provides convenient access to tech data with optimized lookups.
 * Replaces utility functions from data-access.util.ts with an injectable service.
 * Uses TechAtlasService underneath for signal-based reactivity.
 * 
 * Usage:
 *   constructor(private data = inject(DataAccessService)) {}
 *   
 *   readonly component = computed(() => this.data.getComponent(componentId()));
 *   readonly hullStats = this.data.getRequiredTechLevel(component);
 */
@Injectable({ providedIn: 'root' })
export class DataAccessService {
  private readonly techAtlas = inject(TechAtlasService);

  // Precomputed component lookup for O(1) access
  private readonly _componentLookup = computed(() => {
    const lookup: Record<string, ComponentStats> = {};
    for (const component of this.techAtlas.getAllComponents()) {
      lookup[component.id] = component;
      // Add lowercase key for case-insensitive lookups
      const lowerKey = component.id.toLowerCase();
      if (!lookup[lowerKey]) {
        lookup[lowerKey] = component;
      }
    }
    return lookup;
  });

  // Precomputed hull lookup for O(1) access
  private readonly _hullLookup = computed(() => {
    const lookup: Record<string, HullTemplate> = {};
    for (const hull of this.techAtlas.getAllHulls()) {
      lookup[hull.id] = hull;
      // Add lowercase key
      const lowerKey = hull.id.toLowerCase();
      if (!lookup[lowerKey]) {
        lookup[lowerKey] = hull;
      }
      // Add normalized name key
      const nameKey = hull.Name.toLowerCase().replace(/\s+/g, '_');
      if (!lookup[nameKey]) {
        lookup[nameKey] = hull;
      }
    }
    return lookup;
  });

  /**
   * Get a component by ID
   * Supports case-insensitive and normalized lookups
   */
  getComponent(componentId: string): ComponentStats | undefined {
    return this.techAtlas.getComponent(componentId);
  }

  /**
   * Get all components as a flat array
   */
  getAllComponents(): Array<ComponentStats> {
    return Array.from(this.techAtlas.getAllComponents());
  }

  /**
   * Get all components as a lookup object for O(1) access
   * Returns a read-only snapshot of the computed lookup
   */
  getComponentsLookup(): Record<string, ComponentStats> {
    return this._componentLookup();
  }

  /**
   * Get a hull by ID
   * Supports ID match, name match, and normalized name match
   */
  getHull(hullId: string): HullTemplate | undefined {
    return this.techAtlas.getHull(hullId);
  }

  /**
   * Get all hulls
   */
  getAllHulls(): Array<HullTemplate> {
    return Array.from(this.techAtlas.getAllHulls());
  }

  /**
   * Get all hulls as a lookup object for O(1) access
   */
  getHullsLookup(): Record<string, HullTemplate> {
    return this._hullLookup();
  }

  /**
   * Get the required tech level for a component
   * Returns the highest tech level requirement across all fields
   */
  getRequiredTechLevel(component: ComponentStats): number {
    if (!component?.tech) return 0;
    const techLevels = Object.values(component.tech);
    return Math.max(...techLevels, 0);
  }

  /**
   * Get the primary tech field for a component
   * Returns the field with the highest requirement
   */
  getPrimaryTechField(component: ComponentStats): string {
    if (!component?.tech) return 'Construction';
    
    const techEntries = Object.entries(component.tech);
    if (techEntries.length === 0) return 'Construction';
    
    // Return the field with the highest requirement
    return techEntries.reduce((max, [field, level]) => 
      level > (component.tech[max as keyof typeof component.tech] || 0) ? field : max,
      techEntries[0][0]
    );
  }

  /**
   * Get all components for a specific slot type
   */
  getComponentsForSlot(slotType: string): Array<ComponentStats> {
    return this.techAtlas.getComponentsForSlot(slotType);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(categoryId: string): Array<ComponentStats> {
    return this.techAtlas.getComponentsByCategory(categoryId);
  }

  /**
   * Get hulls by type
   */
  getHullsByType(type: string): Array<HullTemplate> {
    return this.techAtlas.getHullsByType(type);
  }

  /**
   * Build a lookup map of component ID to primary tech field
   */
  getTechFieldLookup(): Record<string, string> {
    const lookup: Record<string, string> = {};
    for (const component of this.getAllComponents()) {
      lookup[component.id] = this.getPrimaryTechField(component);
    }
    return lookup;
  }

  /**
   * Build a lookup map of component ID to required tech level
   */
  getRequiredLevelLookup(): Record<string, number> {
    const lookup: Record<string, number> = {};
    for (const component of this.getAllComponents()) {
      lookup[component.id] = this.getRequiredTechLevel(component);
    }
    return lookup;
  }
}
