/**
 * Service Interface Definitions for Code Quality Refactor
 * 
 * This file contains all the service interfaces that will be created
 * during the refactoring process to break up god classes into focused services.
 */

import { GameState, Fleet, Planet, ShipDesign, PlayerTech } from './game.model';

// ============================================================================
// Fleet Service Decomposition Interfaces
// ============================================================================

/**
 * Fleet location type to replace any types in fleet operations
 */
export interface FleetLocation {
  type: 'space' | 'orbit';
  x?: number;
  y?: number;
  planetId?: string;
}

/**
 * Result of fleet movement validation
 */
export interface MovementValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fuelRequired: number;
  fuelAvailable: number;
  canMove: boolean;
}

/**
 * Generic validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Core fleet operations service interface
 */
export interface IFleetOperationsService {
  createFleet(game: GameState, location: FleetLocation, ownerId: string, baseNameSource?: string): Fleet;
  addShipToFleet(game: GameState, planet: Planet, shipDesignId: string, count: number): void;
  validateFleetLimits(game: GameState, ownerId: string): boolean;
}

/**
 * Fleet movement and navigation service interface
 */
export interface IFleetMovementService {
  moveFleet(game: GameState, fleetId: string, destination: FleetLocation): void;
  calculateFuelConsumption(fleet: Fleet, distance: number): number;
  validateMovement(fleet: Fleet, destination: FleetLocation): MovementValidationResult;
}

/**
 * Fleet naming and organization service interface
 */
export interface IFleetNamingService {
  generateFleetName(game: GameState, ownerId: string, baseName: string): string;
  validateFleetName(name: string): boolean;
  getAvailableFleetNames(game: GameState, ownerId: string): string[];
}

/**
 * Fleet validation and rules service interface
 */
export interface IFleetValidationService {
  validateShipAddition(fleet: Fleet, shipDesignId: string, count: number): ValidationResult;
  validateFleetComposition(fleet: Fleet): ValidationResult;
  checkFleetLimits(playerFleets: Fleet[], maxFleets: number): boolean;
}

// ============================================================================
// Galaxy Map Component Decomposition Interfaces
// ============================================================================

/**
 * Galaxy map state to replace any types in galaxy map operations
 */
export interface GalaxyMapState {
  zoom: number;
  panX: number;
  panY: number;
  selectedStar: string | null;
  selectedFleet: string | null;
}

/**
 * Screen coordinate interface
 */
export interface ScreenCoordinate {
  x: number;
  y: number;
}

/**
 * Galaxy coordinate interface
 */
export interface GalaxyCoordinate {
  x: number;
  y: number;
}

/**
 * Result of user interaction with galaxy map
 */
export interface InteractionResult {
  type: 'select' | 'pan' | 'zoom' | 'contextMenu';
  target?: string;
  position?: ScreenCoordinate;
}

/**
 * Galaxy map interaction handling service interface
 */
export interface IGalaxyInteractionService {
  handleMouseEvents(event: MouseEvent, mapState: GalaxyMapState): InteractionResult;
  handleTouchEvents(event: TouchEvent, mapState: GalaxyMapState): InteractionResult;
  handleWheelEvents(event: WheelEvent, mapState: GalaxyMapState): InteractionResult;
}

/**
 * Galaxy map coordinate system service interface
 */
export interface IGalaxyCoordinateService {
  screenToGalaxy(screenX: number, screenY: number, mapState: GalaxyMapState): GalaxyCoordinate;
  galaxyToScreen(galaxyX: number, galaxyY: number, mapState: GalaxyMapState): ScreenCoordinate;
  calculateZoomLevel(currentZoom: number, delta: number): number;
}

/**
 * Waypoint interface for galaxy map
 */
export interface Waypoint {
  id: string;
  fleetId: string;
  position: GalaxyCoordinate;
  orderIndex: number;
}

/**
 * Galaxy map context menu management service interface
 */
export interface IGalaxyContextMenuService {
  showPlanetContextMenu(planet: Planet, position: ScreenCoordinate): void;
  showFleetContextMenu(fleet: Fleet, position: ScreenCoordinate): void;
  showWaypointContextMenu(waypoint: Waypoint, position: ScreenCoordinate): void;
  closeAllContextMenus(): void;
}

