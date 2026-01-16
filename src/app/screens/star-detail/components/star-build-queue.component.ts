import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  signal,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BuildItem, Star } from '../../../models/game.model';
import { ShipSelectorComponent, ShipOption } from '../../../components/ship-selector.component';
import { getDesign } from '../../../data/ships.data';
import { GameStateService } from '../../../services/game/game-state.service';
import { BUILD_COSTS, Cost } from '../../../data/costs.data';

export type BuildProject =
  | 'mine'
  | 'factory'
  | 'defense'
  | 'research'
  | 'terraform'
  | 'scanner'
  | 'ship';

@Component({
  standalone: true,
  selector: 'app-star-build-queue',
  imports: [CommonModule, ShipSelectorComponent],
  template: `
    <div class="build-queue-container">
      <!-- Build Items -->
      <div class="build-controls-row">
        <select
          [value]="selectedProject()"
          (change)="onProjectChange($event)"
          class="project-select"
        >
          <option value="mine">Mine{{ getProjectCostLabel('mine') }}</option>
          <option value="factory">Factory{{ getProjectCostLabel('factory') }}</option>
          <option value="defense">Defense{{ getProjectCostLabel('defense') }}</option>
          <option value="research">Labs / Research{{ getProjectCostLabel('research') }}</option>
          @if (shouldShowTerraform()) {
            <option value="terraform">Terraform{{ getProjectCostLabel('terraform') }}</option>
          }
          @if (shouldShowScanner()) {
            <option value="scanner">Scanner{{ getProjectCostLabel('scanner') }}</option>
          }
        </select>

        <select [value]="buildAmount()" (change)="onQuantityChange($event)" class="amount-select">
          <option [value]="1">1</option>
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="25">25</option>
          <option [value]="50">50</option>
          <option [value]="100">100</option>
        </select>

        <button (click)="build()" class="btn-primary build-btn">Build</button>
      </div>

      <div class="ship-construction-section">
        <div class="title">Ship Construction</div>
        @if (availableShipOptions().length > 0) {
          <div class="controls">
            <app-ship-selector
              [options]="availableShipOptions()"
              [selectedShip]="selectedShipOption()"
              (shipSelected)="onShipSelected.emit($event)"
            ></app-ship-selector>

            <select
              [value]="shipBuildAmount()"
              (change)="onShipQuantityChange($event)"
              class="amount-select"
            >
              <option [value]="1">1</option>
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>

            <button (click)="buildShip()" class="btn-primary">Build Ship</button>
          </div>
        } @else {
          <div class="no-designs">
            <p>No ship designs available.</p>
            <button (click)="goToDesigner()" class="btn-primary">Design New Ship</button>
          </div>
        }
      </div>
    </div>
    @if ((star().buildQueue?.length ?? 0) > 0) {
      <div class="queue-list">
        @for (it of star().buildQueue ?? []; track i; let i = $index) {
          <div class="queue-item" [class.active]="i === 0" [class.pending]="i !== 0">
            <div class="item-info">
              <div class="info-top">
                <span class="text-small text-muted index">{{ i + 1 }}</span>
                <span class="project-name">
                  {{ it.project | titlecase }}
                  @if ((it.count ?? 1) > 1) {
                    <span class="text-medium font-bold count"> x {{ it.count }} </span>
                  }
                </span>
                @if (it.project === 'ship' && it.shipDesignId) {
                  <span class="text-small text-muted detail">
                    ({{ getDesignName(it.shipDesignId) }})
                  </span>
                }
                @if (it.isAuto) {
                  <span class="text-small text-muted detail" style="font-style: italic;">
                    (Auto)
                  </span>
                }
                @if (queueColor(it, i) === 'var(--color-danger)') {
                  <span class="text-xs warning">⚠ Cannot afford</span>
                }
              </div>
              <div class="info-bottom">
                <span class="text-small font-medium cost">{{ formatCost(it.cost) }}</span>
                @if (it.paid) {
                  <div style="margin-top: 4px; width: 100%;">
                    <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                      Paid: {{ formatCost(it.paid) }}
                    </div>
                    <div
                      style="height: 4px; background: var(--color-bg-dark); border-radius: 2px; margin-top: 2px; overflow: hidden;"
                    >
                      <div
                        [style.width.%]="getPercentComplete(it)"
                        style="height: 100%; background: var(--color-primary);"
                      ></div>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="item-actions">
              <button (click)="remove.emit(i)" class="btn-icon btn-small remove-btn">×</button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './star-build-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarBuildQueueComponent {
  private router = inject(Router);
  private gs = inject(GameStateService);

  @ViewChild(ShipSelectorComponent) shipSelector?: ShipSelectorComponent;

  star = input.required<Star>();
  shipOptions = input.required<ShipOption[]>();
  selectedShipOption = input.required<ShipOption | null>();
  buildAmount = input.required<number>();
  shouldShowTerraform = input.required<boolean>();
  shouldShowScanner = input.required<boolean>();

  queue = output<BuildProject>();
  remove = output<number>();
  setBuildAmount = output<number>();
  onShipSelected = output<ShipOption>();
  setShipBuildAmount = output<number>();

  selectedProject = signal<BuildProject>('mine');

  availableShipOptions = computed(() => {
    return this.shipOptions();
  });

  shipBuildAmount = input<number>(1);

  onProjectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as BuildProject;
    this.selectedProject.set(value);
  }

  build() {
    this.queue.emit(this.selectedProject());
  }

  buildShip() {
    this.shipSelector?.close();
    this.queue.emit('ship');
  }

  goToDesigner() {
    this.router.navigate(['/ship-design']);
  }

  onQuantityChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.setBuildAmount.emit(value);
  }

  onShipQuantityChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.setShipBuildAmount.emit(value);
  }

  getDesignName(id: string): string {
    const gameDesigns = this.gs.game()?.shipDesigns;
    const userDesign = gameDesigns?.find((d) => d.id === id);
    if (userDesign) return userDesign.name;

    const design = getDesign(id);
    return design?.name || id;
  }

  formatCost(cost: Cost): string {
    const parts = [] as string[];
    if (cost.resources) parts.push(`${cost.resources}R`);
    if (cost.ironium) parts.push(`${cost.ironium}Fe`);
    if (cost.boranium) parts.push(`${cost.boranium}Bo`);
    if (cost.germanium) parts.push(`${cost.germanium}Ge`);
    return parts.join(' ');
  }

  getProjectCostLabel(project: string): string {
    const cost = BUILD_COSTS[project];
    if (!cost) return '';
    return ` (${this.formatCost(cost)})`;
  }

  getPercentComplete(item: BuildItem): number {
    if (!item.paid) return 0;
    const total =
      (item.cost.resources || 0) +
      (item.cost.ironium || 0) +
      (item.cost.boranium || 0) +
      (item.cost.germanium || 0);
    if (total === 0) return 100;
    const paid =
      (item.paid.resources || 0) +
      (item.paid.ironium || 0) +
      (item.paid.boranium || 0) +
      (item.paid.germanium || 0);
    return Math.min(100, (paid / total) * 100);
  }

  queueColor(_item: BuildItem, _index: number): string {
    return 'inherit';
  }
}
