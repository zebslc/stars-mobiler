/**
 * Configuration Model Definitions for Code Quality Refactor
 * 
 * This file contains configuration interfaces for services and logging
 * to support the refactoring process with proper type safety.
 */

// ============================================================================
// Service Configuration Types
// ============================================================================

/**
 * Fleet service configuration
 */
export interface FleetServiceConfig {
  maxFleets: number;
  maxShipsPerDesign: number;
  defaultFuelCapacity: number;
  refuelRates: {
    ownedPlanet: number;
    stardock: number;
    ramscoop: number;
  };
}

/**
 * Galaxy map service configuration
 */
export interface GalaxyMapConfig {
  minZoom: number;
  maxZoom: number;
  panSensitivity: number;
  touchSensitivity: number;
  longPressDelay: number;
  contextMenuDelay: number;
}

/**
 * Ship designer service configuration
 */
export interface ShipDesignerConfig {
  autoSave: boolean;
  validationLevel: 'strict' | 'permissive';
  maxUndoSteps: number;
  componentPreviewDelay: number;
}

/**
 * Hull slot service configuration
 */
export interface HullSlotConfig {
  maxComponentsPerSlot: number;
  allowOverfill: boolean;
  showCapacityWarnings: boolean;
}

/**
 * Master service configuration interface
 */
export interface ServiceConfiguration {
  fleet: FleetServiceConfig;
  galaxyMap: GalaxyMapConfig;
  shipDesigner: ShipDesignerConfig;
  hullSlot: HullSlotConfig;
}

// ============================================================================
// Logging Configuration Types
// ============================================================================

/**
 * Log level enumeration
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

/**
 * Logging context for structured logging
 */
export interface LoggingContext {
  service: string;
  operation: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Service-specific logging context
 */
export interface ServiceLoggingContext extends LoggingContext {
  service: 'FleetService' | 'GalaxyMapService' | 'ShipDesignerService' | 'HullSlotService';
  performance?: {
    startTime: number;
    duration?: number;
  };
}

/**
 * Error logging context
 */
export interface ErrorLoggingContext extends LoggingContext {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Performance logging context
 */
export interface PerformanceLoggingContext extends LoggingContext {
  metrics: {
    duration: number;
    memoryUsage?: number;
    operationCount?: number;
  };
  thresholds: {
    warning: number;
    error: number;
  };
}

// ============================================================================
// Validation Configuration Types
// ============================================================================

/**
 * Validation rule configuration
 */
export interface ValidationRuleConfig {
  enabled: boolean;
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Fleet validation configuration
 */
export interface FleetValidationConfig {
  maxFleets: ValidationRuleConfig;
  maxShipsPerDesign: ValidationRuleConfig;
  fuelCapacity: ValidationRuleConfig;
  cargoCapacity: ValidationRuleConfig;
}

/**
 * Ship design validation configuration
 */
export interface ShipDesignValidationConfig {
  requiredComponents: ValidationRuleConfig;
  massLimits: ValidationRuleConfig;
  costLimits: ValidationRuleConfig;
  techRequirements: ValidationRuleConfig;
}

/**
 * Master validation configuration
 */
export interface ValidationConfiguration {
  fleet: FleetValidationConfig;
  shipDesign: ShipDesignValidationConfig;
  strictMode: boolean;
  showWarnings: boolean;
}

// ============================================================================
// Performance Configuration Types
// ============================================================================

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  enableMonitoring: boolean;
  thresholds: {
    fleetOperations: number;
    galaxyMapInteractions: number;
    shipDesignOperations: number;
    hullSlotOperations: number;
  };
  sampling: {
    rate: number;
    maxSamples: number;
  };
}

// ============================================================================
// Error Handling Configuration Types
// ============================================================================

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  enableGlobalHandler: boolean;
  logAllErrors: boolean;
  showUserFriendlyMessages: boolean;
  retryAttempts: {
    fleetOperations: number;
    galaxyMapOperations: number;
    shipDesignOperations: number;
  };
  fallbackBehavior: 'graceful' | 'strict';
}

// ============================================================================
// Master Configuration Interface
// ============================================================================

/**
 * Master configuration interface for all refactored services
 */
export interface RefactorConfiguration {
  services: ServiceConfiguration;
  validation: ValidationConfiguration;
  performance: PerformanceConfig;
  errorHandling: ErrorHandlingConfig;
  logging: {
    level: LogLevel;
    enableConsoleOutput: boolean;
    enableStructuredLogging: boolean;
  };
}