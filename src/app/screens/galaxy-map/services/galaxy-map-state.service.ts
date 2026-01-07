import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GalaxyMapStateService {
  readonly scale = signal(1);
  readonly translateX = signal(0);
  readonly translateY = signal(0);

  // Selection state
  readonly selectedStarId = signal<string | null>(null);
  readonly selectedFleetId = signal<string | null>(null);

  // Constants
  private readonly MOUSE_SENSITIVITY = 3.0;
  private readonly TOUCH_SENSITIVITY = 3.5;

  // Pan state
  private isPanning = false;
  private panStartClientX = 0;
  private panStartClientY = 0;
  private panStartTranslateX = 0;
  private panStartTranslateY = 0;

  // Touch state
  private touchStartClientX = 0;
  private touchStartClientY = 0;
  private touchStartTranslateX = 0;
  private touchStartTranslateY = 0;
  private lastTouchDistance = 0;

  readonly transformString = computed(() => {
    return `translate(${this.translateX()} ${this.translateY()}) scale(${this.scale()})`;
  });

  zoomIn() {
    this.scale.update((s) => Math.min(s * 1.2, 5));
  }

  zoomOut() {
    this.scale.update((s) => Math.max(s / 1.2, 0.5));
  }

  resetView() {
    this.scale.set(1);
    this.translateX.set(0);
    this.translateY.set(0);
  }

  panArrow(dx: number, dy: number) {
    this.translateX.update((x) => x - dx);
    this.translateY.update((y) => y - dy);
  }

  // Mouse Pan Logic
  startPan(clientX: number, clientY: number) {
    this.isPanning = true;
    this.panStartClientX = clientX;
    this.panStartClientY = clientY;
    this.panStartTranslateX = this.translateX();
    this.panStartTranslateY = this.translateY();
  }

  pan(clientX: number, clientY: number) {
    if (!this.isPanning) return;
    const deltaX = clientX - this.panStartClientX;
    const deltaY = clientY - this.panStartClientY;

    this.translateX.set(this.panStartTranslateX + deltaX * this.MOUSE_SENSITIVITY);
    this.translateY.set(this.panStartTranslateY + deltaY * this.MOUSE_SENSITIVITY);
  }

  endPan() {
    this.isPanning = false;
  }

  // Wheel Zoom Logic
  handleWheel(delta: number, clientX: number, clientY: number, rectLeft: number, rectTop: number) {
    const factor = 1.1;
    const cursorX = clientX - rectLeft;
    const cursorY = clientY - rectTop;

    const oldScale = this.scale();
    let newScale = oldScale;

    if (delta > 0) {
      newScale = Math.min(oldScale * factor, 5);
    } else {
      newScale = Math.max(oldScale / factor, 0.5);
    }

    if (newScale !== oldScale) {
      const worldX = (cursorX - this.translateX()) / oldScale;
      const worldY = (cursorY - this.translateY()) / oldScale;

      this.scale.set(newScale);
      this.translateX.set(cursorX - worldX * newScale);
      this.translateY.set(cursorY - worldY * newScale);
    }
  }

  // Touch Logic
  startTouch(clientX: number, clientY: number) {
    this.isPanning = true;
    this.touchStartClientX = clientX;
    this.touchStartClientY = clientY;
    this.touchStartTranslateX = this.translateX();
    this.touchStartTranslateY = this.translateY();
  }

  moveTouchPan(clientX: number, clientY: number) {
    if (!this.isPanning) return;
    const deltaX = clientX - this.touchStartClientX;
    const deltaY = clientY - this.touchStartClientY;

    this.translateX.set(this.touchStartTranslateX + deltaX * this.TOUCH_SENSITIVITY);
    this.translateY.set(this.touchStartTranslateY + deltaY * this.TOUCH_SENSITIVITY);
  }

  startTouchZoom(touches: TouchList) {
    this.isPanning = false;
    this.lastTouchDistance = this.getTouchDistance(touches);
  }

  moveTouchZoom(touches: TouchList) {
    const dist = this.getTouchDistance(touches);
    const factor = dist / this.lastTouchDistance;
    this.scale.update((s) => Math.min(Math.max(s * factor, 0.5), 5));
    this.lastTouchDistance = dist;
  }

  endTouch() {
    this.isPanning = false;
  }

  private getTouchDistance(touches: TouchList): number {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
  }
}
