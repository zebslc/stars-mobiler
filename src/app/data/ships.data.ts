/**
 * DEPRECATION NOTICE: This file is deprecated. Use ShipDesignRegistry from services/data/ship-design-registry.service.ts instead.
 * 
 * This file is maintained for backward compatibility only.
 * All new code should use the injectable ShipDesignRegistry service.
 */

// Re-export the service interface and types for backward compatibility
export { ShipDesignRegistry, type CompiledDesign } from '../services/data/ship-design-registry.service';

// Legacy helper to maintain backward compatibility with old code patterns
import { inject } from '@angular/core';
import { ShipDesignRegistry, type CompiledDesign } from '../services/data/ship-design-registry.service';

/**
 * DEPRECATED: Use inject(ShipDesignRegistry) instead
 * This is a function wrapper for backward compatibility with old code
 * that calls getDesign() directly without dependency injection.
 * 
 * @deprecated Use ShipDesignRegistry service via inject()
 */
let _legacyRegistry: ShipDesignRegistry | null = null;

export function getDesign(designId: string): CompiledDesign {
  if (!_legacyRegistry) {
    _legacyRegistry = inject(ShipDesignRegistry);
  }
  return _legacyRegistry.getDesign(designId);
}

/**
 * DEPRECATED: Use inject(ShipDesignRegistry).register() instead
 * @deprecated Use ShipDesignRegistry service via inject()
 */
export function registerCompiledDesign(design: CompiledDesign): void {
  if (!_legacyRegistry) {
    _legacyRegistry = inject(ShipDesignRegistry);
  }
  _legacyRegistry.register(design);
}

/**
 * DEPRECATED: Use inject(ShipDesignRegistry).unregister() instead
 * @deprecated Use ShipDesignRegistry service via inject()
 */
export function unregisterCompiledDesign(designId: string): void {
  if (!_legacyRegistry) {
    _legacyRegistry = inject(ShipDesignRegistry);
  }
  _legacyRegistry.unregister(designId);
}

/**
 * DEPRECATED: Use inject(ShipDesignRegistry).designs for reactive access
 * This creates an object snapshot, not reactive. Use the service signal instead.
 * @deprecated Use ShipDesignRegistry service via inject()
 */
export const COMPILED_DESIGNS: Record<string, CompiledDesign> = {};