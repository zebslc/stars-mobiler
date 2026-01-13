import { Injectable } from '@angular/core';
import { GameState } from '../../models/game.model';
import { IFleetNamingService, LogContext } from '../../models/service-interfaces.model';
import { getDesign } from '../../data/ships.data';
import { LoggingService } from '../core/logging.service';

@Injectable({ providedIn: 'root' })
export class FleetNamingService implements IFleetNamingService {

  constructor(private logging: LoggingService) {}

  generateFleetName(game: GameState, ownerId: string, baseName: string): string {
    const context: LogContext = {
      service: 'FleetNamingService',
      operation: 'generateFleetName',
      entityId: ownerId,
      entityType: 'player',
      additionalData: { baseName }
    };

    this.logging.debug(`Generating fleet name with base: ${baseName}`, context);

    // Get the actual base name from ship design if provided
    let actualBaseName = baseName;
    if (baseName !== 'Fleet') {
      const userDesign = game.shipDesigns.find((d) => d.id === baseName);
      const legacyDesign = getDesign(baseName);
      actualBaseName = userDesign?.name || legacyDesign?.name || baseName;
    }

    const sameNameFleets = game.fleets.filter(
      (f) => f.ownerId === ownerId && f.name && f.name.startsWith(actualBaseName),
    );

    let maxNum = 0;
    const escapedBaseName = actualBaseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedBaseName}-(\\d+)$`);
    
    for (const f of sameNameFleets) {
      const match = f.name.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const newName = `${actualBaseName}-${maxNum + 1}`;
    
    this.logging.debug(`Generated fleet name: ${newName}`, {
      ...context,
      additionalData: { ...context.additionalData, generatedName: newName, nextNumber: maxNum + 1 }
    });

    return newName;
  }

  validateFleetName(name: string): boolean {
    const context: LogContext = {
      service: 'FleetNamingService',
      operation: 'validateFleetName',
      additionalData: { name }
    };

    const isValid = !!(name && name.trim().length > 0 && name.length <= 50);
    
    this.logging.debug(`Fleet name validation: ${name} -> ${isValid}`, {
      ...context,
      additionalData: { ...context.additionalData, isValid }
    });

    return isValid;
  }

  getAvailableFleetNames(game: GameState, ownerId: string): string[] {
    const context: LogContext = {
      service: 'FleetNamingService',
      operation: 'getAvailableFleetNames',
      entityId: ownerId,
      entityType: 'player'
    };

    const playerFleets = game.fleets.filter((f) => f.ownerId === ownerId);
    const usedNames = playerFleets.map((f) => f.name);
    
    // Generate some suggested names based on ship designs
    const suggestions: string[] = [];
    for (const design of game.shipDesigns.filter(d => d.playerId === ownerId)) {
      const baseName = design.name;
      let counter = 1;
      let suggestedName = `${baseName}-${counter}`;
      
      while (usedNames.includes(suggestedName) && counter <= 10) {
        counter++;
        suggestedName = `${baseName}-${counter}`;
      }
      
      if (!usedNames.includes(suggestedName)) {
        suggestions.push(suggestedName);
      }
    }

    this.logging.debug(`Generated ${suggestions.length} available fleet names`, {
      ...context,
      additionalData: { suggestionsCount: suggestions.length, usedNamesCount: usedNames.length }
    });

    return suggestions;
  }
}