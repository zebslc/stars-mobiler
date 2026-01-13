# Design Document

## Overview

This design addresses critical code quality issues by systematically refactoring god classes into focused, single-responsibility services, eliminating TypeScript `any` types, integrating proper logging, and adding comprehensive unit tests. The refactoring preserves all existing functionality while improving maintainability, type safety, and testability.

The approach follows the established Angular patterns in the codebase, using signals for reactive state management, dependency injection for loose coupling, and the command pattern where appropriate for complex operations.

## Architecture

### Current State Analysis

Based on the code review, the main issues are:

1. **FleetService** (4 `any` types) - Handles fleet creation, ship management, movement, and validation
2. **GalaxyMapComponent** (6 `any` types) - Manages map rendering, user interactions, and fleet operations
3. **ShipDesignerComponent** (3 `any` types) - Handles ship design UI and validation
4. **HullSlotComponent** (`any` types) - Manages component placement and validation
5. **Console logging** - 9 files with console.log/console.error statements

### Refactoring Strategy

The refactoring will follow these principles:

1. **Single Responsibility Principle** - Each service handles one specific domain
2. **Dependency Inversion** - Services depend on interfaces, not concrete implementations
3. **Composition over Inheritance** - Use service composition for complex operations
4. **Type Safety First** - Replace all `any` types with proper interfaces
5. **Clean Architecture** - Create clean, focused services without legacy compatibility overhead

## Components and Interfaces

### 1. Fleet Service Decomposition

**Current Issues:**
- Handles fleet creation, ship management, movement, fuel calculation, and validation
- Contains 4 `any` type occurrences
- Mixed responsibilities violate single responsibility principle

**New Architecture:**

```typescript
// Core fleet operations
interface IFleetOperationsService {
  createFleet(game: GameState, location: FleetLocation, ownerId: string, baseNameSource?: string): Fleet;
  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void;
  validateFleetLimits(game: GameState, ownerId: string): boolean;
}

// Fleet movement and navigation
interface IFleetMovementService {
  moveFleet(game: GameState, fleetId: string, destination: FleetLocation): void;
  calculateFuelConsumption(fleet: Fleet, distance: number): number;
  validateMovement(fleet: Fleet, destination: FleetLocation): MovementValidationResult;
}

// Fleet naming and organization
interface IFleetNamingService {
  generateFleetName(game: GameState, ownerId: string, baseName: string): string;
  validateFleetName(name: string): boolean;
  getAvailableFleetNames(game: GameState, ownerId: string): string[];
}

// Fleet validation and rules
interface IFleetValidationService {
  validateShipAddition(fleet: Fleet, shipDesignId: string, count: number): ValidationResult;
  validateFleetComposition(fleet: Fleet): ValidationResult;
  checkFleetLimits(playerFleets: Fleet[], maxFleets: number): boolean;
}
```

### 2. Galaxy Map Component Decomposition

**Current Issues:**
- Handles rendering, user interactions, context menus, and fleet operations
- Contains 6 `any` type occurrences
- UI component doing business logic

**New Architecture:**

```typescript
// Galaxy map interaction handling
interface IGalaxyInteractionService {
  handleMouseEvents(event: MouseEvent, mapState: GalaxyMapState): InteractionResult;
  handleTouchEvents(event: TouchEvent, mapState: GalaxyMapState): InteractionResult;
  handleWheelEvents(event: WheelEvent, mapState: GalaxyMapState): InteractionResult;
}

// Galaxy map coordinate system
interface IGalaxyCoordinateService {
  screenToGalaxy(screenX: number, screenY: number, mapState: GalaxyMapState): GalaxyCoordinate;
  galaxyToScreen(galaxyX: number, galaxyY: number, mapState: GalaxyMapState): ScreenCoordinate;
  calculateZoomLevel(currentZoom: number, delta: number): number;
}

// Galaxy map context menu management
interface IGalaxyContextMenuService {
  showPlanetContextMenu(planet: Planet, position: ScreenCoordinate): void;
  showFleetContextMenu(fleet: Fleet, position: ScreenCoordinate): void;
  showWaypointContextMenu(waypoint: Waypoint, position: ScreenCoordinate): void;
  closeAllContextMenus(): void;
}
```

### 3. Ship Designer Component Decomposition

**Current Issues:**
- Handles UI state, validation, and ship design logic
- Contains 3 `any` type occurrences
- Component doing business logic that should be in services

**New Architecture:**

