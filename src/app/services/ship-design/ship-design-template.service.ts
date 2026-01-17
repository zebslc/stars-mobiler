import { Injectable, inject } from '@angular/core';
import { LoggingService } from '../core/logging.service';
import type {
  IShipDesignTemplateService,
  ShipDesignTemplate,
  LogContext,
} from '../../models/service-interfaces.model';
import type { ShipDesign, PlayerTech, Species } from '../../models/game.model';
import type {
  HullTemplate,
  PrimaryRacialTrait,
  LesserRacialTrait,
} from '../../data/tech-atlas.types';
import { ALL_HULLS } from '../../data/tech-atlas.data';
import { STARBASE_HULLS } from '../../data/hulls/starbases.data';
import { getHull } from '../../utils/data-access.util';
import { createEmptyDesign } from '../../models/ship-design.model';
import { hasAll, lacksAny } from '../../utils/trait-validation.util';

/**
 * Ship Design Template Service
 *
 * Handles hull filtering, template management, and design name sanitization.
 * Extracts business logic previously in ShipDesignerComponent.
 */
@Injectable({
  providedIn: 'root',
})
export class ShipDesignTemplateService implements IShipDesignTemplateService {
  private readonly loggingService = inject(LoggingService);

  /**
   * Get available design templates based on tech levels
   */
  getAvailableTemplates(
    techLevels: PlayerTech,
    primaryTraits: ReadonlyArray<PrimaryRacialTrait> | null = null,
    lesserTraits: ReadonlyArray<LesserRacialTrait> | null = null,
  ): Array<ShipDesignTemplate> {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'getAvailableTemplates',
      entityType: 'ShipDesignTemplate',
    };

    this.loggingService.debug('Getting available design templates', context);

    try {
      // For now, return basic templates based on available hulls
      // This can be expanded to include saved user templates
      const availableHulls = this.getAvailableHulls(techLevels, primaryTraits, lesserTraits);

      const templates: Array<ShipDesignTemplate> = availableHulls.map((hull) => ({
        id: `template_${hull.id}`,
        name: `Basic ${hull.Name}`,
        hullId: hull.id,
        description: `Basic ${hull.Name} design template`,
        techRequirements: {
          Energy: hull.techReq?.Energy ?? 0,
          Kinetics: hull.techReq?.Kinetics ?? 0,
          Propulsion: hull.techReq?.Propulsion ?? 0,
          Construction: hull.techReq?.Construction ?? 0,
        },
      }));

      this.loggingService.debug(`Found ${templates.length} available templates`, {
        ...context,
        additionalData: { templateCount: templates.length },
      });

      return templates;
    } catch (error) {
      const errorMessage = `Failed to get available templates: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      return [];
    }
  }

  /**
   * Apply a template to create a new design
   */
  applyTemplate(templateId: string, techLevels: PlayerTech): ShipDesign {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'applyTemplate',
      entityId: templateId,
      entityType: 'ShipDesignTemplate',
    };

    this.loggingService.debug('Applying design template', context);

    try {
      // Extract hull ID from template ID (basic implementation)
      const hullId = templateId.replace('template_', '');
      const hull = getHull(hullId);

      if (!hull) {
        const error = `Hull ${hullId} not found for template ${templateId}`;
        this.loggingService.error(error, context);
        throw new Error(error);
      }

      // Create empty design - this can be expanded to include pre-configured components
      const design = createEmptyDesign(hull, 'player', 1);

      this.loggingService.debug('Template applied successfully', {
        ...context,
        additionalData: { hullId, designId: design.id },
      });

      return design;
    } catch (error) {
      const errorMessage = `Failed to apply template: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Save a design as a template (placeholder implementation)
   */
  saveAsTemplate(design: ShipDesign, name: string): void {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'saveAsTemplate',
      entityId: design.id,
      entityType: 'ShipDesign',
      additionalData: { templateName: name },
    };

    this.loggingService.debug('Saving design as template', context);

    try {
      // Placeholder implementation - would save to local storage or backend
      this.loggingService.info(`Template "${name}" saved successfully`, context);
    } catch (error) {
      const errorMessage = `Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      throw error;
    }
  }

  /**
   * Get available hulls based on construction tech level and racial traits
   */
  getAvailableHulls(
    techLevels: PlayerTech,
    primaryTraits: ReadonlyArray<PrimaryRacialTrait> | null = null,
    lesserTraits: ReadonlyArray<LesserRacialTrait> | null = null,
  ): Array<HullTemplate> {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'getAvailableHulls',
      entityType: 'Hull',
    };

    this.loggingService.debug('Getting available hulls', context);

    try {
      const constructionLevel = techLevels.Construction;
      const availableHulls = ALL_HULLS.filter((hull) => {
        // Check tech requirement
        if ((hull.techReq?.Construction || 0) > constructionLevel) return false;
        // Check racial trait requirements
        return this.meetsHullTraitRequirements(hull, primaryTraits, lesserTraits);
      });

      this.loggingService.debug(`Found ${availableHulls.length} available hulls`, {
        ...context,
        additionalData: { constructionLevel, hullCount: availableHulls.length },
      });

      return availableHulls;
    } catch (error) {
      const errorMessage = `Failed to get available hulls: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      return [];
    }
  }

