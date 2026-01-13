# Model Types Documentation

This directory contains all TypeScript interfaces and type definitions for the Stellar Remnants application, including the new interfaces created during the code quality refactor.

## Files Overview

### Core Game Models
- **`game.model.ts`** - Core game state, player, fleet, planet, and ship design interfaces
- **`ship-design.model.ts`** - Ship design compilation and validation logic
- **`tech.model.ts`** - Technology and research-related interfaces
- **`logging.model.ts`** - Logging system interfaces and types

### New Refactor Models
- **`service-interfaces.model.ts`** - Service interfaces for decomposed god classes
- **`ui-types.model.ts`** - UI component type definitions to replace `any` types
- **`configuration.model.ts`** - Configuration interfaces for services and logging
- **`index.ts`** - Centralized exports for all model types

## Service Interface Categories

### Fleet Service Decomposition
The following interfaces replace the monolithic FleetService:

- **`IFleetOperationsService`** - Core fleet creation and ship management
- **`IFleetMovementService`** - Fleet movement and navigation logic
- **`IFleetNamingService`** - Fleet naming and organization
- **`IFleetValidationService`** - Fleet validation and rules

### Galaxy Map Component Decomposition
The following interfaces extract business logic from GalaxyMapComponent:

- **`IGalaxyInteractionService`** - Mouse, touch, and wheel event handling
- **`IGalaxyCoordinateService`** - Coordinate transformation and zoom calculations
- **`IGalaxyContextMenuService`** - Context menu management

### Ship Designer Component Decomposition
The following interfaces separate UI from business logic:

- **`IShipDesignValidationService`** - Design validation and component compatibility
- **`IShipDesignOperationsService`** - Slot management and design manipulation
- **`IShipDesignTemplateService`** - Design templates and presets

### Hull Slot Component Decomposition
The following interfaces handle component placement logic:

- **`IHullSlotValidationService`** - Component fit validation and capacity checking
- **`IHullSlotOperationsService`** - Component placement and slot state management

## Type Safety Improvements

### Replaced `any` Types
The following interfaces replace specific `any` type occurrences found in the codebase:

#### Fleet Service (4 occurrences)
- **`FleetLocation`** - Replaces `any` in fleet location parameters
- **`EngineStats`** - Replaces `any` in engine component handling
- **`LegacyEngineSpec`** - Replaces `any` in legacy engine calculations

#### Galaxy Map Component (6 occurrences)
- **`GalaxyMapState`** - Replaces `any` in map state management
- **`TouchHoldState`** - Replaces `any` in touch event handling
- **`LongPressState`** - Replaces `any` in long press detection
- **`WaypointContextMenuState`** - Replaces `any` in waypoint context menu
- **`FleetPathSegment`** - Replaces `any` in fleet path visualization

#### Ship Designer Component (3 occurrences)
- **`HoveredItem`** - Replaces `any` in hover state management
- **`ComponentData`** - Replaces `any` in component data handling
- **`ShipDesignDisplay`** - Replaces `any` in design display logic

#### Hull Slot Component
- **`ComponentAssignmentDisplay`** - Replaces `any` in component assignment UI
- **`SlotDisplayInfo`** - Replaces `any` in slot display information

### UI Event Types
- **`ImageErrorEvent`** - Replaces `any` in image error handlers
- **`MouseEventData`** - Structured mouse event data
- **`TouchEventData`** - Structured touch event data
- **`WheelEventData`** - Structured wheel event data

### Validation and Results
- **`ValidationResult`** - Generic validation result interface
- **`MovementValidationResult`** - Fleet movement validation results
- **`InteractionResult`** - User interaction results

## Configuration and Logging

### Service Configuration
- **`ServiceConfiguration`** - Master configuration for all services
- **`FleetServiceConfig`** - Fleet service specific configuration
- **`GalaxyMapConfig`** - Galaxy map service configuration
- **`ShipDesignerConfig`** - Ship designer service configuration
- **`HullSlotConfig`** - Hull slot service configuration

### Logging Context
- **`LoggingContext`** - Base logging context interface
- **`ServiceLoggingContext`** - Service-specific logging context
- **`ErrorLoggingContext`** - Error logging with severity levels
- **`PerformanceLoggingContext`** - Performance monitoring context

## Usage Guidelines

### Importing Types
Use the centralized index file for imports:

```typescript
import { 
  IFleetOperationsService, 
  FleetLocation, 
  ValidationResult 
} from '../models';
```

### Service Implementation
Services should implement the appropriate interfaces:

```typescript
@Injectable({ providedIn: 'root' })
export class FleetOperationsService implements IFleetOperationsService {
  createFleet(game: GameState, location: FleetLocation, ownerId: string): Fleet {
    // Implementation
  }
}
```

### Type Safety
Always use the specific interfaces instead of `any`:

```typescript
// ❌ Bad - using any
function handleEvent(event: any): void {
  // ...
}

// ✅ Good - using specific interface
function handleMouseEvent(event: MouseEventData): void {
  // ...
}
```

## Requirements Mapping

This implementation addresses the following requirements:

- **Requirement 2.5**: TypeScript strictness enhancement - all `any` types replaced
- **Requirement 6.4**: Code quality standards - proper interface definitions
- **Requirement 8.1**: Clean architecture - well-designed service interfaces

The interfaces follow Angular best practices and support dependency injection, testing, and maintainability goals outlined in the refactoring specification.