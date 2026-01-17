import { Injectable, computed, signal } from '@angular/core';
import type { HullTemplate, ComponentCategory, ComponentStats } from '../../data/tech-atlas.types';

// Direct imports from source data files
import { FREIGHTER_HULLS } from '../../data/hulls/freighters.data';
import { WARSHIP_HULLS } from '../../data/hulls/warships.data';
import { UTILITY_HULLS } from '../../data/hulls/utility.data';
import { STARBASE_HULLS } from '../../data/hulls/starbases.data';
import { ENGINE_COMPONENTS } from '../../data/techs/engines.data';
import { SCANNER_COMPONENTS } from '../../data/techs/scanners.data';
import { COMPUTER_COMPONENTS, CAPACITOR_COMPONENTS, CLOAKING_COMPONENTS } from '../../data/techs/electronics.data';
import { MECHANICAL_COMPONENTS } from '../../data/techs/mechanical.data';
import { WEAPON_COMPONENTS } from '../../data/techs/weapons.data';
import { BOMB_COMPONENTS } from '../../data/techs/bombs.data';
import { SHIELD_COMPONENTS, ARMOR_COMPONENTS } from '../../data/techs/defenses.data';
import { ORBITAL_COMPONENTS } from '../../data/techs/orbitals.data';
import { MINE_COMPONENTS } from '../../data/techs/mines.data';

// Assemble hull and component arrays locally
const ALL_HULLS_LOCAL: Array<HullTemplate> = [
  ...FREIGHTER_HULLS,
  ...WARSHIP_HULLS,
  ...UTILITY_HULLS,
  ...STARBASE_HULLS,
];

const ALL_COMPONENTS_LOCAL: Array<ComponentCategory> = [
  {
    id: 'engines',
    name: 'Engines',
    allowedSlots: ['Engine'],
    displayOrder: 1,
    category: 'Engines',
    items: ENGINE_COMPONENTS,
  },
  {
    id: 'scanners',
    name: 'Scanners',
    allowedSlots: ['Scanner'],
    displayOrder: 2,
    category: 'Scanners',
    items: SCANNER_COMPONENTS,
  },
  {
    id: 'computers',
    name: 'Computers',
    allowedSlots: ['Computer', 'Elect'],
    displayOrder: 3,
    category: 'Computers',
    items: COMPUTER_COMPONENTS,
  },
  {
    id: 'electrical',
    name: 'Electrical',
    allowedSlots: ['Electrical', 'Elect'],
    displayOrder: 4,
    category: 'Electrical',
    items: CAPACITOR_COMPONENTS,
  },
  {
    id: 'cloaking',
    name: 'Cloaking',
    allowedSlots: ['Cloak', 'Elect'],
    displayOrder: 5,
    category: 'Cloaking',
    items: CLOAKING_COMPONENTS,
  },
  {
    id: 'mechanical',
    name: 'Mechanical',
    allowedSlots: ['Mechanical', 'Mech'],
    displayOrder: 6,
    category: 'Mechanical',
    items: MECHANICAL_COMPONENTS,
  },
  {
    id: 'weapons',
    name: 'Weapons',
    allowedSlots: ['Weapon'],
    displayOrder: 7,
    category: 'Weapons',
    items: WEAPON_COMPONENTS,
  },
  {
    id: 'bombs',
    name: 'Bombs',
    allowedSlots: ['Bomb'],
    displayOrder: 8,
    category: 'Bombs',
    items: BOMB_COMPONENTS,
  },
  {
    id: 'shields',
    name: 'Shields',
    allowedSlots: ['Shield'],
    displayOrder: 9,
    category: 'Shields',
    items: SHIELD_COMPONENTS,
  },
  {
    id: 'armor',
    name: 'Armor',
    allowedSlots: ['Armor'],
    displayOrder: 10,
    category: 'Armor',
    items: ARMOR_COMPONENTS,
  },
  {
    id: 'orbital',
    name: 'Orbital',
    allowedSlots: ['Orbital'],
    displayOrder: 11,
    category: 'Orbital',
    items: ORBITAL_COMPONENTS,
  },
  {
    id: 'mines',
    name: 'Mines',
    allowedSlots: ['Mine'],
    displayOrder: 12,
    category: 'Mines',
    items: MINE_COMPONENTS,
  },
];

/**
 * TechAtlasService
 * 
 * Provides signal-based reactive access to all tech data (hulls and components).
 * Maintains precomputed indices for O(1) lookups.
 * Replaces bare exports from tech-atlas.data.ts with an injectable service.
 * 
 * Usage:
 *   constructor(private techAtlas = inject(TechAtlasService)) {}
 *   
 *   readonly hull = computed(() => this.techAtlas.getHull(hullId()));
 *   readonly component = computed(() => this.techAtlas.getComponent(componentId()));
 */
