import { Injectable } from '@angular/core';
import { TECH_ATLAS } from '../data/tech-atlas.data';
import { GameState, ShipDesign } from '../models/game.model';

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

  getShipCost(design: ShipDesign): {
    resources: number;
    iron: number;
    boranium: number;
    germanium: number;
  } {
    const hull = TECH_ATLAS.hulls.find((h) => h.name === design.hullId);
    let totalCost = {
      resources: hull?.cost.res ?? 0,
      iron: hull?.cost.iron ?? 0,
      boranium: hull?.cost.bor ?? 0,
      germanium: hull?.cost.germ ?? 0,
    };

    for (const slot of design.slots) {
      for (const component of slot.components) {
        const allComponents = TECH_ATLAS.components.flatMap((c) => c.items);
        const componentData = allComponents.find((item) => item.name === component.componentId);

        if (componentData) {
          totalCost.resources += (componentData.cost.res ?? 0) * component.count;
          totalCost.iron += (componentData.cost.iron ?? 0) * component.count;
          totalCost.boranium += (componentData.cost.bor ?? 0) * component.count;
          totalCost.germanium += (componentData.cost.germ ?? 0) * component.count;
        }
      }
    }

    return totalCost;
  }
}
