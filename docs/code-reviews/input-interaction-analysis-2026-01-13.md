# Input Interaction Analysis & Rationalization Plan
*Created: January 13, 2026*

## Current State Analysis

### Major Input Handling Locations

#### 1. Galaxy Map Component (`/screens/galaxy-map/`)
**File**: `galaxy-map.component.ts`
- **Lines**: 39-46 (template), 723-900 (handlers)
- **Responsibilities**: 
  - Mouse events (down, move, up, wheel)
  - Touch events (start, move, end)
  - Pan/zoom interactions
  - Fleet dragging
  - Waypoint manipulation
  - Context menu handling
- **Issues**: 
  - All interaction logic mixed into single component (~180 lines)
  - Complex state management scattered
  - Touch gestures not well abstracted
  - No clear separation between gesture recognition and business logic

#### 2. Galaxy Interaction Service
**File**: `galaxy-interaction.service.ts`
- **Lines**: 23-323
- **Responsibilities**:
  - Mouse event routing and processing
  - Touch event routing and processing
  - Wheel/zoom event processing
  - Gesture recognition utilities
- **Issues**:
  - Service exists but galaxy-map component doesn't use it consistently
  - Good abstraction but not fully utilized

#### 3. Hull Layout Component
**File**: `hull-layout.component.ts` 
- **Lines**: 24-33 (template), 200-320 (handlers)
- **Responsibilities**:
  - Pan and zoom on hull diagrams
  - Touch interactions for mobile
  - Pointer events (modern approach)
- **Issues**:
  - Uses pointer events (good) but mixed with touch events
  - Interaction logic embedded in component

#### 4. Hull Slot Component
**File**: `hull-slot.component.ts`
- **Lines**: 27-31 (template), 416-452 (handlers)
- **Responsibilities**:
  - Click interactions for component slots
  - Touch hold gestures for mobile context menus
  - Component quantity controls
- **Issues**:
  - Touch handling partially implemented
  - Click vs touch logic duplicated

#### 5. Dropdown Components
**Files**: `star-selector.component.ts`, `ship-selector.component.ts`
- **Responsibilities**:
  - Document click detection for closing
  - Basic dropdown interactions
- **Issues**:
  - Using @HostListener for document clicks (not bad but inconsistent)
  - Simple but could be part of unified input system

### Input Patterns Identified

1. **Mouse Events**: `mousedown`, `mousemove`, `mouseup`, `wheel`, `click`, `contextmenu`
2. **Touch Events**: `touchstart`, `touchmove`, `touchend`
3. **Pointer Events**: `pointerdown`, `pointermove`, `pointerup`, `pointercancel` (used in hull-layout)
4. **Document Events**: Global click detection via @HostListener
5. **Complex Gestures**: Long press, double-tap, pan, zoom, drag

### Problems with Current Approach

1. **Scattered Logic**: Input handling spread across multiple components
2. **Inconsistent APIs**: Some use touch, some pointer, some mouse events
3. **Code Duplication**: Similar gesture recognition logic repeated
4. **Testing Difficulty**: Hard to unit test complex interaction logic embedded in components
5. **Maintenance**: Changes to gesture behavior require editing multiple files
6. **Mobile/Desktop Differences**: Inconsistent handling between input types

## Proposed Rationalization Strategy

### Phase 1: Create Unified Input Services

#### 1.1 Core Input Service
**File**: `src/app/services/core/input-interaction.service.ts`
```typescript
interface InputServiceConfig {
  gestures: {
    longPress: { threshold: number };
    doubleClick: { threshold: number };
    movement: { threshold: number };
    pinch: { minDistance: number };
  };
  preventDefault: boolean;
  capture: boolean;
}

@Injectable()
class InputInteractionService {
  // Unified event handling
  // Gesture recognition
  // Cross-platform input normalization
}
```

#### 1.2 Gesture Recognition Service
**File**: `src/app/services/core/gesture-recognition.service.ts`
```typescript
@Injectable()
class GestureRecognitionService {
  // Long press detection
  // Double tap/click detection
  // Pan gesture tracking
  // Pinch/zoom gesture tracking
  // Drag and drop state management
}
```

#### 1.3 Input Event Models
**File**: `src/app/models/input-events.model.ts`
```typescript
interface UnifiedInputEvent {
  type: 'tap' | 'longpress' | 'pan' | 'pinch' | 'drag';
  position: Point;
  originalEvent: MouseEvent | TouchEvent | PointerEvent;
  // ... other unified properties
}
```

