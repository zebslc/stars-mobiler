import { Injectable } from '@angular/core';
import { GameState, Fleet, Star } from '../../models/game.model';
import { LogContext } from '../../models/service-interfaces.model';
import { LoggingService } from '../core/logging.service';

export interface CargoManifest {
  resources?: number | 'all' | 'fill';
  ironium?: number | 'all' | 'fill';
  boranium?: number | 'all' | 'fill';
  germanium?: number | 'all' | 'fill';
  colonists?: number | 'all' | 'fill';
}

@Injectable({ providedIn: 'root' })
export class FleetCargoService {
  constructor(private logging: LoggingService) {}

  loadCargo(game: GameState, fleetId: string, starId: string, manifest: CargoManifest): GameState {
    const context: LogContext = {
      service: 'FleetCargoService',
      operation: 'loadCargo',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { starId, manifest },
    };

    this.logging.debug(`Loading cargo from planet ${starId}`, context);

    const originalFleet = game.fleets.find(
      (f) => f.id === fleetId && f.ownerId === game.humanPlayer.id,
    );
    const planetIndex = this.buildPlanetIndex(game);
    const originalPlanet = planetIndex.get(starId);

    if (!originalFleet || !originalPlanet) {
      this.logging.error('Fleet or planet not found for cargo loading', context);
      return game;
    }

    // Create deep copies to avoid mutating original objects
    const fleet = structuredClone(originalFleet);
    const planet = structuredClone(originalPlanet);

    const capacity = this.calculateCargoCapacity(game, fleet);
    let used = this.calculateCargoUsed(fleet);
    const free = Math.max(0, capacity - used);

    this.logging.debug(`Cargo capacity: ${capacity}, used: ${used}, free: ${free}`, {
      ...context,
      additionalData: { ...context.additionalData, capacity, used, free },
    });

    const takeMineral = (
      key: 'ironium' | 'boranium' | 'germanium',
      req?: number | 'all' | 'fill',
    ) => {
      if (!req) return;
      const available = planet.surfaceMinerals[key];
      const room = Math.max(0, free - (this.calculateCargoUsed(fleet) - used));
      const wanted =
        req === 'all' ? available : req === 'fill' ? room : Math.max(0, Math.floor(req));
      const take = Math.min(wanted, available, room);

      planet.surfaceMinerals[key] -= take;
      fleet.cargo.minerals[key] += take;
      used += take;

      if (take > 0) {
        this.logging.debug(`Loaded ${take} ${key}`, {
          ...context,
          additionalData: { ...context.additionalData, mineral: key, amount: take },
        });
      }
    };

    takeMineral('ironium', manifest.ironium);
    takeMineral('boranium', manifest.boranium);
    takeMineral('germanium', manifest.germanium);

    if (manifest.resources) {
      const available = planet.resources;
      const room = Math.max(0, free - (this.calculateCargoUsed(fleet) - used));
      const wanted =
        manifest.resources === 'all'
          ? available
          : manifest.resources === 'fill'
            ? room
            : Math.max(0, Math.floor(manifest.resources));
      const take = Math.min(wanted, available, room);

      planet.resources -= take;
      fleet.cargo.resources += take;
      used += take;

      if (take > 0) {
        this.logging.debug(`Loaded ${take} resources`, {
          ...context,
          additionalData: { ...context.additionalData, resources: take },
        });
      }
    }

    if (manifest.colonists) {
      const availablePeople = planet.population;
      const roomKT = Math.max(0, capacity - this.calculateCargoUsed(fleet));
      const roomPeople = roomKT * 1000;
      const wantedPeople =
        manifest.colonists === 'all'
          ? availablePeople
          : manifest.colonists === 'fill'
            ? roomPeople
            : Math.max(0, Math.floor(manifest.colonists));
      const takePeople = Math.min(wantedPeople, availablePeople, roomPeople);

      planet.population = Math.max(0, planet.population - takePeople);
      fleet.cargo.colonists += takePeople;

      if (takePeople > 0) {
        this.logging.debug(`Loaded ${takePeople} colonists`, {
          ...context,
          additionalData: { ...context.additionalData, colonists: takePeople },
        });
      }
    }

    this.logging.info(`Cargo loading completed for fleet ${fleet.name}`, context);

    // Create new game state with updated fleet and star
    const updatedFleets = game.fleets.map((f) => (f.id === fleet.id ? fleet : f));
    const updatedStars = game.stars.map((star) => (star.id === planet.id ? planet : star));

    return { ...game, stars: updatedStars, fleets: updatedFleets };
  }

