import { ComponentStats } from '../tech-atlas.types';

export const CARGO_COMPONENTS: ComponentStats[] = [
  {
    id: 'fixed_cargo_70',
    name: 'Cargo Bay (70kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { iron: 0, bor: 0, germ: 0, res: 0 },
    stats: { cap: 70 },
    img: 'icon-cargo-small',
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_200',
    name: 'Cargo Bay (200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { iron: 0, bor: 0, germ: 0, res: 0 },
    stats: { cap: 200 },
    img: 'icon-cargo-med',
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_1200',
    name: 'Cargo Bay (1200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { iron: 0, bor: 0, germ: 0, res: 0 },
    stats: { cap: 1200 },
    img: 'icon-cargo-large',
    description: 'Massive cargo hold.'
  }
];
