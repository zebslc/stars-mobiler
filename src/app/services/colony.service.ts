import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../models/game.model';
import { EconomyService } from './economy.service';
import { getDesign } from '../data/ships.data';
import { ShipyardService } from './shipyard.service';

@Injectable({ providedIn: 'root' })
export class ColonyService {
  constructor(
    private economy: EconomyService,
    private shipyard: ShipyardService,
  ) {}

  addToBuildQueue(game: GameState, planetId: string, item: BuildItem): GameState {
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
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
        const count = item.count ?? 1;
        let constructed = 0;

        // Try to build as many as possible
        for (let i = 0; i < count; i++) {
          if (this.economy.spend(planet, item.cost)) {
            // Build successful
            constructed++;
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
              case 'scanner':
                planet.scanner = 1;
                break;
              case 'terraform':
                planet.temperature +=
                  planet.temperature < game.humanPlayer.species.habitat.idealTemperature ? 1 : -1;
                planet.atmosphere +=
                  planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere ? 1 : -1;
                break;
              case 'ship': {
                const designId = item.shipDesignId ?? 'scout';
                const orbitFleets = game.fleets.filter(
                  (f) =>
                    f.ownerId === game.humanPlayer.id &&
                    f.location.type === 'orbit' &&
                    f.location.planetId === planet.id,
                );
                let fleet = orbitFleets[0];
                if (!fleet) {
                  fleet = {
                    id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    ownerId: game.humanPlayer.id,
                    location: { type: 'orbit', planetId: planet.id },
                    ships: [],
                    fuel: 0,
                    cargo: {
                      resources: 0,
                      minerals: { iron: 0, boranium: 0, germanium: 0 },
                      colonists: 0,
                    },
                    orders: [],
                  };
                  game.fleets.push(fleet);
                }
                const stack = fleet.ships.find((s) => s.designId === designId);
                if (stack) stack.count += 1;
                else fleet.ships.push({ designId, count: 1, damage: 0 });
                // Add starting fuel based on design
                fleet.fuel += getDesign(designId).fuelCapacity;
                // If colony ship, preload colonists based on design capacity
                const design = getDesign(designId);
                if (design.colonyModule && design.colonistCapacity) {
                  fleet.cargo.colonists += design.colonistCapacity;
                }
                break;
              }
              default:
                break;
            }
          } else {
            // Cannot afford anymore
            break;
          }
        }

        if (constructed > 0) {
          // If we built some, update the item count
          if (constructed >= count) {
            // Finished this item
            queue = queue.slice(1);
          } else {
            // Partially finished
            item.count = count - constructed;
            // Stop processing this planet for this turn as we ran out of resources
            break;
          }
        } else {
          // Couldn't build even one. Stop processing this planet.
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
              cost: { resources: 5 },
              isAuto: true,
            });
          } else if (planet.factories < Math.floor(planet.population / 10)) {
            this.addToBuildQueue(game, planet.id, {
              project: 'factory',
              cost: { resources: 10, germanium: 4 },
              isAuto: true,
            });
          } else {
            this.addToBuildQueue(game, planet.id, {
              project: 'defense',
              cost: { resources: 15, iron: 2, boranium: 2 },
              isAuto: true,
            });
          }
          break;
        }
        case 'mining':
          this.addToBuildQueue(game, planet.id, {
            project: 'mine',
            cost: { resources: 5 },
            isAuto: true,
          });
          break;
        case 'industrial':
          this.addToBuildQueue(game, planet.id, {
            project: 'factory',
            cost: { resources: 10, germanium: 4 },
            isAuto: true,
          });
          break;
        case 'military':
          this.addToBuildQueue(game, planet.id, {
            project: 'defense',
            cost: { resources: 15, iron: 2, boranium: 2 },
            isAuto: true,
          });
          break;
        case 'shipyard': {
          const designId = planet.governor.shipDesignId ?? 'scout';
          const design = game.shipDesigns.find(d => d.id === designId);
          if (!design) break;

          const limit = planet.governor.buildLimit ?? 0;
          const queuedShips = (planet.buildQueue ?? []).filter((i) => i.project === 'ship').length;
          if (limit === 0 || queuedShips < limit) {
            const cost = this.shipyard.getShipCost(design);
            this.addToBuildQueue(game, planet.id, {
              project: 'ship',
              cost,
              shipDesignId: designId,
              isAuto: true,
            });
          }
          break;
        }
      }
    }
  }

  setGovernor(game: GameState, planetId: string, governor: Planet['governor']): GameState {
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || planet.ownerId !== game.humanPlayer.id) return game;
    planet.governor = governor ?? { type: 'manual' };
    return { ...game, stars: [...game.stars] };
  }

  removeFromQueue(game: GameState, planetId: string, index: number): GameState {
    const planet = game.stars.flatMap((s) => s.planets).find((p) => p.id === planetId);
    if (!planet || !planet.buildQueue) return game;
    planet.buildQueue = planet.buildQueue.filter((_, i) => i !== index);
    return { ...game, stars: [...game.stars] };
  }
}