  unloadCargo(
    game: GameState,
    fleetId: string,
    starId: string,
    manifest: {
      resources?: number | 'all';
      ironium?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    },
  ): GameState {
    const context: LogContext = {
      service: 'FleetCargoService',
      operation: 'unloadCargo',
      entityId: fleetId,
      entityType: 'fleet',
      additionalData: { starId, manifest },
    };

    this.logging.debug(`Unloading cargo to planet ${starId}`, context);

    const originalFleet = game.fleets.find(
      (f) => f.id === fleetId && f.ownerId === game.humanPlayer.id,
    );
    const planetIndex = this.buildPlanetIndex(game);
    const originalPlanet = planetIndex.get(starId);

    if (!originalFleet || !originalPlanet) {
      this.logging.error('Fleet or planet not found for cargo unloading', context);
      return game;
    }

    // Create deep copies to avoid mutating original objects
    const fleet = structuredClone(originalFleet);
    const planet = structuredClone(originalPlanet);

    const giveMineral = (key: 'ironium' | 'boranium' | 'germanium', req?: number | 'all') => {
      if (!req) return;
      const available = fleet.cargo.minerals[key];
      const wanted = req === 'all' ? available : Math.max(0, Math.floor(req));
      const give = Math.min(wanted, available);

      fleet.cargo.minerals[key] -= give;
      planet.surfaceMinerals[key] += give;

      if (give > 0) {
        this.logging.debug(`Unloaded ${give} ${key}`, {
          ...context,
          additionalData: { ...context.additionalData, mineral: key, amount: give },
        });
      }
    };

    giveMineral('ironium', manifest.ironium);
    giveMineral('boranium', manifest.boranium);
    giveMineral('germanium', manifest.germanium);

    if (manifest.resources) {
      const available = fleet.cargo.resources;
      const wanted =
        manifest.resources === 'all'
          ? available
          : Math.max(0, Math.floor(manifest.resources as number));
      const give = Math.min(wanted, available);

      fleet.cargo.resources -= give;
      planet.resources += give;

      if (give > 0) {
        this.logging.debug(`Unloaded ${give} resources`, {
          ...context,
          additionalData: { ...context.additionalData, resources: give },
        });
      }
    }

    if (manifest.colonists) {
      const availablePeople = fleet.cargo.colonists;
      const wantedPeople =
        manifest.colonists === 'all'
          ? availablePeople
          : Math.max(0, Math.floor(manifest.colonists as number));
      const givePeople = Math.min(wantedPeople, availablePeople);

      fleet.cargo.colonists -= givePeople;
      planet.population += givePeople;

      if (givePeople > 0) {
        this.logging.debug(`Unloaded ${givePeople} colonists`, {
          ...context,
          additionalData: { ...context.additionalData, colonists: givePeople },
        });
      }
    }

    this.logging.info(`Cargo unloading completed for fleet ${fleet.name}`, context);

    // Create new game state with updated fleet and star
    const updatedFleets = game.fleets.map((f) => (f.id === fleet.id ? fleet : f));
    const updatedStars = game.stars.map((star) => (star.id === planet.id ? planet : star));

    return { ...game, stars: updatedStars, fleets: updatedFleets };
  }

  private buildPlanetIndex(game: GameState): Map<string, Star> {
    const index = new Map<string, Star>();
    for (const star of game.stars) {
      index.set(star.id, star);
    }
    return index;
  }

  private calculateCargoCapacity(game: GameState, fleet: Fleet): number {
    return fleet.ships.reduce((sum, s) => {
      const d = this.getShipDesign(game, s.designId);
      return sum + (d.cargoCapacity || 0) * s.count;
    }, 0);
  }

  private calculateCargoUsed(fleet: Fleet): number {
    const resourcesUsed = fleet.cargo.resources;
    const mineralsUsed =
      fleet.cargo.minerals.ironium + fleet.cargo.minerals.boranium + fleet.cargo.minerals.germanium;
    const colonistUsed = Math.floor(fleet.cargo.colonists / 1000); // 1 kT per 1000 colonists
    return resourcesUsed + mineralsUsed + colonistUsed;
  }

  private getShipDesign(game: GameState, designId: string): any {
    const dynamicDesign = game.shipDesigns.find((d) => d.id === designId);
    if (dynamicDesign?.spec) {
      return {
        ...dynamicDesign.spec,
        cargoCapacity: dynamicDesign.spec.cargoCapacity || 0,
      };
    }
    // Fallback for legacy designs
    return { cargoCapacity: 0 };
  }
}