```typescript
// Ship design validation
interface IShipDesignValidationService {
  validateDesign(design: ShipDesign, techLevels: PlayerTech): ValidationResult;
  validateComponentPlacement(slotId: string, component: Component, count: number): ValidationResult;
  validateHullSelection(hullId: string, techLevels: PlayerTech): ValidationResult;
}

// Ship design operations
interface IShipDesignOperationsService {
  setSlotComponent(design: ShipDesign, slotId: string, component: Component, count: number): ShipDesign;
  clearSlot(design: ShipDesign, slotId: string): ShipDesign;
  changeHull(design: ShipDesign, newHullId: string): ShipDesign;
  calculateDesignCost(design: ShipDesign): ResourceCost;
}

// Ship design templates and presets
interface IShipDesignTemplateService {
  getAvailableTemplates(techLevels: PlayerTech): ShipDesignTemplate[];
  applyTemplate(templateId: string, techLevels: PlayerTech): ShipDesign;
  saveAsTemplate(design: ShipDesign, name: string): void;
}
```

### 4. Hull Slot Component Decomposition

**Current Issues:**
- Complex component placement logic in UI component
- `any` types for component data
- Mixed UI and business logic

**New Architecture:**

```typescript
// Hull slot validation
interface IHullSlotValidationService {
  validateComponentFit(slot: HullSlot, component: Component): boolean;
  getMaxComponentCount(slot: HullSlot, component: Component): number;
  validateSlotCapacity(slot: HullSlot, components: Component[]): boolean;
}

// Hull slot operations
interface IHullSlotOperationsService {
  placeComponent(slot: HullSlot, component: Component, count: number): HullSlot;
  removeComponent(slot: HullSlot): HullSlot;
  getSlotDisplayInfo(slot: HullSlot): SlotDisplayInfo;
}
```

### 5. Type Safety Improvements

**New Type Definitions:**

```typescript
// Replace any types with proper interfaces
interface FleetLocation {
  type: 'space' | 'orbit';
  x?: number;
  y?: number;
  planetId?: string;
}

interface GalaxyMapState {
  zoom: number;
  panX: number;
  panY: number;
  selectedStar: string | null;
  selectedFleet: string | null;
}

interface InteractionResult {
  type: 'select' | 'pan' | 'zoom' | 'contextMenu';
  target?: string;
  position?: ScreenCoordinate;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface MovementValidationResult extends ValidationResult {
  fuelRequired: number;
  fuelAvailable: number;
  canMove: boolean;
}

interface SlotDisplayInfo {
  isEmpty: boolean;
  componentName: string;
  componentCount: number;
  maxCount: number;
  slotType: string;
}

interface ScreenCoordinate {
  x: number;
  y: number;
}

interface GalaxyCoordinate {
  x: number;
  y: number;
}
```

## Data Models

### Service Configuration

```typescript
interface ServiceConfiguration {
  fleetService: {
    maxFleets: number;
    maxShipsPerDesign: number;
    defaultFuelCapacity: number;
  };
  galaxyMap: {
    minZoom: number;
    maxZoom: number;
    panSensitivity: number;
  };
  shipDesigner: {
    autoSave: boolean;
    validationLevel: 'strict' | 'permissive';
  };
}
```

### Logging Integration

```typescript
interface LogContext {
  service: string;
  operation: string;
  entityId?: string;
  entityType?: string;
  additionalData?: Record<string, unknown>;
}

interface ServiceLogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I'll analyze the acceptance criteria to determine which ones are testable as properties:

### Converting EARS to Properties

Based on the prework analysis, I identified several testable properties that focus on behavioral preservation and functional correctness during refactoring:

**Property 1: Service Interface Consistency**
*For any* service method call with valid parameters, the service should produce consistent, well-typed results according to its interface contract
**Validates: Requirements 1.6, 8.1**

**Property 2: Type Safety Enforcement**
*For any* operation in the refactored system, all inputs and outputs should be properly typed with no `any` types or type assertions
**Validates: Requirements 2.6, 8.3**

**Property 3: Logging Level Appropriateness**
*For any* logging call in the refactored system, the log level should match the severity of the event being logged (Debug for trace info, Info for normal operations, Warn for recoverable issues, Error for failures)
**Validates: Requirements 3.4**

**Property 4: Logging Context Completeness**
*For any* log entry generated by refactored services, the log context should include service name, operation name, and relevant entity identifiers for debugging
**Validates: Requirements 3.5**

**Property 5: Error Handling and Logging**
*For any* error condition in refactored services, the error should be properly caught, logged with appropriate context, and handled gracefully without crashing the application
**Validates: Requirements 4.6**

**Property 6: Performance Optimization**
*For any* critical path operation, the refactored implementation should complete efficiently within reasonable time bounds for the operation complexity
**Validates: Requirements 7.1**

**Property 7: Logging Performance Impact**
*For any* logging operation in production builds, the logging call should complete within 5ms to ensure minimal performance impact
**Validates: Requirements 7.5**

**Property 8: Clean Component Interfaces**
*For any* refactored component, all inputs and outputs should be properly typed and follow Angular best practices with signals
**Validates: Requirements 8.2**

**Property 9: Service Instantiation**
*For any* service in the refactored system, the service should be properly injectable and instantiable through Angular's dependency injection system
**Validates: Requirements 8.4**

## Error Handling

### Error Classification

The refactoring will implement comprehensive error handling with proper classification:

```typescript
// Service-specific error types
class FleetServiceError extends Error {
  constructor(message: string, public readonly operation: string, public readonly fleetId?: string) {
    super(message);
    this.name = 'FleetServiceError';
  }
}

