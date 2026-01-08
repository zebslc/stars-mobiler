import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  StarSelectorComponent,
  StarOption,
} from '../../../../components/star-selector.component';
import { Fleet } from '../../../../models/game.model';

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
              [options]="starOptions"
              [selectedStar]="selectedStarOption"
              (starSelected)="starSelected.emit($event)"
              style="flex-grow:1;min-width:200px"
            ></app-star-selector>
            <button
              (click)="moveOrder.emit()"
              class="btn-primary"
              [disabled]="!selectedStarOption"
            >
              Set Move Order
            </button>
          </div>
          <label
            style="display:flex;gap:var(--space-sm);align-items:center;margin-top:var(--space-md);cursor:pointer"
          >
            <input
              type="checkbox"
              [checked]="showAll"
              (change)="onShowAll($event)"
            />
            <span class="text-small">Show all systems (including out of range)</span>
          </label>
        </div>
        <div>
          <button
            (click)="colonizeOrder.emit()"
            [disabled]="!canColonize"
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
  @Input({ required: true }) fleet!: Fleet;
  @Input() starOptions: StarOption[] = [];
  @Input() selectedStarOption: StarOption | null = null;
  @Input() showAll = false;
  @Input() canColonize = false;

  @Output() starSelected = new EventEmitter<StarOption>();
  @Output() moveOrder = new EventEmitter<void>();
  @Output() colonizeOrder = new EventEmitter<void>();
  @Output() showAllChange = new EventEmitter<boolean>();

  onShowAll(event: Event) {
    this.showAllChange.emit((event.target as HTMLInputElement).checked);
  }
}
