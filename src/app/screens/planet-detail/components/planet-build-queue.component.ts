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
import { Planet } from '../../../models/game.model';
import { ShipSelectorComponent, ShipOption } from '../../../components/ship-selector.component';
import { COMPILED_DESIGNS, getDesign } from '../../../data/ships.data';
import { GameStateService } from '../../../services/game-state.service';

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
  selector: 'app-planet-build-queue',
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
          <option value="mine">Mine</option>
          <option value="factory">Factory</option>
          <option value="defense">Defense</option>
          <option value="research">Labs</option>
          @if (shouldShowTerraform()) {
            <option value="terraform">Terraform</option>
          }
          @if (shouldShowScanner()) {
            <option value="scanner">Scanner</option>
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
    @if ((planet().buildQueue?.length ?? 0) > 0) {
      <div class="queue-list">
        @for (it of planet().buildQueue ?? []; track i; let i = $index) {
          <div class="queue-item" [class.active]="i === 0" [class.pending]="i !== 0">
            <div class="item-info">
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
            <div class="item-actions">
              <span class="text-small font-medium cost">{{ it.cost.resources }}R</span>
              <button (click)="remove.emit(i)" class="btn-icon btn-small remove-btn">×</button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './planet-build-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanetBuildQueueComponent {
  private router = inject(Router);
  private gs = inject(GameStateService);

  @ViewChild(ShipSelectorComponent) shipSelector?: ShipSelectorComponent;

  planet = input.required<Planet>();
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
    // Try to find in game state designs first (user designs)
    const gameDesigns = this.gs.game()?.shipDesigns;
    const userDesign = gameDesigns?.find((d) => d.id === id);
    if (userDesign) return userDesign.name;

    // Fallback to compiled designs (built-in)
    const design = getDesign(id);
    return design?.name || id;
  }

  queueColor(item: any, index: number): string {
    if (index === 0) return 'inherit';
    const planet = this.planet();
    const neededR = item.cost?.resources ?? 0;
    const neededFe = item.cost?.ironium ?? 0;
    const neededBo = item.cost?.boranium ?? 0;
    const neededGe = item.cost?.germanium ?? 0;
    const haveR = planet.resources;
    const haveFe = planet.surfaceMinerals.ironium;
    const haveBo = planet.surfaceMinerals.boranium;
    const haveGe = planet.surfaceMinerals.germanium;
    const cannot = haveR < neededR || haveFe < neededFe || haveBo < neededBo || haveGe < neededGe;
    return cannot ? 'var(--color-danger)' : 'inherit';
  }
}