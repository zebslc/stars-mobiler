import { Directive, ElementRef, OnInit, OnDestroy, input, output, Renderer2 } from '@angular/core';
import { InputInteractionService } from '../../services/core/input-interaction.service';
import { 
  UnifiedInputEvent, 
  InputServiceConfig, 
  Point 
} from '../../models/input-events.model';

export interface DragEvent {
  position: Point;
  delta: Point;
  startPosition: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  target: Element;
}

export interface DropEvent extends DragEvent {
  dropTarget: Element | null;
}

/**
 * Directive that handles drag and drop functionality
 * Supports both mouse and touch drag operations
 */
@Directive({
  selector: '[appDragDrop]',
  standalone: true
})
export class DragDropDirective implements OnInit, OnDestroy {
  readonly dragDropConfig = input<Partial<InputServiceConfig>>({});
  readonly dragHandle = input<string | Element | null>(null);
  readonly dragData = input<any>(null);
  readonly enableGhost = input(true);
  readonly ghostOpacity = input(0.5);

  readonly dragStart = output<DragEvent>();
  readonly drag = output<DragEvent>();
  readonly dragEnd = output<DragEvent>();
  readonly drop = output<DropEvent>();
  
  private handlerId: string;
  private isDragging = false;
  private ghostElement: HTMLElement | null = null;
  private dragStartPosition: Point | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private inputService: InputInteractionService,
    private renderer: Renderer2
  ) {
    this.handlerId = `dragdrop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    const config: Partial<InputServiceConfig> = {
      enabledGestures: ['drag', 'pan'],
      gestures: {
        longPress: { threshold: 500 },
        doubleClick: { threshold: 300 },
        movement: { threshold: 5 }, // Lower threshold for drag detection
        pinch: { minDistance: 20 }
      },
      preventDefault: true,
      stopPropagation: false,
      ...this.dragDropConfig()
    };

    // If dragHandle is specified, only attach to the handle element
    const targetElement = this.getDragHandle() || this.elementRef.nativeElement;
    
    this.inputService.attachToElement(
      targetElement,
      config,
      this.handlerId
    );

    this.inputService.registerHandler(this.handlerId, this.handleInput.bind(this));
  }

  ngOnDestroy(): void {
    const targetElement = this.getDragHandle() || this.elementRef.nativeElement;
    this.inputService.detachFromElement(targetElement);
    this.inputService.unregisterHandler(this.handlerId);
    this.cleanupGhost();
  }

  private handleInput(event: UnifiedInputEvent): void {
    switch (event.type) {
      case 'drag':
        if (!this.isDragging) {
          this.startDrag(event);
        } else {
          this.updateDrag(event);
        }
        break;
      case 'pan':
        if (this.isDragging) {
          this.endDrag(event);
        }
        break;
    }
  }

  private startDrag(event: UnifiedInputEvent): void {
    if (!event.gestureData?.startPosition) return;
    
    this.isDragging = true;
    this.dragStartPosition = event.gestureData.startPosition;

    const dragEvent: DragEvent = {
      position: event.position,
      delta: event.gestureData.delta || { x: 0, y: 0 },
      startPosition: event.gestureData.startPosition,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    // Create ghost element if enabled
    if (this.enableGhost()) {
      this.createGhostElement(event.position);
    }

    // Add dragging class to original element
    this.renderer.addClass(this.elementRef.nativeElement, 'dragging');

    this.dragStart.emit(dragEvent);
  }

  private updateDrag(event: UnifiedInputEvent): void {
    if (!this.isDragging || !this.dragStartPosition || !event.gestureData?.delta) return;

    const dragEvent: DragEvent = {
      position: event.position,
      delta: event.gestureData.delta,
      startPosition: this.dragStartPosition,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    // Update ghost position
    if (this.ghostElement) {
      this.updateGhostPosition(event.position);
    }

    this.drag.emit(dragEvent);
  }

  private endDrag(event: UnifiedInputEvent): void {
    if (!this.isDragging || !this.dragStartPosition) return;

    const dragEvent: DragEvent = {
      position: event.position,
      delta: event.gestureData?.delta || { x: 0, y: 0 },
      startPosition: this.dragStartPosition,
      originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
      target: event.target
    };

    // Find drop target
    const dropTarget = this.findDropTarget(event.position);
    
    const dropEvent: DropEvent = {
      ...dragEvent,
      dropTarget
    };

    // Cleanup
    this.isDragging = false;
    this.dragStartPosition = null;
    this.renderer.removeClass(this.elementRef.nativeElement, 'dragging');
    this.cleanupGhost();

    this.dragEnd.emit(dragEvent);
    this.drop.emit(dropEvent);
  }

  private createGhostElement(position: Point): void {
    const originalElement = this.elementRef.nativeElement;
    
    // Clone the original element
    this.ghostElement = originalElement.cloneNode(true) as HTMLElement;
    
    // Style the ghost element
    this.renderer.setStyle(this.ghostElement, 'position', 'fixed');
    this.renderer.setStyle(this.ghostElement, 'top', '0px');
    this.renderer.setStyle(this.ghostElement, 'left', '0px');
    this.renderer.setStyle(this.ghostElement, 'opacity', this.ghostOpacity().toString());
    this.renderer.setStyle(this.ghostElement, 'pointer-events', 'none');
    this.renderer.setStyle(this.ghostElement, 'z-index', '9999');
    this.renderer.setStyle(this.ghostElement, 'transform', 
      `translate(${position.x - originalElement.offsetWidth / 2}px, ${position.y - originalElement.offsetHeight / 2}px)`
    );
    
    // Add ghost class for styling
    this.renderer.addClass(this.ghostElement, 'drag-ghost');
    
    // Append to body
    this.renderer.appendChild(document.body, this.ghostElement);
  }

  private updateGhostPosition(position: Point): void {
    if (!this.ghostElement) return;
    
    const originalElement = this.elementRef.nativeElement;
    this.renderer.setStyle(this.ghostElement, 'transform', 
      `translate(${position.x - originalElement.offsetWidth / 2}px, ${position.y - originalElement.offsetHeight / 2}px)`
    );
  }

  private findDropTarget(position: Point): Element | null {
    // Temporarily hide the ghost element to get the element underneath
    if (this.ghostElement) {
      this.renderer.setStyle(this.ghostElement, 'display', 'none');
    }
    
    const elementBelow = document.elementFromPoint(position.x, position.y);
    
    // Restore ghost element
    if (this.ghostElement) {
      this.renderer.setStyle(this.ghostElement, 'display', 'block');
    }
    
    return elementBelow;
  }

  private cleanupGhost(): void {
    if (this.ghostElement) {
      this.renderer.removeChild(document.body, this.ghostElement);
      this.ghostElement = null;
    }
  }

  private getDragHandle(): Element | null {
    const handle = this.dragHandle();
    if (!handle) return null;

    if (typeof handle === 'string') {
      return this.elementRef.nativeElement.querySelector(handle);
    }

    return handle;
  }
}