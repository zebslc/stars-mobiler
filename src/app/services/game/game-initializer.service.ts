import { Injectable } from '@angular/core';
import {
  GameSettings,
  GameState,
  Player,
  AIPlayer,
  Planet,
  ShipDesign,
  Fleet,
} from '../../models/game.model';
import { GALAXY_SIZES } from '../../core/constants/galaxy.constants';
import { GalaxyGeneratorService } from './galaxy-generator.service';
import { SPECIES } from '../../data/species.data';
import { getHull } from '../../utils/data-access.util';
import { createEmptyDesign } from '../../models/ship-design.model';

@Injectable({ providedIn: 'root' })
export class GameInitializerService {
  constructor(private galaxy: GalaxyGeneratorService) {}

  initializeGame(settings: GameSettings): GameState {
    const starCount =
      settings.galaxySize === 'small' ? 16 : settings.galaxySize === 'medium' ? 24 : 36;
    const sizeConfig = GALAXY_SIZES[settings.galaxySize];
    const stars = this.galaxy.generateGalaxy(
      starCount,
      settings.seed,
      sizeConfig.width,
      sizeConfig.height,
    );
    const playerSpecies = SPECIES.find((s) => s.id === settings.speciesId)!;
    const aiSpecies = SPECIES.find((s) => s.id !== settings.speciesId)!;

    const human: Player = {
      id: 'human',
      name: 'You',
      species: playerSpecies,
      ownedPlanetIds: [],
      techLevels: {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
      },
      researchProgress: {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      },
      selectedResearchField: 'Propulsion',
    };
    const ai: AIPlayer = {
      id: 'ai-1',
      name: 'AI',
      species: aiSpecies,
      ownedPlanetIds: [],
      techLevels: {
        Energy: 1,
        Kinetics: 1,
        Propulsion: 1,
        Construction: 1,
      },
      researchProgress: {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      },
      selectedResearchField: 'Propulsion',
      brain: { personality: 'expansionist', difficulty: settings.aiDifficulty },
    };

    this.galaxy.assignStartPositions(
      stars,
      human.id,
      ai.id,
      playerSpecies,
      aiSpecies,
      settings.seed,
    );
    // Fill starId in planets and set ownership/homeworlds
    const planetMap = new Map<string, Planet>();
    for (const star of stars) {
      for (const planet of star.planets) {
        planet.starId = star.id;
        planetMap.set(planet.name, planet);
      }
    }
    const humanHome = planetMap.get('Home');
    const aiHome = planetMap.get('Enemy Home');
    if (humanHome) {
      humanHome.ownerId = human.id;
      humanHome.resources = 100;
      humanHome.surfaceMinerals.ironium += 200;
      humanHome.surfaceMinerals.boranium += 150;
      humanHome.surfaceMinerals.germanium += 100;
      humanHome.buildQueue = [];
      humanHome.governor = { type: 'balanced' };
      human.ownedPlanetIds.push(humanHome.id);
    }

    // Initial Space Station
    const ssDesignId = `design-${settings.seed}-init`;
    const ssFleetId = `fleet-${settings.seed}-init`;

    // Use createEmptyDesign to ensure slots are properly initialized from the hull definition
    const ssHull = getHull('Space Station');
    let ssDesign: ShipDesign;

    if (ssHull) {
      ssDesign = createEmptyDesign(ssHull, human.id, 1);
      ssDesign.id = ssDesignId;
      ssDesign.name = 'Space Station';
      // Manually set spec for initial station (it has no components but is valid)
      ssDesign.spec = {
        warpSpeed: 0,
        fuelCapacity: 0,
        idealWarp: 0,
        isRamscoop: false,
        firepower: 0,
        armor: 500,
        shields: 0,
        accuracy: 1,
        initiative: 1,
        cargoCapacity: 0,
        colonistCapacity: 0,
        scanRange: 0,
        penScanRange: 0,
        canDetectCloaked: false,
        miningRate: 0,
        terraformRate: 0,
        bombing: { kill: 0, destroy: 0 },
        massDriver: { speed: 0, catch: 0 },
        maxWeaponRange: 0,
        mass: 0,
        cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
        hasEngine: false,
        hasColonyModule: false,
        isStarbase: true,
        isValid: true,
        validationErrors: [],
        components: [],
      };
    } else {
      console.warn('Space Station hull not found, creating legacy fallback design');
      ssDesign = {
        id: ssDesignId,
        name: 'Space Station',
        hullId: 'space_station',
        playerId: human.id,
        createdTurn: 1,
        slots: [],
        spec: {
          warpSpeed: 0,
          fuelCapacity: 0,
          idealWarp: 0,
          isRamscoop: false,
          firepower: 0,
          armor: 500,
          shields: 0,
          accuracy: 1,
          initiative: 1,
          cargoCapacity: 0,
          colonistCapacity: 0,
          scanRange: 0,
          penScanRange: 0,
          canDetectCloaked: false,
          miningRate: 0,
          terraformRate: 0,
          bombing: { kill: 0, destroy: 0 },
          massDriver: { speed: 0, catch: 0 },
          maxWeaponRange: 0,
          mass: 0,
          cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
          hasEngine: false,
          hasColonyModule: false,
          isStarbase: true,
          isValid: true,
          validationErrors: [],
          components: [],
        },
      };
    }

    const ssFleet: Fleet = {
      id: ssFleetId,
      name: 'Space Station',
      ownerId: human.id,
      location: { type: 'orbit', planetId: humanHome ? humanHome.id : '' },
      ships: [{ designId: ssDesignId, count: 1, damage: 0 }],
      fuel: 0,
      cargo: {
        resources: 0,
        minerals: { ironium: 0, boranium: 0, germanium: 0 },
        colonists: 0,
      },
      orders: [],
    };

    if (aiHome) {
      aiHome.ownerId = ai.id;
      ai.ownedPlanetIds.push(aiHome.id);
    }

    const state: GameState = {
      id: `game-${Date.now()}`,
      seed: settings.seed,
      turn: 1,
      settings,
      stars,
      humanPlayer: human,
      aiPlayers: [ai],
      fleets: [ssFleet],
      playerEconomy: {
        freighterCapacity: 100,
        research: 0,
      },
      shipDesigns: [ssDesign],
    };
    
    return state;
  }
}
