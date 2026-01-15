import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Cost {
  resources?: number;
  ironium?: number;
  boranium?: number;
  germanium?: number;
}

@Component({
  selector: 'app-resource-cost',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cost(); as c) {
      <div class="cost-display" [class.inline]="inline()">
        @if (c.ironium) {
          <span class="cost-item ironium" title="Ironium">
            {{ c.ironium }} <span class="unit">Fe</span>
          </span>
        }
        @if (c.boranium) {
          <span class="cost-item boranium" title="Boranium">
            {{ c.boranium }} <span class="unit">B</span>
          </span>
        }
        @if (c.germanium) {
          <span class="cost-item germanium" title="Germanium">
            {{ c.germanium }} <span class="unit">Ge</span>
          </span>
        }
        @if (c.resources) {
          <span class="cost-item resources" title="Resources">
            {{ c.resources }} <span class="unit">Res</span>
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .cost-display {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.9em;
    }
    
    .cost-display.inline {
      display: inline-flex;
    }

    .cost-item {
      display: inline-flex;
      align-items: baseline;
      font-weight: 500;
    }

    .unit {
      font-size: 0.85em;
      margin-left: 1px;
      opacity: 0.8;
    }

    /* Resource Colors - matching system theme */
    .ironium { color: var(--color-ironium); } /* Ironium-ish gray */
    .boranium { color: var(--color-boranium); } /* Gold/Yellow */
    .germanium { color: var(--color-germanium); } /* Green */
    .resources { color: var(--color-resources); } /* Blue */
    
    /* Dark mode adjustments if parent context is dark, 
       but we want to use these colors as they pop on both usually, 
       or rely on the fact we are switching to light theme. 
       These colors are fairly standard for the app based on PlanetSummary.
    */
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceCostComponent {
  readonly cost = input.required<Cost>();
  readonly inline = input(true);
}
