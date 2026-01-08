import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fleet } from '../../../../models/game.model';
import { DesignPreviewButtonComponent } from '../../../../shared/components/design-preview-button.component';

export interface TransferState {
  ships: { designId: string; damage: number; count: number; max: number }[];
  fuel: number;
  resources: number;
  ironium: number;
  boranium: number;
  germanium: number;
  colonists: number;
}

@Component({
  selector: 'app-fleet-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, DesignPreviewButtonComponent],
  template: `
    <div class="transfer-overlay">
      <div class="card transfer-modal">
        <h3>
          {{
            transferMode === 'split' ? 'Split Fleet' : 'Transfer to ' + (targetName || 'Target')
          }}
        </h3>

        <div
          *ngIf="transferMode === 'split'"
          style="display:flex;gap:var(--space-md);margin-bottom:var(--space-md)"
        >
          <button
            class="btn-small"
            [class.btn-primary]="splitMode === 'custom'"
            (click)="setSplitMode('custom')"
          >
            Custom Split
          </button>
          <button
            class="btn-small"
            [class.btn-primary]="splitMode === 'separate'"
            (click)="setSplitMode('separate')"
          >
            Separate All
          </button>
        </div>

        <div class="transfer-grid" *ngIf="transferMode === 'transfer' || splitMode === 'custom'">
          <!-- Ships -->
          <div class="transfer-section">
            <h4>Ships</h4>
            <div *ngFor="let item of transferState.ships" class="transfer-row">
              <app-design-preview-button
                [designId]="item.designId"
                buttonClass="transfer-ship-btn"
                title="View hull layout"
              >
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                  {{ getDesignName(item.designId) }} ({{ item.damage || 0 }}% dmg)
                </span>
              </app-design-preview-button>
              <span class="text-muted" style="white-space:nowrap">Max: {{ item.max }}</span>
              <input
                type="number"
                [(ngModel)]="item.count"
                min="0"
                [max]="item.max"
                class="qty-input"
              />
            </div>
          </div>

          <!-- Cargo -->
          <div class="transfer-section" *ngIf="transferMode === 'transfer'">
            <h4>Cargo & Fuel</h4>
            <div class="transfer-row">
              <span>Fuel</span>
              <span class="text-muted">Max: {{ fleet.fuel | number: '1.0-0' }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.fuel"
                min="0"
                [max]="fleet.fuel"
                class="qty-input"
              />
            </div>
            <div class="transfer-row">
              <span>Resources</span>
              <span class="text-muted">Max: {{ fleet.cargo.resources }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.resources"
                min="0"
                [max]="fleet.cargo.resources"
                class="qty-input"
              />
            </div>
            <div class="transfer-row">
              <span>Ironium</span>
              <span class="text-muted">Max: {{ fleet.cargo.minerals.ironium }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.ironium"
                min="0"
                [max]="fleet.cargo.minerals.ironium"
                class="qty-input"
              />
            </div>
            <div class="transfer-row">
              <span>Boranium</span>
              <span class="text-muted">Max: {{ fleet.cargo.minerals.boranium }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.boranium"
                min="0"
                [max]="fleet.cargo.minerals.boranium"
                class="qty-input"
              />
            </div>
            <div class="transfer-row">
              <span>Germanium</span>
              <span class="text-muted">Max: {{ fleet.cargo.minerals.germanium }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.germanium"
                min="0"
                [max]="fleet.cargo.minerals.germanium"
                class="qty-input"
              />
            </div>
            <div class="transfer-row">
              <span>Colonists</span>
              <span class="text-muted">Max: {{ fleet.cargo.colonists }}</span>
              <input
                type="number"
                [(ngModel)]="transferState.colonists"
                min="0"
                [max]="fleet.cargo.colonists"
                class="qty-input"
              />
            </div>
          </div>
        </div>

        <div
          *ngIf="transferMode === 'split' && splitMode === 'separate'"
          style="padding:var(--space-lg);text-align:center"
        >
          <p>Separate this fleet into {{ totalShipCount }} individual fleets?</p>
        </div>

        <div class="transfer-actions">
          <button (click)="onCancel()" class="btn-secondary">Cancel</button>
          <button (click)="onConfirm()" class="btn-primary">
            {{
              transferMode === 'split'
                ? splitMode === 'separate'
                  ? 'Separate All'
                  : 'Split Fleet'
                : 'Transfer'
            }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .transfer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: var(--space-lg);
      }
      .transfer-modal {
        background: var(--color-bg-primary);
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }
      .transfer-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-lg);
        margin: var(--space-md) 0;
      }
      .transfer-section {
        background: var(--color-bg-secondary);
        padding: var(--space-md);
        border-radius: var(--radius-md);
        min-width: 0;
      }
      .transfer-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
        min-width: 0;
      }
      :host ::ng-deep .transfer-ship-btn {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        padding: 4px;
        color: var(--color-text);
        text-align: left;
        cursor: pointer;
        min-width: 0;
        overflow: hidden;
      }
      :host ::ng-deep .transfer-ship-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-sm);
      }
      .qty-input {
        width: 60px;
        padding: 4px;
        flex-shrink: 0;
      }
      .transfer-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-md);
        margin-top: var(--space-lg);
      }
      @media (max-width: 700px) {
        .transfer-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetTransferComponent implements OnInit, OnChanges {
  @Input({ required: true }) fleet!: Fleet;
  @Input() targetName: string | undefined;
  @Input() transferMode: 'split' | 'transfer' = 'transfer';
  @Input() splitMode: 'custom' | 'separate' = 'custom';
  @Input() designNameResolver: (id: string) => string = (id) => id;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{
    mode: 'split' | 'transfer';
    splitMode: 'custom' | 'separate';
    state: TransferState;
  }>();
  @Output() splitModeChange = new EventEmitter<'custom' | 'separate'>();

  transferState: TransferState = {
    ships: [],
    fuel: 0,
    resources: 0,
    ironium: 0,
    boranium: 0,
    germanium: 0,
    colonists: 0,
  };

  ngOnInit() {
    this.initTransferState();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fleet']) {
      this.initTransferState();
    }
  }

  initTransferState() {
    if (!this.fleet) return;
    this.transferState = {
      ships: this.fleet.ships.map((s) => ({
        designId: s.designId,
        damage: s.damage || 0,
        count: 0,
        max: s.count,
      })),
      fuel: 0,
      resources: 0,
      ironium: 0,
      boranium: 0,
      germanium: 0,
      colonists: 0,
    };
  }

  setSplitMode(mode: 'custom' | 'separate') {
    this.splitMode = mode;
    this.splitModeChange.emit(mode);
  }

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit({
      mode: this.transferMode,
      splitMode: this.splitMode,
      state: this.transferState,
    });
  }

  getDesignName(id: string): string {
    return this.designNameResolver(id);
  }

  get totalShipCount(): number {
    return this.fleet?.ships.reduce((acc, s) => acc + s.count, 0) || 0;
  }
}
