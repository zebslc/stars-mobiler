import { Injectable, computed, signal, inject } from '@angular/core';
import { logInternalWarn, logInternalInfo } from '../core/internal-logger.service';
import { TechAtlasService } from './tech-atlas.service';

/**
 * CompiledDesign represents a fully compiled ship design with calculated stats
 */
export interface CompiledDesign {
  id: string;
  name: string;
  image?: string;
  hullId: string;
  hullName: string;
  isStarbase?: boolean;
  type?: string;
  mass: number;
  cargoCapacity: number;
  fuelCapacity: number;
  fuelEfficiency: number;
  warpSpeed: number;
  idealWarp: number;
  armor: number;
  shields: number;
  initiative: number;
  firepower: number;
  colonistCapacity?: number;
  engine?: {
    id: string;
  };
  cost: {
    ironium: number;
    boranium: number;
    germanium: number;
    resources: number;
  };
  colonyModule: boolean;
  scannerRange: number;
  planetScanRange: number;
  cloakedRange: number;
  components: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

/**
 * ShipDesignRegistry Service
 * 
 * Provides signal-based reactive access to all ship designs (compiled and registered).
 * Maintains O(1) lookup performance via computed indices.
 * Replaces the old ships.data.ts barrel export with an injectable service.
 * 
 * Usage:
 *   constructor(private registry = inject(ShipDesignRegistry)) {}
 *   
 *   readonly myDesign = computed(() => {
 *     const id = this.selectedDesignId();
 *     return this.registry.getDesign(id);
 *   });
 */
@Injectable({ providedIn: 'root' })
export class ShipDesignRegistry {
  private readonly techAtlas = inject(TechAtlasService);

  // Private signals for state management
  private readonly _designs = signal<Record<string, CompiledDesign>>(
    this._createBasicDesigns()
  );

  // Public read-only signals for reactive access
  readonly designs = computed(() => this._designs());
  readonly designCount = computed(() => Object.keys(this._designs()).length);

  // Precomputed indices for O(1) lookups
  private readonly _designIndex = computed(() => {
    const designs = this._designs();
    const index = new Map<string, CompiledDesign>();
    
    for (const [id, design] of Object.entries(designs)) {
      index.set(id, design);
      // Add lowercase version for case-insensitive lookups
      const lowerKey = id.toLowerCase();
      if (!index.has(lowerKey)) {
        index.set(lowerKey, design);
      }
    }
    
    return index;
  });

  constructor() {
    // Initialize with basic designs on service creation
    logInternalInfo('ShipDesignRegistry initialized', {
      designCount: this.designCount(),
    }, 'ShipDesignRegistry');
  }

  /**
   * Get a design by ID, with fallback logic for various naming conventions
   * Returns a default design if not found (prevents crashes)
   */
  getDesign(designId: string): CompiledDesign {
    if (!designId) {
      return this._createDefaultDesign('unknown');
    }

    let design = this._designIndex().get(designId);

    if (!design) {
      // Try normalizing the ID
      const normalizedId = designId.toLowerCase().replace(/[\s-]+/g, '_');
      design = this._designIndex().get(normalizedId);

      // Fallback for legacy starbase IDs
      if (!design && normalizedId.startsWith('starbase')) {
        const match = normalizedId.match(/starbase_?(\d+)/);
        if (match) {
          const level = parseInt(match[1], 10);
          const starbaseMap: { [key: number]: string } = {
            1: 'orbital_fort',
            2: 'space_dock',
            3: 'space_station',
            4: 'ultra_station',
            5: 'death_star',
          };
          const mappedId = starbaseMap[level];
          if (mappedId) {
            design = this._designIndex().get(mappedId);
          }
        }
      }
    }

    if (!design) {
      // Only warn for legacy design IDs, not dynamic ones
      if (!designId.startsWith('design_') && !designId.startsWith('design-')) {
        logInternalWarn('Design not found in registry', { 
          designId,
          availableCount: this.designCount(),
        }, 'ShipDesignRegistry');
      }
      return this._createDefaultDesign(designId);
    }

    return design;
  }

  /**
   * Register a new design or update an existing one
   * Triggers reactivity for all consumers watching designs
   */
  register(design: CompiledDesign): void {
    if (!design?.id) {
      logInternalWarn('Attempted to register design with missing ID', { design }, 'ShipDesignRegistry');
      return;
    }

    this._designs.update(designs => ({
      ...designs,
      [design.id]: design,
    }));

    logInternalInfo('Design registered', {
      designId: design.id,
      totalDesigns: this.designCount(),
    }, 'ShipDesignRegistry');
  }

  /**
   * Unregister a design by ID
   */
  unregister(designId: string): void {
    if (!designId) return;

    this._designs.update(designs => {
      const updated = { ...designs };
      delete updated[designId];
      return updated;
    });
  }

