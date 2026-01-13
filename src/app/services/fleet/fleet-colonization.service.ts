import { Injectable } from '@angular/core';
import { GameState, Fleet, Planet } from '../../models/game.model';
import { LogContext } from '../../models/service-interfaces.model';
import { LoggingService } from '../core/logging.service';
import { HabitabilityService } from '../colony/habitability.service';
import { ShipyardService } from '../ship-design/shipyard.service';
import { SettingsService } from '../core/settings.service';
import { getDesign } from '../../data/ships.data';

@Injectable({ providedIn: 'root' })
export class FleetColonizationService {

  constructor(
    private logging: LoggingService,
    private habitability: HabitabilityService,
    private shipyard: ShipyardService,
    private settings: SettingsService
  ) {}

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    const context = this.createContext('colonizeNow', fleetId);
    this.logging.debug(`Attempting colonization with fleet ${fleetId}`, context);

    const validationResult = this.validateColonizationRequest(game, fleetId, context);
    if (!validationResult.isValid) {
      return [game, null];
    }

    const { fleet, planet } = validationResult;
    // fleet and planet are guaranteed to exist due to validation above
    const colonyShip = this.findColonyShip(game, fleet!, context);
    if (!colonyShip.ship) {
      return [game, null];
    }

    return this.executeColonization(game, fleet!, planet!, colonyShip.ship, colonyShip.design, context);
  }

  canColonize(game: GameState, fleetId: string): { canColonize: boolean; reason?: string } {
    const context = this.createContext('canColonize', fleetId);

    const fleetValidation = this.validateFleetForColonization(game, fleetId);
    if (!fleetValidation.isValid) {
      return { canColonize: false, reason: fleetValidation.reason };
    }

    const planetValidation = this.validatePlanetForColonization(game, fleetValidation.fleet!, game.humanPlayer.id);
    if (!planetValidation.isValid) {
      return { canColonize: false, reason: planetValidation.reason };
    }

    const hasColonyShips = this.checkForColonyShips(game, fleetValidation.fleet!);
    if (!hasColonyShips) {
      return { canColonize: false, reason: 'No colony ships in fleet' };
    }

    this.logSuccessfulValidation(fleetValidation.fleet!, planetValidation.planet!, context);
    return { canColonize: true };
  }

  private validateFleetForColonization(
    game: GameState, 
    fleetId: string
  ): { isValid: boolean; reason?: string; fleet?: Fleet } {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet) {
      return { isValid: false, reason: 'Fleet not found' };
    }

    if (fleet.location.type !== 'orbit') {
      return { isValid: false, reason: 'Fleet must be in orbit' };
    }

    return { isValid: true, fleet };
  }

  private validatePlanetForColonization(
    game: GameState, 
    fleet: Fleet, 
    playerId: string
  ): { isValid: boolean; reason?: string; planet?: Planet } {
    const planetIndex = this.buildPlanetIndex(game);
    const planet = planetIndex.get(
      (fleet.location as { type: 'orbit'; planetId: string }).planetId
    );
    
    if (!planet) {
      return { isValid: false, reason: 'Planet not found' };
    }

    if (planet.ownerId && planet.ownerId !== playerId) {
      return { isValid: false, reason: 'Planet already colonized by another player' };
    }

    if (planet.ownerId === playerId) {
      return { isValid: false, reason: 'Planet already colonized by you' };
    }

    return { isValid: true, planet };
  }

  private checkForColonyShips(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0;
    });
  }

  private logSuccessfulValidation(fleet: Fleet, planet: Planet, context: LogContext): void {
    this.logging.debug(`Colonization check passed for fleet ${fleet.name}`, {
      ...context,
      additionalData: { 
        planetId: planet.id,
        planetName: planet.name,
        fleetName: fleet.name
      }
    });
  }

  private createContext(operation: string, entityId: string): LogContext {
    return {
      service: 'FleetColonizationService',
      operation,
      entityId,
      entityType: 'fleet'
    };
  }

  private validateColonizationRequest(
    game: GameState, 
    fleetId: string, 
    context: LogContext
  ): { isValid: boolean; fleet?: Fleet; planet?: Planet } {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.logging.error('Fleet not found or not in orbit for colonization', context);
      return { isValid: false };
    }

    const planetIndex = this.buildPlanetIndex(game);
    const planet = planetIndex.get(
      (fleet.location as { type: 'orbit'; planetId: string }).planetId
    );
    
    if (!planet) {
      this.logging.error('Planet not found for colonization', context);
      return { isValid: false };
    }

    return { isValid: true, fleet, planet };
  }

  private findColonyShip(
    game: GameState, 
    fleet: Fleet, 
    context: LogContext
  ): { ship: any | null; design: any | null } {
    const colonyStack = fleet.ships.find((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && getDesign(design.hullId)?.colonyModule && s.count > 0;
    });

    if (!colonyStack) {
      this.logging.warn('No colony ships available for colonization', context);
      return { ship: null, design: null };
    }

    const design = game.shipDesigns.find((d) => d.id === colonyStack.designId);
    if (!design) {
      this.logging.error('Colony ship design not found', context);
      return { ship: null, design: null };
    }

    return { ship: colonyStack, design };
  }

  private executeColonization(
    game: GameState, 
    fleet: Fleet, 
    planet: Planet, 
    colonyStack: any, 
    design: any, 
    context: LogContext
  ): [GameState, string | null] {
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

    return this.performColonization(game, fleet, planet, colonyStack, design, hab, context);
  }

  private performColonization(
    game: GameState,
    fleet: Fleet,
    planet: Planet,
    colonyStack: any,
    design: any,
    habitability: number,
    context: LogContext
  ): [GameState, string | null] {
    this.consumeColonyShip(fleet, colonyStack);
    this.initializeColony(planet, habitability, game.humanPlayer.id);
    this.transferResourcesToColony(planet, fleet, design);
    
    return this.finalizeColonization(game, fleet, planet, context);
  }

  private consumeColonyShip(fleet: Fleet, colonyStack: any): void {
    colonyStack.count -= 1;
    if (colonyStack.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }
  }

  private initializeColony(planet: Planet, habitability: number, playerId: string): void {
    planet.ownerId = playerId;
    planet.governor = { type: this.settings.defaultGovernor() };
    planet.buildQueue = [];
    planet.maxPopulation = habitability > 0 
      ? Math.floor(1_000_000 * (habitability / 100)) 
      : 1000;
  }

  private transferResourcesToColony(planet: Planet, fleet: Fleet, design: any): void {
    // Transfer population
    planet.population = Math.max(0, fleet.cargo.colonists);
    
    // Transfer minerals from cargo
    planet.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    planet.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    planet.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;
    
    // Add resources from broken-down ship
    const cost = this.shipyard.getShipCost(design);
    planet.resources += cost.resources;
    planet.surfaceMinerals.ironium += cost.ironium ?? 0;
    planet.surfaceMinerals.boranium += cost.boranium ?? 0;
    planet.surfaceMinerals.germanium += cost.germanium ?? 0;
  }

  private finalizeColonization(
    game: GameState, 
    fleet: Fleet, 
    planet: Planet, 
    context: LogContext
  ): [GameState, string | null] {
    this.clearFleetCargo(fleet);
    this.logColonyEstablishment(planet, context);
    this.removeEmptyFleet(game, fleet, context);
    
    return [{ ...game, stars: [...game.stars], fleets: [...game.fleets] }, planet.id];
  }

  private clearFleetCargo(fleet: Fleet): void {
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
    fleet.orders = [];
  }

  private logColonyEstablishment(planet: Planet, context: LogContext): void {
    this.logging.info(`Colony established on ${planet.name}`, {
      ...context,
      additionalData: { 
        planetId: planet.id,
        planetName: planet.name,
        population: planet.population,
        maxPopulation: planet.maxPopulation
      }
    });
  }

  private removeEmptyFleet(game: GameState, fleet: Fleet, context: LogContext): void {
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
      this.logging.debug(`Removed empty fleet after colonization`, context);
    }
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