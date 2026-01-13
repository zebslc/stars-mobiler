/**
 * Model Index - Centralized exports for all model types
 * 
 * This file provides a single point of import for all model types
 * used throughout the application, including the new interfaces
 * created during the code quality refactor.
 */

// Core game models
export * from './game.model';
export * from './ship-design.model';
export * from './tech.model';
export * from './logging.model';

// New service interface models
export * from './service-interfaces.model';
export * from './ui-types.model';
export * from './configuration.model';

// Re-export commonly used types for convenience
export type {
  // Fleet types
  Fleet,
  FleetOrder,
  ShipStack,
  
  // Game state types
  GameState,
  Player,
  Planet,
  Star,
  
  // Ship design types
  ShipDesign,
  CompiledShipStats,
  SlotAssignment,
  ComponentAssignment,
  
  // Tech types
  PlayerTech,
} from './game.model';

export type {
  // Service interfaces
  IFleetOperationsService,
  IFleetMovementService,
  IFleetNamingService,
  IFleetValidationService,
  IGalaxyInteractionService,
  IGalaxyCoordinateService,
  IGalaxyContextMenuService,
  IShipDesignValidationService,
  IShipDesignOperationsService,
  IShipDesignTemplateService,
  IHullSlotValidationService,
  IHullSlotOperationsService,
  
  // Core data types
  FleetLocation,
  GalaxyMapState,
  ValidationResult,
  MovementValidationResult,
  InteractionResult,
  ComponentData,
  HullSlot,
  
  // Coordinate types
  ScreenCoordinate,
  GalaxyCoordinate,
} from './service-interfaces.model';

export type {
  // UI types
  ImageErrorEvent,
  FleetOrderDisplay,
  BuildQueueItem,
  ShipDesignDisplay,
  HoveredItem,
  WaypointContextMenuState,
  TouchHoldState,
  LongPressState,
  CargoManifest,
  CargoPayload,
  FleetPathSegment,
  PlanetCoordinate,
  SlotTypeDisplay,
  EngineStats,
  LegacyEngineSpec,
  ComponentAssignmentDisplay,
} from './ui-types.model';

export type {
  // Configuration types
  ServiceConfiguration,
  FleetServiceConfig,
  GalaxyMapConfig,
  ShipDesignerConfig,
  HullSlotConfig,
  ValidationConfiguration,
  PerformanceConfig,
  ErrorHandlingConfig,
  RefactorConfiguration,
  
  // Logging types
  LoggingContext,
  ServiceLoggingContext,
  ErrorLoggingContext,
  PerformanceLoggingContext,
} from './configuration.model';

export {
  // Enums
  LogLevel,
} from './configuration.model';