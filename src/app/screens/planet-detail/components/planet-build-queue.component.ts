import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Planet } from '../../../models/game.model';
import { ShipSelectorComponent, ShipOption } from '../../../components/ship-selector.component';
import { COMPILED_DESIGNS } from '../../../data/ships.data';

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
    <h3 class="section-title">Build Queue</h3>
    <div class="build-queue-container">
      <!-- Governor -->
      <div class="governor-section">
        <div class="controls">
          <label>Governor:</label>
          <select
            [value]="planet().governor?.type ?? 'manual'"
            (change)="onGovernorTypeChange($event)"
            class="main-select"
          >
            <option value="manual">Manual</option>
            <option value="balanced">Balanced</option>
            <option value="mining">Mining</option>
            <option value="industrial">Industrial</option>
            <option value="military">Military</option>
            <option value="shipyard">Shipyard</option>
          </select>
          @if (planet().governor?.type === 'shipyard') {
            <div class="shipyard-controls">
              <select [value]="shipyardDesign()" (change)="onShipyardDesignChange.emit($event)">
                <option value="scout">Scout</option>
                <option value="frigate">Frigate</option>
                <option value="destroyer">Destroyer</option>
                <option value="freighter">Freighter</option>
                <option value="super_freighter">S.Freighter</option>
                <option value="tanker">Tanker</option>
                <option value="settler">Colony</option>
              </select>
              <input
                type="number"
                [value]="shipyardLimit()"
                (input)="onShipyardLimit.emit($event)"
                placeholder="∞"
              />
            </div>
          }
        </div>
      </div>

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
                <span class="text-small text-muted detail"> ({{ it.shipDesignId }}) </span>
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
  planet = input.required<Planet>();
  shipOptions = input.required<ShipOption[]>();
  selectedShipOption = input.required<ShipOption | null>();
  buildAmount = input.required<number>();
  shipyardDesign = input.required<string>();
  shipyardLimit = input.required<number>();
  shouldShowTerraform = input.required<boolean>();
  shouldShowScanner = input.required<boolean>();

  queue = output<BuildProject>();
  remove = output<number>();
  onGovernorType = output<Event>();
  onShipyardDesignChange = output<Event>();
  onShipyardLimit = output<Event>();
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

  onQuantityChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.setBuildAmount.emit(value);
  }

  onShipQuantityChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;
    this.setShipBuildAmount.emit(value);
  }

  onGovernorTypeChange(event: Event) {
    this.onGovernorType.emit(event);
  }

  queueColor(item: any, index: number): string {
    if (index === 0) return 'inherit';
    const planet = this.planet();
    const neededR = item.cost?.resources ?? 0;
    const neededFe = item.cost?.iron ?? 0;
    const neededBo = item.cost?.boranium ?? 0;
    const neededGe = item.cost?.germanium ?? 0;
    const haveR = planet.resources;
    const haveFe = planet.surfaceMinerals.iron;
    const haveBo = planet.surfaceMinerals.boranium;
    const haveGe = planet.surfaceMinerals.germanium;
    const cannot = haveR < neededR || haveFe < neededFe || haveBo < neededBo || haveGe < neededGe;
    return cannot ? 'var(--color-danger)' : 'inherit';
  }
}
