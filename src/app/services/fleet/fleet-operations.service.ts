import { Injectable } from '@angular/core';
import { GameState, Fleet, Planet, ShipDesign } from '../../models/game.model';
import { 
  IFleetOperationsService, 
  FleetLocation, 
  ValidationResult,
  LogContext 
} from '../../models/service-interfaces.model';
import { getDesign } from '../../data/ships.data';
import { LoggingService } from '../core/logging.service';
import { FleetNamingService } from './fleet-naming.service';
import { FleetValidationService } from './fleet-validation.service';

@Injectable({ providedIn: 'root' })
export class FleetOperationsService implements IFleetOperationsService {
  readonly MAX_FLEETS = 512;
  readonly MAX_SHIPS_PER_DESIGN = 32000;

  constructor(
    private logging: LoggingService,
    private namingService: FleetNamingService,
    private validationService: FleetValidationService,
  ) {}

  createFleet(
    game: GameState,
    location: FleetLocation,
    ownerId: string,
    baseNameSource?: string,
  ): Fleet {
    const metadata = this.getCreateFleetMetadata(ownerId, location, baseNameSource);
    this.logging.debug('Creating new fleet', metadata);

    this.checkFleetLimit(game, ownerId, metadata);

    const fleet = this.buildFleetObject(game, location, ownerId, baseNameSource);
    game.fleets.push(fleet);

    this.logFleetCreated(fleet, metadata);
    return fleet;
  }

  private getCreateFleetMetadata(
    ownerId: string,
    location: FleetLocation,
    baseNameSource?: string,
  ) {
    return {
      service: 'FleetOperationsService',
      operation: 'createFleet',
      entityId: ownerId,
      entityType: 'player',
      additionalData: { location, baseNameSource },
    };
  }

  private logFleetCreated(fleet: Fleet, metadata: any) {
    this.logging.info(`Fleet created: ${fleet.name}`, {
      ...metadata,
      entityId: fleet.id,
      entityType: 'fleet',
    });
  }

  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void {
    const metadata = this.createAdditionMetadata(planet, shipDesignId, count);
    this.logging.debug(`Adding ${count} ships of design ${shipDesignId} to fleet`, metadata);

    const context = this.resolveDesignInfo(game, shipDesignId);
    const fleet = this.ensureFleetExists(game, planet, shipDesignId, context.isNewShipStarbase);

    this.validateAdditionOrThrow(fleet, shipDesignId, count, metadata);
    const hasColony = this.executeShipAddition(
      fleet,
      shipDesignId,
      count,
      context,
      planet,
      metadata,
    );
    this.logAdditionSuccess(fleet, shipDesignId, count, context, hasColony, metadata);
  }

  private createAdditionMetadata(planet: Planet, shipDesignId: string, count: number) {
    return {
      service: 'FleetOperationsService',
      operation: 'addShipToFleet',
      entityId: planet.id,
      entityType: 'planet',
      additionalData: { shipDesignId, count },
    };
  }

  private resolveDesignInfo(game: GameState, shipDesignId: string) {
    const designId = shipDesignId ?? 'scout';
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    const legacyDesign = !shipDesign ? getDesign(designId) : null;
    const isNewShipStarbase = this.isShipStarbase(game, designId);
    return { shipDesign, legacyDesign, isNewShipStarbase };
  }

  private validateAdditionOrThrow(
    fleet: Fleet,
    designId: string,
    count: number,
    metadata: any,
  ): void {
    const validation = this.validationService.validateShipAddition(fleet, designId, count);
    if (!validation.isValid) {
      const error = validation.errors.join(', ');
      this.logging.error(`Ship addition validation failed: ${error}`, metadata);
      throw new Error(error);
    }
  }

  private executeShipAddition(
    fleet: Fleet,
    designId: string,
    count: number,
    context: any,
    planet: Planet,
    metadata: any,
  ): boolean {
    this.addShipsToFleetStack(fleet, designId, count, metadata);
    this.handleFuelAddition(fleet, context.shipDesign, context.legacyDesign, count);
    return this.handleColonistLoading(fleet, planet, context, count, metadata);
  }

  private logAdditionSuccess(
    fleet: Fleet,
    designId: string,
    count: number,
    context: any,
    hasColony: boolean,
    metadata: any,
  ): void {
    this.logging.info(`Added ${count} ships of design ${designId} to fleet ${fleet.name}`, {
      ...metadata,
      entityId: fleet.id,
      entityType: 'fleet',
      additionalData: this.getSuccessLogData(metadata, hasColony, context),
    });
  }

  private getSuccessLogData(metadata: any, hasColony: boolean, context: any) {
    return {
      ...metadata.additionalData,
      hasColonyModule: hasColony,
      designSpecs: {
        hull: context.shipDesign?.hullId || context.legacyDesign?.hullId,
        modules: context.shipDesign?.spec?.components || [],
      },
    };
  }

  private isShipStarbase(game: GameState, designId: string): boolean {
    const d = game.shipDesigns.find((sd) => sd.id === designId);
    const ld = !d ? getDesign(designId) : null;
    return d?.spec?.isStarbase ?? ld?.isStarbase ?? false;
  }

