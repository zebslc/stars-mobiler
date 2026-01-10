import { HullTemplate, ComponentStats } from '../data/tech-atlas.types';
import { SlotAssignment } from '../models/game.model';
import { TraitType, ValidationRule } from '../data/tech-atlas.types';

type InstalledComponent = {
  component: ComponentStats;
  count: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getNumberParam = (params: unknown, key: string): number | undefined => {
  if (!isRecord(params)) return undefined;
  const value = params[key];
  return typeof value === 'number' ? value : undefined;
};

const getStringArrayParam = (params: unknown, key: string): string[] | undefined => {
  if (!isRecord(params)) return undefined;
  const value = params[key];
  if (!Array.isArray(value)) return undefined;
  if (!value.every((v) => typeof v === 'string')) return undefined;
  return value;
};

const getTraitParam = (params: unknown): TraitType | undefined => {
  if (!isRecord(params)) return undefined;
  const value = params['trait'] ?? params['traitType'];
  return typeof value === 'string' ? (value as TraitType) : undefined;
};

const hasTrait = (installed: InstalledComponent[], trait: TraitType): boolean =>
  installed.some(({ component }) => component.traits?.some((t) => t.type === trait));

const getInstalledComponents = (
  assignments: SlotAssignment[],
  componentsById: Record<string, ComponentStats>,
): InstalledComponent[] => {
  const counts = new Map<string, number>();

  for (const slot of assignments) {
    for (const assignment of slot.components ?? []) {
      counts.set(
        assignment.componentId,
        (counts.get(assignment.componentId) ?? 0) + assignment.count,
      );
    }
  }

  const installed: InstalledComponent[] = [];
  for (const [id, count] of counts.entries()) {
    const component = componentsById[id];
    if (component) {
      installed.push({ component, count });
    }
  }

  return installed;
};

const validateRule = (
  rule: ValidationRule,
  subject: InstalledComponent,
  installed: InstalledComponent[],
  hull: HullTemplate,
): string | null => {
  switch (rule.type) {
    case 'max_per_hull': {
      const max = getNumberParam(rule.params, 'max') ?? getNumberParam(rule.params, 'maxPerHull');
      if (typeof max === 'number' && subject.count > max) return rule.errorMessage;
      return null;
    }
    case 'exclusive_to_hull_type': {
      const allowed = getStringArrayParam(rule.params, 'hullTypes');
      if (!allowed || allowed.length === 0) return null;
      const hullType = hull.type ?? '';
      const hullName = hull.Name;
      if (!allowed.includes(hullType) && !allowed.includes(hullName)) return rule.errorMessage;
      return null;
    }
    case 'requires_trait': {
      const trait = getTraitParam(rule.params);
      if (!trait) return null;
      if (!hasTrait(installed, trait)) return rule.errorMessage;
      return null;
    }
    case 'mutually_exclusive': {
      const componentIds = getStringArrayParam(rule.params, 'componentIds') ?? [];
      if (componentIds.length) {
        const forbiddenInstalled = installed.some(({ component }) => componentIds.includes(component.id));
        if (forbiddenInstalled) return rule.errorMessage;
      }

      const traitTypes = (getStringArrayParam(rule.params, 'traitTypes') ?? []).filter(
        (t): t is TraitType => typeof t === 'string',
      ) as TraitType[];
      if (traitTypes.length) {
        const forbiddenTraitInstalled = installed.some(({ component }) =>
          component.traits?.some((t) => traitTypes.includes(t.type)),
        );
        if (forbiddenTraitInstalled) return rule.errorMessage;
      }

      return null;
    }
  }
  
  // Default case: unknown rule type
  return null;
};

export function validateShipDesign(
  hull: HullTemplate,
  assignments: SlotAssignment[],
  componentsById: Record<string, ComponentStats>,
): string[] {
  const errors: string[] = [];
  const installed = getInstalledComponents(assignments, componentsById);

  const isStarbase = !!hull.isStarbase;
  if (!isStarbase && !hasTrait(installed, 'propulsion')) {
    errors.push('Ship requires at least one engine');
  }

  for (const subject of installed) {
    for (const rule of subject.component.constraints ?? []) {
      const error = validateRule(rule, subject, installed, hull);
      if (error) errors.push(error);
    }
  }

  return errors;
}

