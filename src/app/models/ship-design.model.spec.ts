import { compileShipStats } from './ship-design.model';
import { SCANNER_COMPONENTS } from '../data/techs/scanners.data';
import type { HullTemplate } from '../data/tech-atlas.types';
import type { PlayerTech } from './game.model';

describe('ShipDesignModel', () => {
  it('should calculate scan range correctly for Rhino Scanner', () => {
    // Mock a Hull
    const mockHull: HullTemplate = {
      id: 'scout_hull',
      Name: 'Scout',
      Structure: [],
      Slots: [{ Code: 'S', Allowed: ['Scanner'], Max: 1 }],
      Cost: { Ironium: 0, Boranium: 0, Germanium: 0, Resources: 0 },
      Stats: { Mass: 1, 'Max Fuel': 0, Armor: 0, Cargo: 0, Initiative: 0 }
    };

    // Mock Tech
    const mockTech: PlayerTech = {
        Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0
    };

    // Find Rhino Scanner
    const rhinoScanner = SCANNER_COMPONENTS.find(c => c.id === 'scan_rhino');
    expect(rhinoScanner).toBeDefined();

    // Create components lookup
    const componentsLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c]));
    const techFieldLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, 'Energy']));
    const requiredLevelLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c.tech?.Energy || 0]));

    // Calculate Spec
    const spec = compileShipStats(mockHull, [{
      slotId: 'S',
      components: [{
        componentId: 'scan_rhino',
        count: 1
      }]
    }], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.scanRange).toBe(50);
  });

  it('should calculate cumulative scan range for multiple scanners', () => {
    // Mock a Hull
    const mockHull: HullTemplate = {
      id: 'scout_hull',
      Name: 'Scout',
      Structure: [],
      Slots: [{ Code: 'S', Allowed: ['Scanner'], Max: 2 }],
      Cost: { Ironium: 0, Boranium: 0, Germanium: 0, Resources: 0 },
      Stats: { Mass: 1, 'Max Fuel': 0, Armor: 0, Cargo: 0, Initiative: 0 }
    };

    // Mock Tech
    const mockTech: PlayerTech = {
        Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0
    };

    // Create components lookup
    const componentsLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c]));
    const techFieldLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, 'Energy']));
    const requiredLevelLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c.tech?.Energy || 0]));

    // 2 Rhino Scanners: (50^4 + 50^4)^0.25 = 59.46
    const spec = compileShipStats(mockHull, [{
      slotId: 'S',
      components: [{
        componentId: 'scan_rhino',
        count: 2
      }]
    }], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.scanRange).toBeCloseTo(59.46, 1);
  });
});
