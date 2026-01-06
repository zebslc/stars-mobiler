import { ComponentStats } from '../tech-atlas.types';

export const STARGATE_COMPONENTS: ComponentStats[] = [
  {
    id: 'gate-std',
    name: 'Weight 100/250',
    type: 'Stargate',
    tech: { Construction: 5, Propulsion: 5 },
    mass: 50,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 500 },
    stats: { gateRange: 250, gateMass: 100 },
    img: 'gate-std',
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
    img: 'gate-weight',
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
    img: 'gate-jump',
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
    img: 'gate-any',
    description: 'Wormhole generator. Unlimited range and mass.'
  }
];
