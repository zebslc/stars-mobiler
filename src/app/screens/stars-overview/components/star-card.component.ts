import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Star } from '../../../models/game.model';
import { GameStateService } from '../../../services/game/game-state.service';
import { DesignPreviewButtonComponent } from '../../../shared/components/design-preview-button.component';

@Component({
  selector: 'app-star-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TitleCasePipe, DesignPreviewButtonComponent],
  template: `
    <div class="star-card">
      <div class="star-header">
        <h3>{{ star.name }}</h3>
        <div class="header-buttons">
          @if (starbase && starbase.designId) {
            <app-design-preview-button [designId]="starbase.designId" title="View Starbase Design">
            </app-design-preview-button>
          }
          <button (click)="onViewOnMap()" class="btn-small" title="View on Map">
            <span style="font-size: 24px;">🗺️</span>
          </button>
          <button (click)="onViewStar()" class="btn-small" title="Star Details">
            <span style="font-size: 24px;">🌏</span>
          </button>
        </div>
      </div>

      <div class="star-stats">
        <div class="stat-row">
          <span class="stat-label">Resources:</span>
          <span class="stat-value" style="color:var(--color-primary)">
            {{ star.resources }}R
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Minerals:</span>
          <span class="stat-value">
            {{ star.surfaceMinerals.ironium }}Fe {{ star.surfaceMinerals.boranium }}Bo
            {{ star.surfaceMinerals.germanium }}Ge
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Population:</span>
          <span class="stat-value">
            {{ star.population | number }} /
            {{ (star.maxPopulation / 1_000_000).toFixed(1) }}M
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Habitability:</span>
          <span class="stat-value" [style.color]="habitabilityColor()">
            {{ habitability() }}%
          </span>
        </div>
      </div>

      <div class="star-production">
        <div class="production-row">
          <span class="text-small text-muted">Mines:</span>
          <span class="text-small">{{ star.mines }}</span>
        </div>
        <div class="production-row">
          <span class="text-small text-muted">Factories:</span>
          <span class="text-small">{{ star.factories }}</span>
        </div>
        <div class="production-row">
          <span class="text-small text-muted">Defenses:</span>
          <span class="text-small">{{ star.defenses }}</span>
        </div>
        <div class="production-row">
          <span class="text-small text-muted">Labs:</span>
          <span class="text-small">{{ star.research || 0 }}</span>
        </div>
      </div>

      @if (buildQueue().length > 0) {
        <div class="build-queue">
          <div class="queue-header">Build Queue:</div>
          @for (item of buildQueue().slice(0, 3); track $index) {
            <div class="queue-item">
              <span class="queue-index">{{ $index + 1 }}.</span>
              <span class="queue-project">
                {{ item.project | titlecase }}
                @if ((item.count ?? 1) > 1) {
                  <span class="text-xs font-bold" style="color:var(--color-primary)">
                    x {{ item.count }}
                  </span>
                }
                @if (item.isAuto) {
                  <span class="text-xs text-muted" style="font-style:italic"> (Auto) </span>
                }
              </span>
              <span class="queue-cost text-xs text-muted">{{ item.cost.resources }}R</span>
            </div>
          }
          @if (buildQueue().length > 3) {
            <div class="text-xs text-muted" style="padding-left:var(--space-sm)">
              +{{ buildQueue().length - 3 }} more
            </div>
          }
        </div>
      } @else {
        <div class="text-small text-muted" style="padding:var(--space-md)">
          No items in build queue
        </div>
      }
    </div>
  `,
  styles: [
    `
      .star-card {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .star-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: var(--space-sm);
        border-bottom: 1px solid var(--color-border);
      }

      .star-header h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      .header-buttons {
        display: flex;
        gap: var(--space-sm);
      }

      .btn-small {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        font-size: var(--font-size-sm);
        cursor: pointer;
      }

      .star-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
      }

      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .stat-label {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .stat-value {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .star-production {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-sm);
        padding: var(--space-sm);
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-sm);
      }

      .production-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .build-queue {
        background: var(--color-bg-tertiary);
        padding: var(--space-md);
        border-radius: var(--radius-sm);
      }

      .queue-header {
        font-weight: 600;
        margin-bottom: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .queue-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-xs) 0;
        font-size: var(--font-size-sm);
      }

      .queue-index {
        color: var(--color-text-muted);
        min-width: 20px;
      }

      .queue-project {
        flex: 1;
      }

      .queue-cost {
        margin-left: auto;
      }

      @media (max-width: 600px) {
        .star-card {
          padding: var(--space-md);
          gap: var(--space-sm);
        }

        .star-header h3 {
          font-size: var(--font-size-md);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarCardComponent {
  @Input({ required: true }) star!: Star;
  @Input() starbase: { designId?: string; name: string; imageClass: string } | null = null;
  @Output() viewStar = new EventEmitter<void>();
  @Output() viewOnMap = new EventEmitter<void>();

  private gs = inject(GameStateService);

  buildQueue = computed(() => this.star.buildQueue || []);

  habitability = computed(() => this.gs.habitabilityFor(this.star.id));

  habitabilityColor = computed(() => {
    return this.habitability() > 0 ? '#27ae60' : '#c0392b';
  });

  onViewStar() {
    this.viewStar.emit();
  }

  onViewOnMap() {
    this.viewOnMap.emit();
  }
}
