import { 
  Directive, 
  ElementRef, 
  OnInit, 
  OnDestroy, 
  Output, 
  EventEmitter, 
  Input 
} from '@angular/core';
import { InputInteractionService } from '../../services/core/input-interaction.service';
import { 
  UnifiedInputEvent, 
  InputServiceConfig, 
  Point 
} from '../../models/input-events.model';

export interface PanEvent {
  position: Point;
  delta: Point;
  startPosition: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  target: Element;
}

export interface PanZoomEvent extends PanEvent {
  scale?: number;
  gestureCenter?: Point;
}

/**
 * Directive that handles pan and zoom gestures
 * Supports mouse drag, touch pan, and pinch-to-zoom
 */
@Directive({
  selector: '[appPanZoom]',
  standalone: true
})
export class PanZoomDirective implements OnInit, OnDestroy {
  @Input() panZoomConfig: Partial<InputServiceConfig> = {};
  @Input() enablePan: boolean = true;
  @Input() enableZoom: boolean = true;
  @Input() movementThreshold: number = 10;
  
  @Output() panStart = new EventEmitter<PanEvent>();
  @Output() pan = new EventEmitter<PanEvent>();
  @Output() panEnd = new EventEmitter<PanEvent>();
  @Output() zoom = new EventEmitter<PanZoomEvent>();
  @Output() wheel = new EventEmitter<PanZoomEvent>();
  
  private handlerId: string;
  private isPanning = false;
  private isZooming = false;

  constructor(
    private elementRef: ElementRef<Element>,
    private inputService: InputInteractionService
  ) {
    this.handlerId = `panzoom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    const enabledGestures: Array<'tap' | 'longpress' | 'doubletap' | 'pan' | 'pinch' | 'drag' | 'wheel'> = [];
    
    if (this.enablePan) {
      enabledGestures.push('pan', 'drag');
    }
    if (this.enableZoom) {
      enabledGestures.push('pinch', 'wheel');
    }

    const config: Partial<InputServiceConfig> = {
      enabledGestures,
      gestures: {
        longPress: { threshold: 500 },
        doubleClick: { threshold: 300 },
        movement: { threshold: this.movementThreshold },
        pinch: { minDistance: 20 }
      },
      preventDefault: true,
      stopPropagation: false,
      ...this.panZoomConfig
    };

    this.inputService.attachToElement(
      this.elementRef.nativeElement,
      config,
      this.handlerId
    );

    this.inputService.registerHandler(this.handlerId, this.handleInput.bind(this));
  }

  ngOnDestroy(): void {
    this.inputService.detachFromElement(this.elementRef.nativeElement);
    this.inputService.unregisterHandler(this.handlerId);
  }

  private handleInput(event: UnifiedInputEvent): void {
    switch (event.type) {
      case 'pan':
        this.handlePanEvent(event);
        break;
      case 'drag':
        this.handleDragEvent(event);
        break;
      case 'pinch':
        this.handlePinchEvent(event);
        break;
      case 'wheel':
        this.handleWheelEvent(event);
        break;
    }
  }

  private handlePanEvent(event: UnifiedInputEvent): void {
    if (!this.enablePan || !event.gestureData?.delta || !event.gestureData?.startPosition) {
      return;
    }

    const panEvent: PanEvent = {
      position: event.position,
      delta: event.gestureData.delta,
      startPosition: event.gestureData.startPosition,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    if (!this.isPanning) {
      this.isPanning = true;
      this.panStart.emit(panEvent);
    }

    this.pan.emit(panEvent);
  }

  private handleDragEvent(event: UnifiedInputEvent): void {
    if (!this.enablePan || !event.gestureData?.delta || !event.gestureData?.startPosition) {
      return;
    }

    const panEvent: PanEvent = {
      position: event.position,
      delta: event.gestureData.delta,
      startPosition: event.gestureData.startPosition,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    if (this.isPanning) {
      this.isPanning = false;
      this.panEnd.emit(panEvent);
    }
  }

  private handlePinchEvent(event: UnifiedInputEvent): void {
    if (!this.enableZoom || !event.gestureData?.scale) {
      return;
    }

    const zoomEvent: PanZoomEvent = {
      position: event.position,
      delta: event.gestureData.delta || { x: 0, y: 0 },
      startPosition: event.gestureData.startPosition || event.position,
      scale: event.gestureData.scale,
      gestureCenter: event.position,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    this.zoom.emit(zoomEvent);
  }

  private handleWheelEvent(event: UnifiedInputEvent): void {
    if (!this.enableZoom || !event.gestureData?.deltaY) {
      return;
    }

    const scale = event.gestureData.deltaY > 0 ? 0.9 : 1.1; // Zoom out/in

    const wheelEvent: PanZoomEvent = {
      position: event.position,
      delta: { x: 0, y: event.gestureData.deltaY },
      startPosition: event.position,
      scale,
      gestureCenter: event.position,
      originalEvent: event.originalEvent as WheelEvent,
      target: event.target
    };

    this.wheel.emit(wheelEvent);
  }
}