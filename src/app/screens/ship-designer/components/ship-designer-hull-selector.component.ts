import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HullTemplate } from '../../../data/tech-atlas.types';

@Component({
  selector: 'app-ship-designer-hull-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Select Hull</h3>
        <div class="hull-list">
          @for (hull of hulls; track hull.id || hull.Name) {
            <div class="hull-option" (click)="onSelect(hull.id || hull.Name)">
              <div class="hull-icon">
                <img
                  [src]="getHullImagePath(hull)"
                  [alt]="hull.Name"
                  (error)="onImageError($event)"
                  (click)="$event.stopPropagation(); onPreview(hull)"
                />
              </div>
              <div class="hull-details">
                <div class="hull-name">{{ hull.Name }}</div>
                <div class="hull-role">{{ hull.role }}</div>
                <div class="hull-specs">
                  {{ hull.Stats.Mass }}kt | {{ hull.Stats['Max Fuel'] }}mg | Armor {{ hull.Stats.Armor }}
                </div>
                <div class="hull-tech">Tech: Con {{ hull.techReq?.Construction || 0 }}</div>
              </div>
            </div>
          }
        </div>
        <button (click)="onClose()" class="btn-text">Close</button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      }

      .modal-content {
        background: #1a1a2e;
        border: 1px solid #4fc3f7;
        border-radius: 8px;
        padding: 1.5rem;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      }

      h3 {
        margin-top: 0;
        color: #4fc3f7;
        border-bottom: 1px solid rgba(79, 195, 247, 0.3);
        padding-bottom: 0.5rem;
      }

      .hull-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }

      .hull-option {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: left;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
        overflow: hidden;
      }

      .hull-option:hover {
        background: rgba(79, 195, 247, 0.1);
        border-color: #4fc3f7;
      }

      .hull-icon {
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .hull-icon img {
        max-width: 100%;
        max-height: 100%;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .hull-icon img:hover {
        opacity: 0.8;
      }

      .hull-details {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0; /* Prevents text overflow issues in flex items */
      }

      .hull-name {
        font-weight: bold;
        color: #fff;
        font-size: 0.95rem;
        margin-bottom: 0.15rem;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .hull-role {
        font-size: 0.75rem;
        color: #aaa;
        margin-bottom: 0.15rem;
        font-style: italic;
      }

      .hull-specs {
        font-size: 0.75rem;
        color: #ccc;
        margin-bottom: 0.15rem;
      }

      .hull-tech {
        font-size: 0.75rem;
        color: #4fc3f7;
      }

      .btn-text {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        transition: color 0.2s;
        float: right;
      }

      .btn-text:hover {
        color: #fff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerHullSelectorComponent {
  @Input({ required: true }) hulls: HullTemplate[] = [];
  @Output() hullSelected = new EventEmitter<string>();
  @Output() previewHull = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onSelect(hullId: string) {
    this.hullSelected.emit(hullId);
  }

  onPreview(hull: HullTemplate) {
    this.previewHull.emit(hull.Name);
  }

  onClose() {
    this.close.emit();
  }

  getHullImagePath(hull: HullTemplate): string {
    if ((hull as any).img) {
      return `/assets/tech-icons/${(hull as any).img}.png`;
    }
    // Fallback based on name if no img property
    const name = hull.Name.toLowerCase();
    if (name.includes('scout')) return '/assets/tech-icons/hull-scout.png';
    if (name.includes('freighter')) {
      if (name.includes('small')) return '/assets/tech-icons/hull-freight-s.png';
      if (name.includes('medium')) return '/assets/tech-icons/hull-freight-m.png';
      if (name.includes('large')) return '/assets/tech-icons/hull-freight-l.png';
      return '/assets/tech-icons/hull-freight-s.png';
    }
    if (name.includes('colony')) return '/assets/tech-icons/hull-colony.png';
    return '/assets/tech-icons/hull-scout.png';
  }

  onImageError(event: any) {
    event.target.src = '/assets/tech-icons/hull-scout.png';
  }
}