  private handleFuelAddition(fleet: Fleet, shipDesign: any, legacyDesign: any, count: number) {
    const fuelCap = shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
    fleet.fuel += fuelCap * count;
  }

  private handleColonistLoading(
    fleet: Fleet,
    planet: Planet,
    context: any,
    count: number,
    metadata: any,
  ): boolean {
    const { hasColony, colCap } = this.getColonistSpecs(context);

    if (hasColony && colCap) {
      this.transferColonists(fleet, planet, colCap * count, metadata);
    }
    return !!hasColony;
  }

  private getColonistSpecs(context: any) {
    const hasColony =
      context.shipDesign?.spec?.hasColonyModule ?? context.legacyDesign?.colonyModule;
    const colCap =
      context.shipDesign?.spec?.colonistCapacity ?? context.legacyDesign?.colonistCapacity;
    return { hasColony, colCap };
  }

  private transferColonists(fleet: Fleet, planet: Planet, totalColCap: number, metadata: any) {
    const amount = Math.min(totalColCap, planet.population);
    planet.population -= amount;
    fleet.cargo.colonists += amount;

    this.logging.debug(`Loaded ${amount} colonists onto colony ship`, {
      ...metadata,
      additionalData: { ...metadata.additionalData, colonistsLoaded: amount },
    });
  }

  private findTargetFleet(
    game: GameState,
    planet: Planet,
    isNewShipStarbase: boolean,
  ): Fleet | undefined {
    const orbitFleets = game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.location.type === 'orbit' &&
        (f.location as FleetLocation).planetId === planet.id,
    );

    if (isNewShipStarbase) {
      return orbitFleets.find((f) => f.ships.some((s) => this.isShipStarbase(game, s.designId)));
    } else {
      return orbitFleets.find((f) => !f.ships.some((s) => this.isShipStarbase(game, s.designId)));
    }
  }

  private addShipsToFleetStack(fleet: Fleet, designId: string, count: number, metadata: any) {
    const stack = fleet.ships.find((s) => s.designId === designId && (s.damage || 0) === 0);
    if (stack) {
      if (stack.count + count > this.MAX_SHIPS_PER_DESIGN) {
        const error = `Cannot add ships: Fleet '${fleet.name}' already has ${stack.count} ships of design '${designId}' (Max: ${this.MAX_SHIPS_PER_DESIGN})`;
        this.logging.error(error, metadata);
        throw new Error(error);
      }
      stack.count += count;
    } else {
      if (count > this.MAX_SHIPS_PER_DESIGN) {
        const error = `Cannot add ships: Amount ${count} exceeds max ships per design (${this.MAX_SHIPS_PER_DESIGN})`;
        this.logging.error(error, metadata);
        throw new Error(error);
      }
      fleet.ships.push({ designId, count, damage: 0 });
    }
  }

  validateFleetLimits(game: GameState, ownerId: string): boolean {
    const metadata = {
      service: 'FleetOperationsService',
      operation: 'validateFleetLimits',
      entityId: ownerId,
      entityType: 'player',
    };

    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    const isValid = playerFleets.length < this.MAX_FLEETS;

    this.logging.debug(`Fleet limit validation: ${playerFleets.length}/${this.MAX_FLEETS}`, {
      ...metadata,
      additionalData: { currentFleets: playerFleets.length, maxFleets: this.MAX_FLEETS, isValid },
    });

    return isValid;
  }

  private checkFleetLimit(game: GameState, ownerId: string, metadata: any) {
    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    if (playerFleets.length >= this.MAX_FLEETS) {
      const error = `Maximum of ${this.MAX_FLEETS} fleets allowed per player.`;
      this.logging.error(error, metadata);
      throw new Error(error);
    }
  }

  private buildFleetObject(
    game: GameState,
    location: FleetLocation,
    ownerId: string,
    baseNameSource?: string,
  ): Fleet {
    return {
      id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: this.namingService.generateFleetName(game, ownerId, baseNameSource || 'Fleet'),
      ownerId: ownerId,
      location: this.resolveLocation(location),
      ships: [],
      fuel: 0,
      cargo: this.getInitialCargo(),
      orders: [],
    };
  }

  private resolveLocation(location: FleetLocation): Fleet['location'] {
    if (location.type === 'orbit') {
      return { type: 'orbit', planetId: location.planetId! };
    }
    return { type: 'space', x: location.x!, y: location.y! };
  }

  private getInitialCargo() {
    return {
      resources: 0,
      minerals: { ironium: 0, boranium: 0, germanium: 0 },
      colonists: 0,
    };
  }

  private ensureFleetExists(
    game: GameState,
    planet: Planet,
    designId: string,
    isNewShipStarbase: boolean,
  ): Fleet {
    let fleet = this.findTargetFleet(game, planet, isNewShipStarbase);
    if (!fleet) {
      fleet = this.createFleet(
        game,
        { type: 'orbit', planetId: planet.id },
        game.humanPlayer.id,
        designId,
      );
    }
    return fleet;
  }
}