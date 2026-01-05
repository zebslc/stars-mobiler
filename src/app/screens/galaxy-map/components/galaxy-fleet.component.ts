import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fleet } from '../../../models/game.model';
import { GameStateService } from '../../../services/game-state.service';

@Component({
  selector: 'g[app-galaxy-fleet]',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:rect
      [attr.x]="position.x - 6"
      [attr.y]="position.y - 6"
      width="12"
      height="12"
      [attr.fill]="isOwner() ? '#2e86de' : '#d63031'"
      stroke="#000"
      stroke-width="0.8"
      [attr.transform]="rotation()"
      (click)="fleetClick.emit($event)"
      (dblclick)="fleetDoubleClick.emit($event)"
      (contextmenu)="fleetContext.emit($event)"
      style="cursor: pointer"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyFleetComponent {
  @Input({ required: true }) fleet!: Fleet;
  @Input({ required: true }) position!: { x: number, y: number };
  @Input() isOrbit = false;

  @Output() fleetClick = new EventEmitter<MouseEvent>();
  @Output() fleetDoubleClick = new EventEmitter<MouseEvent>();
  @Output() fleetContext = new EventEmitter<MouseEvent>();

  private gs = inject(GameStateService);

  isOwner = computed(() => this.fleet.ownerId === this.gs.player()?.id);

  rotation = computed(() => {
    if (this.isOrbit) {
      return `rotate(45 ${this.position.x} ${this.position.y})`;
    }
    return null;
  });
}
