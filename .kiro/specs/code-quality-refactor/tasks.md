# Implementation Plan: Code Quality Refactor

## Overview

This implementation plan systematically refactors god classes into focused services, eliminates TypeScript `any` types, integrates proper logging, and adds comprehensive unit tests. The refactoring creates clean, maintainable code following modern Angular best practices without legacy compatibility overhead.

## Tasks

- [x] 1. Create core interfaces and type definitions
  - Create TypeScript interfaces for all new services (IFleetOperationsService, IFleetMovementService, etc.)
  - Define proper type definitions to replace `any` types (FleetLocation, GalaxyMapState, ValidationResult, etc.)
  - Set up service configuration interfaces and logging context types
  - _Requirements: 2.5, 6.4, 8.1_

- [x] 1.1 Write property test for service interface consistency
  - **Property 1: Service Interface Consistency**
  - **Validates: Requirements 1.6, 8.1**

- [x] 2. Analyze and refactor FleetService
  - [x] 2.1 Analyze FleetService responsibilities and identify service boundaries
    - Review FleetService methods and identify distinct responsibilities
    - Determine appropriate service decomposition based on actual code structure
    - Plan extraction of services based on single responsibility principle
    - _Requirements: 1.1, 1.5_

  - [x] 2.2 Extract fleet creation and management logic into focused service(s)
    - Create service(s) for fleet creation, ship addition, and basic fleet management
    - Replace `any` types with proper FleetLocation and validation interfaces
    - Add proper error handling and logging integration
    - _Requirements: 1.1, 2.1, 3.4, 3.5_

  - [x]* 2.3 Write unit tests for extracted fleet management service(s)
    - Test fleet creation, ship addition, and validation logic
    - Mock dependencies using Jasmine spies
    - _Requirements: 4.1, 4.4_

  - [x] 2.4 Extract fleet movement and navigation logic into focused service(s)
    - Create service(s) for fleet movement, fuel calculation, and pathfinding
    - Replace `any` types with proper coordinate and movement interfaces
    - Add logging for movement operations and fuel calculations
    - _Requirements: 1.1, 2.1, 3.4, 3.5_

  - [x]* 2.5 Write unit tests for extracted fleet movement service(s)
    - Test movement validation, fuel consumption, and pathfinding
    - Use property-based tests for coordinate calculations
    - _Requirements: 4.1, 4.5_

  - [x] 2.6 Extract remaining FleetService logic into appropriate services
    - Identify and extract any remaining distinct responsibilities
    - Create additional focused services as needed based on actual code analysis
    - Replace remaining `any` types with proper interfaces
    - Add logging for all extracted operations
    - _Requirements: 1.1, 2.1, 3.4, 4.6_

  - [x]* 2.7 Write property test for error handling and logging
    - **Property 5: Error Handling and Logging**
    - **Validates: Requirements 4.6**

- [x] 3. Analyze and refactor GalaxyMapComponent business logic
  - [x] 3.1 Analyze GalaxyMapComponent and identify extractable business logic
    - Review component methods and identify business logic vs UI logic
    - Determine appropriate service boundaries based on actual responsibilities
    - Plan extraction of services based on single responsibility principle
    - _Requirements: 1.2, 1.5_

  - [x] 3.2 Extract user interaction handling logic into focused service(s)
    - Create service(s) for mouse, touch, and wheel event handling
    - Replace event `any` types with proper MouseEvent, TouchEvent interfaces
    - Add interaction logging for debugging user actions
    - _Requirements: 1.2, 2.2, 3.4, 3.5_

  - [ ]* 3.3 Write unit tests for extracted interaction service(s)
    - Test event handling, interaction validation, and edge cases
    - Mock DOM events for testing
    - _Requirements: 4.1, 4.4_

  - [x] 3.4 Extract coordinate and viewport logic into focused service(s)
    - Create service(s) for coordinate transformation, zoom calculations, and viewport logic
    - Replace coordinate `any` types with proper coordinate interfaces
    - Add logging for coordinate transformations
    - _Requirements: 1.2, 2.2, 3.4_

  - [ ]* 3.5 Write property test for type safety enforcement
    - **Property 2: Type Safety Enforcement**
    - **Validates: Requirements 2.6, 8.3**

  - [x] 3.6 Extract remaining GalaxyMapComponent business logic into appropriate services
    - Identify and extract any remaining business logic from the component
    - Create additional focused services as needed based on actual code analysis
    - Replace remaining `any` types with proper interfaces
    - Add logging for all extracted operations
    - _Requirements: 1.2, 2.2, 3.4_

  - [ ]* 3.7 Write unit tests for additional extracted services
    - Test extracted business logic and service interactions
    - _Requirements: 4.1_