  /**
   * Register multiple designs at once (more efficient than individual calls)
   */
  registerMultiple(designsToAdd: Array<CompiledDesign>): void {
    this._designs.update(designs => {
      const updated = { ...designs };
      for (const design of designsToAdd) {
        if (design?.id) {
          updated[design.id] = design;
        }
      }
      return updated;
    });

    logInternalInfo('Multiple designs registered', {
      count: designsToAdd.length,
      totalDesigns: this.designCount(),
    }, 'ShipDesignRegistry');
  }

  /**
   * Clear all registered designs and reinitialize with basics
   */
  reset(): void {
    this._designs.set(this._createBasicDesigns());
    logInternalInfo('Design registry reset', {
      designCount: this.designCount(),
    }, 'ShipDesignRegistry');
  }

  /**
   * Create basic designs from available hulls
   * This provides default designs for all game hulls
   */
  private _createBasicDesigns(): Record<string, CompiledDesign> {
    const designs: Record<string, CompiledDesign> = {};

    this.techAtlas.getAllHulls().forEach((hull) => {
      const normalizedName = hull.Name.toLowerCase().replace(/\s+/g, '_');
      const designId = hull.id || normalizedName;

      designs[designId] = {
        id: designId,
        name: hull.Name,
        image: hull.id,
        hullId: designId,
        hullName: hull.Name,
        isStarbase: hull.isStarbase,
        type: hull.type,
        mass: hull.Stats.Mass,
        cargoCapacity: hull.Stats.Cargo || 0,
        fuelCapacity: hull.Stats['Max Fuel'] || 0,
        fuelEfficiency: 100,
        warpSpeed: 6,
        idealWarp: 6,
        armor: hull.Stats.Armor || 0,
        shields: 0,
        initiative: hull.Stats.Initiative || 0,
        firepower: 0,
        colonistCapacity: hull.Name.toLowerCase().includes('colony') ? 25000 : undefined,
        engine: undefined,
        cost: {
          ironium: hull.Cost.Ironium,
          boranium: hull.Cost.Boranium,
          germanium: hull.Cost.Germanium,
          resources: hull.Cost.Resources,
        },
        colonyModule:
          hull.Name.toLowerCase().includes('colony') || hull.Name.toLowerCase().includes('settler'),
        scannerRange: 0,
        planetScanRange: 0,
        cloakedRange: 0,
        components: [],
      };

      // Add normalized alias
      if (designId !== normalizedName) {
        designs[normalizedName] = { ...designs[designId], id: normalizedName };
      }
    });

    // Add design aliases for backward compatibility
    if (designs['hull-scout']) {
      designs['scout'] = {
        ...designs['hull-scout'],
        id: 'scout',
        scannerRange: 50,
        components: [
          { id: 'scan_rhino', name: 'Rhino Scanner', quantity: 1 }
        ]
      };
    }

    // Colony ship aliases
    if (designs['hull-mini-colony']) {
      designs['mini_colony_ship'] = { ...designs['hull-mini-colony'], id: 'mini_colony_ship' };
      designs['mini_colony'] = { ...designs['hull-mini-colony'], id: 'mini_colony' };
    }
    if (designs['hull-colony']) {
      designs['colony_ship'] = { ...designs['hull-colony'], id: 'colony_ship' };
      designs['colony'] = { ...designs['hull-colony'], id: 'colony' };
    }

    // Starbase aliases
    if (designs['hull-orbital-fort']) {
      designs['orbital_fort'] = { ...designs['hull-orbital-fort'], id: 'orbital_fort' };
    }
    if (designs['hull-space-dock']) {
      designs['space_dock'] = { ...designs['hull-space-dock'], id: 'space_dock' };
    }
    if (designs['hull-space-station']) {
      designs['space_station'] = { ...designs['hull-space-station'], id: 'space_station' };
    }
    if (designs['hull-ultra-station']) {
      designs['ultra_station'] = { ...designs['hull-ultra-station'], id: 'ultra_station' };
    }
    if (designs['hull-death-star']) {
      designs['death_star'] = { ...designs['hull-death-star'], id: 'death_star' };
    }

    return designs;
  }

  /**
   * Create a default design to return when a design is not found
   * Prevents crashes and provides reasonable defaults
   */
  private _createDefaultDesign(designId: string): CompiledDesign {
    return {
      id: designId,
      name: 'Unknown Design',
      hullId: 'unknown',
      hullName: 'Unknown Hull',
      mass: 100,
      cargoCapacity: 0,
      fuelCapacity: 100,
      fuelEfficiency: 100,
      warpSpeed: 6,
      idealWarp: 6,
      armor: 25,
      shields: 0,
      initiative: 0,
      firepower: 0,
      cost: { ironium: 10, boranium: 0, germanium: 10, resources: 25 },
      colonyModule: false,
      scannerRange: 0,
      planetScanRange: 0,
      cloakedRange: 0,
      components: [],
      engine: undefined,
    };
  }
}
