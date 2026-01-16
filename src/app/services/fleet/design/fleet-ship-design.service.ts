import { Injectable } from '@angular/core';
import { getDesign } from '../../../data/ships.data';
import type { CompiledDesign } from '../../../data/ships.data';

@Injectable({ providedIn: 'root' })
export class FleetShipDesignService {
  getDesign(designId: string): CompiledDesign {
    return getDesign(designId);
  }
}