class ShipDesignValidationError extends Error {
  constructor(message: string, public readonly designId: string, public readonly validationErrors: string[]) {
    super(message);
    this.name = 'ShipDesignValidationError';
  }
}

class GalaxyMapInteractionError extends Error {
  constructor(message: string, public readonly interactionType: string, public readonly coordinates?: GalaxyCoordinate) {
    super(message);
    this.name = 'GalaxyMapInteractionError';
  }
}
```

### Error Handling Strategy

1. **Service Level**: Each service catches and logs its own errors with appropriate context
2. **Component Level**: Components handle service errors and display user-friendly messages
3. **Global Level**: Angular ErrorHandler catches unhandled errors and routes to logging service
4. **Logging Integration**: All errors are logged with structured context for debugging

### Error Recovery

```typescript
interface ErrorRecoveryStrategy {
  canRecover(error: Error): boolean;
  recover(error: Error, context: any): Promise<any>;
  fallback(error: Error, context: any): any;
}
```

## Testing Strategy

### Dual Testing Approach

The refactoring will use both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Test specific examples and edge cases for each new service
- Verify error conditions and boundary cases
- Test integration points between services
- Mock dependencies using Jasmine spies for isolation

**Property-Based Tests:**
- Verify universal properties across all inputs using fast-check
- Test behavioral preservation during refactoring
- Validate API compatibility with random inputs
- Ensure performance characteristics are maintained

### Testing Configuration

**Property-Based Test Settings:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: code-quality-refactor, Property {number}: {property_text}**
- Use fast-check library for input generation
- Focus on correctness and type safety validation

**Unit Test Guidelines:**
- Direct instantiation for services with no dependencies
- TestBed only when Angular-specific behavior is needed
- Fast execution target: <50ms per test
- Comprehensive mocking of external dependencies

### Test Organization

```typescript
// Example test structure for refactored services
describe('FleetOperationsService', () => {
  let service: FleetOperationsService;
  let mockValidationService: jasmine.SpyObj<IFleetValidationService>;
  let mockNamingService: jasmine.SpyObj<IFleetNamingService>;

  beforeEach(() => {
    mockValidationService = jasmine.createSpyObj('IFleetValidationService', ['validateFleetLimits']);
    mockNamingService = jasmine.createSpyObj('IFleetNamingService', ['generateFleetName']);
    service = new FleetOperationsService(mockValidationService, mockNamingService);
  });

  // Unit tests for specific scenarios
  it('should create fleet with valid parameters', () => {
    // Test implementation
  });

  // Property-based tests for universal properties
  it('should maintain type safety in fleet operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          ownerId: fc.string(),
          location: fc.oneof(
            fc.record({ type: fc.constant('space'), x: fc.integer(), y: fc.integer() }),
            fc.record({ type: fc.constant('orbit'), planetId: fc.string() })
          )
        }),
        (params) => {
          // Property test implementation - verify all results are properly typed
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Clean Architecture Focus

The refactoring prioritizes clean, maintainable code:

```typescript
// Clean service design without legacy compatibility
describe('Clean Architecture Validation', () => {
  it('should have well-defined service interfaces', () => {
    fc.assert(
      fc.property(
        fc.record({
          gameState: gameStateArbitrary,
          operation: fleetOperationArbitrary
        }),
        ({ gameState, operation }) => {
          const result = fleetOperationsService.performOperation(gameState, operation);
          
          // Verify result is properly typed and follows interface contract
          expect(result).toBeDefined();
          expect(typeof result).not.toBe('any');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

This clean architecture approach ensures the refactored code is maintainable, type-safe, and follows modern Angular best practices without legacy compatibility overhead.