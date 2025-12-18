import { Injectable } from '@angular/core';
import { GameState } from '../models/game.model';
import { TECH_FIELDS, TechField } from '../data/tech-tree.data';

@Injectable({ providedIn: 'root' })
export class ResearchService {
  constructor() {}

  advanceResearch(game: GameState, totalRP: number) {
    // All research goes into the selected field
    const field = game.humanPlayer.selectedResearchField;
    game.humanPlayer.researchProgress[field] += totalRP;

    // Check if we've reached the next level
    const currentLevel = game.humanPlayer.techLevels[field];
    if (currentLevel >= 26) return; // Max level

    const techInfo = TECH_FIELDS[field];
    const nextLevel = techInfo.levels[currentLevel + 1];

    if (nextLevel && game.humanPlayer.researchProgress[field] >= nextLevel.cost) {
      // Level up!
      game.humanPlayer.techLevels[field]++;
      game.humanPlayer.researchProgress[field] -= nextLevel.cost;

      // TODO: Show notification to player about tech advancement
      console.log(`Advanced ${techInfo.name} to level ${game.humanPlayer.techLevels[field]}`);
    }
  }

  setResearchField(game: GameState, fieldId: TechField): GameState {
    // Update the player's selected research field immutably
    const nextPlayer = { ...game.humanPlayer, selectedResearchField: fieldId };

    // Create new references to trigger signal updates with OnPush
    const nextGame = {
      ...game,
      humanPlayer: nextPlayer,
      stars: [...game.stars],
      fleets: [...game.fleets],
    };
    return nextGame;
  }
}
