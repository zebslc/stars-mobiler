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
  private touchZoomSvg: SVGSVGElement | null = null;

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

  startTouchZoom(touches: TouchList, svgElement: SVGSVGElement) {
    this.isPanning = false;
    this.lastTouchDistance = this.getTouchDistance(touches);
    // Store the SVG element for coordinate conversion
    this.touchZoomSvg = svgElement;
  }

  moveTouchZoom(touches: TouchList) {
    if (!this.touchZoomSvg) return;

    const dist = this.getTouchDistance(touches);
    const factor = dist / this.lastTouchDistance;

    const oldScale = this.scale();
    const newScale = Math.min(Math.max(oldScale * factor, 0.5), 5);

    if (newScale !== oldScale) {
      // Calculate midpoint between the two touches (recalculated each frame)
      const midClientX = (touches[0].clientX + touches[1].clientX) / 2;
      const midClientY = (touches[0].clientY + touches[1].clientY) / 2;

      // Convert client coordinates to SVG coordinates
      const point = this.touchZoomSvg.createSVGPoint();
      point.x = midClientX;
      point.y = midClientY;
      const svgPoint = point.matrixTransform(this.touchZoomSvg.getScreenCTM()!.inverse());

      // Use SVG coordinates as zoom center
      const zoomCenterX = svgPoint.x;
      const zoomCenterY = svgPoint.y;

      // Calculate world coordinates at the zoom center
      const worldX = (zoomCenterX - this.translateX()) / oldScale;
      const worldY = (zoomCenterY - this.translateY()) / oldScale;

      // Apply new scale and adjust translation to keep zoom center fixed
      this.scale.set(newScale);
      this.translateX.set(zoomCenterX - worldX * newScale);
      this.translateY.set(zoomCenterY - worldY * newScale);
    }

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
