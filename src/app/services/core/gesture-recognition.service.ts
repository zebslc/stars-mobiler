import { Injectable } from '@angular/core';
import { Point, GestureState, GestureConfig, UnifiedInputEvent } from '../../models/input-events.model';

@Injectable({
  providedIn: 'root'
})
export class GestureRecognitionService {
  private readonly DEFAULT_CONFIG: GestureConfig = {
    longPress: { threshold: 500 },
    doubleClick: { threshold: 300 },
    movement: { threshold: 10 },
    pinch: { minDistance: 20 }
  };

  constructor() {}

  /**
   * Initializes a new gesture state
   */
  createGestureState(initialPosition: Point, touchCount: number = 1): GestureState {
    return {
      ...this.createBasicGestureState(initialPosition, touchCount),
      panData: this.createInitialPanData(),
      pinchData: this.createInitialPinchData(initialPosition, touchCount),
      longPressData: this.createInitialLongPressData(),
      doubleClickData: this.createInitialDoubleClickData()
    };
  }

  /**
   * Creates basic gesture state properties
   */
  private createBasicGestureState(initialPosition: Point, touchCount: number) {
    return {
      isActive: true,
      startTime: Date.now(),
      startPosition: { ...initialPosition },
      currentPosition: { ...initialPosition },
      lastPosition: { ...initialPosition },
      touchCount,
      pointerIds: new Set<number>()
    };
  }

