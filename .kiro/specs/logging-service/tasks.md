# Implementation Plan: Logging Service

## Overview

This implementation plan creates a comprehensive logging service for Stellar Remnants with multiple destinations, developer mode integration, and rich error context capture. The implementation follows the established Angular patterns in the codebase and integrates seamlessly with existing services.

## Tasks

- [x] 1. Set up core logging interfaces and types
  - Create logging interfaces (LogEntry, LogLevel, LogDestination, LogContext)
  - Define configuration interfaces for all destinations
  - Set up TypeScript enums and utility types
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 1.1 Write property test for structured log data acceptance
  - **Property 1: Structured Log Data Acceptance**
  - **Validates: Requirements 1.2**

- [ ] 2. Implement core LoggingService
  - [x] 2.1 Create LoggingService with dependency injection setup
    - Implement basic service structure with Angular DI
    - Add signal-based configuration management
    - Set up service registration in root
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Write property test for log level support
    - **Property 2: Log Level Support**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Implement automatic metadata inclusion
    - Add timestamp generation for all log entries
    - Implement source context capture
    - Create unique ID generation for log entries
    - _Requirements: 1.4_

  - [x] 2.4 Write property test for automatic metadata inclusion
    - **Property 3: Automatic Metadata Inclusion**
    - **Validates: Requirements 1.4**

- [ ] 3. Create context providers
  - [ ] 3.1 Implement BrowserContextProvider
    - Capture user agent, viewport, and performance data
    - Create browser information gathering utilities
    - _Requirements: 6.1_

  - [ ] 3.2 Implement GameContextProvider
    - Integrate with GameStateService to capture game context
    - Include current game state, player info, turn number
    - _Requirements: 6.2_

  - [ ] 3.3 Implement AngularContextProvider
    - Capture component and route context for Angular errors
    - Integrate with Angular Router and component tree
    - _Requirements: 6.4_

  - [ ] 3.4 Write property test for comprehensive context capture
    - **Property 13: Comprehensive Context Capture**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ] 3.5 Write property test for context serialization
    - **Property 14: Context Serialization**
    - **Validates: Requirements 6.5**

- [ ] 4. Implement log destinations
  - [ ] 4.1 Create ConsoleDestination
    - Implement console logging with formatted output
    - Add color coding for different log levels
    - _Requirements: 2.1_

  - [ ] 4.2 Create ApplicationInsightsDestination
    - Implement Application Insights API integration
    - Add batching and retry logic for external calls
    - Handle connection failures gracefully
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 4.3 Create DeveloperPanelDestination
    - Implement observable stream for real-time events
    - Add developer mode conditional logic
    - _Requirements: 2.3, 4.1_

  - [ ] 4.4 Write property test for multi-destination routing
    - **Property 4: Multi-Destination Routing**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [ ] 4.5 Write property test for destination failure isolation
    - **Property 5: Destination Failure Isolation**
    - **Validates: Requirements 2.5**

- [ ] 5. Implement LogDestinationManager
  - [ ] 5.1 Create destination management service
    - Implement destination registration and routing
    - Add configuration-based destination enabling/disabling
    - Handle destination failures with isolation
    - _Requirements: 2.4, 2.5_

  - [ ] 5.2 Write property test for Application Insights integration
    - **Property 10: Application Insights Integration**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ] 5.3 Write property test for Application Insights failure handling
    - **Property 11: Application Insights Failure Handling**
    - **Validates: Requirements 5.4**

- [ ] 6. Extend SettingsService with developer mode
  - [ ] 6.1 Add developer mode signal to SettingsService
    - Add developerMode signal with boolean type
    - Implement toggleDeveloperMode method
    - Follow existing settings service patterns
    - _Requirements: 3.1, 3.3_

  - [ ] 6.2 Write property test for developer mode signal behavior
    - **Property 7: Developer Mode Signal Behavior**
    - **Validates: Requirements 3.1**

  - [ ] 6.3 Write property test for settings persistence
    - **Property 8: Settings Persistence**
    - **Validates: Requirements 3.3**

