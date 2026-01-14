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

export interface TouchClickEvent {
  position: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  target: Element;
}

/**
 * Directive that provides unified touch and click handling
 * Handles both mouse clicks and touch taps consistently
 */
@Directive({
  selector: '[appTouchClick]',
  standalone: true
})
export class TouchClickDirective implements OnInit, OnDestroy {
  @Input() touchClickConfig: Partial<InputServiceConfig> = {};
  @Output() touchClick = new EventEmitter<TouchClickEvent>();
  
  private handlerId: string;

  constructor(
    private elementRef: ElementRef<Element>,
    private inputService: InputInteractionService
  ) {
    this.handlerId = `touchclick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    const config: Partial<InputServiceConfig> = {
      enabledGestures: ['tap'],
      preventDefault: false,
      stopPropagation: false,
      ...this.touchClickConfig
    };

    console.log('📍 TouchClickDirective initializing on element:', this.elementRef.nativeElement.className, 'handlerId:', this.handlerId);
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
    if (event.type === 'tap') {
      console.log('📱 TouchClickDirective tap detected:', {
        type: event.type,
        position: event.position,
        target: event.target.className
      });
      const touchClickEvent: TouchClickEvent = {
        position: event.position,
        originalEvent: event.originalEvent as MouseEvent | TouchEvent | PointerEvent,
        target: event.target
      };
      
      this.touchClick.emit(touchClickEvent);
    }
  }
}