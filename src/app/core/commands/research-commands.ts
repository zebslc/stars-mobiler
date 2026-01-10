import { GameCommand } from './game-command.interface';
import { GameState } from '../../models/game.model';
import { TechField } from '../../data/tech-tree.data';
import { ResearchService } from '../../services/research.service';

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