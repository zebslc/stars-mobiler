import { Injectable } from '@angular/core';
import type { BuildItem, Star, FleetOrder, ShipDesign } from '../../models/game.model';
import { GameState } from '../../models/game.model';
import type { TechField } from '../../data/tech-tree.data';

// Import services
import { ColonyService } from '../../services/colony/colony.service';
import { FleetService } from '../../services/fleet/core/fleet.service';
import { ResearchService } from '../../services/tech/research.service';
import { ShipyardService } from '../../services/ship-design/shipyard.service';
import { TurnService } from '../../services/game/turn.service';

// Import command classes
import {
  AddToBuildQueueCommand,
  SetGovernorCommand,
  RemoveFromQueueCommand
} from './colony-commands';
import {
  IssueFleetOrderCommand,
  SetFleetOrdersCommand,
  ColonizeNowCommand,
  LoadCargoCommand,
  UnloadCargoCommand,
  SplitFleetCommand,
  SeparateFleetCommand,
  MergeFleetsCommand,
  TransferFleetCargoCommand,
  DecommissionFleetCommand,
} from './fleet-commands';
import { SetResearchFieldCommand } from './research-commands';
import { SaveShipDesignCommand, DeleteShipDesignCommand } from './shipyard-commands';
import { EndTurnCommand } from './turn-commands';

/**
 * Factory service for creating game commands with proper dependency injection.
 * This avoids the need to inject services directly into command constructors.
 */
@Injectable({ providedIn: 'root' })
export class CommandFactoryService {
  constructor(
    private colonyService: ColonyService,
    private fleetService: FleetService,
    private researchService: ResearchService,
    private shipyardService: ShipyardService,
    private turnService: TurnService
  ) {}

  // Colony commands
  createAddToBuildQueueCommand(starId: string, item: BuildItem): AddToBuildQueueCommand {
    return new AddToBuildQueueCommand(this.colonyService, starId, item);
  }

  createSetGovernorCommand(starId: string, governor: Star['governor']): SetGovernorCommand {
    return new SetGovernorCommand(this.colonyService, starId, governor);
  }

  createRemoveFromQueueCommand(starId: string, index: number): RemoveFromQueueCommand {
    return new RemoveFromQueueCommand(this.colonyService, starId, index);
  }

  // Fleet commands
  createIssueFleetOrderCommand(fleetId: string, order: FleetOrder): IssueFleetOrderCommand {
    return new IssueFleetOrderCommand(this.fleetService, fleetId, order);
  }

  createSetFleetOrdersCommand(fleetId: string, orders: Array<FleetOrder>): SetFleetOrdersCommand {
    return new SetFleetOrdersCommand(this.fleetService, fleetId, orders);
  }

  createColonizeNowCommand(fleetId: string): ColonizeNowCommand {
    return new ColonizeNowCommand(this.fleetService, fleetId);
  }

  createLoadCargoCommand(
    fleetId: string,
    starId: string,
    manifest: {
      resources?: number | 'all' | 'fill';
      ironium?: number | 'all' | 'fill';
      boranium?: number | 'all' | 'fill';
      germanium?: number | 'all' | 'fill';
      colonists?: number | 'all' | 'fill';
    }
  ): LoadCargoCommand {
    return new LoadCargoCommand(this.fleetService, fleetId, starId, manifest);
  }

  createUnloadCargoCommand(
    fleetId: string,
    starId: string,
    manifest: {
      resources?: number | 'all';
      ironium?: number | 'all';
      boranium?: number | 'all';
      germanium?: number | 'all';
      colonists?: number | 'all';
    }
  ): UnloadCargoCommand {
    return new UnloadCargoCommand(this.fleetService, fleetId, starId, manifest);
  }

  createSplitFleetCommand(
    fleetId: string,
    transferSpec: {
      ships: Array<{ designId: string; count: number; damage?: number }>;
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    }
  ): SplitFleetCommand {
    return new SplitFleetCommand(this.fleetService, fleetId, transferSpec);
  }

  createSeparateFleetCommand(fleetId: string): SeparateFleetCommand {
    return new SeparateFleetCommand(this.fleetService, fleetId);
  }

  createMergeFleetsCommand(sourceId: string, targetId: string): MergeFleetsCommand {
    return new MergeFleetsCommand(this.fleetService, sourceId, targetId);
  }

  createTransferFleetCargoCommand(
    sourceId: string,
    targetId: string,
    transferSpec: {
      ships: Array<{ designId: string; count: number; damage?: number }>;
      fuel: number;
      cargo: {
        resources: number;
        ironium: number;
        boranium: number;
        germanium: number;
        colonists: number;
      };
    }
  ): TransferFleetCargoCommand {
    return new TransferFleetCargoCommand(this.fleetService, sourceId, targetId, transferSpec);
  }

  createDecommissionFleetCommand(fleetId: string): DecommissionFleetCommand {
    return new DecommissionFleetCommand(this.fleetService, fleetId);
  }

  // Research commands
  createSetResearchFieldCommand(fieldId: TechField): SetResearchFieldCommand {
    return new SetResearchFieldCommand(this.researchService, fieldId);
  }

  // Shipyard commands
  createSaveShipDesignCommand(design: ShipDesign): SaveShipDesignCommand {
    return new SaveShipDesignCommand(this.shipyardService, design);
  }

  createDeleteShipDesignCommand(designId: string): DeleteShipDesignCommand {
    return new DeleteShipDesignCommand(this.shipyardService, designId);
  }

  // Turn commands
  createEndTurnCommand(): EndTurnCommand {
    return new EndTurnCommand(this.turnService);
  }
}
