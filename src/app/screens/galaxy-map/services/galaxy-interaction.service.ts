import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../../../services/core/logging.service';
import { 
  IGalaxyInteractionService, 
  InteractionResult, 
  GalaxyMapState, 
  MouseEventData, 
  TouchEventData, 
  WheelEventData,
  LogContext 
} from '../../../models/service-interfaces.model';

@Injectable({
  providedIn: 'root',
})
export class GalaxyInteractionService implements IGalaxyInteractionService {
  private logging = inject(LoggingService);

  private readonly LONG_PRESS_THRESHOLD = 500; // ms
  private readonly MOVEMENT_THRESHOLD = 10; // pixels
  private readonly DOUBLE_CLICK_THRESHOLD = 300; // ms

  handleMouseEvents(event: MouseEvent, mapState: GalaxyMapState): InteractionResult {
    const context: LogContext = {
      service: 'GalaxyInteractionService',
      operation: 'handleMouseEvents',
      additionalData: { 
        button: event.button, 
        clientX: event.clientX, 
        clientY: event.clientY,
        type: event.type
      }
    };

    this.logging.debug('Processing mouse event', context);

    const mouseData: MouseEventData = {
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    };

    switch (event.type) {
      case 'mousedown':
        return this.handleMouseDown(mouseData, mapState);
      case 'mousemove':
        return this.handleMouseMove(mouseData, mapState);
      case 'mouseup':
        return this.handleMouseUp(mouseData, mapState);
      case 'click':
        return this.handleMouseClick(mouseData, mapState);
      case 'dblclick':
        return this.handleMouseDoubleClick(mouseData, mapState);
      case 'contextmenu':
        return this.handleMouseRightClick(mouseData, mapState);
      default:
        this.logging.warn('Unhandled mouse event type', { ...context, additionalData: { ...context.additionalData, eventType: event.type } });
        return { type: 'select' };
    }
  }

  handleTouchEvents(event: TouchEvent, mapState: GalaxyMapState): InteractionResult {
    const context: LogContext = {
      service: 'GalaxyInteractionService',
      operation: 'handleTouchEvents',
      additionalData: { 
        touchCount: event.touches.length,
        type: event.type
      }
    };

    this.logging.debug('Processing touch event', context);

    const touchData: TouchEventData = {
      touches: Array.from(event.touches).map(touch => ({
        clientX: touch.clientX,
        clientY: touch.clientY
      })),
      changedTouches: Array.from(event.changedTouches).map(touch => ({
        clientX: touch.clientX,
        clientY: touch.clientY
      }))
    };

    switch (event.type) {
      case 'touchstart':
        return this.handleTouchStart(touchData, mapState);
      case 'touchmove':
        return this.handleTouchMove(touchData, mapState);
      case 'touchend':
        return this.handleTouchEnd(touchData, mapState);
      default:
        this.logging.warn('Unhandled touch event type', { ...context, additionalData: { ...context.additionalData, eventType: event.type } });
        return { type: 'select' };
    }
  }

  handleWheelEvents(event: WheelEvent, mapState: GalaxyMapState): InteractionResult {
    const context: LogContext = {
      service: 'GalaxyInteractionService',
      operation: 'handleWheelEvents',
      additionalData: { 
        deltaY: event.deltaY,
        clientX: event.clientX,
        clientY: event.clientY
      }
    };

    this.logging.debug('Processing wheel event for zoom', context);

    const wheelData: WheelEventData = {
      deltaY: event.deltaY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey
    };

    return this.handleWheelZoom(wheelData, mapState);
  }

  private handleMouseDown(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    if (mouseData.button === 1) { // Middle mouse button
      this.logging.debug('Middle mouse button pressed - starting pan', {
        service: 'GalaxyInteractionService',
        operation: 'handleMouseDown',
        additionalData: { button: mouseData.button }
      });
      return { 
        type: 'pan', 
        position: { x: mouseData.clientX, y: mouseData.clientY } 
      };
    }

    return { type: 'select' };
  }

  private handleMouseMove(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    // Mouse move handling logic would be coordinated with the state service
    return { 
      type: 'pan', 
      position: { x: mouseData.clientX, y: mouseData.clientY } 
    };
  }

  private handleMouseUp(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    this.logging.debug('Mouse button released', {
      service: 'GalaxyInteractionService',
      operation: 'handleMouseUp',
      additionalData: { button: mouseData.button }
    });
    return { type: 'select' };
  }

  private handleMouseClick(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    this.logging.debug('Mouse click detected', {
      service: 'GalaxyInteractionService',
      operation: 'handleMouseClick',
      additionalData: { 
        button: mouseData.button,
        position: { x: mouseData.clientX, y: mouseData.clientY }
      }
    });
    return { 
      type: 'select', 
      position: { x: mouseData.clientX, y: mouseData.clientY } 
    };
  }