- [x] 4. Analyze and refactor ShipDesignerComponent business logic
  - [x] 4.1 Analyze ShipDesignerComponent and identify extractable business logic
    - Review component methods and identify business logic vs UI logic
    - Determine appropriate service boundaries based on actual responsibilities
    - Plan extraction of services based on single responsibility principle
    - _Requirements: 1.3, 1.5_

  - [x] 4.2 Extract ship design validation logic into focused service(s)
    - Create service(s) for design validation, component compatibility, and constraint checking
    - Replace validation `any` types with proper ValidationResult and error interfaces
    - Add comprehensive validation logging
    - _Requirements: 1.3, 2.3, 3.4, 4.6_

  - [ ]* 4.3 Write unit tests for extracted validation service(s)
    - Test design validation rules, component compatibility, and error conditions
    - _Requirements: 4.1, 4.6_

  - [x] 4.4 Extract ship design operations logic into focused service(s)
    - Create service(s) for slot management, component placement, and design manipulation
    - Replace operation `any` types with proper component and slot interfaces
    - Replace console.log statements with LoggingService calls
    - _Requirements: 1.3, 2.3, 3.1, 3.4, 3.5_

  - [ ]* 4.5 Write property test for logging level appropriateness
    - **Property 3: Logging Level Appropriateness**
    - **Validates: Requirements 3.4**

  - [x] 4.6 Extract remaining ShipDesignerComponent business logic into appropriate services
    - Identify and extract any remaining business logic from the component
    - Create additional focused services as needed based on actual code analysis
    - Replace remaining `any` types with proper interfaces
    - Add logging for all extracted operations
    - _Requirements: 1.3, 2.3, 3.4_

  - [ ]* 4.7 Write unit tests for additional extracted services
    - Test extracted business logic and service interactions
    - _Requirements: 4.1_

- [x] 5. Analyze and refactor HullSlotComponent business logic
  - [x] 5.1 Analyze HullSlotComponent and identify extractable business logic
    - Review component methods and identify business logic vs UI logic
    - Determine appropriate service boundaries based on actual responsibilities
    - Plan extraction of services based on single responsibility principle
    - _Requirements: 1.4, 1.5_

  - [x] 5.2 Extract slot validation logic into focused service(s)
    - Create service(s) for component fit validation, capacity checking, and constraint validation
    - Replace slot `any` types with proper HullSlot and Component interfaces
    - Add validation logging
    - _Requirements: 1.4, 2.4, 3.4_

  - [ ]* 5.3 Write unit tests for extracted slot validation service(s)
    - Test component fit validation, capacity limits, and constraint checking
    - _Requirements: 4.1_

  - [x] 5.4 Extract slot operations logic into focused service(s)
    - Create service(s) for component placement, removal, and slot state management
    - Replace operation `any` types with proper slot operation interfaces
    - Add operation logging
    - _Requirements: 1.4, 2.4, 3.4_

  - [ ]* 5.5 Write property test for logging context completeness
    - **Property 4: Logging Context Completeness**
    - **Validates: Requirements 3.5**

  - [x] 5.6 Extract remaining HullSlotComponent business logic into appropriate services
    - Identify and extract any remaining business logic from the component
    - Create additional focused services as needed based on actual code analysis
    - Replace remaining `any` types with proper interfaces
    - _Requirements: 1.4, 2.4, 3.4_

