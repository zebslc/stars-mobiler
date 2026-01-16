import type { ComponentStats } from '../tech-atlas.types';

export const ORBITAL_COMPONENTS: Array<ComponentStats> = [
  // Mass Drivers
  {
    id: 'driver_std',
    name: 'Mass Driver 5',
    type: 'Orbital',
    tech: { Construction: 3, Energy: 1 },
    mass: 50,
    cost: { ironium: 50, boranium: 20, germanium: 20, resources: 100 },
    stats: { driverSpeed: 5, driverCatch: 100 },
    description: 'Launches mineral packets at Warp 5. The receiving planet must have a mass driver or it will take damage.'
  },
  {
    id: 'driver_super',
    name: 'Super Driver 8',
    type: 'Orbital',
    tech: { Construction: 8, Energy: 4 },
    mass: 100,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 200 },
    stats: { driverSpeed: 8, driverCatch: 100 },
    description: 'Launches mineral packets at Warp 8. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'driver_ultra',
    name: 'Ultra Driver 11',
    type: 'Orbital',
    tech: { Construction: 15, Energy: 10 },
    mass: 200,
    cost: { ironium: 200, boranium: 100, germanium: 100, resources: 500 },
    stats: { driverSpeed: 11, driverCatch: 100 },
    description: 'Launches mineral packets at Warp 11. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },

  // Stargates
  {
    id: 'gate-std',
    name: 'Weight 100/250',
    type: 'Stargate',
    tech: { Construction: 5, Propulsion: 5 },
    mass: 50,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 500 },
    stats: { gateRange: 250, gateMass: 100 },
    description: 'Standard jump gate. Safe for light ships.'
  },
  {
    id: 'gate_weight',
    name: 'Weight Gate',
    type: 'Stargate',
    tech: { Construction: 5, Propulsion: 5 },
    mass: 50,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 500 },
    stats: { gateRange: 300, gateMass: 9999 },
    description: 'Standard jump gate. Safe for light ships.'
  },
  {
    id: 'gate_distance',
    name: 'Distance Gate',
    type: 'Stargate',
    tech: { Construction: 12, Propulsion: 9 },
    mass: 100,
    cost: { ironium: 200, boranium: 100, germanium: 100, resources: 1000 },
    stats: { gateRange: 9999, gateMass: 100 },
    description: 'Extended range gate network.'
  },
  {
    id: 'gate_any',
    name: 'Anywhere Gate',
    type: 'Stargate',
    tech: { Construction: 22, Propulsion: 18 },
    mass: 500,
    cost: { ironium: 500, boranium: 500, germanium: 500, resources: 5000 },
    stats: { gateRange: 9999, gateMass: 9999 },
    description: 'Wormhole generator. Unlimited range and mass.'
  },

  // Other Orbitals
  {
    id: 'space_dock',
    name: 'Space Dock',
    type: 'Orbital',
    tech: { Construction: 6 },
    mass: 150,
    cost: { ironium: 75, boranium: 75, germanium: 50, resources: 250 },
    stats: {},
    description: 'Increases ship construction speed by 25%.'
  }
];