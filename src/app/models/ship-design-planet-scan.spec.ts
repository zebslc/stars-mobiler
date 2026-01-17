import { compileShipStats } from './ship-design.model';
import { SCANNER_COMPONENTS } from '../data/techs/scanners.data';
import type { HullTemplate } from '../data/tech-atlas.types';
import type { PlayerTech } from './game.model';

describe('ShipDesignModel Planet Scan', () => {
  const mockHull: HullTemplate = {
    id: 'scout_hull',
    Name: 'Scout',
    Structure: [],
    Slots: [{ Code: 'S', Allowed: ['Scanner'], Max: 1 }],
    Cost: { Ironium: 0, Boranium: 0, Germanium: 0, Resources: 0 },
    Stats: { Mass: 1, 'Max Fuel': 0, Armor: 0, Cargo: 0, Initiative: 0 }
  };

  const mockTech: PlayerTech = {
    Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0
  };

  const componentsLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c]));
  const techFieldLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, 'Energy']));
  const requiredLevelLookup = Object.fromEntries(SCANNER_COMPONENTS.map(c => [c.id, c.tech?.Energy || 0]));

  it('Rhino Scanner should have fleet range 50 and planet range 0', () => {
    const spec = compileShipStats(mockHull, [{
      slotId: 'S',
      components: [{
        componentId: 'scan_rhino',
        count: 1
      }]
    }], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.scanRange).toBe(50);
    expect(spec.planetScanRange).toBe(0);
  });

  it('Bat Scanner should have fleet range 0 and planet range 0', () => {
    const spec = compileShipStats(mockHull, [{
      slotId: 'S',
      components: [{
        componentId: 'scan_bat_scanner',
        count: 1
      }]
    }], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.scanRange).toBe(0);
    expect(spec.planetScanRange).toBe(0);
  });

  it('Chameleon Scanner should have fleet range 160 and planet range 45', () => {
    const spec = compileShipStats(mockHull, [{
      slotId: 'S',
      components: [{
        componentId: 'scan_chameleon_scanner',
        count: 1
      }]
    }], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.scanRange).toBe(160);
    expect(spec.planetScanRange).toBe(45);
  });

  it('No Scanner should have planet range -1', () => {
    const spec = compileShipStats(mockHull, [], mockTech, componentsLookup, techFieldLookup, requiredLevelLookup);

    expect(spec.planetScanRange).toBe(-1);
  });
});