- [ ] 6. Replace console logging with LoggingService
  - [ ] 6.1 Replace console.log in ShipDesignerService
    - Replace debug console.log statements with appropriate LoggingService calls
    - Use Debug level for component placement operations
    - Include relevant context (slotId, component name, count)
    - _Requirements: 3.1, 3.4, 3.5_

  - [ ] 6.2 Replace console.log in PlanetsOverviewComponent
    - Replace debug console.log statements with LoggingService calls
    - Use Debug level for fleet checking operations
    - Include relevant context (planet name, fleet data)
    - _Requirements: 3.2, 3.4, 3.5_

  - [ ] 6.3 Replace console.error statements across services
    - Replace console.error in GameInitializerService, HullLayoutComponent, GalaxyMapComponent
    - Use Error level for actual errors, Warn level for recoverable issues
    - Include structured error context for debugging
    - _Requirements: 3.3, 3.4, 3.5, 4.6_

  - [ ] 6.4 Replace remaining console.log statements
    - Replace console.log in ResearchService, GalaxyMapSettingsComponent, GalaxyMapComponent
    - Use appropriate log levels based on operation type
    - Remove TODO comments and implement proper logging
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 7. Update components to use refactored services
  - [ ] 7.1 Update FleetService consumers to use new services
    - Identify all components and services that use FleetService
    - Update them to inject and use the newly created focused services
    - Update method calls to use new service interfaces
    - _Requirements: 5.1, 5.2, 8.1_

  - [ ] 7.2 Update GalaxyMapComponent to use extracted services
    - Inject the newly created services extracted from GalaxyMapComponent
    - Remove business logic from component and delegate to services
    - Update component to use signals and OnPush change detection
    - _Requirements: 5.1, 6.2, 6.3, 8.2_

  - [ ]* 7.3 Write property test for performance optimization
    - **Property 6: Performance Optimization**
    - **Validates: Requirements 7.1**

  - [ ] 7.4 Update ShipDesignerComponent to use extracted services
    - Inject the newly created services extracted from ShipDesignerComponent
    - Remove business logic from component and delegate to services
    - Update component to use modern Angular patterns
    - _Requirements: 5.1, 6.2, 6.3, 8.2_

  - [ ] 7.5 Update HullSlotComponent to use extracted services
    - Inject the newly created services extracted from HullSlotComponent
    - Remove business logic from component and delegate to services
    - Update component to use proper TypeScript types
    - _Requirements: 5.1, 6.2, 6.3, 8.2_

  - [ ]* 7.6 Write property test for logging performance impact
    - **Property 7: Logging Performance Impact**
    - **Validates: Requirements 7.5**

- [ ] 8. Clean up and optimize service dependencies
  - [ ] 8.1 Optimize service dependency injection for all created services
    - Review and minimize dependencies for each newly created service
    - Use interface-based injection for loose coupling
    - Eliminate any circular dependencies that may have been introduced
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.2 Write property test for clean component interfaces
    - **Property 8: Clean Component Interfaces**
    - **Validates: Requirements 8.2**

  - [ ] 8.3 Update service registration and providers for all new services
    - Register all newly created services in Angular DI system
    - Use `providedIn: 'root'` for singleton services
    - Ensure proper service lifecycle management
    - _Requirements: 6.1, 8.4_

  - [ ]* 8.4 Write property test for service instantiation
    - **Property 9: Service Instantiation**
    - **Validates: Requirements 8.4**

- [ ] 9. Comprehensive testing and validation
  - [ ] 9.1 Add integration tests for service interactions
    - Test interactions between all newly created services
    - Verify proper data flow and error handling across service boundaries
    - Test logging integration across all service interactions
    - _Requirements: 4.2, 4.6_

  - [ ] 9.2 Add performance tests for critical operations
    - Test fleet operations, galaxy map interactions, and ship design operations
    - Verify performance meets or exceeds expectations for refactored code
    - Test logging performance impact across all services
    - _Requirements: 7.1, 7.5, 7.6_

  - [ ] 9.3 Validate TypeScript strictness across all refactored code
    - Run TypeScript compiler with strict settings on all refactored files
    - Verify no `any` types remain in any refactored code
    - Check for proper type inference and safety across all new services
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.4_

  - [ ] 9.4 Validate logging integration across all refactored code
    - Test all logging calls use appropriate levels and context
    - Verify no console.log or console.error statements remain anywhere
    - Test logging service integration in all refactored services and components
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 10. Final cleanup and optimization
  - [ ] 10.1 Remove unused code and imports
    - Clean up any unused imports from refactoring
    - Remove dead code and commented-out sections
    - Optimize import statements and dependencies
    - _Requirements: 6.5, 8.5_

  - [ ] 10.2 Update documentation and comments
    - Add JSDoc comments to all new service interfaces
    - Update inline comments to reflect new architecture
    - Document service responsibilities and usage patterns
    - _Requirements: 6.6_

  - [ ] 10.3 Final validation and testing
    - Run full test suite to ensure all tests pass
    - Verify build succeeds with no TypeScript errors
    - Test application functionality end-to-end
    - _Requirements: All requirements_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and integration points
- Focus on clean architecture without legacy compatibility overhead
- All refactored code should follow modern Angular best practices with signals and OnPush change detection