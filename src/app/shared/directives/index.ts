// Input interaction directives for unified touch, mouse, and pointer event handling

export * from './touch-click.directive';
export * from './long-press.directive';
export * from './pan-zoom.directive';
export * from './click-outside.directive';
export * from './drag-drop.directive';

// Convenience array for importing all directives
export const INPUT_DIRECTIVES = [
  'TouchClickDirective',
  'LongPressDirective', 
  'PanZoomDirective',
  'ClickOutsideDirective',
  'DragDropDirective'
] as const;

// Re-export the actual directive classes
import { TouchClickDirective } from './touch-click.directive';
import { LongPressDirective } from './long-press.directive';
import { PanZoomDirective } from './pan-zoom.directive';
import { ClickOutsideDirective } from './click-outside.directive';
import { DragDropDirective } from './drag-drop.directive';

export const ALL_INPUT_DIRECTIVES = [
  TouchClickDirective,
  LongPressDirective,
  PanZoomDirective,
  ClickOutsideDirective,
  DragDropDirective
];