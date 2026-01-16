import type { GameCommand } from './game-command.interface';
import type { GameState } from '../../models/game.model';
import type { TechField } from '../../data/tech-tree.data';
import type { ResearchService } from '../../services/tech/research.service';

/**
 * Command to set the current research field.
 */
export class SetResearchFieldCommand implements GameCommand {
  constructor(
    private researchService: ResearchService,
    private fieldId: TechField
  ) {}

  execute(game: GameState): GameState {
    return this.researchService.setResearchField(game, this.fieldId);
  }
}