- [ ] 7. Update settings screen UI
  - [ ] 7.1 Add developer mode checkbox to settings component
    - Add checkbox input with proper labeling
    - Bind to SettingsService developerMode signal
    - Follow existing UI patterns and styling
    - _Requirements: 3.2, 3.5_

  - [ ] 7.2 Write unit test for settings screen developer mode checkbox
    - Test checkbox rendering and interaction
    - Verify integration with SettingsService
    - _Requirements: 3.2_

- [ ] 8. Create developer panel component
  - [ ] 8.1 Implement DeveloperPanelComponent
    - Create standalone component with OnPush strategy
    - Display real-time error stream from logging service
    - Show timestamp, level, message, and metadata
    - _Requirements: 4.2, 4.4, 4.5_

  - [ ] 8.2 Write property test for developer mode event emission
    - **Property 6: Developer Mode Event Emission**
    - **Validates: Requirements 2.3, 4.1, 4.3**

  - [ ] 8.3 Write property test for developer panel error display
    - **Property 9: Developer Panel Error Display**
    - **Validates: Requirements 4.4**

  - [ ] 8.4 Write unit test for developer panel component rendering
    - Test component structure and error display
    - Verify real-time updates from logging service
    - _Requirements: 4.2_

- [ ] 9. Implement performance and reliability features
  - [ ] 9.1 Add rate limiting to LoggingService
    - Implement configurable rate limiting for log messages
    - Preserve most recent entries when throttling
    - _Requirements: 7.3_

  - [ ] 9.2 Add message batching for external destinations
    - Implement batching logic for Application Insights
    - Add configurable batch size and flush intervals
    - _Requirements: 7.4_

  - [ ] 9.3 Implement error isolation for external logging
    - Wrap external service calls in try-catch blocks
    - Ensure main application continues on logging failures
    - _Requirements: 7.2_

  - [ ] 9.4 Write property test for external logging error isolation
    - **Property 15: External Logging Error Isolation**
    - **Validates: Requirements 7.2**

  - [ ] 9.5 Write property test for rate limiting behavior
    - **Property 16: Rate Limiting Behavior**
    - **Validates: Requirements 7.3**

  - [ ] 9.6 Write property test for message batching
    - **Property 17: Message Batching**
    - **Validates: Requirements 7.4**

- [ ] 10. Configure environment-specific settings
  - [ ] 10.1 Update environment configuration files
    - Add logging configuration to environment.ts and environment.prod.ts
    - Configure different log levels and destinations per environment
    - Add Application Insights configuration
    - _Requirements: 8.1, 8.2, 8.3, 5.5_

  - [ ] 10.2 Create LogConfigurationService
    - Implement environment-based configuration loading
    - Support runtime configuration changes
    - _Requirements: 8.4, 8.5_

  - [ ] 10.3 Write property test for environment configuration
    - **Property 12: Environment Configuration**
    - **Validates: Requirements 5.5**

  - [ ] 10.4 Write property test for environment-specific configuration
    - **Property 18: Environment-Specific Configuration**
    - **Validates: Requirements 8.1**

  - [ ] 10.5 Write property test for runtime configuration changes
    - **Property 19: Runtime Configuration Changes**
    - **Validates: Requirements 8.5**

- [ ] 11. Create Angular error handler integration
  - [ ] 11.1 Implement custom Angular ErrorHandler
    - Create ErrorHandler that routes to LoggingService
    - Capture Angular-specific error context
    - Register as provider in main application
    - _Requirements: 6.4_

  - [ ] 11.2 Write unit test for Angular error handler integration
    - Test error capture and routing to logging service
    - Verify Angular context inclusion
    - _Requirements: 6.4_

- [ ] 12. Integration and final wiring
  - [ ] 12.1 Wire all components together
    - Connect LoggingService with all destinations and providers
    - Integrate developer panel with main application routing
    - Set up proper dependency injection for all services
    - _Requirements: All requirements_

  - [ ] 12.2 Write integration tests for complete logging flow
    - Test end-to-end logging from error to all destinations
    - Verify developer mode integration
    - Test settings persistence and UI updates
    - _Requirements: All requirements_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and integration points
- The implementation follows Angular best practices and project architectural patterns