  private handleMouseDoubleClick(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    this.logging.debug('Mouse double-click detected', {
      service: 'GalaxyInteractionService',
      operation: 'handleMouseDoubleClick',
      additionalData: { 
        button: mouseData.button,
        position: { x: mouseData.clientX, y: mouseData.clientY }
      }
    });
    return { 
      type: 'select', 
      position: { x: mouseData.clientX, y: mouseData.clientY } 
    };
  }

  private handleMouseRightClick(mouseData: MouseEventData, mapState: GalaxyMapState): InteractionResult {
    this.logging.debug('Right-click context menu requested', {
      service: 'GalaxyInteractionService',
      operation: 'handleMouseRightClick',
      additionalData: { 
        position: { x: mouseData.clientX, y: mouseData.clientY }
      }
    });
    return { 
      type: 'contextMenu', 
      position: { x: mouseData.clientX, y: mouseData.clientY } 
    };
  }

  private handleTouchStart(touchData: TouchEventData, mapState: GalaxyMapState): InteractionResult {
    const touchCount = touchData.touches.length;
    
    this.logging.debug('Touch interaction started', {
      service: 'GalaxyInteractionService',
      operation: 'handleTouchStart',
      additionalData: { 
        touchCount,
        firstTouchPosition: touchData.touches[0] ? { x: touchData.touches[0].clientX, y: touchData.touches[0].clientY } : null
      }
    });

    if (touchCount === 1) {
      return { 
        type: 'pan', 
        position: { x: touchData.touches[0].clientX, y: touchData.touches[0].clientY } 
      };
    } else if (touchCount === 2) {
      return { 
        type: 'zoom', 
        position: this.calculateTouchMidpoint(touchData.touches) 
      };
    }

    return { type: 'select' };
  }

  private handleTouchMove(touchData: TouchEventData, mapState: GalaxyMapState): InteractionResult {
    const touchCount = touchData.touches.length;

    if (touchCount === 1) {
      return { 
        type: 'pan', 
        position: { x: touchData.touches[0].clientX, y: touchData.touches[0].clientY } 
      };
    } else if (touchCount === 2) {
      return { 
        type: 'zoom', 
        position: this.calculateTouchMidpoint(touchData.touches) 
      };
    }

    return { type: 'select' };
  }

  private handleTouchEnd(touchData: TouchEventData, mapState: GalaxyMapState): InteractionResult {
    this.logging.debug('Touch interaction ended', {
      service: 'GalaxyInteractionService',
      operation: 'handleTouchEnd',
      additionalData: { 
        remainingTouches: touchData.touches.length
      }
    });
    return { type: 'select' };
  }

  private handleWheelZoom(wheelData: WheelEventData, mapState: GalaxyMapState): InteractionResult {
    const zoomDirection = Math.sign(wheelData.deltaY) * -1; // Invert for natural scrolling
    
    this.logging.debug('Wheel zoom interaction', {
      service: 'GalaxyInteractionService',
      operation: 'handleWheelZoom',
      additionalData: { 
        deltaY: wheelData.deltaY,
        zoomDirection,
        position: { x: wheelData.clientX, y: wheelData.clientY }
      }
    });

    return { 
      type: 'zoom', 
      position: { x: wheelData.clientX, y: wheelData.clientY } 
    };
  }

  private calculateTouchMidpoint(touches: Array<{ clientX: number; clientY: number }>): { x: number; y: number } {
    if (touches.length < 2) {
      return touches[0] || { x: 0, y: 0 };
    }

    const midX = (touches[0].clientX + touches[1].clientX) / 2;
    const midY = (touches[0].clientY + touches[1].clientY) / 2;

    return { x: midX, y: midY };
  }

  /**
   * Calculates the distance between two touch points for zoom gestures
   */
  calculateTouchDistance(touches: Array<{ clientX: number; clientY: number }>): number {
    if (touches.length < 2) return 0;
    
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  }

  /**
   * Determines if a movement exceeds the threshold for gesture recognition
   */
  isMovementSignificant(startPos: { x: number; y: number }, currentPos: { x: number; y: number }): boolean {
    const distance = Math.hypot(
      currentPos.x - startPos.x,
      currentPos.y - startPos.y
    );
    return distance > this.MOVEMENT_THRESHOLD;
  }

  /**
   * Checks if the time elapsed qualifies as a long press
   */
  isLongPress(startTime: number, currentTime: number): boolean {
    return (currentTime - startTime) >= this.LONG_PRESS_THRESHOLD;
  }

  /**
   * Checks if two clicks qualify as a double-click
   */
  isDoubleClick(lastClickTime: number, currentTime: number): boolean {
    return (currentTime - lastClickTime) < this.DOUBLE_CLICK_THRESHOLD;
  }
}