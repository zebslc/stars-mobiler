import { Injectable, NgZone } from '@angular/core';
import { 
  Point,
  UnifiedInputEvent, 
  InputServiceConfig, 
  InputHandler, 
  GestureState, 
  ManagedListener
} from '../../models/input-events.model';
import { GestureRecognitionService } from './gesture-recognition.service';

@Injectable({
  providedIn: 'root'
})
export class InputInteractionService {
  private readonly DEFAULT_CONFIG: InputServiceConfig = {
    gestures: {
      longPress: { threshold: 500 },
      doubleClick: { threshold: 300 },
      movement: { threshold: 10 },
      pinch: { minDistance: 20 }
    },
    preventDefault: true,
    stopPropagation: false,
    useCapture: false,
    enabledGestures: ['tap', 'longpress', 'doubletap', 'pan', 'pinch', 'drag', 'wheel']
  };

  private gestureStates = new Map<string, GestureState>();
  private managedListeners = new Map<Element, ManagedListener[]>();
  private handlerRegistry = new Map<string, Set<InputHandler>>();

  constructor(
    private gestureService: GestureRecognitionService,
    private ngZone: NgZone
  ) {}

  /**
   * Attaches input handling to an element
   */
  attachToElement(
    element: Element, 
    config: Partial<InputServiceConfig> = {},
    handlerId?: string
  ): void {
    // console.log('🔗 InputInteractionService.attachToElement called:', {
    //   element: element.className,
    //   handlerId,
    //   hasPointerEvent: 'PointerEvent' in window
    // });
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Clean up existing listeners
    this.detachFromElement(element);

    const listeners: ManagedListener[] = [];

    // Use pointer events for unified handling where supported
    if ('PointerEvent' in window) {
      this.attachPointerEvents(element, fullConfig, listeners, handlerId);
    } else {
      // Fallback to mouse and touch events
      this.attachMouseEvents(element, fullConfig, listeners, handlerId);
      this.attachTouchEvents(element, fullConfig, listeners, handlerId);
    }

    // Always attach wheel events separately
    if (fullConfig.enabledGestures.includes('wheel')) {
      this.attachWheelEvents(element, fullConfig, listeners, handlerId);
    }

    this.managedListeners.set(element, listeners);
    // console.log('✅ Listeners attached:', listeners.length);
  }

  /**
   * Detaches input handling from an element
   */
  detachFromElement(element: Element): void {
    const listeners = this.managedListeners.get(element);
    if (listeners) {
      listeners.forEach(listener => {
        listener.element.removeEventListener(
          listener.eventType, 
          listener.handler, 
          listener.options
        );
      });
      this.managedListeners.delete(element);
    }

    // Clean up any associated gesture states
    const elementId = this.getElementId(element);
    this.gestureStates.delete(elementId);
  }

  /**
   * Registers an input handler for specific gesture types
   */
  registerHandler(handlerId: string, handler: InputHandler): void {
    if (!this.handlerRegistry.has(handlerId)) {
      this.handlerRegistry.set(handlerId, new Set());
    }
    this.handlerRegistry.get(handlerId)!.add(handler);
  }

  /**
   * Unregisters an input handler
   */
  unregisterHandler(handlerId: string, handler?: InputHandler): void {
    const handlers = this.handlerRegistry.get(handlerId);
    if (handlers) {
      if (handler) {
        handlers.delete(handler);
      } else {
        handlers.clear();
      }
      if (handlers.size === 0) {
        this.handlerRegistry.delete(handlerId);
      }
    }
  }

  /**
   * Manually triggers a unified input event
   */
  triggerEvent(event: UnifiedInputEvent, handlerId?: string): void {
    this.processUnifiedEvent(event, handlerId);
  }

