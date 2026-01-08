import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet } from '../models/game.model';
import { EconomyService } from './economy.service';
import { getDesign } from '../data/ships.data';
import { ShipyardService } from './shipyard.service';
import { PLANETARY_SCANNER_COMPONENTS } from '../data/techs/planetary.data';

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
                const oldDesign = game.shipDesigns.find(
                  (d) => d.id === f.ships[idx].designId,
                );
                if (oldDesign?.spec?.cost) {
                  // 75% Mineral Recovery
                  scrapCredit.ironium = Math.floor(
                    (oldDesign.spec.cost.ironium || 0) * 0.75,
                  );
                  scrapCredit.boranium = Math.floor(
                    (oldDesign.spec.cost.boranium || 0) * 0.75,
                  );
                  scrapCredit.germanium = Math.floor(
                    (oldDesign.spec.cost.germanium || 0) * 0.75,
                  );
                }
                break;
              }
            }
          }
        }

        // Calculate remaining needed (taking credit into account)
        const remaining = {
          resources: Math.max(0, totalCost.resources - item.paid.resources),
          ironium: Math.max(
            0,
            totalCost.ironium - item.paid.ironium - scrapCredit.ironium,
          ),
          boranium: Math.max(
            0,
            totalCost.boranium - item.paid.boranium - scrapCredit.boranium,
          ),
          germanium: Math.max(
            0,
            totalCost.germanium - item.paid.germanium - scrapCredit.germanium,
          ),
        };

        // Pay what we can
        const affordable = {
          resources: Math.min(remaining.resources, planet.resources),
          ironium: Math.min(remaining.ironium, planet.surfaceMinerals.ironium),
          boranium: Math.min(remaining.boranium, planet.surfaceMinerals.boranium),
          germanium: Math.min(
            remaining.germanium,
            planet.surfaceMinerals.germanium,
          ),
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
          const excessIronium =
            item.paid.ironium + scrapCredit.ironium - totalCost.ironium;
          const excessBoranium =
            item.paid.boranium + scrapCredit.boranium - totalCost.boranium;
          const excessGermanium =
            item.paid.germanium + scrapCredit.germanium - totalCost.germanium;

          if (excessIronium > 0) planet.surfaceMinerals.ironium += excessIronium;
          if (excessBoranium > 0) planet.surfaceMinerals.boranium += excessBoranium;
          if (excessGermanium > 0)
            planet.surfaceMinerals.germanium += excessGermanium;

          // Remove old starbase if we built a new one
          if (existingFleet && existingStarbaseIndex >= 0) {
            existingFleet.ships.splice(existingStarbaseIndex, 1);
            if (existingFleet.ships.length === 0) {
                // If fleet is empty, remove it
                game.fleets = game.fleets.filter(f => f.id !== existingFleet!.id);
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
                planet.temperature <
                game.humanPlayer.species.habitat.idealTemperature
                  ? 1
                  : -1;
              planet.atmosphere +=
                planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere
                  ? 1
                  : -1;
              break;
            case 'ship': {
              const designId = item.shipDesignId ?? 'scout';
              const shipDesign = game.shipDesigns.find((d) => d.id === designId);

              // Find or create fleet
              const orbitFleets = game.fleets.filter(
                (f) =>
                  f.ownerId === game.humanPlayer.id &&
                  f.location.type === 'orbit' &&
                  f.location.planetId === planet.id,
              );
              let fleet = orbitFleets[0];
              
              // If no fleet or we want to separate (logic can be refined, defaulting to first fleet or new)
              // Logic: Join existing fleet if possible, else create new.
              // NOTE: If we just removed the old starbase fleet, orbitFleets[0] might be gone or changed.
              // So we should re-fetch or be careful.
              // Re-fetching is safer.
               const currentOrbitFleets = game.fleets.filter(
                (f) =>
                  f.ownerId === game.humanPlayer.id &&
                  f.location.type === 'orbit' &&
                  f.location.planetId === planet.id,
              );
              fleet = currentOrbitFleets[0];

              if (!fleet) {
                // Generate fleet name
                const userDesign = game.shipDesigns.find((d) => d.id === designId);
                const legacyDesign = getDesign(designId);
                const baseName =
                  userDesign?.name || legacyDesign?.name || 'Fleet';

                const sameNameFleets = game.fleets.filter(
                  (f) =>
                    f.ownerId === game.humanPlayer.id &&
                    f.name &&
                    f.name.startsWith(baseName),
                );
                let maxNum = 0;
                const escapedBaseName = baseName.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  '\\$&',
                );
                const regex = new RegExp(`^${escapedBaseName}-(\\d+)$`);
                for (const f of sameNameFleets) {
                  const match = f.name.match(regex);
                  if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                  }
                }
                const newName = `${baseName}-${maxNum + 1}`;

                fleet = {
                  id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  name: newName,
                  ownerId: game.humanPlayer.id,
                  location: { type: 'orbit', planetId: planet.id },
                  ships: [],
                  fuel: 0,
                  cargo: {
                    resources: 0,
                    minerals: { ironium: 0, boranium: 0, germanium: 0 },
                    colonists: 0,
                  },
                  orders: [],
                };
                game.fleets.push(fleet);
              }

              const stack = fleet.ships.find((s) => s.designId === designId);
              if (stack) stack.count += 1;
              else fleet.ships.push({ designId, count: 1, damage: 0 });

              // Add starting fuel
              const legacyDesign = getDesign(designId);
              const fuelCap =
                shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
              fleet.fuel += fuelCap;

              // Preload colonists if colony ship
              const hasColony =
                shipDesign?.spec?.hasColonyModule ?? legacyDesign?.colonyModule;
              const colCap =
                shipDesign?.spec?.colonistCapacity ?? legacyDesign?.colonistCapacity;

              if (hasColony && colCap) {
                // Take colonists from planet?
                // Standard Stars!: Colony ships are built empty?
                // Wait, in `ColonyService` original code:
                // `fleet.cargo.colonists += colCap;`
                // It just GAVE colonists. It didn't deduct from planet.
                // That's infinite colonists!
                // We should check if we should deduct.
                // For now, I will keep original logic but ideally we should deduct.
                // Requirement "Maintain all existing functionality".
                // I will keep it as is (magic colonists).
                fleet.cargo.colonists += colCap;
              }
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
              cost: { resources: 15, ironium: 2, boranium: 2 },
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
            cost: { resources: 15, ironium: 2, boranium: 2 },
            isAuto: true,
          });
          break;
        case 'research':
          this.addToBuildQueue(game, planet.id, {
            project: 'research',
            cost: { resources: 10 },
            isAuto: true,
          });
          break;
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
