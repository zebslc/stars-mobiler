import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type {
  StarOption} from '../../../../components/star-selector.component';
import {
  StarSelectorComponent
} from '../../../../components/star-selector.component';
import type { Fleet } from '../../../../models/game.model';

@Component({
  selector: 'app-fleet-orders',
  standalone: true,
  imports: [CommonModule, StarSelectorComponent],
  template: `
    <section class="card">
      <h3 style="margin-bottom:var(--space-lg)">Orders</h3>
      <div style="display:grid;gap:var(--space-lg)">
        <div>
          <label>Move to star</label>
          <div style="display:flex;gap:var(--space-md);flex-wrap:wrap">
            <app-star-selector
              [options]="starOptions()"
              [selectedStar]="selectedStarOption()"
              (starSelected)="starSelected.emit($event)"
              style="flex-grow:1;min-width:200px"
            ></app-star-selector>
            <button
              (click)="moveOrder.emit()"
              class="btn-primary"
              [disabled]="!selectedStarOption()"
            >
              Set Move Order
            </button>
          </div>
          <label
            style="display:flex;gap:var(--space-sm);align-items:center;margin-top:var(--space-md);cursor:pointer"
          >
            <input
              type="checkbox"
              [checked]="showAll()"
              (change)="onShowAll($event)"
            />
            <span class="text-small">Show all systems (including out of range)</span>
          </label>
        </div>
        <div>
          <button
            (click)="colonizeOrder.emit()"
            [disabled]="!canColonize()"
            class="btn-success"
          >
            Colonize Current Planet
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetOrdersComponent {
  readonly fleet = input.required<Fleet>();
  readonly starOptions = input<Array<StarOption>>([]);
  readonly selectedStarOption = input<StarOption | null>(null);
  readonly showAll = input(false);
  readonly canColonize = input(false);

  readonly starSelected = output<StarOption>();
  readonly moveOrder = output<void>();
  readonly colonizeOrder = output<void>();
  readonly showAllChange = output<boolean>();

  onShowAll(event: Event) {
    this.showAllChange.emit((event.target as HTMLInputElement).checked);
  }
}
