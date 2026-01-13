import { ComponentStats } from '../../../data/tech-atlas.types';

/**
 * Component data interface for hull slot component
 * Replaces any types with proper TypeScript interfaces
 */
export interface HullSlotComponentData {
  component: ComponentStats;
  count: number;
}

/**
 * Hull slot event data interfaces
 */
export interface SlotClickEvent {
  slotId: string;
  editable: boolean;
}

export interface SlotHoverEvent {
  slotId: string;
  componentData?: HullSlotComponentData;
}

export interface ComponentActionEvent {
  slotId: string;
  componentId: string;
  action: 'increment' | 'decrement' | 'remove' | 'clear' | 'info';
  originalEvent: Event;
}

export interface SlotTouchEvent {
  slotId: string;
  touchEvent: TouchEvent;
  editable: boolean;
}