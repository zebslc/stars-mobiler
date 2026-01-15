import { Injectable, inject } from '@angular/core';
import { GameContext } from '../../models/logging.model';
import { GameStateService } from '../game/game-state.service';

/**
 * Provider for game-specific context information.
 * Integrates with GameStateService to capture current game state, player info, and turn number.
 */
@Injectable({
  providedIn: 'root',
})
export class GameContextProvider {
  private readonly gameState = inject(GameStateService);

  /**
   * Capture comprehensive game context information
   */
  getContext(): GameContext | undefined {
    const game = this.gameState.game();

    if (!game) {
      return undefined;
    }

    const player = this.gameState.player();

    return {
      gameId: game.id,
      turn: this.gameState.turn(),
      playerId: player?.id,
      currentScreen: this.getCurrentScreen(),
      selectedStar: this.getSelectedStar(),
      selectedFleet: this.getSelectedFleet(),
      gameState: this.getGameState(),
    };
  }

  /**
   * Get current screen/route information
   */
  private getCurrentScreen(): string | undefined {
    // Extract screen name from current URL path
    const path = window.location.pathname;
    const segments = path.split('/').filter((segment) => segment.length > 0);

    if (segments.length === 0) {
      return 'home';
    }

    // Return the first segment as the screen name
    return segments[0];
  }

  /**
   * Get currently selected star ID if any
   */
  private getSelectedStar(): string | undefined {
    // Check URL parameters for star selection
    const urlParams = new URLSearchParams(window.location.search);
    const starId = urlParams.get('star') || urlParams.get('starId');

    if (starId) {
      return starId;
    }

    // Check route parameters for star detail screen
    const path = window.location.pathname;
    const starMatch = path.match(/\/star\/([^\/]+)/);
    if (starMatch) {
      return starMatch[1];
    }

    return undefined;
  }

  /**
   * Get currently selected fleet ID if any
   */
  private getSelectedFleet(): string | undefined {
    // Check URL parameters for fleet selection
    const urlParams = new URLSearchParams(window.location.search);
    const fleetId = urlParams.get('fleet') || urlParams.get('fleetId');

    if (fleetId) {
      return fleetId;
    }

    // Check route parameters for fleet detail screen
    const path = window.location.pathname;
    const fleetMatch = path.match(/\/fleet\/([^\/]+)/);
    if (fleetMatch) {
      return fleetMatch[1];
    }

    return undefined;
  }

  /**
   * Determine current game state
   */
  private getGameState(): GameContext['gameState'] {
    const game = this.gameState.game();

    if (!game) {
      return 'loading';
    }

    // Check if game is in an error state
    try {
      // Basic validation of game state
      if (!game.stars || game.stars.length === 0) {
        return 'error';
      }

      if (!game.humanPlayer) {
        return 'error';
      }

      // If we're on a loading screen or the game is initializing
      if (this.getCurrentScreen() === 'new-game') {
        return 'loading';
      }

      // Default to playing state
      return 'playing';
    } catch (error) {
      return 'error';
    }
  }

  /**
   * Get detailed game statistics for context
   */
  getGameStatistics(): Record<string, any> {
    const game = this.gameState.game();
    const player = this.gameState.player();

    if (!game || !player) {
      return {};
    }

    const playerStars = game.stars.filter((star) => star.ownerId === player.id);

    const playerFleets = game.fleets?.filter((fleet) => fleet.ownerId === player.id) || [];

    return {
      turn: this.gameState.turn(),
      totalStars: game.stars.length,
      playerStars: playerStars.length,
      playerFleets: playerFleets.length,
      playerSpecies: player.species?.name,
      gameSettings: {
        galaxySize: game.settings?.galaxySize,
        aiDifficulty: game.settings?.aiDifficulty,
      },
    };
  }

  /**
   * Get current player research information
   */
  getResearchContext(): Record<string, any> {
    const game = this.gameState.game();
    const player = this.gameState.player();

    if (!game || !player) {
      return {};
    }

    return {
      currentField: player.selectedResearchField,
      researchPoints: player.researchProgress || {},
      techLevels: player.techLevels || {},
    };
  }

  /**
   * Get current economic context
   */
  getEconomicContext(): Record<string, any> {
    const economy = this.gameState.playerEconomy();

    if (!economy) {
      return {};
    }

    return {
      freighterCapacity: economy.freighterCapacity || 0,
      researchCapacity: economy.research || 0,
    };
  }

  /**
   * Get context for error reporting with game state snapshot
   */
  getErrorContext(): Record<string, any> {
    const context = this.getContext();

    if (!context) {
      return { gameLoaded: false };
    }

    return {
      ...context,
      gameLoaded: true,
      statistics: this.getGameStatistics(),
      research: this.getResearchContext(),
      economy: this.getEconomicContext(),
      timestamp: Date.now(),
    };
  }
}