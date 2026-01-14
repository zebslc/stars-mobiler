/**
 * UI Type Definitions for Code Quality Refactor
 * 
 * This file contains type definitions for UI components to replace
 * any types found in the codebase during the refactoring process.
 */

import { FleetOrder } from './game.model';
import { ComponentData, GalaxyCoordinate } from './service-interfaces.model';

// ============================================================================
// Image Event Types
// ============================================================================

/**
 * Image error event interface to replace any types in image error handlers
 */
export interface ImageErrorEvent {
  target: HTMLImageElement;
}

// ============================================================================
// Fleet Order Types
// ============================================================================

/**
 * Fleet order display interface for UI components
 */
export interface FleetOrderDisplay {
  type: string;
  description: string;
  destination?: GalaxyCoordinate;
  planetId?: string;
  warpSpeed?: number;
}

// ============================================================================
// Build Queue Types
// ============================================================================

/**
 * Build queue item interface to replace any types in build queue components
 */
export interface BuildQueueItem {
  id: string;
  project: string;
  cost: {
    resources: number;
    ironium?: number;
    boranium?: number;
    germanium?: number;
  };
  paid?: {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
  };
  shipDesignId?: string;
  isAuto?: boolean;
  count?: number;
}

// ============================================================================
// Ship Design Types
// ============================================================================

/**
 * Ship design display interface for UI components
 */
export interface ShipDesignDisplay {
  id: string;
  name: string;
  hullName: string;
  mass: number;
  cost: {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
  };
}

/**
 * Hovered item interface for ship designer
 */
export interface HoveredItem {
  type: 'component' | 'slot' | 'hull';
  id: string;
  name: string;
  data?: ComponentData | Record<string, unknown>;
}

// ============================================================================
// Context Menu Types
// ============================================================================

/**
 * Waypoint context menu state interface
 */
export interface WaypointContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fleetId: string | null;
  orderIndex: number;
  order: FleetOrder | null;
}

// ============================================================================
// Touch and Mouse Event Types
// ============================================================================

/**
 * Touch hold state interface
 */
export interface TouchHoldState {
  timer: number | null;
  startPos: { x: number; y: number } | null;
  isHolding: boolean;
}

/**
 * Long press state interface
 */
export interface LongPressState {
  timer: number | null;
  isPressed: boolean;
  startPos: { x: number; y: number } | null;
}

// ============================================================================
// Cargo Management Types
// ============================================================================

/**
 * Cargo manifest interface for fleet cargo operations
 */
export interface CargoManifest {
  resources?: number | 'all' | 'fill';
  ironium?: number | 'all' | 'fill';
  boranium?: number | 'all' | 'fill';
  germanium?: number | 'all' | 'fill';
  colonists?: number | 'all' | 'fill';
}

/**
 * Cargo payload interface for load/unload operations
 */
export interface CargoPayload {
  resources?: number;
  ironium?: number;
  boranium?: number;
  germanium?: number;
  colonists?: number;
}

// ============================================================================
// Fleet Path Visualization Types
// ============================================================================

/**
 * Fleet path segment interface for galaxy map visualization
 */
export interface FleetPathSegment {
  start: GalaxyCoordinate;
  end: GalaxyCoordinate;
  warpSpeed: number;
  fuelCost: number;
  isCurrentSegment: boolean;
}

// ============================================================================
// Planet Coordinate Types
// ============================================================================

/**
 * Planet coordinate interface to replace any types in planet position calculations
 */
export interface PlanetCoordinate {
  x: number;
  y: number;
  starId: string;
  starId: string;
}

// ============================================================================
// Slot Type Display Types
// ============================================================================

/**
 * Slot type display configuration
 */
export interface SlotTypeDisplay {
  icon: string;
  label: string;
  color: string;
}

// ============================================================================
// Engine Statistics Types
// ============================================================================

/**
 * Engine statistics interface to replace any types in engine calculations
 */
export interface EngineStats {
  id: string;
  name: string;
  type: string;
  stats: {
    maxWarp: number;
    fuelEff: number;
    fuelUsage: Record<string, number>;
  };
  isRamscoop?: boolean;
}

/**
 * Legacy engine specification interface
 */
export interface LegacyEngineSpec {
  fuelEfficiency?: number;
  idealWarp?: number;
  warpSpeed?: number;
  mass?: number;
  engine?: {
    id: string;
  };
}

// ============================================================================
// Component Assignment Types
// ============================================================================

/**
 * Component assignment with metadata for UI display
 */
export interface ComponentAssignmentDisplay {
  componentId: string;
  count: number;
  component: ComponentData;
  maxCount: number;
  canIncrement: boolean;
  canDecrement: boolean;
}