import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../../models/game.model';

export type StarbaseUpgradeInfo = {
  scrapCredit: { resources: number; ironium: number; boranium: number; germanium: number };
  existingStarbaseIndex: number;
  existingFleet: any;
};

@Injectable({ providedIn: 'root' })
export class StarbaseUpgradeService {

  /**
   * Handle starbase upgrade logic and calculate scrap credit.
   */
  handleStarbaseUpgrade(game: GameState, planet: Planet, item: BuildItem): StarbaseUpgradeInfo {
    if (!this.isStarbaseProject(game, item)) {
      return this.createEmptyUpgradeInfo();
    }

    return this.findExistingStarbase(game, planet);
  }

  /**
   * Check if the build item is a starbase project.
   */
  private isStarbaseProject(game: GameState, item: BuildItem): boolean {
    if (item.project !== 'ship') return false;
    
    const design = game.shipDesigns.find((d) => d.id === item.shipDesignId);
    return Boolean(design?.spec?.isStarbase);
  }

  /**
   * Create empty starbase upgrade info.
   */
  private createEmptyUpgradeInfo(): StarbaseUpgradeInfo {
    return {
      scrapCredit: { resources: 0, ironium: 0, boranium: 0, germanium: 0 },
      existingStarbaseIndex: -1,
      existingFleet: null
    };
  }

  /**
   * Find existing starbase in orbit and calculate scrap credit.
   */
  private findExistingStarbase(game: GameState, planet: Planet): StarbaseUpgradeInfo {
    const orbitFleets = this.getOrbitFleets(game, planet);
    
    for (const fleet of orbitFleets) {
      const starbaseIndex = this.findStarbaseInFleet(game, fleet);
      if (starbaseIndex >= 0) {
        const scrapCredit = this.calculateScrapCredit(game, fleet, starbaseIndex);
        return { scrapCredit, existingStarbaseIndex: starbaseIndex, existingFleet: fleet };
      }
    }
    
    return this.createEmptyUpgradeInfo();
  }

  /**
   * Get fleets orbiting the planet.
   */
  private getOrbitFleets(game: GameState, planet: Planet) {
    return game.fleets.filter(
      (f) =>
        f.ownerId === planet.ownerId &&
        f.location.type === 'orbit' &&
        (f.location as any).planetId === planet.id,
    );
  }

  /**
   * Find starbase ship in fleet.
   */
  private findStarbaseInFleet(game: GameState, fleet: any): number {
    return fleet.ships.findIndex((s: any) => {
      const d = game.shipDesigns.find((sd) => sd.id === s.designId);
      return d?.spec?.isStarbase;
    });
  }

  /**
   * Calculate scrap credit from old starbase.
   */
  private calculateScrapCredit(game: GameState, fleet: any, starbaseIndex: number) {
    const scrapCredit = { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
    const oldDesign = game.shipDesigns.find((d) => d.id === fleet.ships[starbaseIndex].designId);
    
    if (oldDesign?.spec?.cost) {
      // 75% Mineral Recovery
      scrapCredit.ironium = Math.floor((oldDesign.spec.cost.ironium || 0) * 0.75);
      scrapCredit.boranium = Math.floor((oldDesign.spec.cost.boranium || 0) * 0.75);
      scrapCredit.germanium = Math.floor((oldDesign.spec.cost.germanium || 0) * 0.75);
    }
    
    return scrapCredit;
  }

  /**
   * Remove an old starbase when upgrading.
   */
  removeOldStarbase(game: GameState, existingFleet: any, existingStarbaseIndex: number): void {
    if (!existingFleet || existingStarbaseIndex < 0) return;

    existingFleet.ships.splice(existingStarbaseIndex, 1);
    if (existingFleet.ships.length === 0) {
      // If fleet is empty, remove it
      game.fleets = game.fleets.filter((f: any) => f.id !== existingFleet.id);
    }
  }
}