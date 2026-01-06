import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { TechField } from '../../data/tech-tree.data';
import { ResearchCurrentComponent } from './components/research-current.component';
import { ResearchFieldSelectorComponent } from './components/research-field-selector.component';
import { ResearchTechTreeComponent } from './components/research-tech-tree.component';
import { ResearchUnlockDetailsComponent } from '../../shared/components/research-unlock-details/research-unlock-details.component';

@Component({
  standalone: true,
  selector: 'app-research-overview',
  imports: [
    CommonModule,
    ResearchCurrentComponent,
    ResearchFieldSelectorComponent,
    ResearchTechTreeComponent,
    ResearchUnlockDetailsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="research-container">
      <h1>Research & Technology</h1>

      <app-research-current
        [selectedField]="selectedField()"
        (showTechTree)="showTechTree = true"
        (showUnlockDetails)="showUnlockDetails($event)"
      />

      <app-research-field-selector
        [selectedField]="selectedField()"
        (selectField)="selectField($event)"
      />

      @if (showTechTree) {
        <app-research-tech-tree
          [selectedField]="selectedField()"
          (close)="showTechTree = false"
          (showUnlockDetails)="showUnlockDetails($event)"
        />
      }

      @if (selectedUnlock()) {
        <app-research-unlock-details
          [unlockName]="selectedUnlock()!"
          (close)="selectedUnlock.set(null)"
        />
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
      }

      .research-container {
        padding: var(--space-lg);
        max-width: 1000px;
        margin: 0 auto;
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }

      h1 {
        margin: 0 0 var(--space-md) 0;
        font-size: var(--font-size-2xl);
      }
    `,
  ],
})
export class ResearchOverviewComponent {
  private gameState = inject(GameStateService);

  showTechTree = false;
  selectedUnlock = signal<string | null>(null);

  readonly selectedField = computed(
    () => this.gameState.player()?.selectedResearchField ?? 'Propulsion',
  );

  selectField(field: TechField) {
    this.gameState.setResearchField(field);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showUnlockDetails(unlock: string) {
    this.selectedUnlock.set(unlock);
  }
}
