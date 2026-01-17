import { Injectable, inject } from '@angular/core';
import type { GameState, Fleet, Star, ShipStack, ShipDesign } from '../../../models/game.model';
import type { LogContext } from '../../../models/service-interfaces.model';
import { LoggingService } from '../../core/logging.service';
import { HabitabilityService } from '../../colony/habitability.service';
import { ShipyardService } from '../../ship-design/shipyard.service';
import { SettingsService } from '../../core/settings.service';
import { ShipDesignRegistry } from '../../data/ship-design-registry.service';

@Injectable({ providedIn: 'root' })
export class FleetColonizationService {
  private readonly logging = inject(LoggingService);
  private readonly habitability = inject(HabitabilityService);
  private readonly shipyard = inject(ShipyardService);
  private readonly settings = inject(SettingsService);
  private readonly shipDesignRegistry = inject(ShipDesignRegistry);

  colonizeNow(game: GameState, fleetId: string): [GameState, string | null] {
    const context = this.createContext('colonizeNow', fleetId);
    this.logging.debug(`Attempting colonization with fleet ${fleetId}`, context);

    const validationResult = this.validateColonizationRequest(game, fleetId, context);
    if (!validationResult.isValid) {
      return [game, null];
    }

    const { fleet, star } = validationResult;
    if (!fleet || !star) {
      return [game, null];
    }

    const colonyShip = this.findColonyShip(game, fleet, context);
    if (!colonyShip.ship || !colonyShip.design) {
      return [game, null];
    }

    return this.executeColonization(game, fleet, star, colonyShip.ship, colonyShip.design, context);
  }

