import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-galaxy-map-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      style="position:absolute; bottom:1rem; right:1rem; display:flex; flex-direction:column; gap:0.5rem; align-items: flex-end;"
    >
      <!-- Nav Controls -->
      <div
        style="display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.8); padding:0.5rem; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.2)"
      >
        <div style="display:flex; gap:0.5rem; justify-content:center">
          <button (click)="zoomIn.emit()" style="width:30px;height:30px;font-weight:bold">+</button>
          <button (click)="zoomOut.emit()" style="width:30px;height:30px;font-weight:bold">
            -
          </button>
        </div>
        <div
          style="display:grid; grid-template-columns: 30px 30px 30px; gap:0.25rem; justify-content:center"
        >
          <div></div>
          <button (click)="pan.emit({ x: 0, y: -50 })" style="width:30px;height:30px">↑</button>
          <div></div>
          <button (click)="pan.emit({ x: -50, y: 0 })" style="width:30px;height:30px">←</button>
          <button (click)="reset.emit()" style="width:30px;height:30px;font-size:0.8rem">R</button>
          <button (click)="pan.emit({ x: 50, y: 0 })" style="width:30px;height:30px">→</button>
          <div></div>
          <button (click)="pan.emit({ x: 0, y: 50 })" style="width:30px;height:30px">↓</button>
          <div></div>
        </div>
      </div>
    </div>
  `,
})
export class GalaxyMapControlsComponent {
  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly pan = output<{ x: number; y: number }>();
  readonly reset = output<void>();
}
