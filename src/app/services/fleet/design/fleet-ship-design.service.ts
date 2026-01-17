import { Injectable, inject } from '@angular/core';
import type { CompiledDesign } from '../../../data/ships.data';
import { ShipDesignRegistry } from '../../data/ship-design-registry.service';
import { LoggingService } from '../../core/logging.service';

@Injectable({ providedIn: 'root' })
export class FleetShipDesignService {
  private readonly logging = inject(LoggingService);
  private readonly shipDesignRegistry = inject(ShipDesignRegistry);
  
  getDesign(designId: string): CompiledDesign {
    const result = this.shipDesignRegistry.getDesign(designId);
    this.logging.debug('Design lookup', {
      service: 'FleetShipDesignService',
      operation: 'getDesign',
      entityId: designId,
      entityType: 'shipDesign',
      additionalData: {
        foundName: result.name,
        isUnknown: result.name === 'Unknown Design'
      }
    });
    return result;
  }
}
