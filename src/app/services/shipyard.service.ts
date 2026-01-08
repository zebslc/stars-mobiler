import { Injectable } from '@angular/core';
import { TECH_ATLAS } from '../data/tech-atlas.data';
import { getComponent } from '../data/components.data';
import { GameState, ShipDesign, PlayerTech } from '../models/game.model';
import { miniaturizeComponent } from '../utils/miniaturization.util';

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
}
