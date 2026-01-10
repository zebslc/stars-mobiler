import { ComponentStats } from '../tech-atlas.types';

export const CARGO_COMPONENTS: ComponentStats[] = [
  {
    id: 'fixed_cargo_70',
    name: 'Cargo Bay (70kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 70 },
    img: 'icon-cargo-small.png',
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_200',
    name: 'Cargo Bay (200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 200 },
    img: 'icon-cargo-med.png',
    description: 'Standard cargo hold.'
  },
  {
    id: 'fixed_cargo_1200',
    name: 'Cargo Bay (1200kT)',
    type: 'Cargo',
    tech: { Construction: 0 },
    mass: 0,
    cost: { ironium: 0, boranium: 0, germanium: 0, resources: 0 },
    stats: { cap: 1200 },
    img: 'icon-cargo-large.png',
    description: 'Massive cargo hold.'
  }
];