  /**
   * Filter hulls by type (ships vs starbases)
   */
  filterHullsByType(
    hulls: Array<HullTemplate>,
    filter: 'starbases' | 'ships' | null,
  ): Array<HullTemplate> {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'filterHullsByType',
      entityType: 'Hull',
      additionalData: { filter, inputCount: hulls.length },
    };

    this.loggingService.debug('Filtering hulls by type', context);

    try {
      if (!filter) {
        return hulls;
      }

      const filtered = hulls.filter((hull) => {
        const isStarbase = this.isStarbaseHull(hull);
        return filter === 'starbases' ? isStarbase : !isStarbase;
      });

      this.loggingService.debug(`Filtered to ${filtered.length} hulls`, {
        ...context,
        additionalData: { ...context.additionalData, outputCount: filtered.length },
      });

      return filtered;
    } catch (error) {
      const errorMessage = `Failed to filter hulls: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      return hulls;
    }
  }

  /**
   * Check if a hull is a starbase hull
   */
  isStarbaseHull(hull: HullTemplate): boolean {
    const name = hull?.Name ?? '';
    return (
      !!hull?.isStarbase || hull?.type === 'starbase' || STARBASE_HULLS.some((h) => h.Name === name)
    );
  }

  /**
   * Sanitize design name for safe storage
   */
  sanitizeDesignName(name: string): string {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'sanitizeDesignName',
      entityType: 'DesignName',
      additionalData: { originalName: name },
    };

    this.loggingService.debug('Sanitizing design name', context);

    try {
      // Remove HTML tags and dangerous characters, limit length
      const sanitized = name
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim()
        .slice(0, 50);

      this.loggingService.debug('Design name sanitized', {
        ...context,
        additionalData: { ...context.additionalData, sanitizedName: sanitized },
      });

      return sanitized;
    } catch (error) {
      const errorMessage = `Failed to sanitize design name: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      return 'Unnamed Design';
    }
  }

  /**
   * Validate design limits (ships vs starbases)
   */
  validateDesignLimits(
    existingDesigns: Array<ShipDesign>,
    newDesign: ShipDesign,
    isUpdate: boolean,
  ): { isValid: boolean; error?: string } {
    const context: LogContext = {
      service: 'ShipDesignTemplateService',
      operation: 'validateDesignLimits',
      entityId: newDesign.id,
      entityType: 'ShipDesign',
      additionalData: { isUpdate, existingCount: existingDesigns.length },
    };

    this.loggingService.debug('Validating design limits', context);

    try {
      if (isUpdate) {
        return { isValid: true };
      }

      const hull = getHull(newDesign.hullId);
      if (!hull) {
        return { isValid: false, error: 'Hull not found' };
      }

      const isStarbase = this.isStarbaseHull(hull);

      const starbaseDesigns = existingDesigns.filter((d) => {
        const h = getHull(d.hullId);
        return h && this.isStarbaseHull(h);
      });

      const shipDesigns = existingDesigns.filter((d) => {
        const h = getHull(d.hullId);
        return h && !this.isStarbaseHull(h);
      });

      if (isStarbase) {
        if (starbaseDesigns.length >= 10) {
          const error =
            'You have reached the maximum of 10 starbase designs. You must delete an existing design before you can create a new one.';
          this.loggingService.warn(error, context);
          return { isValid: false, error };
        }
      } else {
        if (shipDesigns.length >= 16) {
          const error =
            'You have reached the maximum of 16 ship designs. You must delete an existing design before you can create a new one.';
          this.loggingService.warn(error, context);
          return { isValid: false, error };
        }
      }

      this.loggingService.debug('Design limits validation passed', context);
      return { isValid: true };
    } catch (error) {
      const errorMessage = `Failed to validate design limits: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.loggingService.error(errorMessage, context);
      return { isValid: false, error: errorMessage };
    }
  }

  private meetsHullTraitRequirements(
    hull: HullTemplate,
    primaryTraits: ReadonlyArray<PrimaryRacialTrait> | null,
    lesserTraits: ReadonlyArray<LesserRacialTrait> | null,
  ): boolean {
    if (!hasAll(primaryTraits, hull.primaryRacialTraitRequired)) return false;
    if (!lacksAny(primaryTraits, hull.primaryRacialTraitUnavailable)) return false;
    if (!hasAll(lesserTraits, hull.lesserRacialTraitRequired)) return false;
    if (!lacksAny(lesserTraits, hull.lesserRacialTraitUnavailable)) return false;
    return true;
  }
}