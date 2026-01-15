import { Injectable, inject } from '@angular/core';
import { ShipDesign } from '../../models/game.model';
import { ComponentStats } from '../../data/tech-atlas.types';
import { ShipDesignOperationsService } from './ship-design-operations.service';
import { ComponentData } from '../../models/service-interfaces.model';

@Injectable({
  providedIn: 'root',
})
export class ShipSlotOperatorService {
  private readonly operations = inject(ShipDesignOperationsService);

  setSlotComponent(
    design: ShipDesign,
    slotId: string,
    component: ComponentStats,
    count: number,
  ): ShipDesign {
    return this.operations.setSlotComponent(design, slotId, this.toComponentData(component), count);
  }

  addComponent(
    design: ShipDesign,
    slotId: string,
    component: ComponentStats,
    count: number,
  ): ShipDesign {
    return this.operations.addComponent(design, slotId, this.toComponentData(component), count);
  }

  removeComponent(design: ShipDesign, slotId: string, componentId: string): ShipDesign {
    return this.operations.removeComponent(design, slotId, componentId);
  }

  clearSlot(design: ShipDesign, slotId: string): ShipDesign {
    return this.operations.clearSlot(design, slotId);
  }

  private toComponentData(component: ComponentStats): ComponentData {
    const { id, name, type, stats, cost, mass } = component;
    return { id, name, type, stats, cost, mass };
  }
}
