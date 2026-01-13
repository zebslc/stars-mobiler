import { Injectable } from '@angular/core';
import { GameState, Fleet, Planet, ShipDesign } from '../models/game.model';
import { 
  IFleetOperationsService, 
  FleetLocation, 
  ValidationResult,
  LogContext 
} from '../models/service-interfaces.model';
import { getDesign } from '../data/ships.data';
import { LoggingService } from './logging.service';
import { FleetNamingService } from './fleet-naming.service';
import { FleetValidationService } from './fleet-validation.service';

@Injectable({ providedIn: 'root' })
export class FleetOperationsService implements IFleetOperationsService {
  readonly MAX_FLEETS = 512;
  readonly MAX_SHIPS_PER_DESIGN = 32000;

  constructor(
    private logging: LoggingService,
    private namingService: FleetNamingService,
    private validationService: FleetValidationService
  ) {}

  createFleet(
    game: GameState,
    location: FleetLocation,
    ownerId: string,
    baseNameSource?: string
  ): Fleet {
    const context: LogContext = {
      service: 'FleetOperationsService',
      operation: 'createFleet',
      entityId: ownerId,
      entityType: 'player',
      additionalData: { location, baseNameSource }
    };

    this.logging.debug('Creating new fleet', context);

    // Check fleet limit
    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    if (playerFleets.length >= this.MAX_FLEETS) {
      const error = `Maximum of ${this.MAX_FLEETS} fleets allowed per player.`;
      this.logging.error(error, context);
      throw new Error(error);
    }

    // Generate fleet name
    const fleetName = this.namingService.generateFleetName(game, ownerId, baseNameSource || 'Fleet');

    const fleet: Fleet = {
      id: `fleet-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: fleetName,
      ownerId: ownerId,
      location: location.type === 'orbit' 
        ? { type: 'orbit', planetId: location.planetId! }
        : { type: 'space', x: location.x!, y: location.y! },
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
    
    this.logging.info(`Fleet created: ${fleet.name}`, {
      ...context,
      entityId: fleet.id,
      entityType: 'fleet'
    });

    return fleet;
  }

  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void {
    const context: LogContext = {
      service: 'FleetOperationsService',
      operation: 'addShipToFleet',
      entityId: planet.id,
      entityType: 'planet',
      additionalData: { shipDesignId, count }
    };

    this.logging.debug(`Adding ${count} ships of design ${shipDesignId} to fleet`, context);

    const designId = shipDesignId ?? 'scout';
    const shipDesign = game.shipDesigns.find((d) => d.id === designId);
    const legacyDesign = getDesign(designId);

    const isNewShipStarbase = shipDesign?.spec?.isStarbase ?? legacyDesign?.isStarbase ?? false;

    // Find or create fleet
    const orbitFleets = game.fleets.filter(
      (f) =>
        f.ownerId === game.humanPlayer.id &&
        f.location.type === 'orbit' &&
        (f.location as FleetLocation).planetId === planet.id,
    );

    let fleet: Fleet | undefined;

    if (isNewShipStarbase) {
      // Look for existing starbase fleet to merge into
      fleet = orbitFleets.find((f) =>
        f.ships.some((s) => {
          const d = game.shipDesigns.find((sd) => sd.id === s.designId);
          const ld = getDesign(s.designId);
          return d?.spec?.isStarbase ?? ld?.isStarbase;
        }),
      );
    } else {
      // Look for existing regular fleet (non-starbase)
      fleet = orbitFleets.find(
        (f) =>
          !f.ships.some((s) => {
            const d = game.shipDesigns.find((sd) => sd.id === s.designId);
            const ld = getDesign(s.designId);
            return d?.spec?.isStarbase ?? ld?.isStarbase;
          }),
      );
    }

    if (!fleet) {
      fleet = this.createFleet(
        game,
        { type: 'orbit', planetId: planet.id },
        game.humanPlayer.id,
        designId,
      );
    }

    // Validate ship addition
    const validation = this.validationService.validateShipAddition(fleet, designId, count);
    if (!validation.isValid) {
      const error = validation.errors.join(', ');
      this.logging.error(`Ship addition validation failed: ${error}`, context);
      throw new Error(error);
    }

    const stack = fleet.ships.find((s) => s.designId === designId && (s.damage || 0) === 0);
    if (stack) {
      if (stack.count + count > this.MAX_SHIPS_PER_DESIGN) {
        const error = `Cannot add ships: Fleet '${fleet.name}' already has ${stack.count} ships of design '${designId}' (Max: ${this.MAX_SHIPS_PER_DESIGN})`;
        this.logging.error(error, context);
        throw new Error(error);
      }
      stack.count += count;
    } else {
      if (count > this.MAX_SHIPS_PER_DESIGN) {
        const error = `Cannot add ships: Amount ${count} exceeds max ships per design (${this.MAX_SHIPS_PER_DESIGN})`;
        this.logging.error(error, context);
        throw new Error(error);
      }
      fleet.ships.push({ designId, count, damage: 0 });
    }

    // Add starting fuel
    const fuelCap = shipDesign?.spec?.fuelCapacity ?? legacyDesign?.fuelCapacity ?? 0;
    fleet.fuel += fuelCap * count;

    // Preload colonists if colony ship
    const hasColony = shipDesign?.spec?.hasColonyModule ?? legacyDesign?.colonyModule;
    const colCap = shipDesign?.spec?.colonistCapacity ?? legacyDesign?.colonistCapacity;

    if (hasColony && colCap) {
      const totalColCap = colCap * count;
      const amount = Math.min(totalColCap, planet.population);
      planet.population -= amount;
      fleet.cargo.colonists += amount;
      
      this.logging.debug(`Loaded ${amount} colonists onto colony ship`, {
        ...context,
        additionalData: { ...context.additionalData, colonistsLoaded: amount }
      });
    }

    this.logging.info(`Added ${count} ships of design ${designId} to fleet ${fleet.name}`, {
      ...context,
      entityId: fleet.id,
      entityType: 'fleet'
    });
  }

  validateFleetLimits(game: GameState, ownerId: string): boolean {
    const context: LogContext = {
      service: 'FleetOperationsService',
      operation: 'validateFleetLimits',
      entityId: ownerId,
      entityType: 'player'
    };

    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    const isValid = playerFleets.length < this.MAX_FLEETS;

    this.logging.debug(`Fleet limit validation: ${playerFleets.length}/${this.MAX_FLEETS}`, {
      ...context,
      additionalData: { currentFleets: playerFleets.length, maxFleets: this.MAX_FLEETS, isValid }
    });

    return isValid;
  }
}