import { Injectable, inject } from '@angular/core';
import { getDesign } from '../../../data/ships.data';
import type { CompiledDesign } from '../../../data/ships.data';
import { LoggingService } from '../../core/logging.service';

@Injectable({ providedIn: 'root' })
export class FleetShipDesignService {
  private readonly logging = inject(LoggingService);
  
  getDesign(designId: string): CompiledDesign {
    const result = getDesign(designId);
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
