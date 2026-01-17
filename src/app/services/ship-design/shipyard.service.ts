import { Injectable, inject } from '@angular/core';
import type { GameState, ShipDesign, PlayerTech, Star, Player, CompiledShipStats } from '../../models/game.model';
import { miniaturizeComponent } from '../../utils/miniaturization.util';
import type { ShipOption } from '../../components/ship-selector.component';
import { DataAccessService } from '../data/data-access.service';
import { HullTemplate } from '../../data/tech-atlas.types';
import { compileShipStats } from '../../models/ship-design.model';
import type { CompiledDesign } from '../../services/data/ship-design-registry.service';
import { ShipDesignRegistry } from '../../services/data/ship-design-registry.service';
import { LoggingService } from '../core/logging.service';

@Injectable({ providedIn: 'root' })
export class ShipyardService {
  private readonly logging = inject(LoggingService);
  private readonly dataAccess = inject(DataAccessService);
  private readonly shipRegistry = inject(ShipDesignRegistry);
  
  constructor() {}

  saveShipDesign(game: GameState, design: ShipDesign): GameState {
    const existingIndex = game.shipDesigns.findIndex((d) => d.id === design.id);
    let nextDesigns: Array<ShipDesign>;
    let persistedDesign: ShipDesign;

    // Compile design stats to determine if it's valid
    const hull = this.dataAccess.getHull(design.hullId);
    const compiledStats = hull ? compileShipStats(hull, design.slots, this.getTechLevelsForPlayer(game, design.playerId), this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup()) : null;
    
    // Set isValid based on compiled stats
    const designWithValidity: ShipDesign = {
      ...design,
      spec: compiledStats ?? undefined,
      isValid: compiledStats?.isValid ?? false,
    };

    if (existingIndex >= 0) {
      nextDesigns = [...game.shipDesigns];
      persistedDesign = { ...designWithValidity };
      nextDesigns[existingIndex] = persistedDesign;
    } else {
      persistedDesign = { ...designWithValidity };
      nextDesigns = [...game.shipDesigns, persistedDesign];
    }

    this.cacheCompiledDesign(game, persistedDesign);

    return {
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
  }

  deleteShipDesign(game: GameState, designId: string): GameState {
    if (this.isDynamicDesign(designId)) {
      this.shipRegistry.unregister(designId);
    }

    const nextDesigns = game.shipDesigns.filter((d) => d.id !== designId);

    return {
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
  }

  getPlayerShipDesigns(game: GameState): Array<ShipDesign> {
    if (!game) return [];
    return game.shipDesigns.filter((d) => d.playerId === game.humanPlayer.id);
  }

  getShipCost(
    design: ShipDesign,
    playerTech?: PlayerTech,
  ): {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
  } {
    const hull = this.dataAccess.getHull(design.hullId);
    let totalCost = {
      resources: hull?.Cost.Resources ?? 0,
      ironium: hull?.Cost.Ironium ?? 0,
      boranium: hull?.Cost.Boranium ?? 0,
      germanium: hull?.Cost.Germanium ?? 0,
    };

    const techLevels = playerTech || {
      Energy: 0,
      Kinetics: 0,
      Propulsion: 0,
      Construction: 0,
    };

    for (const slot of design.slots) {
      for (const component of slot.components) {
        const componentData = this.dataAccess.getComponent(component.componentId);

        if (componentData) {
          const primaryField = this.dataAccess.getPrimaryTechField(componentData);
          const requiredLevel = this.dataAccess.getRequiredTechLevel(componentData);
          const miniComp = miniaturizeComponent(componentData, techLevels, primaryField, requiredLevel);
          totalCost.resources += (miniComp.cost.resources ?? 0) * component.count;
          totalCost.ironium += (miniComp.cost.ironium ?? 0) * component.count;
          totalCost.boranium += (miniComp.cost.boranium ?? 0) * component.count;
          totalCost.germanium += (miniComp.cost.germanium ?? 0) * component.count;
        }
      }
    }

    return totalCost;
  }

  getAvailableShipOptions(planet: Star, player: Player, game: GameState): Array<ShipOption> {
    if (!player || !game) return [];

    const userDesigns = this.getPlayerShipDesigns(game);
    const techLevels = player.techLevels;

    // Calculate existing ship counts
    const shipCounts = new Map<string, number>();
    if (game.fleets) {
      for (const fleet of game.fleets) {
        for (const stack of fleet.ships) {
          const current = shipCounts.get(stack.designId) || 0;
          shipCounts.set(stack.designId, current + stack.count);
        }
      }
    }

    const userOptions = userDesigns
      .map((design) => {
        const hull = this.dataAccess.getHull(design.hullId);
        if (!hull) return null;

        const stats = compileShipStats(
          hull,
          design.slots,
          techLevels,
          this.dataAccess.getComponentsLookup(),
          this.dataAccess.getTechFieldLookup(),
          this.dataAccess.getRequiredLevelLookup(),
        );
        const cost = this.getShipCost(design, techLevels);

        const compiled: CompiledDesign = {
          id: design.id,
          name: design.name,
          hullId: design.hullId,
          hullName: hull.Name,
          mass: stats.mass,
          cargoCapacity: stats.cargoCapacity,
          fuelCapacity: stats.fuelCapacity,
          fuelEfficiency: 100, // Not in stats?
          warpSpeed: stats.warpSpeed,
          idealWarp: stats.idealWarp,
          armor: stats.armor,
          shields: stats.shields,
          initiative: stats.initiative,
          firepower: stats.firepower,
          colonistCapacity: stats.colonistCapacity,
          cost: {
            ironium: cost.ironium,
            boranium: cost.boranium,
            germanium: cost.germanium,
            resources: cost.resources,
          },
          colonyModule: stats.hasColonyModule,
          scannerRange: stats.scanRange,
          cloakedRange: stats.canDetectCloaked ? stats.scanRange : 0,
          components: [],
        };

        // Note: Registration happens during game load (hydrateCompiledDesignCache)
        // and on design save (cacheCompiledDesign), not during read operations

        // Determine ship type for badge
        let shipType: 'attack' | 'cargo' | 'support' | 'colony' = 'support';
        const hullNameLower = hull.Name.toLowerCase();
        if (hullNameLower.includes('colony')) shipType = 'colony';
        else if (hullNameLower.includes('freighter')) shipType = 'cargo';
        else if (
          hullNameLower.includes('destroyer') ||
          hullNameLower.includes('frigate') ||
          hullNameLower.includes('battleship') ||
          hullNameLower.includes('cruiser')
        )
          shipType = 'attack';

        const canAfford = planet
          ? planet.resources >= cost.resources &&
            planet.surfaceMinerals.ironium >= (cost.ironium ?? 0) &&
            planet.surfaceMinerals.boranium >= (cost.boranium ?? 0) &&
            planet.surfaceMinerals.germanium >= (cost.germanium ?? 0)
          : false;

        return {
          design: compiled,
          cost,
          shipType,
          canAfford,
          existingCount: shipCounts.get(design.id) || 0,
        } as ShipOption;
      })
      .filter((opt): opt is ShipOption => opt !== null);

    if (userOptions.length > 0) {
      return userOptions;
    }

    return [];
  }

  hydrateCompiledDesignCache(game: GameState): void {
    for (const design of game.shipDesigns) {
      this.cacheCompiledDesign(game, design);
    }
  }

  private cacheCompiledDesign(game: GameState, design: ShipDesign): void {
    if (!this.isDynamicDesign(design.id)) return;

    const compiled = this.toCompiledDesign(game, design);
    if (compiled) {
      this.shipRegistry.register(compiled);
      this.logging.debug('Registered compiled design', {
        service: 'ShipyardService',
        operation: 'cacheCompiledDesign',
        entityId: compiled.id,
        entityType: 'shipDesign',
        additionalData: {
          name: compiled.name,
          hasSpec: !!design.spec,
          warpSpeed: compiled.warpSpeed,
          mass: compiled.mass,
          fuelCapacity: compiled.fuelCapacity
        }
      });
    } else {
      this.logging.warn('Failed to compile design', {
        service: 'ShipyardService',
        operation: 'cacheCompiledDesign',
        entityId: design.id,
        entityType: 'shipDesign',
        additionalData: { name: design.name }
      });
    }
  }

  private toCompiledDesign(game: GameState, design: ShipDesign): CompiledDesign | null {
    const hull = this.dataAccess.getHull(design.hullId);
    const stats = design.spec ?? this.compileDesignStats(game, design, hull);
    if (!stats || !hull) {
      return null;
    }

    const engineId = this.extractEngineComponentId(design);

    return {
      id: design.id,
      name: design.name,
      image: hull.id,
      hullId: design.hullId,
      hullName: hull.Name,
      isStarbase: stats.isStarbase ?? Boolean(hull.isStarbase),
      type: hull.type,
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
      engine: engineId ? { id: engineId } : undefined,
      cost: {
        ironium: stats.cost.ironium ?? 0,
        boranium: stats.cost.boranium ?? 0,
        germanium: stats.cost.germanium ?? 0,
        resources: stats.cost.resources ?? 0,
      },
      colonyModule: stats.hasColonyModule,
      scannerRange: stats.scanRange,
      cloakedRange: stats.canDetectCloaked ? stats.scanRange : 0,
      components: (stats.components ?? []).map((component) => ({
        id: component.id,
        name: component.name,
        quantity: component.quantity,
      })),
    };
  }

  private compileDesignStats(
    game: GameState,
    design: ShipDesign,
    hull?: HullTemplate,
  ): CompiledShipStats | null {
    const resolvedHull = hull ?? this.dataAccess.getHull(design.hullId);
    if (!resolvedHull) {
      return null;
    }

    const owner = this.findDesignOwner(game, design.playerId);
    const techLevels = owner?.techLevels ?? this.createDefaultTechLevels();
    return compileShipStats(resolvedHull, design.slots, techLevels, this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup());
  }

  private findDesignOwner(game: GameState, playerId: string): Player | null {
    if (game.humanPlayer.id === playerId) {
      return game.humanPlayer;
    }
    return game.aiPlayers.find((candidate) => candidate.id === playerId) ?? null;
  }

  private getTechLevelsForPlayer(game: GameState, playerId: string): PlayerTech {
    const owner = this.findDesignOwner(game, playerId);
    return owner?.techLevels ?? this.createDefaultTechLevels();
  }

  private createDefaultTechLevels(): PlayerTech {
    return { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 };
  }

  private extractEngineComponentId(design: ShipDesign): string | undefined {
    for (const slot of design.slots) {
      for (const component of slot.components) {
        const data = this.dataAccess.getComponent(component.componentId);
        if (data?.type?.toLowerCase() === 'engine') {
          return component.componentId;
        }
      }
    }
    return undefined;
  }

  private isDynamicDesign(designId: string): boolean {
    // Match both design_ (user-created) and design- (initial/seed-based) formats
    return designId.startsWith('design_') || designId.startsWith('design-');
  }
}
