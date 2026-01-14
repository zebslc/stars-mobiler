# Input Interaction System Migration Guide
*Created: January 13, 2026*

## Overview

This guide shows how to migrate from manual event handling to the unified input interaction system. The new system provides consistent touch, mouse, and pointer event handling through reusable services and directives.

## Quick Start

### 1. Import the Services and Directives

```typescript
// In your component
import { 
  TouchClickDirective, 
  LongPressDirective, 
  PanZoomDirective, 
  ClickOutsideDirective,
  DragDropDirective
} from '../shared/directives';

// In your service
import { InputInteractionService } from '../services/core/input-interaction.service';
```

### 2. Replace Common Patterns

#### Before (Manual Event Handling):
```typescript
// Old approach - multiple event listeners
@Component({
  template: `
    <div 
      (click)="onClick($event)"
      (touchstart)="onTouchStart($event)" 
      (touchend)="onTouchEnd($event)"
      (mousedown)="onMouseDown($event)"
    >
      Content
    </div>
  `
})
class OldComponent {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  onClick(event: MouseEvent) { /* handle click */ }
  onTouchStart(event: TouchEvent) { /* handle touch */ }
  onTouchEnd(event: TouchEvent) { /* handle touch */ }
  onMouseDown(event: MouseEvent) { /* handle mouse */ }
}
```

#### After (Unified Directives):
```typescript
// New approach - unified directives
@Component({
  imports: [TouchClickDirective, ClickOutsideDirective],
  template: `
    <div 
      appTouchClick 
      (touchClick)="onUnifiedClick($event)"
      appClickOutside 
      (clickOutside)="close()"
    >
      Content
    </div>
  `
})
class NewComponent {
  onUnifiedClick(event: TouchClickEvent) {
    // Handles both touch and mouse clicks
  }
  
  close() {
    // Automatically handles both click and touch outside
  }
}
```

## Directive Usage Examples

### 1. TouchClick Directive
Replaces: `(click)`, `(touchstart)/(touchend)` combinations

```typescript
@Component({
  template: `
    <button 
      appTouchClick 
      (touchClick)="handleAction($event)"
      [touchClickConfig]="{ preventDefault: false }"
    >
      Click Me
    </button>
  `
})
class ButtonComponent {
  handleAction(event: TouchClickEvent) {
    console.log('Unified click/tap:', event.position);
  }
}
```

### 2. LongPress Directive  
Replaces: Custom timer-based long press detection

```typescript
@Component({
  template: `
    <div 
      appLongPress 
      [longPressThreshold]="750"
      (longPress)="showContextMenu($event)"
    >
      Hold for context menu
    </div>
  `
})
class ContextMenuComponent {
  showContextMenu(event: LongPressEvent) {
    // Show context menu at event.position
  }
}
```

### 3. PanZoom Directive
Replaces: Manual pan/zoom gesture handling

```typescript
@Component({
  template: `
    <div 
      appPanZoom 
      [enablePan]="true" 
      [enableZoom]="true"
      (panStart)="onPanStart($event)"
      (pan)="onPan($event)" 
      (panEnd)="onPanEnd($event)"
      (zoom)="onZoom($event)"
      (wheel)="onWheel($event)"
    >
      Pan and zoom me
    </div>
  `
})
class InteractiveMapComponent {
  onPan(event: PanEvent) {
    this.updateMapPosition(event.delta);
  }
  
  onZoom(event: PanZoomEvent) {
    this.updateMapScale(event.scale);
  }
}
```

### 4. ClickOutside Directive
Replaces: `@HostListener('document:click')` patterns

```typescript
@Component({
  template: `
    <div 
      class="dropdown" 
      appClickOutside 
      (clickOutside)="closeDropdown()"
      [excludeElements]="[triggerButton]"
    >
      Dropdown content
    </div>
  `
})
class DropdownComponent {
  @ViewChild('trigger') triggerButton!: ElementRef;
  
  closeDropdown() {
    this.isOpen = false;
  }
}
```

### 5. DragDrop Directive
Replaces: Complex drag and drop implementations

