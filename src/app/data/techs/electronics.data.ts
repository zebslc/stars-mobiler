import { ComponentStats } from '../tech-atlas.types';

export const CLOAKING_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_transport_cloaking',
    name: 'Transport Cloaking',
    type: 'Cloak',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 2, boranium: 0, germanium: 2, resources: 500 },
    stats: { unarmedCloak: 0.75 },
    description: 'Cloaks unarmed hulls, reducing the range at which scanners detect it by up to 75%.',
    primaryRacialTraitRequired: ['Super Stealth'],
  },
  {
    id: 'elec_stealth_cloak',
    name: 'Stealth Cloak',
    type: 'Cloak',
    tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 2 },
    mass: 2,
    cost: { ironium: 2, boranium: 0, germanium: 2, resources: 960 },
    stats: { cloak: .35 },
    description: 'Cloaks any ship reducing the range at which scanners detect it by 35%.',
  },
  {
    id: 'elec_super_stealth_cloak',
    name: 'Super-Stealth Cloak',
    type: 'Cloak',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 3,
    cost: { ironium: 8, boranium: 0, germanium: 8, resources: 116920 },
    stats: { cloak: .55 },
    description: 'Cloaks any ship reducing the range at which scanners detect it by 55%.',
  },
  {
    id: 'elec_ultra_stealth_cloak',
    name: 'Ultra-Stealth Cloak',
    type: 'Cloak',
    tech: { Energy: 12, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 5,
    cost: { ironium: 10, boranium: 0, germanium: 10, resources: 150000 },
    stats: { cloak: 0.85 },
    description: ' Cloaks any ship reducing the range at which scanners detect it by 85%.',
    primaryRacialTraitRequired: ['Super Stealth'],
  },
];

export const COMPUTER_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_battle_computer',
    name: 'Battle Computer',
    type: 'Computer',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 15, resources: 6 },
    stats: { accuracy: 0.20, initiative: 1 },
    description: 'This module increases the accuracy of your torpedoes by 20% and increases initiative by 1. If an enemy ship has jammers the computer acts to offset their effects.',
  },
  {
    id: 'elec_battle_super_computer',
    name: 'Battle Super Computer',
    type: 'Computer',
    tech: { Energy: 11, Kinetics: 0, Propulsion: 0, Construction: 5 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 25, resources: 18630 },
    stats: { accuracy: 0.30, initiative: 2 },
    description: 'This module increases the accuracy of your torpedoes by 30% and increases initiative by 2. If an enemy ship has jammers the computer acts to offset their effects.',
  },
  {
    id: 'elec_battle_nexus',
    name: 'Battle Nexus',
    type: 'Computer',
    tech: { Energy: 19, Kinetics: 0, Propulsion: 0, Construction: 10 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 30, resources: 234000 },
    stats: { accuracy: 0.50, initiative: 3 },
    description: 'This module increases the accuracy of your torpedoes by 50% and increases initiative by 3. If an enemy ship has jammers the computer acts to offset their effects.',

  },
];

export const JAMMER_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_jammer_10',
    name: 'Jammer 10',
    type: 'Electrical',
    tech: { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 2, resources: 5000 },
    stats: { jamming: 0.10, deflectedShieldDamageReduction: 0.125 },
    description: 'Has a 10% chance of deflecting incoming torpedoes. Deflected torpedoes will still reduce shields (if any by 1/8 the damage value).',
    primaryRacialTraitRequired: ['Inner Strength'],
  },
  {
    id: 'elec_jammer_20',
    name: 'Jammer 20',
    type: 'Electrical',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 1,
    cost: { ironium: 1, boranium: 0, germanium: 5, resources: 11620 },
    stats: { jamming: 0.2, deflectedShieldDamageReduction: 0.125 },
    description: 'Has a 20% chance of deflecting incoming torpedoes. Deflected torpedoes will still reduce shields (if any by 1/8 the damage value).',
  },
  {
    id: 'elec_jammer_30',
    name: 'Jammer 30',
    type: 'Electrical',
    tech: { Energy: 16, Kinetics: 0, Propulsion: 0, Construction: 8 },
    mass: 1,
    cost: { ironium: 1, boranium: 0, germanium: 6, resources: 115000 },
    stats: { jamming: 0.3, deflectedShieldDamageReduction: 0.125 },
    description: 'Has a 30% chance of deflecting incoming torpedoes. Deflected torpedoes will still reduce shields (if any by 1/8 the damage value).',
  },
  {
    id: 'elec_jammer_50',
    name: 'Jammer 50',
    type: 'Electrical',
    tech: { Energy: 22, Kinetics: 0, Propulsion: 0, Construction: 16 },
    mass: 1,
    cost: { ironium: 2, boranium: 0, germanium: 7, resources: 200000 },
    stats: { jamming: 0.5, deflectedShieldDamageReduction: 0.125 },
    description: 'Has a 50% chance of deflecting incoming torpedoes. Deflected torpedoes will still reduce shields (if any by 1/8 the damage value).',
    primaryRacialTraitRequired: ['Inner Strength'],
  },
];

export const CAPACITOR_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_energy_capacitor',
    name: 'Energy Capacitor',
    type: 'Electrical',
    tech: { Energy: 7, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 8, resources: 3300 },
    stats: { energyBonus: 0.1 },
    description: 'Increases the damage done by all beam weapons on the ship by 10%.',
  },
  {
    id: 'elec_flux_capacitor',
    name: 'Flux Capacitor',
    type: 'Electrical',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 1,
    cost: { ironium: 0, boranium: 0, germanium: 8, resources: 15000 },
    stats: { energyBonus: 0.2 },
    description: 'Increases the damage done by all beam weapons on the ship by 20%.',
    primaryRacialTraitRequired: ['Hyper Expansion'],
  },
];

export const DAMPENER_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_energy_dampener',
    name: 'Energy Dampener',
    type: 'Electrical',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 8, Construction: 0 },
    mass: 2,
    cost: { ironium: 5, boranium: 10, germanium: 0, resources: 10000 },
    stats: { dampening: 1 },
    description: 'Slows all ships in combat by 1 square of movement.',
    primaryRacialTraitRequired: ['Space Demolition'],
  },
  {
    id: 'elec_tachyon_detector',
    name: 'Tachyon Detector',
    type: 'Electrical',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 0, Construction: 8 },
    mass: 1,
    cost: { ironium: 1, boranium: 5, germanium: 0, resources: 70 },
    stats: { detection: .5   },
    description: 'Reduces the effectiveness of other players cloaks by 5%.',
    primaryRacialTraitRequired: ['Inner Strength'],
  },
];

export const GENERATOR_COMPONENTS: ComponentStats[] = [
  {
    id: 'elec_anti_matter_generator',
    name: 'Anti-matter Generator',
    type: 'Electrical',
    tech: { Energy: 0, Kinetics: 12, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 8, boranium: 3, germanium: 3, resources: 10 },
    stats: { energyGen: 200 },
    description: 'Acts as a 200mg anti-matter fuel tank and generates 50mg of fuel every year',
    primaryRacialTraitRequired: ['Interstellar Traveler'],
  },
];

