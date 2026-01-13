import { GameCommand } from './game-command.interface';
import { GameState, ShipDesign } from '../../models/game.model';
import { ShipyardService } from '../../services/ship-design/shipyard.service';

/**
 * Command to save a ship design.
 */
export class SaveShipDesignCommand implements GameCommand {
  constructor(
    private shipyardService: ShipyardService,
    private design: ShipDesign
  ) {}

  execute(game: GameState): GameState {
    return this.shipyardService.saveShipDesign(game, this.design);
  }
}

/**
 * Command to delete a ship design.
 */
export class DeleteShipDesignCommand implements GameCommand {
  constructor(
    private shipyardService: ShipyardService,
    private designId: string
  ) {}

  execute(game: GameState): GameState {
    return this.shipyardService.deleteShipDesign(game, this.designId);
  }
}