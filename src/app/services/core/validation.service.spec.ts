import type { HullTemplate, ComponentStats } from '../../data/tech-atlas.types';
import type { SlotAssignment } from '../../models/game.model';
import { validateShipDesign } from './validation.service';

describe('validateShipDesign', () => {
  it('returns error when non-starbase hull has no propulsion trait', () => {
    const hull: HullTemplate = {
      id: 'test-hull',
      Name: 'Test Hull',
      mass: 100,
      techReq: {},
    } as any;

    const componentsById: Record<string, ComponentStats> = {};
    const assignments: Array<SlotAssignment> = [];

    const errors = validateShipDesign(hull, assignments, componentsById);

    expect(errors).toContain('Ship requires at least one engine');
  });

  it('returns no errors when hull is starbase', () => {
    const hull: HullTemplate = {
      id: 'starbase',
      Name: 'Starbase',
      mass: 100,
      techReq: {},
      isStarbase: true,
    } as any;

    const componentsById: Record<string, ComponentStats> = {};
    const assignments: Array<SlotAssignment> = [];

    const errors = validateShipDesign(hull, assignments, componentsById);

    expect(errors.length).toBe(0);
  });
});

