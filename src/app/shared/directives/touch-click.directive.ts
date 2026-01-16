import { Directive, ElementRef, OnInit, OnDestroy, input, output } from '@angular/core';
import { InputInteractionService } from '../../services/core/input-interaction.service';
import type { UnifiedInputEvent, InputServiceConfig, Point } from '../../models/input-events.model';
import { LoggingService } from '../../services/core/logging.service';

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
  readonly touchClickConfig = input<Partial<InputServiceConfig>>({});
  readonly touchClick = output<TouchClickEvent>();

  private handlerId: string;

  constructor(
    private elementRef: ElementRef<Element>,
    private inputService: InputInteractionService,
    private logging: LoggingService,
  ) {
    this.handlerId = `touchclick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnInit(): void {
    const config: Partial<InputServiceConfig> = {
      enabledGestures: ['tap'],
      preventDefault: false,
      stopPropagation: false,
      ...this.touchClickConfig()
    };

    this.logging.debug('TouchClickDirective initializing', {
      handlerId: this.handlerId,
      targetClass: this.elementRef.nativeElement.className,
    });
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
      this.logging.debug('TouchClickDirective tap detected', {
        type: event.type,
        position: event.position,
        targetClass: event.target.className,
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
