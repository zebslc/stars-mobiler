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

export interface LongPressEvent {
  position: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  target: Element;
}

/**
 * Directive that detects long press gestures on both mouse and touch
 */
@Directive({
  selector: '[appLongPress]',
  standalone: true
})
export class LongPressDirective implements OnInit, OnDestroy {
  @Input() longPressThreshold: number = 500; // milliseconds
  @Input() longPressConfig: Partial<InputServiceConfig> = {};
  @Output() longPress = new EventEmitter<LongPressEvent>();
  
  private handlerId: string;

  constructor(
    private elementRef: ElementRef<Element>,
    private inputService: InputInteractionService
  ) {
    this.handlerId = `longpress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    const config: Partial<InputServiceConfig> = {
      enabledGestures: ['longpress'],
      gestures: {
        longPress: { threshold: this.longPressThreshold },
        doubleClick: { threshold: 300 },
        movement: { threshold: 10 },
        pinch: { minDistance: 20 }
      },
      preventDefault: false,
      stopPropagation: false,
      ...this.longPressConfig
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
    if (event.type === 'longpress') {
      const longPressEvent: LongPressEvent = {
        position: event.position,
        originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
        target: event.target
      };
      
      this.longPress.emit(longPressEvent);
    }
  }
}