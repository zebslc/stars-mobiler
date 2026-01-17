import { Injectable, inject } from '@angular/core';
import type { CompiledDesign } from '../../data/ships.data';
import { compileShipStats } from '../../models/ship-design.model';
import type { CompiledShipStats, GameState, PlayerTech, ShipDesign } from '../../models/game.model';
import { DataAccessService } from '../data/data-access.service';
import { ShipDesignRegistry } from '../data/ship-design-registry.service';

const DEFAULT_TECH_LEVELS: PlayerTech = {
  Energy: 0,
  Kinetics: 0,
  Propulsion: 0,
  Construction: 0,
};

@Injectable({ providedIn: 'root' })
export class ShipDesignResolverService {
  private readonly dataAccess = inject(DataAccessService);
  private readonly shipDesignRegistry = inject(ShipDesignRegistry);

  /**
   * Resolve a ship design from game state or static data
   * @param designId Design ID to resolve
   * @param gameState Game state containing dynamic designs. If not provided, only static designs can be resolved.
   * @returns Compiled design or null if not found
   */
  resolve(designId: string, gameState?: GameState | null): CompiledDesign | null {
    // Check dynamic designs in game state first
    if (gameState) {
      const dynamicDesign = gameState.shipDesigns.find((d) => d.id === designId);
      if (dynamicDesign) {
        const compiledStats = dynamicDesign.spec ?? this.compileDynamicDesign(dynamicDesign, gameState);
        if (compiledStats) {
          return this.toCompiledDesign(designId, dynamicDesign, compiledStats);
        }
      }
    }

    // Fall back to static designs
    return this.shipDesignRegistry.getDesign(designId) ?? null;
  }

  private compileDynamicDesign(design: ShipDesign, gameState: GameState): CompiledShipStats | null {
    const hull = this.dataAccess.getHull(design.hullId);
    if (!hull) return null;

    const player = gameState.humanPlayer;
    const techLevels = player?.techLevels ?? DEFAULT_TECH_LEVELS;
    return compileShipStats(hull, design.slots, techLevels, this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup());
  }

  private toCompiledDesign(
    designId: string,
    design: ShipDesign,
    stats: CompiledShipStats,
  ): CompiledDesign {
    const hull = this.dataAccess.getHull(design.hullId);

    return {
      id: designId,
      name: design.name,
      image: hull?.id ?? design.hullId,
      hullId: design.hullId,
      hullName: hull?.Name ?? design.name,
      isStarbase: stats.isStarbase,
      type: hull?.type,
      mass: stats.mass,
      cargoCapacity: stats.cargoCapacity,
      fuelCapacity: stats.fuelCapacity,
      fuelEfficiency: stats.fuelEfficiency ?? 100,
      warpSpeed: stats.warpSpeed,
      idealWarp: stats.idealWarp,
      armor: stats.armor,
      shields: stats.shields,
      initiative: stats.initiative,
      firepower: stats.firepower,
      colonistCapacity: stats.colonistCapacity,
      cost: stats.cost,
      colonyModule: stats.hasColonyModule,
      scannerRange: stats.scanRange,
      cloakedRange: stats.penScanRange,
      components: stats.components ?? [],
    };
  }
}