@Injectable({ providedIn: 'root' })
export class TechAtlasService {
  // Signal-based state (read-only to consumers)
  private readonly _hulls = signal<Array<HullTemplate>>(ALL_HULLS_LOCAL);
  private readonly _components = signal<Array<ComponentCategory>>(ALL_COMPONENTS_LOCAL);

  // Public computed signals for reactive access
  readonly hulls = computed(() => this._hulls());
  readonly components = computed(() => this._components());
  readonly hullCount = computed(() => this._hulls().length);
  readonly componentCount = computed(() => 
    this._components().reduce((sum, cat) => sum + cat.items.length, 0)
  );

  // Precomputed hull index for O(1) lookups by ID
  private readonly _hullIndex = computed(() => {
    const index = new Map<string, HullTemplate>();
    for (const hull of this._hulls()) {
      index.set(hull.id, hull);
      // Add lowercase version for case-insensitive lookups
      index.set(hull.id.toLowerCase(), hull);
      // Add hull name as alternate key
      const nameKey = hull.Name.toLowerCase().replace(/\s+/g, '_');
      if (!index.has(nameKey)) {
        index.set(nameKey, hull);
      }
    }
    return index;
  });

  // Precomputed component index for O(1) lookups by ID
  private readonly _componentIndex = computed(() => {
    const index = new Map<string, ComponentStats>();
    for (const category of this._components()) {
      for (const component of category.items) {
        index.set(component.id, component);
        // Add lowercase version
        index.set(component.id.toLowerCase(), component);
      }
    }
    return index;
  });

  // Flat component array (computed once)
  private readonly _allComponentsFlat = computed(() =>
    this._components().flatMap(category => category.items)
  );

  /**
   * Get a hull by ID
   * Supports case-insensitive lookup and name-based lookup
   * Returns undefined if not found
   */
  getHull(hullId: string): HullTemplate | undefined {
    if (!hullId) return undefined;
    
    // Try exact match first
    let hull = this._hullIndex().get(hullId);
    
    // Try case-insensitive
    if (!hull) {
      hull = this._hullIndex().get(hullId.toLowerCase());
    }
    
    // Try normalized name
    if (!hull) {
      const normalized = hullId.toLowerCase().replace(/[\s-]+/g, '_');
      hull = this._hullIndex().get(normalized);
    }
    
    return hull;
  }

  /**
   * Get all hulls (computed signal for reactivity)
   */
  getAllHulls(): ReadonlyArray<HullTemplate> {
    return this.hulls();
  }

  /**
   * Get hulls filtered by type
   */
  getHullsByType(type: string): Array<HullTemplate> {
    return this._hulls().filter(hull => hull.type === type);
  }

  /**
   * Get a component by ID
   * Supports case-insensitive lookup
   * Returns undefined if not found
   */
  getComponent(componentId: string): ComponentStats | undefined {
    if (!componentId) return undefined;
    
    // Try exact match first
    let component = this._componentIndex().get(componentId);
    
    // Try case-insensitive
    if (!component) {
      component = this._componentIndex().get(componentId.toLowerCase());
    }
    
    return component;
  }

  /**
   * Get all components as a flat array (computed for reactivity)
   */
  getAllComponents(): ReadonlyArray<ComponentStats> {
    return this._allComponentsFlat();
  }

  /**
   * Get a component category by ID
   */
  getComponentCategory(categoryId: string): ComponentCategory | undefined {
    return this._components().find(cat => cat.id === categoryId);
  }

  /**
   * Get all component categories
   */
  getAllComponentCategories(): ReadonlyArray<ComponentCategory> {
    return this.components();
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(categoryId: string): Array<ComponentStats> {
    const category = this.getComponentCategory(categoryId);
    return category?.items ?? [];
  }

  /**
   * Get components that fit in a specific slot type
   */
  getComponentsForSlot(slotType: string): Array<ComponentStats> {
    return this._allComponentsFlat().filter(component => {
      // Check if component belongs to any category that allows this slot
      const category = this._components().find(cat =>
        cat.items.some(item => item.id === component.id)
      );
      return category?.allowedSlots?.includes(slotType) ?? false;
    });
  }

  /**
   * Legacy compatibility - returns object with arrays (for backward compat)
   */
  getTechAtlas() {
    return {
      techStreams: ['Energy', 'Kinetics', 'Propulsion', 'Construction'] as const,
      hulls: this.getAllHulls(),
      components: this.getAllComponentCategories(),
    };
  }
}
