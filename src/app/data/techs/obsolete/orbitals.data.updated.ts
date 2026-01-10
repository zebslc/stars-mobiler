import { ComponentStats } from '../tech-atlas.types';

export const ORBITAL_COMPONENTS: ComponentStats[] = [
  // ========================================================================
  // STARBASE COMPONENTS
  // ========================================================================
  {
    id: 'orb_dock',
    name: 'Space Dock',
    type: 'Orbital',
    tech: { Construction: 2 },
    mass: 0,
    cost: { ironium: 50, boranium: 0, germanium: 50, resources: 100 },
    stats: { cap: 0 },
    img: 'orb_dock.png',
    description: 'Allows starbase to repair ships.'
  },
  {
    id: 'orb_sensor',
    name: 'Orbital Sensor',
    type: 'Orbital',
    tech: { Energy: 3 },
    mass: 0,
    cost: { ironium: 10, boranium: 0, germanium: 20, resources: 50 },
    stats: { scan: 200 },
    img: 'orb_sensor.png',
    description: 'Extends planetary sensor range.'
  },
  {
    id: 'orb_shield',
    name: 'Orbital Shielding',
    type: 'Orbital',
    tech: { Energy: 6, Construction: 4 },
    mass: 0,
    cost: { ironium: 20, boranium: 20, germanium: 20, resources: 80 },
    stats: { shield: 500, armor: 500 },
    img: 'orb_shield.png',
    description: 'Reinforced structure for starbases.'
  },

  // ========================================================================
  // MASS DRIVERS
  // ========================================================================
  {
    id: 'orb_mass_driver_5',
    name: 'Mass Driver 5',
    type: 'Orbital',
    tech: { Construction: 3, Energy: 1 },
    mass: 50,
    cost: { ironium: 50, boranium: 20, germanium: 20, resources: 100 },
    stats: { driverSpeed: 5, driverCatch: 100 },
    img: 'orb_mass_driver_5.png',
    description: 'Launches mineral packets at Warp 5. The receiving planet must have a mass driver or it will take damage.'
  },
  {
    id: 'orb_mass_driver_6',
    name: 'Mass Driver 6',
    type: 'Orbital',
    tech: { Construction: 5, Energy: 2 },
    mass: 60,
    cost: { ironium: 60, boranium: 25, germanium: 25, resources: 120 },
    stats: { driverSpeed: 6, driverCatch: 100 },
    img: 'orb_mass_driver_6.png',
    description: 'Launches mineral packets at Warp 6. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_mass_driver_7',
    name: 'Mass Driver 7',
    type: 'Orbital',
    tech: { Construction: 7, Energy: 3 },
    mass: 70,
    cost: { ironium: 70, boranium: 30, germanium: 30, resources: 140 },
    stats: { driverSpeed: 7, driverCatch: 100 },
    img: 'orb_mass_driver_7.png',
    description: 'Launches mineral packets at Warp 7. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_super_driver_8',
    name: 'Super Driver 8',
    type: 'Orbital',
    tech: { Construction: 8, Energy: 4 },
    mass: 100,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 200 },
    stats: { driverSpeed: 8, driverCatch: 100 },
    img: 'orb_super_driver_8.png',
    description: 'Launches mineral packets at Warp 8. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_super_driver_9',
    name: 'Super Driver 9',
    type: 'Orbital',
    tech: { Construction: 10, Energy: 5 },
    mass: 110,
    cost: { ironium: 110, boranium: 55, germanium: 55, resources: 220 },
    stats: { driverSpeed: 9, driverCatch: 100 },
    img: 'orb_super_driver_9.png',
    description: 'Launches mineral packets at Warp 9. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_ultra_driver_10',
    name: 'Ultra Driver 10',
    type: 'Orbital',
    tech: { Construction: 12, Energy: 7 },
    mass: 150,
    cost: { ironium: 150, boranium: 75, germanium: 75, resources: 300 },
    stats: { driverSpeed: 10, driverCatch: 100 },
    img: 'orb_ultra_driver_10.png',
    description: 'Launches mineral packets at Warp 10. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_ultra_driver_11',
    name: 'Ultra Driver 11',
    type: 'Orbital',
    tech: { Construction: 15, Energy: 10 },
    mass: 200,
    cost: { ironium: 200, boranium: 100, germanium: 100, resources: 500 },
    stats: { driverSpeed: 11, driverCatch: 100 },
    img: 'orb_ultra_driver_11.png',
    description: 'Launches mineral packets at Warp 11. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_ultra_driver_12',
    name: 'Ultra Driver 12',
    type: 'Orbital',
    tech: { Construction: 17, Energy: 12 },
    mass: 220,
    cost: { ironium: 220, boranium: 110, germanium: 110, resources: 550 },
    stats: { driverSpeed: 12, driverCatch: 100 },
    img: 'orb_ultra_driver_12.png',
    description: 'Launches mineral packets at Warp 12. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },
  {
    id: 'orb_ultra_driver_13',
    name: 'Ultra Driver 13',
    type: 'Orbital',
    tech: { Construction: 20, Energy: 15 },
    mass: 250,
    cost: { ironium: 250, boranium: 125, germanium: 125, resources: 600 },
    stats: { driverSpeed: 13, driverCatch: 100 },
    img: 'orb_ultra_driver_13.png',
    description: 'Launches mineral packets at Warp 13. The receiving planet must have a mass driver at least as capable or it will take damage.'
  },

  // ========================================================================
  // STARGATES
  // ========================================================================
  {
    id: 'orb_stargate_100_250',
    name: 'Stargate 100/250',
    type: 'Stargate',
    tech: { Construction: 5, Propulsion: 5 },
    mass: 50,
    cost: { ironium: 100, boranium: 50, germanium: 50, resources: 500 },
    stats: { gateRange: 250, gateMass: 100 },
    img: 'orb_stargate_100_250.png',
    description: 'Standard jump gate. Safe for light ships up to 100kT at 250ly range.'
  },
  {
    id: 'orb_stargate_any_300',
    name: 'Stargate Any/300',
    type: 'Stargate',
    tech: { Construction: 9, Propulsion: 6 },
    mass: 100,
    cost: { ironium: 150, boranium: 75, germanium: 75, resources: 700 },
    stats: { gateRange: 300, gateMass: 9999 },
    img: 'orb_stargate_any_300.png',
    description: 'Heavy-duty gate. Handles any mass at 300ly range.'
  },
  {
    id: 'orb_stargate_100_any',
    name: 'Stargate 100/Any',
    type: 'Stargate',
    tech: { Construction: 9, Propulsion: 11 },
    mass: 100,
    cost: { ironium: 150, boranium: 75, germanium: 75, resources: 700 },
    stats: { gateRange: 9999, gateMass: 100 },
    img: 'orb_stargate_100_any.png',
    description: 'Extended range gate. Light ships (100kT) can jump unlimited distance.'
  },
  {
    id: 'orb_stargate_150_600',
    name: 'Stargate 150/600',
    type: 'Stargate',
    tech: { Construction: 12, Propulsion: 9 },
    mass: 120,
    cost: { ironium: 200, boranium: 100, germanium: 100, resources: 1000 },
    stats: { gateRange: 600, gateMass: 150 },
    img: 'orb_stargate_150_600.png',
    description: 'Medium-class gate network. Ships up to 150kT at 600ly range.'
  },
  {
    id: 'orb_stargate_300_500',
    name: 'Stargate 300/500',
    type: 'Stargate',
    tech: { Construction: 15, Propulsion: 12 },
    mass: 150,
    cost: { ironium: 250, boranium: 125, germanium: 125, resources: 1200 },
    stats: { gateRange: 500, gateMass: 300 },
    img: 'orb_stargate_300_500.png',
    description: 'Heavy-class gate. Ships up to 300kT at 500ly range.'
  },
  {
    id: 'orb_stargate_any_800',
    name: 'Stargate Any/800',
    type: 'Stargate',
    tech: { Construction: 18, Propulsion: 15 },
    mass: 200,
    cost: { ironium: 300, boranium: 150, germanium: 150, resources: 1500 },
    stats: { gateRange: 800, gateMass: 9999 },
    img: 'orb_stargate_any_800.png',
    description: 'Super heavy gate. Unlimited mass at 800ly range.'
  },
  {
    id: 'orb_stargate_any_any',
    name: 'Stargate Any/Any',
    type: 'Stargate',
    tech: { Construction: 22, Propulsion: 18 },
    mass: 500,
    cost: { ironium: 500, boranium: 500, germanium: 500, resources: 5000 },
    stats: { gateRange: 9999, gateMass: 9999 },
    img: 'orb_stargate_any_any.png',
    description: 'Ultimate wormhole generator. Unlimited range and mass.'
  }
];
