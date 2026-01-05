import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game-state.service';
import { TechService } from '../../../services/tech.service';
import { TECH_FIELDS, TechField, TechLevel } from '../../../data/tech-tree.data';
import { TechRequirement } from '../../../data/tech-atlas.data';

@Component({
  selector: 'app-research-tech-tree',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content tech-tree-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>
              {{ fieldIcon() }}
              {{ fieldInfo().name }} Technology Tree
            </h2>
            <p class="tech-subtitle">{{ fieldInfo().description }}</p>
          </div>
          <button class="modal-close" (click)="onClose()">✕</button>
        </div>
        <div class="modal-body">
          @for (level of visibleLevels(); track level.level) {
            <div
              class="tech-level-item"
              [class.current-level]="level.level === currentLevel()"
              [class.completed]="level.level < currentLevel()"
            >
              <div class="level-indicator">
                <div class="level-number">{{ level.level }}</div>
                @if (level.level < currentLevel()) {
                  <div class="level-status completed">✓</div>
                } @else if (level.level === currentLevel()) {
                  <div class="level-status current">▶</div>
                } @else {
                  <div class="level-status locked">🔒</div>
                }
              </div>
              <div class="level-content">
                <div class="level-header">
                  <strong>Level {{ level.level }}</strong>
                  <span class="level-cost">{{ level.cost }} RP</span>
                </div>
                @if (level.unlocks.length > 0) {
                  <div class="level-unlocks">
                    @for (unlock of level.unlocks; track unlock) {
                      <button class="unlock-chip" (click)="onShowUnlockDetails(unlock)">
                        <span class="tech-icon" [ngClass]="getUnlockIcon(unlock)" style="transform: scale(0.5); width: 32px; height: 32px; margin-right: 4px; vertical-align: middle;"></span>
                        {{ unlock }}
                        @for (
                          dep of getExternalDependenciesWithStatus(unlock);
                          track dep.label
                        ) {
                          <span class="dep-badge" [class]="'dep-badge-' + dep.status">{{ dep.label }}</span>
                        }
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('../../../shared/components/tech-atlas.css');

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-lg);
    }

    .modal-content {
      background: var(--color-bg-primary);
      border-radius: var(--radius-lg);
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .tech-tree-modal {
      max-width: 900px;
    }

    .modal-header {
      padding: var(--space-lg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
    }

    .modal-close:hover {
      background: var(--color-bg-secondary);
    }

    .modal-body {
      padding: var(--space-lg);
      overflow-y: auto;
    }

    .tech-subtitle {
      margin: 4px 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .tech-level-item {
      display: flex;
      gap: var(--space-md);
      padding: var(--space-md);
      margin-bottom: var(--space-sm);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }

    .tech-level-item.completed {
      opacity: 0.7;
    }

    .tech-level-item.current-level {
      border-color: var(--color-primary);
      background: linear-gradient(
        to right,
        var(--color-bg-secondary),
        rgba(var(--color-primary-rgb), 0.1)
      );
    }

    .level-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-xs);
      min-width: 60px;
    }

    .level-number {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--color-bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-size-lg);
    }

    .tech-level-item.completed .level-number {
      background: var(--color-success);
      color: white;
    }

    .tech-level-item.current-level .level-number {
      background: var(--color-primary);
      color: white;
    }

    .level-status {
      font-size: var(--font-size-sm);
    }

    .level-status.completed {
      color: var(--color-success);
    }

    .level-content {
      flex: 1;
    }

    .level-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-sm);
    }

    .level-cost {
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .level-unlocks {
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
    }

    .unlock-chip:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-1px);
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
    
    .tech-icon {
      width: 32px;
      height: 32px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
      background-size: 32px 32px !important;
      background-repeat: no-repeat !important;
      image-rendering: pixelated;
    }
  `],
})
export class ResearchTechTreeComponent {
  @Input({ required: true }) selectedField!: TechField;
  @Output() close = new EventEmitter<void>();
  @Output() showUnlockDetails = new EventEmitter<string>();

  private gs = inject(GameStateService);
  private techService = inject(TechService);

  fieldInfo = computed(() => TECH_FIELDS[this.selectedField]);

  fieldIcon = computed(() => {
    const icons: Record<TechField, string> = {
      Energy: '⚡',
      Kinetics: '🚀',
      Propulsion: '✈️',
      Construction: '🏗️',
    };
    return icons[this.selectedField];
  });

  currentLevel = computed(() => {
    return this.gs.player()?.techLevels[this.selectedField] ?? 0;
  });

  visibleLevels = computed(() => {
    const allLevels = this.fieldInfo().levels;
    return allLevels.filter((level) => level.level > 0 && level.unlocks.length > 0);
  });

  onClose() {
    this.close.emit();
  }

  onShowUnlockDetails(unlock: string) {
    this.showUnlockDetails.emit(unlock);
  }

  getUnlockIcon(name: string): string {
    const hull = this.techService.getHullByName(name);
    if (hull) return hull.img ?? '';
    const comp = this.techService.getComponentByName(name);
    return comp?.img ?? '';
  }

  getExternalDependenciesWithStatus(
    name: string
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
      .filter((r) => r.field !== this.selectedField && r.level > 0)
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
