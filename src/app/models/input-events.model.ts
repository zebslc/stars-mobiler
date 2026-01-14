export interface Point {
  x: number;
  y: number;
}

export interface GestureConfig {
  longPress: {
    threshold: number; // milliseconds
  };
  doubleClick: {
    threshold: number; // milliseconds
  };
  movement: {
    threshold: number; // pixels
  };
  pinch: {
    minDistance: number; // pixels
  };
}

export interface UnifiedInputEvent {
  type: 'tap' | 'longpress' | 'doubletap' | 'pan' | 'pinch' | 'drag' | 'wheel';
  position: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent | WheelEvent;
  target: Element;
  timestamp: number;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  // Gesture-specific data
  gestureData?: {
    // For pan/drag
    delta?: Point;
    startPosition?: Point;
    
    // For pinch/zoom
    scale?: number;
    distance?: number;
    
    // For wheel
    deltaY?: number;
    
    // For multi-touch
    touchCount?: number;
  };
}

export interface InputServiceConfig {
  gestures: GestureConfig;
  preventDefault: boolean;
  stopPropagation: boolean;
  useCapture: boolean;
  enabledGestures: Array<'tap' | 'longpress' | 'doubletap' | 'pan' | 'pinch' | 'drag' | 'wheel'>;
}

export interface InputHandler {
  (event: UnifiedInputEvent): void | boolean; // return false to prevent further processing
}

export interface GestureState {
  isActive: boolean;
  startTime: number;
  startPosition: Point;
  currentPosition: Point;
  lastPosition: Point;
  touchCount: number;
  pointerIds: Set<number>;
  
  // Gesture-specific state
  panData?: {
    totalDelta: Point;
    velocity: Point;
  };
  
  pinchData?: {
    startDistance: number;
    currentDistance: number;
    startScale: number;
    currentScale: number;
    center: Point;
  };
  
  longPressData?: {
    timer: number | null;
    triggered: boolean;
  };
  
  doubleClickData?: {
    lastClickTime: number;
    clickCount: number;
  };
}

export interface DragState {
  isDragging: boolean;
  draggedElement: Element | null;
  startPosition: Point;
  currentPosition: Point;
  offset: Point;
  ghostElement?: Element;
}

// Event listener management
export interface ManagedListener {
  element: Element;
  eventType: string;
  handler: EventListener;
  options: AddEventListenerOptions;
}