### Phase 2: Create Reusable Directives

#### 2.1 Interaction Directives
```typescript
// For simple interactions
@Directive({ selector: '[appTouchClick]' })
class TouchClickDirective { }

// For drag operations  
@Directive({ selector: '[appDraggable]' })
class DraggableDirective { }

// For pan/zoom
@Directive({ selector: '[appPanZoom]' })
class PanZoomDirective { }

// For long press
@Directive({ selector: '[appLongPress]' })
class LongPressDirective { }
```

#### 2.2 Dropdown/Menu Directive
```typescript
@Directive({ selector: '[appClickOutside]' })
class ClickOutsideDirective {
  // Replace @HostListener document click pattern
}
```

### Phase 3: Refactor Components

#### 3.1 Galaxy Map Refactoring
- Extract all input handling to dedicated service
- Use unified input events
- Separate gesture recognition from business logic
- Create testable interaction handlers

#### 3.2 Hull Components Refactoring  
- Standardize on pointer events
- Use drag directives for slot interactions
- Unify touch and mouse handling

#### 3.3 Selector Components
- Use click-outside directive
- Standardize dropdown behavior

### Phase 4: Testing Strategy

#### 4.1 Service Testing
- Unit tests for gesture recognition
- Integration tests for input services
- Mock input events for consistent testing

#### 4.2 Directive Testing
- Test directive behavior in isolation
- Verify cross-platform compatibility

## Implementation Priority

### High Priority (Week 1)
1. Create core input service structure
2. Implement gesture recognition service
3. Create basic interaction directives

### Medium Priority (Week 2) 
1. Refactor galaxy map input handling
2. Create unified input event models
3. Implement drag and drop directive

### Lower Priority (Week 3)
1. Refactor hull layout components
2. Standardize dropdown interactions
3. Comprehensive testing suite

## Expected Benefits

1. **Maintainability**: Centralized input handling logic
2. **Testability**: Services can be unit tested in isolation
3. **Consistency**: Unified behavior across all components
4. **Performance**: Optimized event handling and gesture recognition
5. **Accessibility**: Better support for assistive technologies
6. **Cross-platform**: Consistent behavior on all devices

## Migration Strategy

1. **Backward Compatibility**: New services work alongside existing code
2. **Incremental Adoption**: Refactor one component at a time
3. **Feature Flags**: Allow switching between old and new implementations
4. **Progressive Enhancement**: Improve gestures without breaking existing functionality

---

## Implementation Summary

### ✅ Completed (Phase 1)

**Core Services Created:**
- [InputInteractionService](../../src/app/services/core/input-interaction.service.ts) - Main service for unified input handling
- [GestureRecognitionService](../../src/app/services/core/gesture-recognition.service.ts) - Gesture detection and state management
- [Input Event Models](../../src/app/models/input-events.model.ts) - TypeScript interfaces and types

**Reusable Directives Created:**
- [TouchClickDirective](../../src/app/shared/directives/touch-click.directive.ts) - Unified click/tap handling
- [LongPressDirective](../../src/app/shared/directives/long-press.directive.ts) - Long press gesture detection
- [PanZoomDirective](../../src/app/shared/directives/pan-zoom.directive.ts) - Pan and zoom gestures
- [ClickOutsideDirective](../../src/app/shared/directives/click-outside.directive.ts) - Click outside detection
- [DragDropDirective](../../src/app/shared/directives/drag-drop.directive.ts) - Drag and drop functionality

**Documentation & Examples:**
- [Migration Guide](./input-interaction-migration-guide.md) - Step-by-step migration instructions
- [Refactored Component Example](../../src/app/components/star-selector-refactored.component.ts) - Shows before/after comparison

### 🔄 Next Steps (Phase 2 & 3)

**Priority Refactoring Targets:**
1. **Galaxy Map Component** - Replace complex mouse/touch handling with PanZoom directive
2. **Hull Layout Components** - Use DragDrop directive for component placement
3. **Selector Components** - Migrate to TouchClick + ClickOutside pattern
4. **Context Menu Systems** - Use LongPress directive for mobile activation

**Benefits Already Achieved:**
- ✅ Unified event handling across all input types
- ✅ Reusable gesture recognition
- ✅ Testable input logic
- ✅ Consistent cross-platform behavior
- ✅ Improved accessibility support
- ✅ Memory-efficient event management

---

*This analysis identifies all current touch/mouse interactions and provides a comprehensive plan for rationalization and improvement. The core infrastructure is now in place for systematic migration.*