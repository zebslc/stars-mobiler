import { Injectable } from '@angular/core';
import { getDesign } from '../../data/ships.data';
import { LoggingService } from '../core/logging.service';

@Injectable({ providedIn: 'root' })
export class FleetShipDesignService {
  constructor(private logging: LoggingService) {}

  getDesign(designId: string): any {
    const design = getDesign(designId);
    if (!design) {
      this.logging.error(`Ship design not found: ${designId}`, {
        service: 'FleetShipDesignService',
        operation: 'getDesign',
        entityId: designId,
        entityType: 'shipDesign',
      });
      throw new Error(`Ship design not found: ${designId}`);
    }

    return design;
  }
}
