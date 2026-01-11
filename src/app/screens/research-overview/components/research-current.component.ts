import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game-state.service';
import { TechService } from '../../../services/tech.service';
import { TechField, TECH_FIELDS } from '../../../data/tech-tree.data';
import { TechRequirement } from '../../../data/tech-atlas.data';

@Component({
  selector: 'app-research-current',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="current-research">
      <div class="research-header">
        <div class="research-title">
          <span class="research-icon">{{ fieldIcon() }}</span>
          <div>
            <h2>{{ fieldInfo().name }}</h2>
            <p class="research-subtitle">{{ fieldInfo().description }}</p>
          </div>
        </div>
        <div class="research-level">
          <div class="level-badge">{{ currentLevel() }}</div>
          <div class="level-label">Level</div>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
        </div>
        <div class="progress-stats">
          <span>{{ researchProgress() }} / {{ nextLevelCost() }} RP</span>
          @if (researchPerTurn() > 0) {
            <span>{{ turnsToNextLevel() }} turns left ({{ researchPerTurn() }} RP/turn)</span>
          } @else {
            <span class="warning-text">No Research! Build Labs on planets.</span>
          }
        </div>
      </div>

      <!-- Current Unlocks -->
      @if (currentUnlocks().length > 0) {
        <div class="next-unlocks" style="margin-bottom: var(--space-md)">
          <div class="unlocks-header">
            <strong>Unlocked at Level {{ currentLevel() }}:</strong>
          </div>
          <div class="unlock-items">
            @for (unlock of currentUnlocks(); track unlock) {
              <button class="unlock-chip" (click)="onShowUnlockDetails(unlock)">
                <span
                  class="tech-icon tech-icon-small"
                  [style.background-image]="
                    'url(/assets/tech-icons/' +
                    (getUnlockIconPath(unlock) || 'placeholder') +
                    '.png)'
                  "
                ></span>
                {{ unlock }}
                @for (dep of getExternalDependenciesWithStatus(unlock); track dep.label) {
                  <span class="dep-badge" [class]="'dep-badge-' + dep.status">{{ dep.label }}</span>
                }
              </button>
            }
          </div>
        </div>
      }

      <!-- Next Unlocks -->
      @if (nextUnlocks().length > 0) {
        <div class="next-unlocks">
          <div class="unlocks-header">
            <strong>Next at Level {{ currentLevel() + 1 }}:</strong>
          </div>
          <div class="unlock-items">
            @for (unlock of nextUnlocks(); track unlock) {
              <button
                class="unlock-chip-compact"
                (click)="onShowUnlockDetails(unlock)"
                [title]="unlock"
              >
                <span
                  class="tech-icon tech-icon-small"
                  [style.background-image]="
                    'url(/assets/tech-icons/' +
                    (getUnlockIconPath(unlock) || 'placeholder') +
                    '.png)'
                  "
                ></span>
              </button>
            }
          </div>
        </div>
      } @else {
        <div class="next-unlocks">
          @if (currentLevel() >= 26) {
            <div class="unlock-max">🏆 Maximum level reached</div>
          } @else {
            <div class="unlock-max" style="color: var(--color-text-muted)">
              No new unlocks at Level {{ currentLevel() + 1 }}
            </div>
          }
        </div>
      }

      <!-- View Full Branch Button -->
      <div style="margin-top: var(--space-md)">
        <button class="btn-tech-tree" (click)="onShowTechTree()">
          📊 View Full {{ fieldInfo().name }} Tech Tree
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .current-research {
        background: var(--color-bg-secondary);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        padding: var(--space-lg);
        margin-bottom: var(--space-lg);
      }

      .research-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-md);
      }

      .research-title {
        display: flex;
        gap: var(--space-md);
        align-items: center;
        flex: 1;
      }

      .research-icon {
        font-size: 48px;
      }

      .research-title h2 {
        margin: 0;
        font-size: var(--font-size-xl);
      }

      .research-subtitle {
        margin: 4px 0 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .research-level {
        text-align: center;
      }

      .level-badge {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .level-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
      }

      .progress-section {
        margin-bottom: var(--space-md);
      }

      .progress-bar {
        height: 16px;
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-sm);
        overflow: hidden;
        margin-bottom: var(--space-xs);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
        transition: width 0.3s ease;
      }

      .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
      }

      .next-unlocks {
        background: var(--color-bg-tertiary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
      }

      .unlocks-header {
        margin-bottom: var(--space-sm);
        font-size: var(--font-size-sm);
      }

      .unlock-items {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-xs);
      }

      .unlock-chip {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 6px 12px;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
      }

      .unlock-chip:hover {
        background: var(--color-primary);
        color: white;
        transform: translateY(-1px);
      }

      .unlock-chip-compact {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .unlock-chip-compact:hover {
        background: var(--color-primary);
        border-color: var(--color-primary);
        transform: translateY(-1px);
      }

      .unlock-chip-compact .tech-icon-small {
        margin-right: 0;
      }

      .tech-icon-small {
        width: 32px;
        height: 32px;
        display: inline-block;
        vertical-align: middle;
        margin-right: 4px;
        background-size: 32px 32px !important;
        background-repeat: no-repeat !important;
        image-rendering: pixelated;
      }

      .dep-badge {
        display: inline-block;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        padding: 2px 4px;
        font-size: 10px;
        color: var(--color-text-muted);
        margin-left: 6px;
        vertical-align: middle;
      }

      .dep-badge-met {
        background: #2d5016;
        border-color: #4a7c2c;
        color: #a8e063;
      }

      .dep-badge-close {
        background: #5a4a1a;
        border-color: #8a7a2a;
        color: #ffeb3b;
      }

      .dep-badge-far {
        background: #5a1a1a;
        border-color: #8a2a2a;
        color: #ff6b6b;
      }

      .unlock-max {
        text-align: center;
        font-size: var(--font-size-sm);
        color: var(--color-warning);
      }

      .btn-tech-tree {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: 8px 16px;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
      }

      .btn-tech-tree:hover {
        background: var(--color-primary);
        color: white;
      }

      .warning-text {
        color: var(--color-warning);
        font-weight: bold;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchCurrentComponent {
  selectedField = input.required<TechField>();
  @Output() showTechTree = new EventEmitter<void>();
  @Output() showUnlockDetails = new EventEmitter<string>();

  private gs = inject(GameStateService);
  private techService = inject(TechService);

  fieldInfo = computed(() => TECH_FIELDS[this.selectedField()]);

  fieldIcon = computed(() => {
    const icons: Record<TechField, string> = {
      Energy: '⚡',
      Kinetics: '🚀',
      Propulsion: '✈️',
      Construction: '🏗️',
    };
    return icons[this.selectedField()];
  });

  currentLevel = computed(() => {
    return this.gs.player()?.techLevels[this.selectedField()] ?? 0;
  });

  currentUnlocks = computed(() => {
    const currentLevel = this.currentLevel();
    return this.fieldInfo().levels[currentLevel]?.unlocks ?? [];
  });

  researchProgress = computed(() => {
    return Math.floor(this.gs.player()?.researchProgress[this.selectedField()] ?? 0);
  });

  nextLevelCost = computed(() => {
    const currentLevel = this.currentLevel();
    if (currentLevel >= 26) return 0;
    return this.fieldInfo().levels[currentLevel + 1]?.cost ?? 0;
  });

  progressPercent = computed(() => {
    const progress = this.researchProgress();
    const cost = this.nextLevelCost();
    if (cost === 0) return 100;
    return Math.min(100, (progress / cost) * 100);
  });

  totalLabs = computed(() => {
    const game = this.gs.game();
    if (!game) return 0;
    return game.stars
      .flatMap((s) => s.planets)
      .filter((p) => p.ownerId === game.humanPlayer.id)
      .reduce((sum, p) => sum + (p.research || 0), 0);
  });

  researchPerTurn = computed(() => {
    const game = this.gs.game();
    if (!game) return 0;
    const researchTrait =
      game.humanPlayer.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
    return Math.floor(this.totalLabs() * (1 + researchTrait));
  });

  turnsToNextLevel = computed(() => {
    const cost = this.nextLevelCost();
    if (cost === 0) return 0;

    const progress = this.researchProgress();
    const perTurn = this.researchPerTurn();

    if (perTurn <= 0) return Infinity;

    const remaining = Math.max(0, cost - progress);
    return Math.ceil(remaining / perTurn);
  });

  nextUnlocks = computed(() => {
    const currentLevel = this.currentLevel();
    if (currentLevel >= 26) return [];
    return this.fieldInfo().levels[currentLevel + 1]?.unlocks ?? [];
  });

  onShowTechTree() {
    this.showTechTree.emit();
  }

  onShowUnlockDetails(unlock: string) {
    this.showUnlockDetails.emit(unlock);
  }

  getUnlockIconPath(name: string): string {
    const hull = this.techService.getHullByName(name);
    if (hull) return hull.id ?? '';
    const comp = this.techService.getComponentByName(name);
    return comp?.id ?? '';
  }

  getExternalDependenciesWithStatus(
    name: string,
  ): { label: string; status: 'met' | 'close' | 'far' }[] {
    const hull = this.techService.getHullByName(name);
    const comp = this.techService.getComponentByName(name);
    const details = hull || comp;

    if (!details) return [];

    let techReq: TechRequirement | undefined;
    if (hull) {
      techReq = hull.techReq;
    } else if (comp) {
      techReq = comp.tech;
    }

    if (!techReq) return [];

    const player = this.gs.player();
    if (!player) return [];

    const reqs: { field: string; level: number }[] = [];
    Object.entries(techReq).forEach(([field, level]) => {
      reqs.push({ field, level: Number(level) });
    });

    // Filter out requirements that match the current field and have level > 0
    return reqs
      .filter((r) => r.field !== this.selectedField() && r.level > 0)
      .map((r) => {
        const currentLevel = player.techLevels[r.field as TechField] ?? 0;
        const requiredLevel = r.level;
        const diff = requiredLevel - currentLevel;

        let status: 'met' | 'close' | 'far';
        if (diff <= 0) {
          status = 'met';
        } else if (diff <= 2) {
          status = 'close';
        } else {
          status = 'far';
        }

        return {
          label: `${r.field.substring(0, 4)} ${r.level}`,
          status,
        };
      });
  }
}
