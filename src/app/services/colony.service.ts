import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../models/game.model';
import { EconomyService } from './economy.service';
import { ShipyardService } from './shipyard.service';
import { FleetService } from './fleet.service';
import { PLANETARY_SCANNER_COMPONENTS } from '../data/techs/planetary.data';
import { BUILD_COSTS } from '../data/costs.data';

@Injectable({ providedIn: 'root' })
export class ColonyService {
  constructor(
    private economy: EconomyService,
    private shipyard: ShipyardService,
    private fleet: FleetService,
  ) {}

  /**
   * Build planet index for O(1) lookups.
   */
  private buildPlanetIndex(game: GameState): Map<string, Planet> {
    const index = new Map<string, Planet>();
    for (const star of game.stars) {
      for (const planet of star.planets) {
        index.set(planet.id, planet);
      }
    }
    return index;
  }

  addToBuildQueue(game: GameState, planetId: string, item: BuildItem): GameState {
    const planet = this.buildPlanetIndex(game).get(planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return game;

    // We don't spend resources here anymore. They are spent during turn processing.
    // Just add to queue.
    planet.buildQueue = [...(planet.buildQueue ?? []), item];

    // Update stars array reference to trigger signals
    return { ...game, stars: [...game.stars] };
  }

  processBuildQueues(game: GameState) {
    const allPlanets = game.stars.flatMap((s) => s.planets);
    for (const planet of allPlanets) {
      if (planet.ownerId !== game.humanPlayer.id) continue;

      let queue = planet.buildQueue ?? [];

      // Process items in queue until resources run out or queue is empty
      while (queue.length > 0) {
        const item = queue[0];
        if (!item.paid) {
          item.paid = { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
        }

        const totalCost = {
          resources: item.cost.resources ?? 0,
          ironium: item.cost.ironium ?? 0,
          boranium: item.cost.boranium ?? 0,
          germanium: item.cost.germanium ?? 0,
        };

        // Handle Starbase Upgrade Credit
        let scrapCredit = { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
        let existingStarbaseIndex = -1;
        let existingFleet = null;

        if (item.project === 'ship') {
          const design = game.shipDesigns.find((d) => d.id === item.shipDesignId);
          // Also check built-in designs if not found in user designs (e.g. for initial tests)
          const isStarbase = design?.spec?.isStarbase;

          if (isStarbase) {
            const orbitFleets = game.fleets.filter(
              (f) =>
                f.ownerId === planet.ownerId &&
                f.location.type === 'orbit' &&
                (f.location as any).planetId === planet.id,
            );
            for (const f of orbitFleets) {
              const idx = f.ships.findIndex((s) => {
                const d = game.shipDesigns.find((sd) => sd.id === s.designId);
                // Also check legacy/built-in designs if needed, but game.shipDesigns should have them if loaded correctly
                // Assuming game.shipDesigns contains all relevant designs or we have a way to check.
                // For safety, let's assume we might need to check the spec directly if available or infer.
                return d?.spec?.isStarbase;
              });
              if (idx >= 0) {
                existingStarbaseIndex = idx;
                existingFleet = f;
                const oldDesign = game.shipDesigns.find((d) => d.id === f.ships[idx].designId);
                if (oldDesign?.spec?.cost) {
                  // 75% Mineral Recovery
                  scrapCredit.ironium = Math.floor((oldDesign.spec.cost.ironium || 0) * 0.75);
                  scrapCredit.boranium = Math.floor((oldDesign.spec.cost.boranium || 0) * 0.75);
                  scrapCredit.germanium = Math.floor((oldDesign.spec.cost.germanium || 0) * 0.75);
                }
                break;
              }
            }
          }
        }

        // Calculate remaining needed (taking credit into account)
        const remaining = {
          resources: Math.max(0, totalCost.resources - item.paid.resources),
          ironium: Math.max(0, totalCost.ironium - item.paid.ironium - scrapCredit.ironium),
          boranium: Math.max(0, totalCost.boranium - item.paid.boranium - scrapCredit.boranium),
          germanium: Math.max(0, totalCost.germanium - item.paid.germanium - scrapCredit.germanium),
        };

        // Pay what we can
        const affordable = {
          resources: Math.min(remaining.resources, planet.resources),
          ironium: Math.min(remaining.ironium, planet.surfaceMinerals.ironium),
          boranium: Math.min(remaining.boranium, planet.surfaceMinerals.boranium),
          germanium: Math.min(remaining.germanium, planet.surfaceMinerals.germanium),
        };

        // Deduct from planet
        planet.resources -= affordable.resources;
        planet.surfaceMinerals.ironium -= affordable.ironium;
        planet.surfaceMinerals.boranium -= affordable.boranium;
        planet.surfaceMinerals.germanium -= affordable.germanium;

        // Add to paid
        item.paid.resources += affordable.resources;
        item.paid.ironium += affordable.ironium;
        item.paid.boranium += affordable.boranium;
        item.paid.germanium += affordable.germanium;

        // Check completion
        const isPaid =
          item.paid.resources >= totalCost.resources &&
          item.paid.ironium + scrapCredit.ironium >= totalCost.ironium &&
          item.paid.boranium + scrapCredit.boranium >= totalCost.boranium &&
          item.paid.germanium + scrapCredit.germanium >= totalCost.germanium;

        if (isPaid) {
          // Refund excess minerals (if scrap credit exceeded cost)
          const excessIronium = item.paid.ironium + scrapCredit.ironium - totalCost.ironium;
          const excessBoranium = item.paid.boranium + scrapCredit.boranium - totalCost.boranium;
          const excessGermanium = item.paid.germanium + scrapCredit.germanium - totalCost.germanium;

          if (excessIronium > 0) planet.surfaceMinerals.ironium += excessIronium;
          if (excessBoranium > 0) planet.surfaceMinerals.boranium += excessBoranium;
          if (excessGermanium > 0) planet.surfaceMinerals.germanium += excessGermanium;

          // Remove old starbase if we built a new one
          if (existingFleet && existingStarbaseIndex >= 0) {
            existingFleet.ships.splice(existingStarbaseIndex, 1);
            if (existingFleet.ships.length === 0) {
              // If fleet is empty, remove it
              game.fleets = game.fleets.filter((f) => f.id !== existingFleet!.id);
            }
          }

          // Build logic
          switch (item.project) {
            case 'mine':
              planet.mines += 1;
              break;
            case 'factory':
              planet.factories += 1;
              break;
            case 'defense':
              planet.defenses += 1;
              break;
            case 'research':
              planet.research = (planet.research || 0) + 1;
              break;
            case 'scanner': {
              const techLevels = game.humanPlayer.techLevels;
              let bestRange = 0;
              for (const s of PLANETARY_SCANNER_COMPONENTS) {
                if (
                  s.tech &&
                  techLevels.Energy >= (s.tech.Energy || 0) &&
                  techLevels.Kinetics >= (s.tech.Kinetics || 0) &&
                  techLevels.Propulsion >= (s.tech.Propulsion || 0) &&
                  techLevels.Construction >= (s.tech.Construction || 0)
                ) {
                  const scan = s.stats?.scan || 0;
                  if (scan > bestRange) bestRange = scan;
                }
              }
              planet.scanner = bestRange > 0 ? bestRange : 50;
              break;
            }
            case 'terraform':
              planet.temperature +=
                planet.temperature < game.humanPlayer.species.habitat.idealTemperature ? 1 : -1;
              planet.atmosphere +=
                planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere ? 1 : -1;
              break;
            case 'ship': {
              const designId = item.shipDesignId ?? 'scout';
              this.fleet.addShipToFleet(game, planet, designId, 1);
              break;
            }
            default:
              break;
          }

          // Handle Queue
          if (item.count && item.count > 1) {
            item.count--;
            item.paid = undefined; // Reset for next unit
            // Continue loop
          } else {
            queue.shift(); // Remove completed item
            // Continue loop
          }
        } else {
          // Not finished, ran out of resources
          break;
        }
      }

      planet.buildQueue = queue;
    }
  }

  processGovernors(game: GameState) {
    const owned = game.stars
      .flatMap((s) => s.planets)
      .filter((p) => p.ownerId === game.humanPlayer.id);
    for (const planet of owned) {
      if (!planet.governor || planet.governor.type === 'manual') continue;
      if ((planet.buildQueue ?? []).length > 0) continue;
      switch (planet.governor.type) {
        case 'balanced': {
          const minesTarget = Math.floor(planet.population / 20);
          if (planet.mines < minesTarget) {
            this.addToBuildQueue(game, planet.id, {
              project: 'mine',
              cost: BUILD_COSTS['mine'],
              isAuto: true,
            });
          } else if (planet.factories < Math.floor(planet.population / 10)) {
            this.addToBuildQueue(game, planet.id, {
              project: 'factory',
              cost: BUILD_COSTS['factory'],
              isAuto: true,
            });
          } else {
            this.addToBuildQueue(game, planet.id, {
              project: 'defense',
              cost: BUILD_COSTS['defense'],
              isAuto: true,
            });
          }
          break;
        }
        case 'mining':
          this.addToBuildQueue(game, planet.id, {
            project: 'mine',
            cost: BUILD_COSTS['mine'],
            isAuto: true,
          });
          break;
        case 'industrial':
          this.addToBuildQueue(game, planet.id, {
            project: 'factory',
            cost: BUILD_COSTS['factory'],
            isAuto: true,
          });
          break;
        case 'military':
          this.addToBuildQueue(game, planet.id, {
            project: 'defense',
            cost: BUILD_COSTS['defense'],
            isAuto: true,
          });
          break;
        case 'research':
          this.addToBuildQueue(game, planet.id, {
            project: 'research',
            cost: BUILD_COSTS['research'],
            isAuto: true,
          });
          break;
      }
    }
  }

  setGovernor(game: GameState, planetId: string, governor: Planet['governor']): GameState {
    const planet = this.buildPlanetIndex(game).get(planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return game;
    planet.governor = governor ?? { type: 'manual' };
    return { ...game, stars: [...game.stars] };
  }

  removeFromQueue(game: GameState, planetId: string, index: number): GameState {
    const planet = this.buildPlanetIndex(game).get(planetId);
    if (!planet || !planet.buildQueue) return game;
    planet.buildQueue = planet.buildQueue.filter((_, i) => i !== index);
    return { ...game, stars: [...game.stars] };
  }
}
