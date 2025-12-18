import { Injectable } from '@angular/core';
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

  getShipCost(designId: string): {
    resources: number;
    iron?: number;
    boranium?: number;
    germanium?: number;
  } {
    switch (designId) {
      case 'scout':
        return { resources: 20, iron: 5 };
      case 'frigate':
        return { resources: 40, iron: 10, boranium: 5 };
      case 'destroyer':
        return { resources: 60, iron: 15, boranium: 10, germanium: 5 };
      case 'freighter':
        return { resources: 35, iron: 8, boranium: 5, germanium: 3 };
      case 'super_freighter':
        return { resources: 60, iron: 15, boranium: 8, germanium: 6 };
      case 'tanker':
        return { resources: 30, iron: 6, boranium: 6, germanium: 2 };
      case 'settler':
        return { resources: 80, iron: 10, boranium: 10, germanium: 8 };
      case 'stardock':
        return { resources: 200, iron: 50, boranium: 30, germanium: 40 };
      default:
        return { resources: 25, iron: 5 };
    }
  }
}
