import { Injectable, computed, signal } from '@angular/core';

/**
 * Cost interface for build items
 */
export interface Cost {
  resources: number;
  ironium?: number;
  boranium?: number;
  germanium?: number;
}

/**
 * BuildCostsRegistry Service
 * 
 * Provides signal-based reactive access to all build costs.
 * Maintains O(1) lookup performance via computed indices.
 * Replaces the old costs.data.ts barrel export with an injectable service.
 * 
 * Usage:
 *   constructor(private costs = inject(BuildCostsRegistry)) {}
 *   
 *   readonly mineCharge = computed(() => this.costs.getCost('mine'));
 */
@Injectable({ providedIn: 'root' })
export class BuildCostsRegistry {
  // Default build costs - matches original costs.data.ts
  private static readonly DEFAULTS: Record<string, Cost> = {
    mine: { resources: 5 },
    factory: { resources: 10, germanium: 4 },
    defense: { resources: 15, ironium: 2, boranium: 2 },
    research: { resources: 10 },
    terraform: { resources: 25, germanium: 5 },
    scanner: { resources: 50, ironium: 5, germanium: 10 },
  };

  // Private signal for costs (allows for future runtime updates)
  private readonly _costs = signal<Record<string, Cost>>(
    structuredClone(BuildCostsRegistry.DEFAULTS)
  );

  // Public computed signal for reactive access
  readonly costs = computed(() => this._costs());

  // Precomputed count
  readonly costCount = computed(() => Object.keys(this._costs()).length);

  constructor() {
    // Service initialized with default costs
  }

  /**
   * Get the cost for a build item
   * Returns a copy to prevent mutations
   */
  getCost(itemId: string): Cost | undefined {
    if (!itemId) return undefined;
    
    const cost = this._costs()[itemId];
    if (!cost) return undefined;
    
    // Return a copy to prevent external mutations
    return structuredClone(cost);
  }

  /**
   * Get all costs
   */
  getAllCosts(): Record<string, Cost> {
    return structuredClone(this._costs());
  }

  /**
   * Check if a cost is defined
   */
  hasCost(itemId: string): boolean {
    return itemId in this._costs();
  }

  /**
   * Register a new cost or update existing
   */
  setCost(itemId: string, cost: Cost): void {
    if (!itemId || !cost) return;

    this._costs.update(costs => ({
      ...costs,
      [itemId]: structuredClone(cost),
    }));
  }

  /**
   * Register multiple costs at once
   */
  setMultipleCosts(costsToAdd: Record<string, Cost>): void {
    this._costs.update(costs => ({
      ...costs,
      ...Object.fromEntries(
        Object.entries(costsToAdd).map(([id, cost]) => [id, structuredClone(cost)])
      ),
    }));
  }

  /**
   * Remove a cost entry
   */
  removeCost(itemId: string): void {
    if (!itemId) return;

    this._costs.update(costs => {
      const updated = { ...costs };
      delete updated[itemId];
      return updated;
    });
  }

  /**
   * Reset to default costs
   */
  reset(): void {
    this._costs.set(structuredClone(BuildCostsRegistry.DEFAULTS));
  }

  /**
   * Calculate total cost for multiple items
   */
  calculateTotalCost(items: Array<{ id: string; quantity: number }>): Cost {
    const total: Cost = {
      resources: 0,
      ironium: 0,
      boranium: 0,
      germanium: 0,
    };

    for (const item of items) {
      const cost = this.getCost(item.id);
      if (!cost) continue;

      total.resources += (cost.resources ?? 0) * item.quantity;
      total.ironium = (total.ironium ?? 0) + ((cost.ironium ?? 0) * item.quantity);
      total.boranium = (total.boranium ?? 0) + ((cost.boranium ?? 0) * item.quantity);
      total.germanium = (total.germanium ?? 0) + ((cost.germanium ?? 0) * item.quantity);
    }

    return total;
  }
}
