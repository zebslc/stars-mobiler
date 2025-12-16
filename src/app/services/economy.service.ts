import { Injectable } from '@angular/core';
import { Planet } from '../models/game.model';

export interface ProductionResult {
  resources: number;
  extraction: { iron: number; boranium: number; germanium: number };
  operableFactories: number;
  operableMines: number;
}

@Injectable({ providedIn: 'root' })
export class EconomyService {
  calculateProduction(planet: Planet): ProductionResult {
    const operableFactories = Math.min(planet.factories, Math.floor(planet.population / 10));
    const resources = operableFactories;
    const operableMines = Math.min(planet.mines, Math.floor(planet.population / 10));
    const extraction = {
      iron: operableMines * (planet.mineralConcentrations.iron / 100),
      boranium: operableMines * (planet.mineralConcentrations.boranium / 100),
      germanium: operableMines * (planet.mineralConcentrations.germanium / 100)
    };
    return { resources, extraction, operableFactories, operableMines };
  }

  applyMiningDepletion(planet: Planet, extraction: { iron: number; boranium: number; germanium: number }) {
    planet.surfaceMinerals.iron += Math.floor(extraction.iron);
    planet.surfaceMinerals.boranium += Math.floor(extraction.boranium);
    planet.surfaceMinerals.germanium += Math.floor(extraction.germanium);
    planet.mineralConcentrations.iron = Math.max(
      0,
      Math.round(planet.mineralConcentrations.iron - extraction.iron * 0.01)
    );
    planet.mineralConcentrations.boranium = Math.max(
      0,
      Math.round(planet.mineralConcentrations.boranium - extraction.boranium * 0.01)
    );
    planet.mineralConcentrations.germanium = Math.max(
      0,
      Math.round(planet.mineralConcentrations.germanium - extraction.germanium * 0.01)
    );
  }

  logisticGrowth(population: number, maxPop: number, rate: number): number {
    const growth = population * rate * (1 - population / maxPop);
    return Math.max(0, Math.floor(growth));
  }

  spend(planet: Planet, cost: { resources: number; iron?: number; boranium?: number; germanium?: number }): boolean {
    const iron = cost.iron ?? 0;
    const bo = cost.boranium ?? 0;
    const ge = cost.germanium ?? 0;
    if (
      planet.resources < cost.resources ||
      planet.surfaceMinerals.iron < iron ||
      planet.surfaceMinerals.boranium < bo ||
      planet.surfaceMinerals.germanium < ge
    ) {
      return false;
    }
    planet.resources -= cost.resources;
    planet.surfaceMinerals.iron -= iron;
    planet.surfaceMinerals.boranium -= bo;
    planet.surfaceMinerals.germanium -= ge;
    return true;
  }
}

