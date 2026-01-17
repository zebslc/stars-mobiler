/**
 * DEPRECATION NOTICE: This file is deprecated.
 * Use DataAccessService from services/data/data-access.service.ts instead.
 * 
 * This file is maintained for backward compatibility only.
 * All new code should use the injectable DataAccessService.
 */

import { inject } from '@angular/core';
import type { ComponentStats, HullTemplate } from '../data/tech-atlas.types';
import { DataAccessService } from '../services/data/data-access.service';

let _dataAccessService: DataAccessService | null = null;

function _getService(): DataAccessService {
  if (!_dataAccessService) {
    _dataAccessService = inject(DataAccessService);
  }
  return _dataAccessService;
}

/**
 * DEPRECATED: Use inject(DataAccessService).getComponent() instead
 * Get a component by ID from the tech atlas
 */
export function getComponent(componentId: string): ComponentStats | undefined {
  return _getService().getComponent(componentId);
}

/**
 * DEPRECATED: Use inject(DataAccessService).getAllComponents() instead
 * Get all components as a flat array
 */
export function getAllComponents(): Array<ComponentStats> {
  return _getService().getAllComponents();
}

/**
 * DEPRECATED: Use inject(DataAccessService).getComponentsLookup() instead
 * Get all components as a lookup object for O(1) access
 */
export function getComponentsLookup(): Record<string, ComponentStats> {
  return _getService().getComponentsLookup();
}

/**
 * DEPRECATED: Use inject(DataAccessService).getHull() instead
 * Get a hull by ID from the tech atlas
 */
export function getHull(hullId: string): HullTemplate | undefined {
  return _getService().getHull(hullId);
}

/**
 * DEPRECATED: Use inject(DataAccessService).getAllHulls() instead
 * Get all hulls
 */
export function getAllHulls(): Array<HullTemplate> {
  return _getService().getAllHulls();
}

/**
 * DEPRECATED: Use inject(DataAccessService).getRequiredTechLevel() instead
 * Get the required tech level for a component
 */
export function getRequiredTechLevel(component: ComponentStats): number {
  return _getService().getRequiredTechLevel(component);
}

/**
 * DEPRECATED: Use inject(DataAccessService).getPrimaryTechField() instead
 * Get the primary tech field for a component
 */
export function getPrimaryTechField(component: ComponentStats): string {
  return _getService().getPrimaryTechField(component);
}