  canColonize(game: GameState, fleetId: string): { canColonize: boolean; reason?: string } {
    const context = this.createContext('canColonize', fleetId);

    const fleetValidation = this.validateFleetForColonization(game, fleetId);
    if (!fleetValidation.isValid) {
      return { canColonize: false, reason: fleetValidation.reason };
    }

    const starValidation = this.validateStarForColonization(game, fleetValidation.fleet!, game.humanPlayer.id);
    if (!starValidation.isValid) {
      return { canColonize: false, reason: starValidation.reason };
    }

    const hasColonyShips = this.checkForColonyShips(game, fleetValidation.fleet!);
    if (!hasColonyShips) {
      return { canColonize: false, reason: 'No colony ships in fleet' };
    }

    this.logSuccessfulValidation(fleetValidation.fleet!, starValidation.star!, context);
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

  private validateStarForColonization(
    game: GameState, 
    fleet: Fleet, 
    playerId: string
  ): { isValid: boolean; reason?: string; star?: Star } {
    const starIndex = this.buildStarIndex(game);
    const star = starIndex.get(
      (fleet.location as { type: 'orbit'; starId: string }).starId
    );
    
    if (!star) {
      return { isValid: false, reason: 'Star not found' };
    }

    if (star.ownerId && star.ownerId !== playerId) {
      return { isValid: false, reason: 'Star already colonized by another player' };
    }

    if (star.ownerId === playerId) {
      return { isValid: false, reason: 'Star already colonized by you' };
    }

    return { isValid: true, star };
  }

  private checkForColonyShips(game: GameState, fleet: Fleet): boolean {
    return fleet.ships.some((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && this.shipDesignRegistry.getDesign(design.hullId)?.colonyModule && s.count > 0;
    });
  }

  private logSuccessfulValidation(fleet: Fleet, star: Star, context: LogContext): void {
    this.logging.debug(`Colonization check passed for fleet ${fleet.name}`, {
      ...context,
      additionalData: { 
        starId: star.id,
        starName: star.name,
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
  ): { isValid: boolean; fleet?: Fleet; star?: Star } {
    const fleet = game.fleets.find((f) => f.id === fleetId && f.ownerId === game.humanPlayer.id);
    if (!fleet || fleet.location.type !== 'orbit') {
      this.logging.error('Fleet not found or not in orbit for colonization', context);
      return { isValid: false };
    }

    const starIndex = this.buildStarIndex(game);
    const star = starIndex.get(
      (fleet.location as { type: 'orbit'; starId: string }).starId
    );
    
    if (!star) {
      this.logging.error('Star not found for colonization', context);
      return { isValid: false };
    }

    return { isValid: true, fleet, star };
  }

  private findColonyShip(
    game: GameState,
    fleet: Fleet,
    context: LogContext
  ): { ship: ShipStack | null; design: ShipDesign | null } {
    const colonyStack = fleet.ships.find((s) => {
      const design = game.shipDesigns.find((d) => d.id === s.designId);
      return design && this.shipDesignRegistry.getDesign(design.hullId)?.colonyModule && s.count > 0;
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
    star: Star,
    colonyStack: ShipStack,
    design: ShipDesign,
    context: LogContext
  ): [GameState, string | null] {
    const hab = this.habitability.calculate(star, game.humanPlayer.species);

    this.logging.info(`Colonizing star ${star.name} (habitability: ${hab}%)`, {
      ...context,
      additionalData: {
        starId: star.id,
        starName: star.name,
        habitability: hab,
        fleetName: fleet.name
      }
    });

    return this.performColonization(game, fleet, star, colonyStack, design, hab, context);
  }

  private performColonization(
    game: GameState,
    fleet: Fleet,
    star: Star,
    colonyStack: ShipStack,
    design: ShipDesign,
    habitability: number,
    context: LogContext
  ): [GameState, string | null] {
    this.consumeColonyShip(fleet, colonyStack);
    this.initializeColony(star, habitability, game.humanPlayer.id);
    this.transferResourcesToColony(star, fleet, design);

    return this.finalizeColonization(game, fleet, star, context);
  }

  private consumeColonyShip(fleet: Fleet, colonyStack: ShipStack): void {
    colonyStack.count -= 1;
    if (colonyStack.count <= 0) {
      fleet.ships = fleet.ships.filter((s) => s !== colonyStack);
    }
  }

  private initializeColony(star: Star, habitability: number, playerId: string): void {
    star.ownerId = playerId;
    star.governor = { type: this.settings.defaultGovernor() };
    star.buildQueue = [];
    star.maxPopulation = habitability > 0 
      ? Math.floor(1_000_000 * (habitability / 100)) 
      : 1000;
  }

  private transferResourcesToColony(star: Star, fleet: Fleet, design: ShipDesign): void {
    // Transfer population
    star.population = Math.max(0, fleet.cargo.colonists);

    // Transfer minerals from cargo
    star.surfaceMinerals.ironium += fleet.cargo.minerals.ironium;
    star.surfaceMinerals.boranium += fleet.cargo.minerals.boranium;
    star.surfaceMinerals.germanium += fleet.cargo.minerals.germanium;

    // Add resources from broken-down ship
    const cost = this.shipyard.getShipCost(design);
    star.resources += cost.resources;
    star.surfaceMinerals.ironium += cost.ironium ?? 0;
    star.surfaceMinerals.boranium += cost.boranium ?? 0;
    star.surfaceMinerals.germanium += cost.germanium ?? 0;
  }

  private finalizeColonization(
    game: GameState, 
    fleet: Fleet, 
    star: Star, 
    context: LogContext
  ): [GameState, string | null] {
    this.clearFleetCargo(fleet);
    this.logColonyEstablishment(star, context);
    this.removeEmptyFleet(game, fleet, context);
    
    return [{ ...game, stars: [...game.stars], fleets: [...game.fleets] }, star.id];
  }

  private clearFleetCargo(fleet: Fleet): void {
    fleet.cargo.minerals = { ironium: 0, boranium: 0, germanium: 0 };
    fleet.cargo.colonists = 0;
    fleet.orders = [];
  }

  private logColonyEstablishment(star: Star, context: LogContext): void {
    this.logging.info(`Colony established on ${star.name}`, {
      ...context,
      additionalData: { 
        starId: star.id,
        starName: star.name,
        population: star.population,
        maxPopulation: star.maxPopulation
      }
    });
  }

  private removeEmptyFleet(game: GameState, fleet: Fleet, context: LogContext): void {
    if (fleet.ships.length === 0) {
      game.fleets = game.fleets.filter((f) => f.id !== fleet.id);
      this.logging.debug(`Removed empty fleet after colonization`, context);
    }
  }

  private buildStarIndex(game: GameState): Map<string, Star> {
    const index = new Map<string, Star>();
    for (const star of game.stars) {
      index.set(star.id, star);
    }
    return index;
  }
}