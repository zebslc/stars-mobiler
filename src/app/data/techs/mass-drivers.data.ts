import { ComponentStats } from '../tech-atlas.types';

export const MASS_DRIVER_COMPONENTS: ComponentStats[] = [
  {
    id: 'driver_std',
    name: 'Mass Driver 5',
    type: 'Orbital',
    tech: { Construction: 3, Energy: 1 },
    mass: 50,
    cost: { ironium: 50, boranium: 20, germanium: 20, resources: 100 },
    stats: { driverSpeed: 5, driverCatch: 100 },
    img: 'driver-std',
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
    img: 'driver-super',
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
    img: 'driver-ultra',
    description: 'Launches mineral packets at Warp 11. The receiving planet must have a mass driver at least as capable or it will take damage.'
  }
];
