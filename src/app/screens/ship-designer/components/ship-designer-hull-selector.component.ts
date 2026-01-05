import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hull } from '../../../data/hulls.data';

@Component({
  selector: 'app-ship-designer-hull-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Select Hull</h3>
        <div class="hull-list">
          @for (hull of hulls; track hull.id) {
            <div class="hull-option" (click)="onSelect(hull.id)">
              <div class="hull-name">{{ hull.name }}</div>
              <div class="hull-role">{{ hull.role }}</div>
              <div class="hull-specs">
                {{ hull.mass }}kt | {{ hull.fuelCapacity }}mg | Armor {{ hull.armor }}
              </div>
              <div class="hull-tech">Tech: Con {{ hull.techRequired?.construction || 0 }}</div>
            </div>
          }
        </div>
        <button (click)="onClose()" class="btn-text">Close</button>
      </div>
    </div>
  `,
  styles: [`
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
      max-width: 600px;
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
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }

    .hull-option {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .hull-option:hover {
      background: rgba(79, 195, 247, 0.1);
      border-color: #4fc3f7;
    }

    .hull-name {
      font-weight: bold;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .hull-role {
      font-size: 0.8rem;
      color: #aaa;
      margin-bottom: 0.5rem;
      font-style: italic;
    }

    .hull-specs {
      font-size: 0.8rem;
      color: #ccc;
      margin-bottom: 0.25rem;
    }

    .hull-tech {
      font-size: 0.8rem;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipDesignerHullSelectorComponent {
  @Input({ required: true }) hulls: Hull[] = [];
  @Output() hullSelected = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  onSelect(hullId: string) {
    this.hullSelected.emit(hullId);
  }

  onClose() {
    this.close.emit();
  }
}
