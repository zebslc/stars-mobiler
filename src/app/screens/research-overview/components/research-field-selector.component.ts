import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../services/game/game-state.service';
import { TECH_FIELDS, TECH_FIELD_LIST, TechField } from '../../../data/tech-tree.data';

@Component({
  selector: 'app-research-field-selector',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field-selection">
      <div class="selection-header">
        <h3>Select Research Field</h3>
      </div>
      <div class="field-grid">
        @for (fieldId of techFieldList; track fieldId) {
          <button
            class="field-button"
            [class.active]="selectedField === fieldId"
            (click)="onSelectField(fieldId)"
          >
            <div class="field-icon-large">{{ getFieldIcon(fieldId) }}</div>
            <div class="field-name">{{ getFieldInfo(fieldId).name }}</div>
            <div class="field-level-small">Lv {{ getCurrentLevel(fieldId) }}</div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .field-selection {
        display: flex;
        flex-direction: column;
      }

      .selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);
      }

      .selection-header h3 {
        margin: 0;
        font-size: var(--font-size-lg);
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
      }

      @media (min-width: 600px) {
        .field-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
        }
      }

      .field-button {
        background: var(--color-bg-secondary);
        border: 2px solid var(--color-border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-xs);
      }

      .field-button:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }

      .field-button.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }

      .field-icon-large {
        font-size: 36px;
      }

      .field-name {
        font-weight: 600;
        font-size: var(--font-size-sm);
      }

      .field-level-small {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .field-button.active .field-level-small {
        color: rgba(255, 255, 255, 0.8);
      }
    `,
  ],
})
export class ResearchFieldSelectorComponent {
  @Input({ required: true }) selectedField!: TechField;
  @Output() selectField = new EventEmitter<TechField>();

  private gs = inject(GameStateService);
  readonly techFieldList = TECH_FIELD_LIST;

  onSelectField(field: TechField) {
    this.selectField.emit(field);
  }

  getFieldInfo(field: TechField) {
    return TECH_FIELDS[field];
  }

  getFieldIcon(field: TechField): string {
    const icons: Record<TechField, string> = {
      Energy: '⚡',
      Kinetics: '🚀',
      Propulsion: '✈️',
      Construction: '🏗️',
    };
    return icons[field];
  }

  getCurrentLevel(field: TechField): number {
    return this.gs.player()?.techLevels[field] ?? 0;
  }
}
