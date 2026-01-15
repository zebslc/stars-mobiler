import { Directive, ElementRef, OnInit, OnDestroy, input, output, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface ClickOutsideEvent {
  target: EventTarget | null;
  originalEvent: MouseEvent | TouchEvent;
}

/**
 * Directive that detects clicks outside of the element
 * Useful for closing dropdowns, modals, and other overlays
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  readonly excludeElements = input<Element[]>([]);
  readonly includeTouch = input(true);
  readonly clickOutside = output<ClickOutsideEvent>();
  
  private document = inject(DOCUMENT);
  private clickListener?: (event: MouseEvent) => void;
  private touchListener?: (event: TouchEvent) => void;

  constructor(
    private elementRef: ElementRef<Element>
  ) {}

  ngOnInit(): void {
    // Listen for mouse clicks
    this.clickListener = (event: MouseEvent) => this.handleClickEvent(event);
    this.document.addEventListener('click', this.clickListener, { capture: true });

    // Listen for touch events if enabled
    if (this.includeTouch()) {
      this.touchListener = (event: TouchEvent) => this.handleTouchEvent(event);
      this.document.addEventListener('touchend', this.touchListener, { capture: true });
    }
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      this.document.removeEventListener('click', this.clickListener, { capture: true });
    }
    if (this.touchListener) {
      this.document.removeEventListener('touchend', this.touchListener, { capture: true });
    }
  }

  private handleClickEvent(event: MouseEvent): void {
    if (this.isOutsideClick(event.target)) {
      this.clickOutside.emit({
        target: event.target,
        originalEvent: event
      });
    }
  }

  private handleTouchEvent(event: TouchEvent): void {
    if (event.changedTouches && event.changedTouches.length > 0) {
      const touch = event.changedTouches[0];
      const elementAtPoint = this.document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (this.isOutsideClick(elementAtPoint)) {
        this.clickOutside.emit({
          target: elementAtPoint,
          originalEvent: event
        });
      }
    }
  }

  private isOutsideClick(target: EventTarget | null): boolean {
    if (!target || !(target instanceof Element)) {
      return true;
    }

    const element = this.elementRef.nativeElement;
    
    // Check if click is inside the element
    if (element.contains(target)) {
      return false;
    }

    // Check if click is inside any excluded elements
    return !this.excludeElements().some(excludedElement => 
      excludedElement.contains(target)
    );
  }
}