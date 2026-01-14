import { Injectable } from '@angular/core';
import { BuildItem, GameState, Planet, PlayerTech } from '../../models/game.model';
import { FleetService } from '../fleet/fleet.service';
import { PLANETARY_SCANNER_COMPONENTS } from '../../data/techs/planetary.data';
import { TechRequirement } from '../../data/tech-atlas.types';

const DEFAULT_SCANNER_RANGE = 50;

@Injectable({ providedIn: 'root' })
export class BuildProjectService {
  
  constructor(private fleet: FleetService) {}

  /**
   * Execute a completed build project.
   */
  executeBuildProject(game: GameState, planet: Planet, item: BuildItem): void {
    const projectHandlers = this.getProjectHandlers();
    const handler = projectHandlers[item.project];
    
    if (handler) {
      handler(game, planet, item);
    }
  }

  /**
   * Get project handler functions.
   */
  private getProjectHandlers() {
    return {
      'mine': (_game: GameState, planet: Planet) => this.buildMine(planet),
      'factory': (_game: GameState, planet: Planet) => this.buildFactory(planet),
      'defense': (_game: GameState, planet: Planet) => this.buildDefense(planet),
      'research': (_game: GameState, planet: Planet) => this.buildResearch(planet),
      'scanner': (game: GameState, planet: Planet) => this.buildScanner(game, planet),
      'terraform': (game: GameState, planet: Planet) => this.executeTerraform(game, planet),
      'ship': (game: GameState, planet: Planet, item: BuildItem) => this.buildShip(game, planet, item),
    };
  }

  /**
   * Build a mine on the planet.
   */
  private buildMine(planet: Planet): void {
    planet.mines += 1;
  }

  /**
   * Build a factory on the planet.
   */
  private buildFactory(planet: Planet): void {
    planet.factories += 1;
  }

  /**
   * Build a defense on the planet.
   */
  private buildDefense(planet: Planet): void {
    planet.defenses += 1;
  }

  /**
   * Build a research facility on the planet.
   */
  private buildResearch(planet: Planet): void {
    planet.research = (planet.research || 0) + 1;
  }

  /**
   * Build a scanner on the planet.
   */
  private buildScanner(game: GameState, planet: Planet): void {
    const bestRange = this.findBestScannerRange(game.humanPlayer.techLevels);
    planet.scanner = bestRange > 0 ? bestRange : DEFAULT_SCANNER_RANGE;
  }

  /**
   * Find the best scanner range available for given tech levels.
   */
  findBestScannerRange(techLevels: PlayerTech): number {
    let bestRange = 0;
    for (const scanner of PLANETARY_SCANNER_COMPONENTS) {
      if (this.meetsRequirements(techLevels, scanner.tech)) {
        const scanRange = scanner.stats?.scan || 0;
        if (scanRange > bestRange) bestRange = scanRange;
      }
    }
    return bestRange;
  }

  /**
   * Check if player tech levels meet component requirements.
   */
  meetsRequirements(techLevels: PlayerTech, requirements?: TechRequirement): boolean {
    if (!requirements) return true;
    return (
      techLevels.Energy >= (requirements.Energy ?? 0) &&
      techLevels.Kinetics >= (requirements.Kinetics ?? 0) &&
      techLevels.Propulsion >= (requirements.Propulsion ?? 0) &&
      techLevels.Construction >= (requirements.Construction ?? 0)
    );
  }

  /**
   * Execute terraforming on the planet.
   */
  private executeTerraform(game: GameState, planet: Planet): void {
    planet.temperature +=
      planet.temperature < game.humanPlayer.species.habitat.idealTemperature ? 1 : -1;
    planet.atmosphere +=
      planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere ? 1 : -1;
  }

  /**
   * Build a ship on the planet.
   */
  private buildShip(game: GameState, planet: Planet, item: BuildItem): void {
    const designId = item.shipDesignId ?? 'scout';
    this.fleet.addShipToFleet(game, planet, designId, 1);
  }
}