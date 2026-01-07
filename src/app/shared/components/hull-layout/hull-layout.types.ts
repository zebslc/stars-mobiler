import { HullSlot } from '../../../data/hulls.data';

export interface GridSlot {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  slotDef: HullSlot;
  editable: boolean;
  capacity?: number | 'Unlimited';
}
