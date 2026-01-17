import { Injectable } from '@angular/core';
import type {
  ComponentStats,
  HullTemplate,
  PrimaryRacialTrait,
  LesserRacialTrait,
} from '../../data/tech-atlas.types';
import { getSlotTypeForComponentType } from '../../data/tech-atlas.types';
import { ALL_HULLS, getAllComponents } from '../../data/tech-atlas.data';
import type { PlayerTech, Species } from '../../models/game.model';
import { getPrimaryTechField, getRequiredTechLevel } from '../../utils/data-access.util';
import { hasAll, lacksAny } from '../../utils/trait-validation.util';
import type { MiniaturizedComponent } from '../../utils/miniaturization.util';
import { miniaturizeComponent } from '../../utils/miniaturization.util';
import { canInstallComponent } from '../../models/ship-design.model';

export type NormalizedHullSlot = {
  id: string;
  allowedTypes: Array<ReturnType<typeof getSlotTypeForComponentType>>;
  max?: number;
  required?: boolean;
  editable?: boolean;
  size?: number;
};

@Injectable({
  providedIn: 'root',
})
export class ShipComponentEligibilityService {
  getAvailableComponentsForSlot(
    hull: HullTemplate | null,
    slotId: string,
    techLevels: PlayerTech,
    species: Species | null,
  ): Array<MiniaturizedComponent> {
    if (!hull) return [];
    const slotDefinition = this.findHullSlotDefinition(hull, slotId);
    if (!slotDefinition) return [];
    const slot = this.normalizeSlot(slotDefinition, slotId);
    return getAllComponents()
      .filter((component) => this.isComponentAllowed(component, hull, slot, techLevels, species))
      .map((component) => miniaturizeComponent(component, techLevels));
  }

  getAvailableHulls(
    techLevels: PlayerTech,
    primaryTraits: ReadonlyArray<PrimaryRacialTrait> | null = null,
    lesserTraits: ReadonlyArray<LesserRacialTrait> | null = null,
  ): Array<HullTemplate> {
    const constructionLevel = techLevels.Construction;
    return ALL_HULLS.filter((hull) => {
      // Check tech requirement
      if ((hull.techReq?.Construction ?? 0) > constructionLevel) return false;
      // Check racial trait requirements
      return this.meetsHullTraitRequirements(hull, primaryTraits, lesserTraits);
    });
  }

  normalizeSlot(hullSlot: HullTemplate['Slots'][number], slotId: string): NormalizedHullSlot {
    return {
      id: hullSlot.Code ?? slotId,
      allowedTypes: hullSlot.Allowed.map((type) => getSlotTypeForComponentType(type)) as Array<
        ReturnType<typeof getSlotTypeForComponentType>
      >,
      max: hullSlot.Max,
      required: hullSlot.Required,
      editable: hullSlot.Editable,
      size: typeof hullSlot.Size === 'number' ? hullSlot.Size : undefined,
    };
  }

  findHullSlotDefinition(hull: HullTemplate, slotId: string): HullTemplate['Slots'][number] | null {
    return hull.Slots.find((slot, index) => (slot.Code ?? `slot_${index}`) === slotId) ?? null;
  }

  private isComponentAllowed(
    component: ComponentStats,
    hull: HullTemplate,
    slot: NormalizedHullSlot,
    techLevels: PlayerTech,
    species: Species | null,
  ): boolean {
    return (
      this.meetsTechRequirement(component, techLevels) &&
      this.meetsTraitRequirements(component, species) &&
      this.meetsHullRestriction(component, hull) &&
      canInstallComponent(component, slot)
    );
  }

  private meetsTechRequirement(component: ComponentStats, techLevels: PlayerTech): boolean {
    const primaryField = getPrimaryTechField(component);
    const requiredLevel = getRequiredTechLevel(component);
    const playerLevel = techLevels[primaryField as keyof PlayerTech] ?? 0;
    return playerLevel >= requiredLevel;
  }

  private meetsTraitRequirements(component: ComponentStats, species: Species | null): boolean {
    if (!species) return true;
    if (!hasAll(species.primaryTraits, component.primaryRacialTraitRequired)) return false;
    if (!lacksAny(species.primaryTraits, component.primaryRacialTraitUnavailable)) return false;
    if (!hasAll(species.lesserTraits, component.lesserRacialTraitRequired)) return false;
    if (!lacksAny(species.lesserTraits, component.lesserRacialTraitUnavailable)) return false;
    return true;
  }

  private meetsHullRestriction(component: ComponentStats, hull: HullTemplate): boolean {
    const restrictions = component.hullRestrictions;
    if (!restrictions || restrictions.length === 0) return true;
    return restrictions.includes(hull.Name);
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