```typescript
@Component({
  template: `
    <div 
      appDragDrop 
      [dragData]="itemData"
      [enableGhost]="true"
      (dragStart)="onDragStart($event)"
      (drag)="onDrag($event)"
      (drop)="onDrop($event)"
    >
      Draggable item
    </div>
  `
})
class DraggableItemComponent {
  onDrop(event: DropEvent) {
    if (event.dropTarget?.classList.contains('drop-zone')) {
      // Handle successful drop
    }
  }
}
```

## Migration Checklist

### Phase 1: Replace Simple Interactions
- [ ] Replace `(click)` with `appTouchClick` directive
- [ ] Replace `@HostListener('document:click')` with `appClickOutside`
- [ ] Replace manual long press timers with `appLongPress`

### Phase 2: Replace Complex Gestures
- [ ] Replace manual pan/zoom with `appPanZoom` directive  
- [ ] Replace custom drag/drop with `appDragDrop` directive
- [ ] Update touch event handling to use unified system

### Phase 3: Component-Specific Refactoring
- [ ] Galaxy Map: Use PanZoom directive for map navigation
- [ ] Hull Layout: Use PanZoom + DragDrop for component placement
- [ ] Selectors: Use TouchClick + ClickOutside for dropdowns
- [ ] Context Menus: Use LongPress for mobile activation

## Service Integration

For complex custom interactions, use the service directly:

```typescript
@Component({})
class CustomInteractionComponent implements OnInit, OnDestroy {
  constructor(private inputService: InputInteractionService) {}
  
  ngOnInit() {
    // Custom interaction handling
    this.inputService.attachToElement(this.element, {
      enabledGestures: ['pan', 'pinch', 'longpress'],
      gestures: {
        longPress: { threshold: 1000 },
        movement: { threshold: 5 }
      }
    }, 'custom-handler');
    
    this.inputService.registerHandler('custom-handler', this.handleInput.bind(this));
  }
  
  handleInput(event: UnifiedInputEvent): void {
    switch(event.type) {
      case 'pan': 
        // Custom pan handling
        break;
      case 'pinch':
        // Custom zoom handling  
        break;
      case 'longpress':
        // Custom long press handling
        break;
    }
  }
  
  ngOnDestroy() {
    this.inputService.detachFromElement(this.element);
  }
}
```

## Testing

### Directive Testing
```typescript
describe('TouchClickDirective', () => {
  it('should emit touchClick for mouse events', () => {
    const fixture = TestBed.createComponent(TestComponent);
    const directive = fixture.debugElement.query(By.directive(TouchClickDirective));
    
    spyOn(directive.componentInstance.touchClick, 'emit');
    
    directive.nativeElement.click();
    
    expect(directive.componentInstance.touchClick.emit).toHaveBeenCalled();
  });
});
```

### Service Testing
```typescript
describe('InputInteractionService', () => {
  it('should recognize pan gestures', () => {
    const service = TestBed.inject(InputInteractionService);
    const element = document.createElement('div');
    
    let panEvent: UnifiedInputEvent | null = null;
    service.registerHandler('test', (event) => panEvent = event);
    service.attachToElement(element, { enabledGestures: ['pan'] }, 'test');
    
    // Simulate pan gesture
    // ... test implementation
    
    expect(panEvent?.type).toBe('pan');
  });
});
```

## Performance Benefits

1. **Unified Event Handling**: Single event listener per element instead of multiple
2. **Gesture Recognition**: Efficient gesture state management
3. **Memory Management**: Automatic cleanup of event listeners
4. **Touch Optimization**: Proper passive event handling where appropriate

## Browser Support

- **Modern Browsers**: Uses Pointer Events API when available
- **Fallback**: Gracefully falls back to Mouse + Touch events
- **Mobile**: Optimized for touch interactions
- **Accessibility**: Supports assistive technologies

## Common Pitfalls

1. **Don't mix old and new**: Don't use both `(click)` and `appTouchClick` on same element
2. **Configure preventDefault**: Set `preventDefault: false` if you need event bubbling
3. **Handle cleanup**: Services automatically clean up, but custom handlers need manual cleanup
4. **Test on devices**: Always test gesture interactions on actual touch devices

## Next Steps

1. Start with simple click replacements in dropdown components
2. Migrate galaxy map to use PanZoom directive
3. Update hull layout to use DragDrop directive  
4. Implement comprehensive touch testing
5. Add accessibility improvements using unified events