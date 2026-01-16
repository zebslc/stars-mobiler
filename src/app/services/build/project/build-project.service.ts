import { Injectable } from '@angular/core';
import { BuildItem, GameState, Star, PlayerTech } from '../../../models/game.model';
import { FleetService } from '../../fleet/core/fleet.service';
import { PLANETARY_SCANNER_COMPONENTS } from '../../../data/techs/planetary.data';
import { TechRequirement } from '../../../data/tech-atlas.types';

const DEFAULT_SCANNER_RANGE = 50;

@Injectable({ providedIn: 'root' })
export class BuildProjectService {
  
  constructor(private fleet: FleetService) {}

  /**
   * Execute a completed build project.
   */
  executeBuildProject(game: GameState, planet: Star, item: BuildItem): void {
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
      'mine': (_game: GameState, planet: Star) => this.buildMine(planet),
      'factory': (_game: GameState, planet: Star) => this.buildFactory(planet),
      'defense': (_game: GameState, planet: Star) => this.buildDefense(planet),
      'research': (_game: GameState, planet: Star) => this.buildResearch(planet),
      'scanner': (game: GameState, planet: Star) => this.buildScanner(game, planet),
      'terraform': (game: GameState, planet: Star) => this.executeTerraform(game, planet),
      'ship': (game: GameState, planet: Star, item: BuildItem) => this.buildShip(game, planet, item),
    };
  }

  /**
   * Build a mine on the planet.
   */
  private buildMine(planet: Star): void {
    planet.mines += 1;
  }

  /**
   * Build a factory on the planet.
   */
  private buildFactory(planet: Star): void {
    planet.factories += 1;
  }

  /**
   * Build a defense on the planet.
   */
  private buildDefense(planet: Star): void {
    planet.defenses += 1;
  }

  /**
   * Build a research facility on the planet.
   */
  private buildResearch(planet: Star): void {
    planet.research = (planet.research || 0) + 1;
  }

  /**
   * Build a scanner on the planet.
   */
  private buildScanner(game: GameState, planet: Star): void {
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
  private executeTerraform(game: GameState, planet: Star): void {
    planet.temperature +=
      planet.temperature < game.humanPlayer.species.habitat.idealTemperature ? 1 : -1;
    planet.atmosphere +=
      planet.atmosphere < game.humanPlayer.species.habitat.idealAtmosphere ? 1 : -1;
  }

  /**
   * Build a ship on the planet.
   */
  private buildShip(game: GameState, planet: Star, item: BuildItem): void {
    const designId = item.shipDesignId ?? 'scout';
    this.fleet.addShipToFleet(game, planet, designId, 1);
  }
}