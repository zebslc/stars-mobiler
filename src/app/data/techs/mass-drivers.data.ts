import { ComponentStats } from '../tech-atlas.types';

export const MASS_DRIVER_COMPONENTS: ComponentStats[] = [
  {
    id: 'driver_std',
    name: 'Mass Driver 5',
    type: 'MassDriver',
    tech: { Kinetics: 3, Energy: 1 },
    mass: 50,
    cost: { iron: 50, bor: 20, germ: 20, res: 100 },
    stats: { driverSpeed: 5, driverCatch: 100 },
    img: 'driver-std',
    description: 'Launches mineral packets at Warp 5. The receiving planet must have a mass driver or it will take damage.'
  },
  {
    id: 'driver_super',
    name: 'Super Driver 8',
    type: 'MassDriver',
    tech: { Kinetics: 8, Energy: 4 },
    mass: 100,
    cost: { iron: 100, bor: 50, germ: 50, res: 200 },
    stats: { driverSpeed: 8, driverCatch: 100 },
    img: 'driver-super',
    description: 'Launches mineral packets at Warp 8. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'driver_ultra',
    name: 'Ultra Driver 11',
    type: 'MassDriver',
    tech: { Kinetics: 15, Energy: 10 },
    mass: 200,
    cost: { iron: 200, bor: 100, germ: 100, res: 500 },
    stats: { driverSpeed: 11, driverCatch: 100 },
    img: 'driver-ultra',
    description: 'Launches mineral packets at Warp 11.The receiving planet must have a mass driver at least as capable or it will take damage.''
  }
];
