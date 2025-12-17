import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { TECH_FIELDS, TECH_FIELD_LIST, TechField } from '../../data/tech-tree.data';

@Component({
  standalone: true,
  selector: 'app-research-overview',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="research-container">
      <h1>Research & Technology</h1>

      <!-- Research Summary -->
      <div class="research-summary">
        <div class="summary-card">
          <div class="summary-icon">🔬</div>
          <div class="summary-content">
            <div class="summary-label">Total Research</div>
            <div class="summary-value">{{ playerEconomy()?.research ?? 0 }} RP</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🏭</div>
          <div class="summary-content">
            <div class="summary-label">Research Labs</div>
            <div class="summary-value">{{ totalLabs() }}</div>
          </div>
        </div>
      </div>

      <!-- Tech Fields -->
      <div class="tech-fields">
        @for (fieldId of techFieldList; track fieldId) {
          <div class="tech-field-card">
            <div class="field-header">
              <div class="field-icon">{{ getFieldIcon(fieldId) }}</div>
              <div class="field-info">
                <h3>{{ getFieldInfo(fieldId).name }}</h3>
                <p class="field-description">{{ getFieldInfo(fieldId).description }}</p>
              </div>
              <div class="field-level">
                <div class="level-badge">{{ getCurrentLevel(fieldId) }}</div>
                <div class="level-label">Level</div>
              </div>
            </div>

            <div class="field-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  [style.width.%]="getProgressPercent(fieldId)"
                ></div>
              </div>
              <div class="progress-text">
                {{ getResearchProgress(fieldId) }} / {{ getNextLevelCost(fieldId) }} RP
              </div>
            </div>

            <div class="field-unlocks">
              <div class="unlocks-label">Next unlock at Level {{ getCurrentLevel(fieldId) + 1 }}:</div>
              <div class="unlock-list">
                @for (unlock of getNextUnlocks(fieldId); track unlock) {
                  <div class="unlock-item">
                    <span class="unlock-checkmark">✓</span>
                    {{ unlock }}
                  </div>
                }
                @if (getNextUnlocks(fieldId).length === 0) {
                  <div class="unlock-item text-muted">
                    <span class="unlock-checkmark">🏆</span>
                    Maximum level reached
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .research-container {
      padding: var(--space-lg);
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: var(--space-xl);
    }

    .research-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
    }

    .summary-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .summary-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .summary-content {
      flex: 1;
    }

    .summary-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-primary);
    }

    .tech-fields {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .tech-field-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .tech-field-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .field-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      margin-bottom: var(--space-lg);
    }

    .field-icon {
      font-size: 40px;
      flex-shrink: 0;
    }

    .field-info {
      flex: 1;
    }

    .field-info h3 {
      margin: 0 0 var(--space-xs) 0;
      font-size: var(--font-size-xl);
      color: var(--color-text-primary);
    }

    .field-description {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .field-level {
      text-align: center;
      flex-shrink: 0;
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
      margin-bottom: var(--space-xs);
    }

    .level-label {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .field-progress {
      margin-bottom: var(--space-lg);
    }

    .progress-bar {
      height: 12px;
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

    .progress-text {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-align: right;
    }

    .field-unlocks {
      background: var(--color-bg-tertiary);
      border-radius: var(--radius-md);
      padding: var(--space-md);
    }

    .unlocks-label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-sm);
    }

    .unlock-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .unlock-item {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
    }

    .unlock-checkmark {
      color: var(--color-success);
      font-weight: bold;
      flex-shrink: 0;
    }

    .unlock-item.text-muted {
      color: var(--color-text-muted);
    }

    .unlock-item.text-muted .unlock-checkmark {
      color: var(--color-warning);
    }
  `]
})
export class ResearchOverviewComponent {
  private gameState = inject(GameStateService);

  readonly player = this.gameState.player;
  readonly playerEconomy = this.gameState.playerEconomy;
  readonly techFieldList = TECH_FIELD_LIST;

  readonly totalLabs = computed(() => {
    const game = this.gameState.game();
    if (!game) return 0;
    return game.stars
      .flatMap(s => s.planets)
      .filter(p => p.ownerId === game.humanPlayer.id)
      .reduce((sum, p) => sum + (p.research || 0), 0);
  });

  getFieldInfo(field: TechField) {
    return TECH_FIELDS[field];
  }

  getFieldIcon(field: TechField): string {
    const icons: Record<TechField, string> = {
      energy: '⚡',
      weapons: '🚀',
      propulsion: '✈️',
      construction: '🏗️',
      electronics: '📡',
      biotechnology: '🧬',
    };
    return icons[field];
  }

  getCurrentLevel(field: TechField): number {
    const player = this.player();
    return player?.techLevels[field] ?? 0;
  }

  getResearchProgress(field: TechField): number {
    const player = this.player();
    return Math.floor(player?.researchProgress[field] ?? 0);
  }

  getNextLevelCost(field: TechField): number {
    const currentLevel = this.getCurrentLevel(field);
    if (currentLevel >= 26) return 0;
    const fieldInfo = TECH_FIELDS[field];
    return fieldInfo.levels[currentLevel + 1]?.cost ?? 0;
  }

  getProgressPercent(field: TechField): number {
    const progress = this.getResearchProgress(field);
    const cost = this.getNextLevelCost(field);
    if (cost === 0) return 100;
    return Math.min(100, (progress / cost) * 100);
  }

  getNextUnlocks(field: TechField): string[] {
    const currentLevel = this.getCurrentLevel(field);
    if (currentLevel >= 26) return [];
    const fieldInfo = TECH_FIELDS[field];
    return fieldInfo.levels[currentLevel + 1]?.unlocks ?? [];
  }
}
