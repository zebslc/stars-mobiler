// Legacy ships.data.ts - Compatibility layer for compiled ship designs
import { ALL_HULLS } from './tech-atlas.data';

// CompiledDesign interface - represents a fully compiled ship design with calculated stats
export interface CompiledDesign {
  id: string;
  name: string;
  image?: string;
  hullId: string;
  hullName: string;
  isStarbase?: boolean;
  type?: string;
  mass: number;
  cargoCapacity: number;
  fuelCapacity: number;
  fuelEfficiency: number;
  warpSpeed: number;
  idealWarp: number;
  armor: number;
  shields: number;
  initiative: number;
  firepower: number;
  colonistCapacity?: number;
  cost: {
    ironium: number;
    boranium: number;
    germanium: number;
    resources: number;
  };
  colonyModule: boolean;
  scannerRange: number;
  cloakedRange: number;
  components: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

// Sample compiled designs - these would normally be computed from player designs
// For now, creating basic designs from hulls for compatibility
const createBasicDesigns = (): { [key: string]: CompiledDesign } => {
  const designs: { [key: string]: CompiledDesign } = {};

  ALL_HULLS.forEach((hull, index) => {
    const designId = hull.id || hull.Name.toLowerCase().replace(/\s+/g, '_');

    designs[designId] = {
      id: designId,
      name: hull.Name,
      image: hull.id,
      hullId: designId,
      hullName: hull.Name,
      isStarbase: hull.isStarbase,
      type: hull.type,
      mass: hull.Stats.Mass,
      cargoCapacity: hull.Stats.Cargo || 0,
      fuelCapacity: hull.Stats['Max Fuel'] || 0,
      fuelEfficiency: 100, // Default fuel efficiency
      warpSpeed: 6, // Default warp speed
      idealWarp: 6, // Default ideal warp
      armor: hull.Stats.Armor || 0,
      shields: 0,
      initiative: hull.Stats.Initiative || 0,
      firepower: 0,
      colonistCapacity: hull.Name.toLowerCase().includes('colony') ? 25000 : undefined, // 25kT = 25,000 colonists
      cost: {
        ironium: hull.Cost.Ironium,
        boranium: hull.Cost.Boranium,
        germanium: hull.Cost.Germanium,
        resources: hull.Cost.Resources,
      },
      colonyModule:
        hull.Name.toLowerCase().includes('colony') || hull.Name.toLowerCase().includes('settler'),
      scannerRange: 0,
      cloakedRange: 0,
      components: [],
    };
  });

  // Add additional design entries for backward compatibility with tests
  // Scout design should be available as both 'hull-scout' and 'scout'
  if (designs['hull-scout']) {
    designs['scout'] = {
      ...designs['hull-scout'],
      id: 'scout',
      scannerRange: 50,
      components: [
        { id: 'scan_rhino', name: 'Rhino Scanner', quantity: 1 }
      ]
    };
  }

  // Starbase designs should be available with simpler names for mapping
  if (designs['hull-orbital-fort']) {
    designs['orbital_fort'] = { ...designs['hull-orbital-fort'], id: 'orbital_fort' };
  }
  if (designs['hull-space-dock']) {
    designs['space_dock'] = { ...designs['hull-space-dock'], id: 'space_dock' };
  }
  if (designs['hull-space-station']) {
    designs['space_station'] = { ...designs['hull-space-station'], id: 'space_station' };
  }
  if (designs['hull-ultra-station']) {
    designs['ultra_station'] = { ...designs['hull-ultra-station'], id: 'ultra_station' };
  }
  if (designs['hull-death-star']) {
    designs['death_star'] = { ...designs['hull-death-star'], id: 'death_star' };
  }

  return designs;
};

// Export compiled designs
export const COMPILED_DESIGNS = createBasicDesigns();

// Utility function to get design by ID
export function getDesign(designId: string): CompiledDesign {
  let design = COMPILED_DESIGNS[designId];

  if (!design) {
    // Try normalizing the ID to handle cases where name is passed as ID
    const normalizedId = designId.toLowerCase().replace(/[\s-]+/g, '_');
    design = COMPILED_DESIGNS[normalizedId];

    // Fallback for legacy starbase IDs (starbase1, starbase2, etc.)
    if (!design && normalizedId.startsWith('starbase')) {
      const match = normalizedId.match(/starbase_?(\d+)/);
      if (match) {
        const level = parseInt(match[1], 10);
        const starbaseMap: { [key: number]: string } = {
          1: 'orbital_fort',
          2: 'space_dock',
          3: 'space_station',
          4: 'ultra_station',
          5: 'death_star',
        };
        const mappedId = starbaseMap[level];
        if (mappedId) {
          design = COMPILED_DESIGNS[mappedId];
        }
      }
    }
  }

  if (!design) {
    // Only warn if this looks like a legacy design ID, not a user-created one
    if (!designId.startsWith('design_')) {
      console.warn(`Design not found: ${designId}`);
    }
    // Return a default design to prevent crashes
    return {
      id: designId,
      name: 'Unknown Design',
      hullId: 'unknown',
      hullName: 'Unknown Hull',
      mass: 100,
      cargoCapacity: 0,
      fuelCapacity: 100,
      fuelEfficiency: 100,
      warpSpeed: 6,
      idealWarp: 6,
      armor: 25,
      shields: 0,
      initiative: 0,
      firepower: 0,
      cost: { ironium: 10, boranium: 0, germanium: 10, resources: 25 },
      colonyModule: false,
      scannerRange: 0,
      cloakedRange: 0,
      components: [],
    };
  }
  return design;
}