  private attachPointerEvents(
    element: Element, 
    config: InputServiceConfig, 
    listeners: ManagedListener[],
    handlerId?: string
  ): void {
    const pointerDown = (event: Event) => {
      this.handlePointerDown(event as PointerEvent, config, handlerId);
    };
    const pointerMove = (event: Event) => {
      this.handlePointerMove(event as PointerEvent, config, handlerId);
    };
    const pointerUp = (event: Event) => {
      this.handlePointerUp(event as PointerEvent, config, handlerId);
    };
    const pointerCancel = (event: Event) => {
      this.handlePointerCancel(event as PointerEvent, config, handlerId);
    };

    this.addEventListener(element, 'pointerdown', pointerDown, config, listeners);
    this.addEventListener(element, 'pointermove', pointerMove, config, listeners);
    this.addEventListener(element, 'pointerup', pointerUp, config, listeners);
    this.addEventListener(element, 'pointercancel', pointerCancel, config, listeners);
  }

  private attachMouseEvents(
    element: Element, 
    config: InputServiceConfig, 
    listeners: ManagedListener[],
    handlerId?: string
  ): void {
    const mouseDown = (event: Event) => {
      this.handleMouseDown(event as MouseEvent, config, handlerId);
    };
    const mouseMove = (event: Event) => {
      this.handleMouseMove(event as MouseEvent, config, handlerId);
    };
    const mouseUp = (event: Event) => {
      this.handleMouseUp(event as MouseEvent, config, handlerId);
    };
    const click = (event: Event) => {
      this.handleClick(event as MouseEvent, config, handlerId);
    };

    this.addEventListener(element, 'mousedown', mouseDown, config, listeners);
    this.addEventListener(element, 'mousemove', mouseMove, config, listeners);
    this.addEventListener(element, 'mouseup', mouseUp, config, listeners);
    this.addEventListener(element, 'click', click, config, listeners);
  }

  private attachTouchEvents(
    element: Element, 
    config: InputServiceConfig, 
    listeners: ManagedListener[],
    handlerId?: string
  ): void {
    const touchStart = (event: Event) => {
      this.handleTouchStart(event as TouchEvent, config, handlerId);
    };
    const touchMove = (event: Event) => {
      this.handleTouchMove(event as TouchEvent, config, handlerId);
    };
    const touchEnd = (event: Event) => {
      this.handleTouchEnd(event as TouchEvent, config, handlerId);
    };

    this.addEventListener(element, 'touchstart', touchStart, config, listeners, { passive: false });
    this.addEventListener(element, 'touchmove', touchMove, config, listeners, { passive: false });
    this.addEventListener(element, 'touchend', touchEnd, config, listeners);
  }

  private attachWheelEvents(
    element: Element, 
    config: InputServiceConfig, 
    listeners: ManagedListener[],
    handlerId?: string
  ): void {
    const wheel = (event: Event) => {
      this.handleWheel(event as WheelEvent, config, handlerId);
    };

    this.addEventListener(element, 'wheel', wheel, config, listeners, { passive: false });
  }

  private addEventListener(
    element: Element,
    eventType: string,
    handler: (event: Event) => void,
    config: InputServiceConfig,
    listeners: ManagedListener[],
    extraOptions: AddEventListenerOptions = {}
  ): void {
    const options = {
      capture: config.useCapture,
      passive: false,
      ...extraOptions
    };

    element.addEventListener(eventType, handler, options);
    
    listeners.push({
      element,
      eventType,
      handler,
      options
    });
  }

  // Event Handlers
  private handlePointerDown(event: PointerEvent, config: InputServiceConfig, handlerId?: string): void {
    // console.log('👇 PointerDown event:', { pointerId: event.pointerId, target: (event.target as Element).className, handlerId });
    const position = { x: event.clientX, y: event.clientY };
    const elementId = this.getElementId(event.target as Element);
    
    let state = this.gestureStates.get(elementId);
    if (!state) {
      state = this.gestureService.createGestureState(position);
      this.gestureStates.set(elementId, state);
    }
    
    state.pointerIds.add(event.pointerId);
    this.processEventHandling(event, config, handlerId);
  }

