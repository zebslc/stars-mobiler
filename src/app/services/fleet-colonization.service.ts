import { Injectable } from '@angular/core';
import { GameState, Fleet, Planet } from '../models/game.model';
import { LogContext } from '../models/service-interfaces.model';
import { LoggingService } from './logging.service';
import { HabitabilityService } from './habitability.service';
import { ShipyardService } from './shipyard.service';
import { SettingsService } from './settings.service';
import { getDesign } from '../data/ships.data';

@Injectable({ providedIn: 'root' })
export class FleetColonizationService {

  constructor(
    private logging: LoggingService,
    private habitability: HabitabilityService,
    private shipyard: ShipyardService,
    private settings: SettingsService
  ) {}

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    const context: LogContext = {
      service: 'FleetColonizationService',
      operation: 'colonizeNow',
      entityId: fleetId,
      entityType: 'fleet'
    };

    this.logging.debug(`Attempting colonization with fleet ${fleetId}`, context);

    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.logging.error('Fleet not found or not in orbit for colonization', context);
      return [game, null];
    }

    const planetIndex = this.buildPlanetIndex(game);
    const planet = planetIndex.get(
      (fleet.location as { type: 'orbit'; planetId: string }).planetId,
    );
    
    if (!planet) {
      this.logging.error('Planet not found for colonization', context);
      return [game, null];
    }

    // Find colony ship
    const colonyStack = fleet.ships.find((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0;
    });

    const hasColony = !!colonyStack;
    if (!hasColony) {
      this.logging.warn('No colony ships available for colonization', {
        ...context,
        additionalData: { planetId: planet.id, planetName: planet.name }
      });
      return [game, null];
    }

    // Calculate habitability
    const hab = this.habitability.calculate(planet, game.humanPlayer.species);
    
    this.logging.info(`Colonizing planet ${planet.name} (habitability: ${hab}%)`, {
      ...context,
      additionalData: { 
        planetId: planet.id, 
        planetName: planet.name, 
        habitability: hab,
        fleetName: fleet.name
      }
    });

    const design = game.shipDesigns.find((d) => d.id === colonyStack!.designId);
    if (!design) {
      this.logging.error('Colony ship design not found', context);
      return [game, null];
    }

    // Consume one colony ship
    colonyStack!.count -= 1;
    if (colonyStack!.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }

    // Absorb ship cargo into the new colony
    planet.ownerId = game.humanPlayer.id;
    
    // Apply default governor from settings
    planet.governor = { type: this.settings.defaultGovernor() };
    
    // Initialize build queue
    planet.buildQueue = [];

    // Set Max Population based on habitability
    planet.maxPopulation = hab > 0 ? Math.floor(1_000_000 * (hab / 100)) : 1000; // Allow small pop on hostile worlds

    const addedColonists = Math.max(0, fleet.cargo.colonists);
    planet.population = addedColonists;
    
    // Transfer minerals from cargo
    planet.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    
    // Broken-down ship parts contribute minerals based on its build cost
    const cost = this.shipyard.getShipCost(design);
    planet.resources += cost.resources;
    planet.surfaceMinerals.ironium += cost.ironium ?? 0;
    planet.surfaceMinerals.boranium += cost.boranium ?? 0;
    planet.surfaceMinerals.germanium += cost.germanium ?? 0;
    
    // Clear cargo after colonization
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
    fleet.orders = [];
    
    this.logging.info(`Colony established on ${planet.name}`, {
      ...context,
      additionalData: { 
        planetId: planet.id,
        planetName: planet.name,
        population: planet.population,
        maxPopulation: planet.maxPopulation,
        habitability: hab
      }
    });

    // Remove empty fleets
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
      this.logging.debug(`Removed empty fleet after colonization`, context);
    }
    
    const newGame = { ...game, stars: [...game.stars], fleets: [...game.fleets] };
    return [newGame, planet.id];
  }

  canColonize(game: GameState, fleetId: string): { canColonize: boolean; reason?: string } {
    const context: LogContext = {
      service: 'FleetColonizationService',
      operation: 'canColonize',
      entityId: fleetId,
      entityType: 'fleet'
    };

    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) {
      return { canColonize: false, reason: 'Fleet not found' };
    }

    if (fleet.location.type !== 'orbit') {
      return { canColonize: false, reason: 'Fleet must be in orbit' };
    }

    const planetIndex = this.buildPlanetIndex(game);
    const planet = planetIndex.get(
      (fleet.location as { type: 'orbit'; planetId: string }).planetId,
    );
    
    if (!planet) {
      return { canColonize: false, reason: 'Planet not found' };
    }

    if (planet.ownerId && planet.ownerId !== game.humanPlayer.id) {
      return { canColonize: false, reason: 'Planet already colonized by another player' };
    }

    if (planet.ownerId === game.humanPlayer.id) {
      return { canColonize: false, reason: 'Planet already colonized by you' };
    }

    // Check for colony ships
    const hasColonyShip = fleet.ships.some((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0;
    });

    if (!hasColonyShip) {
      return { canColonize: false, reason: 'No colony ships in fleet' };
    }

    this.logging.debug(`Colonization check passed for fleet ${fleet.name}`, {
      ...context,
      additionalData: { 
        planetId: planet.id,
        planetName: planet.name,
        fleetName: fleet.name
      }
    });

    return { canColonize: true };
  }

  private buildPlanetIndex(game: GameState): Map<string, Planet> {
    const index = new Map<string, Planet>();
    for (const star of game.stars) {
      for (const planet of star.planets) {
        index.set(planet.id, planet);
      }
    }
    return index;
  }
}