// ============================================================================
// Ship Designer Component Decomposition Interfaces
// ============================================================================

/**
 * Resource cost interface
 */
export interface ResourceCost {
  resources: number;
  ironium: number;
  boranium: number;
  germanium: number;
}

/**
 * Ship design template interface
 */
export interface ShipDesignTemplate {
  id: string;
  name: string;
  hullId: string;
  description: string;
  techRequirements: PlayerTech;
}

/**
 * Ship design validation service interface
 */
export interface IShipDesignValidationService {
  validateDesign(design: ShipDesign, techLevels: PlayerTech): ValidationResult;
  validateComponentPlacement(slotId: string, component: ComponentData, count: number): ValidationResult;
  validateHullSelection(hullId: string, techLevels: PlayerTech): ValidationResult;
}

/**
 * Ship design operations service interface
 */
export interface IShipDesignOperationsService {
  setSlotComponent(design: ShipDesign, slotId: string, component: ComponentData, count: number): ShipDesign;
  clearSlot(design: ShipDesign, slotId: string): ShipDesign;
  changeHull(design: ShipDesign, newHullId: string): ShipDesign;
  calculateDesignCost(design: ShipDesign): ResourceCost;
}

/**
 * Ship design templates and presets service interface
 */
export interface IShipDesignTemplateService {
  getAvailableTemplates(techLevels: PlayerTech): ShipDesignTemplate[];
  applyTemplate(templateId: string, techLevels: PlayerTech): ShipDesign;
  saveAsTemplate(design: ShipDesign, name: string): void;
}

// ============================================================================
// Hull Slot Component Decomposition Interfaces
// ============================================================================

/**
 * Hull slot interface to replace any types in slot operations
 */
export interface HullSlot {
  id: string;
  allowedTypes: string[];
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
}

/**
 * Component data interface to replace any types
 */
export interface ComponentData {
  id: string;
  name: string;
  type: string;
  stats?: Record<string, unknown>;
  cost?: ResourceCost;
  mass?: number;
}

/**
 * Slot display information interface
 */
export interface SlotDisplayInfo {
  isEmpty: boolean;
  componentName: string;
  componentCount: number;
  maxCount: number;
  slotType: string;
}

/**
 * Hull slot validation service interface
 */
export interface IHullSlotValidationService {
  validateComponentFit(slot: HullSlot, component: ComponentData): boolean;
  getMaxComponentCount(slot: HullSlot, component: ComponentData): number;
  validateSlotCapacity(slot: HullSlot, components: ComponentData[]): boolean;
}

/**
 * Hull slot operations service interface
 */
export interface IHullSlotOperationsService {
  placeComponent(slot: HullSlot, component: ComponentData, count: number): HullSlot;
  removeComponent(slot: HullSlot): HullSlot;
  getSlotDisplayInfo(slot: HullSlot): SlotDisplayInfo;
}

// ============================================================================
// Event Handling Interfaces
// ============================================================================

/**
 * Mouse event data interface to replace any types
 */
export interface MouseEventData {
  clientX: number;
  clientY: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Touch event data interface to replace any types
 */
export interface TouchEventData {
  touches: Array<{
    clientX: number;
    clientY: number;
  }>;
  changedTouches: Array<{
    clientX: number;
    clientY: number;
  }>;
}

/**
 * Wheel event data interface to replace any types
 */
export interface WheelEventData {
  deltaY: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
}

// ============================================================================
// Service Configuration Interfaces
// ============================================================================

/**
 * Service configuration interface
 */
export interface ServiceConfiguration {
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

// ============================================================================
// Logging Context Interfaces
// ============================================================================

/**
 * Log context interface for structured logging
 */
export interface LogContext {
  service: string;
  operation: string;
  entityId?: string;
  entityType?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Service log entry interface
 */
export interface ServiceLogEntry {
  level: 'Debug' | 'Info' | 'Warn' | 'Error';
  message: string;
  context: LogContext;
  timestamp: Date;
}