import { Injectable } from '@angular/core';
import { TECH_ATLAS } from '../data/tech-atlas.data';
import { getComponent, COMPONENTS } from '../data/components.data';
import { GameState, ShipDesign, PlayerTech, Planet, Player } from '../models/game.model';
import { miniaturizeComponent } from '../utils/miniaturization.util';
import { ShipOption } from '../components/ship-selector.component';
import { getHull } from '../data/hulls.data';
import { compileShipStats } from '../models/ship-design.model';
import { CompiledDesign } from '../data/ships.data';

@Injectable({ providedIn: 'root' })
export class ShipyardService {
  constructor() {}

  saveShipDesign(game: GameState, design: ShipDesign): GameState {
    const existingIndex = game.shipDesigns.findIndex((d) => d.id === design.id);
    let nextDesigns: ShipDesign[];

    if (existingIndex >= 0) {
      // Update existing design
      nextDesigns = [...game.shipDesigns];
      nextDesigns[existingIndex] = { ...design };
    } else {
      // Add new design
      nextDesigns = [...game.shipDesigns, { ...design }];
    }

    return {
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
  }

  deleteShipDesign(game: GameState, designId: string): GameState {
    const nextDesigns = game.shipDesigns.filter((d) => d.id !== designId);

    return {
      ...game,
      shipDesigns: nextDesigns,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
  }

  getPlayerShipDesigns(game: GameState): ShipDesign[] {
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
    const hull = TECH_ATLAS.hulls.find((h) => h.Name === design.hullId);
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
        const componentData = getComponent(component.componentId);

        if (componentData) {
          const miniComp = miniaturizeComponent(componentData, techLevels);
          totalCost.resources += (miniComp.cost.resources ?? 0) * component.count;
          totalCost.ironium += (miniComp.cost.ironium ?? 0) * component.count;
          totalCost.boranium += (miniComp.cost.boranium ?? 0) * component.count;
          totalCost.germanium += (miniComp.cost.germanium ?? 0) * component.count;
        }
      }
    }

    return totalCost;
  }

  getAvailableShipOptions(planet: Planet, player: Player, game: GameState): ShipOption[] {
    if (!player || !game) return [];

    const userDesigns = this.getPlayerShipDesigns(game);
    const techLevels = player.techLevels;
    const miniComps = Object.values(COMPONENTS).map((comp) =>
      miniaturizeComponent(comp, techLevels),
    );

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
        const hull = getHull(design.hullId);
        if (!hull) return null;

        const stats = compileShipStats(hull, design.slots, miniComps);
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
}
