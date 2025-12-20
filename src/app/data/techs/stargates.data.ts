import { ComponentStats } from '../tech-atlas.types';

export const STARGATE_COMPONENTS: ComponentStats[] = [
  {
    id: 'gate_std',
    name: 'Stargate 100/300',
    type: 'Stargate',
    tech: { Construction: 5, Propulsion: 5 },
    mass: 50,
    cost: { iron: 100, bor: 50, germ: 50, res: 500 },
    stats: { gateRange: 300, gateMass: 100 },
    img: 'gate-std',
    description: 'Standard jump gate. Safe for light ships.'
  },
  {
    id: 'gate_jump',
    name: 'Jump Gate',
    type: 'Stargate',
    tech: { Construction: 12, Propulsion: 9 },
    mass: 100,
    cost: { iron: 200, bor: 100, germ: 100, res: 1000 },
    stats: { gateRange: 800, gateMass: 250 },
    img: 'gate-jump',
    description: 'Extended range gate network.'
  },
  {
    id: 'gate_any',
    name: 'Anywhere Gate',
    type: 'Stargate',
    tech: { Construction: 22, Propulsion: 18 },
    mass: 500,
    cost: { iron: 500, bor: 500, germ: 500, res: 5000 },
    stats: { gateRange: 9999, gateMass: 9999 },
    img: 'gate-any',
    description: 'Wormhole generator. Unlimited range and mass.'
  }
];