  private handlePointerMove(event: PointerEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state && state.pointerIds.has(event.pointerId)) {
      const position = { x: event.clientX, y: event.clientY };
      this.gestureService.updateGestureState(state, position);
      
      const gestureType = this.gestureService.recognizeGesture(state, config.gestures);
      if (gestureType && config.enabledGestures.includes(gestureType as any)) {
        const unifiedEvent = this.gestureService.createUnifiedEvent(
          gestureType, state, event, event.target as Element
        );
        this.processUnifiedEvent(unifiedEvent, handlerId);
      }
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handlePointerUp(event: PointerEvent, config: InputServiceConfig, handlerId?: string): void {
    // console.log('☝️ PointerUp event:', { pointerId: event.pointerId, handlerId });
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    // console.log('🔎 Looking for gesture state:', { elementId, stateFound: !!state, hasPointers: state?.pointerIds.size });
    
    if (state) {
      state.pointerIds.delete(event.pointerId);
      
      // console.log('📊 After deleting pointer:', { remainingPointers: state.pointerIds.size });
      
      // If no more active pointers, finalize gesture
      if (state.pointerIds.size === 0) {
        // console.log('🎬 Calling finalizeGesture');
        this.finalizeGesture(state, event, handlerId);
        this.gestureStates.delete(elementId);
      }
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handlePointerCancel(event: PointerEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state) {
      this.gestureService.cleanup(state);
      this.gestureStates.delete(elementId);
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleMouseDown(event: MouseEvent, config: InputServiceConfig, handlerId?: string): void {
    const position = { x: event.clientX, y: event.clientY };
    const elementId = this.getElementId(event.target as Element);
    
    const state = this.gestureService.createGestureState(position);
    this.gestureStates.set(elementId, state);

    this.processEventHandling(event, config, handlerId);
  }

  private handleMouseMove(event: MouseEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state) {
      const position = { x: event.clientX, y: event.clientY };
      this.gestureService.updateGestureState(state, position);
      
      const gestureType = this.gestureService.recognizeGesture(state, config.gestures);
      if (gestureType && config.enabledGestures.includes(gestureType as any)) {
        const unifiedEvent = this.gestureService.createUnifiedEvent(
          gestureType, state, event, event.target as Element
        );
        this.processUnifiedEvent(unifiedEvent, handlerId);
      }
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleMouseUp(event: MouseEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state) {
      this.finalizeGesture(state, event, handlerId);
      this.gestureStates.delete(elementId);
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleClick(event: MouseEvent, config: InputServiceConfig, handlerId?: string): void {
    if (config.enabledGestures.includes('tap')) {
      const unifiedEvent: UnifiedInputEvent = {
        type: 'tap',
        position: { x: event.clientX, y: event.clientY },
        originalEvent: event,
        target: event.target as Element,
        timestamp: Date.now(),
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey
        }
      };
      
      this.processUnifiedEvent(unifiedEvent, handlerId);
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleTouchStart(event: TouchEvent, config: InputServiceConfig, handlerId?: string): void {
    const touch = event.touches[0];
    if (!touch) return;

    const position = { x: touch.clientX, y: touch.clientY };
    const elementId = this.getElementId(event.target as Element);
    
    const state = this.gestureService.createGestureState(position, event.touches.length);
    this.gestureStates.set(elementId, state);

    this.processEventHandling(event, config, handlerId);
  }

  private handleTouchMove(event: TouchEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state && event.touches.length > 0) {
      const touch = event.touches[0];
      const position = { x: touch.clientX, y: touch.clientY };
      this.gestureService.updateGestureState(state, position, event.touches.length);
      
      // Handle pinch gestures
      if (event.touches.length === 2) {
        const touch1 = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        const touch2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };
        this.gestureService.updatePinchGesture(state, touch1, touch2);
      }
      
      const gestureType = this.gestureService.recognizeGesture(state, config.gestures);
      if (gestureType && config.enabledGestures.includes(gestureType as any)) {
        const unifiedEvent = this.gestureService.createUnifiedEvent(
          gestureType, state, event, event.target as Element
        );
        this.processUnifiedEvent(unifiedEvent, handlerId);
      }
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleTouchEnd(event: TouchEvent, config: InputServiceConfig, handlerId?: string): void {
    const elementId = this.getElementId(event.target as Element);
    const state = this.gestureStates.get(elementId);
    
    if (state) {
      if (event.touches.length === 0) {
        this.finalizeGesture(state, event, handlerId);
        this.gestureStates.delete(elementId);
      } else {
        // Update touch count for remaining touches
        this.gestureService.updateGestureState(
          state, 
          state.currentPosition, 
          event.touches.length
        );
      }
    }

    this.processEventHandling(event, config, handlerId);
  }

  private handleWheel(event: WheelEvent, config: InputServiceConfig, handlerId?: string): void {
    if (config.enabledGestures.includes('wheel')) {
      const unifiedEvent: UnifiedInputEvent = {
        type: 'wheel',
        position: { x: event.clientX, y: event.clientY },
        originalEvent: event,
        target: event.target as Element,
        timestamp: Date.now(),
        modifiers: {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey
        },
        gestureData: {
          deltaY: event.deltaY
        }
      };
      
      this.processUnifiedEvent(unifiedEvent, handlerId);
    }

    this.processEventHandling(event, config, handlerId);
  }

  private finalizeGesture(
    state: GestureState, 
    event: MouseEvent | TouchEvent | PointerEvent,
    handlerId?: string
  ): void {
    const elapsed = Date.now() - state.startTime;
    const hasMovement = this.gestureService.hasMovementExceededThreshold(state);
    
    // console.log('🔍 Finalizing gesture:', {
    //   elapsed,
    //   hasMovement,
    //   threshold: 200,
    //   isTap: !hasMovement && elapsed < 200,
    //   handlerId
    // });
    
    // Determine final gesture type
    let gestureType: string | null = null;
    
    if (!hasMovement && elapsed < 200) {
      gestureType = 'tap';
    } else if (state.longPressData?.triggered) {
      gestureType = 'longpress';
    }
    
    if (gestureType) {
      // console.log('✅ Gesture finalized:', gestureType, 'elapsed:', elapsed, 'hasMovement:', hasMovement, 'handlerId:', handlerId);
      const unifiedEvent = this.gestureService.createUnifiedEvent(
        gestureType, state, event, event.target as Element
      );
      this.processUnifiedEvent(unifiedEvent, handlerId);
    } else {
      // console.log('❌ No gesture recognized - elapsed:', elapsed, 'hasMovement:', hasMovement);
    }
    
    this.gestureService.cleanup(state);
  }

  private processEventHandling(
    event: MouseEvent | TouchEvent | PointerEvent | WheelEvent,
    config: InputServiceConfig,
    _handlerId?: string
  ): void {
    if (config.preventDefault) {
      event.preventDefault();
    }
    if (config.stopPropagation) {
      event.stopPropagation();
    }
  }

  private processUnifiedEvent(event: UnifiedInputEvent, handlerId?: string): void {
    this.ngZone.run(() => {
      // Call registered handlers
      if (handlerId) {
        const handlers = this.handlerRegistry.get(handlerId);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              const result = handler(event);
              if (result === false) {
                // Handler requested to stop further processing
                return;
              }
            } catch (error) {
              console.error('Error in input handler:', error);
            }
          });
        }
      }
    });
  }

  private getElementId(element: Element): string {
    // If element has an id, use it
    if (element.id) {
      return element.id;
    }
    
    // Check if we've already assigned a stable ID
    const dataId = element.getAttribute('data-gesture-id');
    if (dataId) {
      return dataId;
    }
    
    // Generate and store a stable ID for this element
    const newId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.setAttribute('data-gesture-id', newId);
    return newId;
  }

  /**
   * Cleanup all listeners and states
   */
  destroy(): void {
    this.managedListeners.forEach((listeners, element) => {
      this.detachFromElement(element);
    });
    
    this.gestureStates.forEach(state => {
      this.gestureService.cleanup(state);
    });
    
    this.gestureStates.clear();
    this.managedListeners.clear();
    this.handlerRegistry.clear();
  }
}