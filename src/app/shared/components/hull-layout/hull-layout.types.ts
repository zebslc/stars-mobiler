import type { SlotDefinition } from '../../../data/tech-atlas.types';

export interface GridSlot {
  id: string;
  row: number;
  col: number;
  width: number;
  height: number;
  slotDef: SlotDefinition;
  editable: boolean;
  capacity?: number | 'Unlimited';
}