  /**
   * Creates initial pan data structure
   */
  private createInitialPanData() {
    return {
      totalDelta: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 }
    };
  }

  /**
   * Creates initial pinch data structure if applicable
   */
  private createInitialPinchData(initialPosition: Point, touchCount: number) {
    return touchCount === 2 ? {
      startDistance: 0,
      currentDistance: 0,
      startScale: 1,
      currentScale: 1,
      center: { ...initialPosition }
    } : undefined;
  }

  /**
   * Creates initial long press data structure
   */
  private createInitialLongPressData() {
    return {
      timer: null,
      triggered: false
    };
  }

  /**
   * Creates initial double click data structure
   */
  private createInitialDoubleClickData() {
    return {
      lastClickTime: 0,
      clickCount: 0
    };
  }

  /**
   * Updates gesture state with new position
   */
  updateGestureState(state: GestureState, newPosition: Point, touchCount?: number): void {
    this.updatePanDataIfNeeded(state, newPosition);
    this.updatePositions(state, newPosition);
    this.updateTouchCountIfProvided(state, touchCount);
  }

  /**
   * Updates pan data with velocity and delta calculations
   */
  private updatePanDataIfNeeded(state: GestureState, newPosition: Point): void {
    if (!state.panData) return;
    
    const now = Date.now();
    const timeDelta = now - (state.lastPosition ? now : state.startTime);
    
    if (timeDelta > 0) {
      state.panData.velocity = this.calculateVelocity(state.currentPosition, newPosition, timeDelta);
      state.panData.totalDelta = this.calculateTotalDelta(state.startPosition, newPosition);
    }
  }

  /**
   * Calculates velocity between two positions
   */
  private calculateVelocity(oldPosition: Point, newPosition: Point, timeDelta: number): Point {
    return {
      x: (newPosition.x - oldPosition.x) / timeDelta,
      y: (newPosition.y - oldPosition.y) / timeDelta
    };
  }

  /**
   * Calculates total delta from start position
   */
  private calculateTotalDelta(startPosition: Point, currentPosition: Point): Point {
    return {
      x: currentPosition.x - startPosition.x,
      y: currentPosition.y - startPosition.y
    };
  }

  /**
   * Updates current and last positions
   */
  private updatePositions(state: GestureState, newPosition: Point): void {
    state.lastPosition = { ...state.currentPosition };
    state.currentPosition = { ...newPosition };
  }

  /**
   * Updates touch count if provided
   */
  private updateTouchCountIfProvided(state: GestureState, touchCount?: number): void {
    if (touchCount !== undefined) {
      state.touchCount = touchCount;
    }
  }

  /**
   * Checks if movement exceeds threshold for gesture recognition
   */
  hasMovementExceededThreshold(state: GestureState, config: GestureConfig = this.DEFAULT_CONFIG): boolean {
    const distance = this.calculateDistance(state.startPosition, state.currentPosition);
    return distance > config.movement.threshold;
  }

  /**
   * Checks if enough time has passed for a long press
   */
  isLongPress(state: GestureState, config: GestureConfig = this.DEFAULT_CONFIG): boolean {
    if (state.longPressData?.triggered) return false;
    
    const elapsed = Date.now() - state.startTime;
    const hasMinimumTime = elapsed >= config.longPress.threshold;
    const hasMinimalMovement = !this.hasMovementExceededThreshold(state, config);
    
    return hasMinimumTime && hasMinimalMovement;
  }

  /**
   * Checks if clicks qualify as double-click
   */
  isDoubleClick(lastClickTime: number, currentTime: number, config: GestureConfig = this.DEFAULT_CONFIG): boolean {
    return (currentTime - lastClickTime) < config.doubleClick.threshold;
  }

  /**
   * Sets up long press detection with timer
   */
  startLongPressDetection(
    state: GestureState, 
    callback: () => void, 
    config: GestureConfig = this.DEFAULT_CONFIG
  ): void {
    if (state.longPressData?.timer) {
      clearTimeout(state.longPressData.timer);
    }

    if (!state.longPressData) {
      state.longPressData = { timer: null, triggered: false };
    }

    state.longPressData.timer = window.setTimeout(() => {
      if (state.isActive && !this.hasMovementExceededThreshold(state, config)) {
        state.longPressData!.triggered = true;
        callback();
      }
    }, config.longPress.threshold);
  }

  /**
   * Cancels long press detection
   */
  cancelLongPress(state: GestureState): void {
    if (state.longPressData?.timer) {
      clearTimeout(state.longPressData.timer);
      state.longPressData.timer = null;
    }
    if (state.longPressData) {
      state.longPressData.triggered = false;
    }
  }

  /**
   * Updates pinch gesture data for two-finger interactions
   */
  updatePinchGesture(state: GestureState, touch1: Point, touch2: Point): void {
    if (!state.pinchData) {
      const distance = this.calculateDistance(touch1, touch2);
      state.pinchData = {
        startDistance: distance,
        currentDistance: distance,
        startScale: 1,
        currentScale: 1,
        center: this.calculateMidpoint(touch1, touch2)
      };
      return;
    }

    const currentDistance = this.calculateDistance(touch1, touch2);
    const scale = currentDistance / state.pinchData.startDistance;
    
    state.pinchData.currentDistance = currentDistance;
    state.pinchData.currentScale = scale;
    state.pinchData.center = this.calculateMidpoint(touch1, touch2);
  }

  /**
   * Calculates distance between two points
   */
  calculateDistance(point1: Point, point2: Point): number {
    return Math.hypot(point2.x - point1.x, point2.y - point1.y);
  }

  /**
   * Calculates midpoint between two points
   */
  calculateMidpoint(point1: Point, point2: Point): Point {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    };
  }

  /**
   * Determines gesture type based on current state
   */
  recognizeGesture(state: GestureState, config: GestureConfig = this.DEFAULT_CONFIG): string | null {
    if (!state.isActive) return null;

    return this.detectLongPress(state, config) ||
           this.detectPinchGesture(state) ||
           this.detectMovementGesture(state, config) ||
           null;
  }

  /**
   * Detects long press gesture
   */
  private detectLongPress(state: GestureState, config: GestureConfig): string | null {
    return this.isLongPress(state, config) ? 'longpress' : null;
  }

  /**
   * Detects pinch/zoom gesture
   */
  private detectPinchGesture(state: GestureState): string | null {
    if (state.touchCount !== 2 || !state.pinchData) return null;
    
    const scaleChange = Math.abs(state.pinchData.currentScale - 1);
    const PINCH_THRESHOLD = 0.1; // 10% scale change threshold
    
    return scaleChange > PINCH_THRESHOLD ? 'pinch' : null;
  }

  /**
   * Detects movement-based gestures (pan/drag)
   */
  private detectMovementGesture(state: GestureState, config: GestureConfig): string | null {
    if (!this.hasMovementExceededThreshold(state, config)) return null;
    
    const elapsed = Date.now() - state.startTime;
    const DRAG_TO_PAN_THRESHOLD = 100; // milliseconds
    
    return elapsed > DRAG_TO_PAN_THRESHOLD ? 'pan' : 'drag';
  }

  /**
   * Creates a unified input event from gesture state
   */
  createUnifiedEvent(
    type: string,
    state: GestureState,
    originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent,
    target: Element
  ): UnifiedInputEvent {
    return {
      type: type as any,
      position: state.currentPosition,
      originalEvent,
      target,
      timestamp: Date.now(),
      modifiers: this.extractEventModifiers(originalEvent),
      gestureData: this.createGestureData(type, state, originalEvent)
    };
  }

  /**
   * Extracts modifier keys from the original event
   */
  private extractEventModifiers(originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent) {
    return {
      ctrl: 'ctrlKey' in originalEvent ? originalEvent.ctrlKey : false,
      shift: 'shiftKey' in originalEvent ? originalEvent.shiftKey : false,
      alt: 'altKey' in originalEvent ? originalEvent.altKey : false
    };
  }

  /**
   * Creates gesture-specific data based on gesture type
   */
  private createGestureData(
    type: string, 
    state: GestureState, 
    originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent
  ): any {
    let gestureData = this.getGestureTypeSpecificData(type, state, originalEvent);
    
    if (state.touchCount > 1) {
      gestureData.touchCount = state.touchCount;
    }
    
    return gestureData;
  }

  /**
   * Gets gesture data specific to the gesture type
   */
  private getGestureTypeSpecificData(
    type: string,
    state: GestureState,
    originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent
  ): any {
    switch (type) {
      case 'pan':
      case 'drag':
        return this.createMovementGestureData(state);
      case 'pinch':
        return this.createPinchGestureData(state);
      case 'wheel':
        return this.createWheelGestureData(originalEvent);
      default:
        return {};
    }
  }

  /**
   * Creates gesture data for movement-based gestures
   */
  private createMovementGestureData(state: GestureState) {
    return {
      delta: state.panData?.totalDelta,
      startPosition: state.startPosition
    };
  }

  /**
   * Creates gesture data for pinch gestures
   */
  private createPinchGestureData(state: GestureState) {
    return {
      scale: state.pinchData?.currentScale,
      distance: state.pinchData?.currentDistance
    };
  }

  /**
   * Creates gesture data for wheel events
   */
  private createWheelGestureData(originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent) {
    return {
      deltaY: 'deltaY' in originalEvent ? originalEvent.deltaY : 0
    };
  }

  /**
   * Cleans up gesture state
   */
  cleanup(state: GestureState): void {
    state.isActive = false;
    this.cancelLongPress(state);
    state.pointerIds.clear();
  }
}