import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="cost-display" [class.inline]="inline">
      @if (cost.ironium) {
        <span class="cost-item ironium" title="Ironium">
          {{ cost.ironium }} <span class="unit">Fe</span>
        </span>
      }
      @if (cost.boranium) {
        <span class="cost-item boranium" title="Boranium">
          {{ cost.boranium }} <span class="unit">B</span>
        </span>
      }
      @if (cost.germanium) {
        <span class="cost-item germanium" title="Germanium">
          {{ cost.germanium }} <span class="unit">Ge</span>
        </span>
      }
      @if (cost.resources) {
        <span class="cost-item resources" title="Resources">
          {{ cost.resources }} <span class="unit">Res</span>
        </span>
      }
    </div>
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
    .ironium { color: #a4b0be; } /* Iron-ish gray */
    .boranium { color: #f1c40f; } /* Gold/Yellow */
    .germanium { color: #2ecc71; } /* Green */
    .resources { color: #3498db; } /* Blue */
    
    /* Dark mode adjustments if parent context is dark, 
       but we want to use these colors as they pop on both usually, 
       or rely on the fact we are switching to light theme. 
       These colors are fairly standard for the app based on PlanetSummary.
    */
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceCostComponent {
  @Input({ required: true }) cost: Cost = {};
  @Input() inline: boolean = true;
}
