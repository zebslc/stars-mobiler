import type { ComponentStats } from '../tech-atlas.types';

export const PLANETARY_SCANNER_COMPONENTS: Array<ComponentStats> = [
  {
    id: 'planet_viewer_50',
    name: 'Viewer 50',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 50 },    description: 'Basic planetary scanner.'
  },
  {
    id: 'planet_viewer_90',
    name: 'Viewer 90',
    type: 'Planetary',
    tech: { Energy: 1, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 90 },    description: 'Improved planetary scanner.'
  },
  {
    id: 'planet_scoper_150',
    name: 'Scoper 150',
    type: 'Planetary',
    tech: { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 150 },    description: 'Long-range planetary scanner.'
  },
  {
    id: 'planet_scoper_220',
    name: 'Scoper 220',
    type: 'Planetary',
    tech: { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 220 },    description: 'Advanced planetary scanner.'
  },
  {
    id: 'planet_scoper_280',
    name: 'Scoper 280',
    type: 'Planetary',
    tech: { Energy: 8, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 280 },    description: 'High-resolution planetary scanner.'
  },
  {
    id: 'planet_snooper_320x',
    name: 'Snooper 320X',
    type: 'Planetary',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 3 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 320 },    description: 'Enhanced penetration scanner.'
  },
  {
    id: 'planet_snooper_400x',
    name: 'Snooper 400X',
    type: 'Planetary',
    tech: { Energy: 13, Kinetics: 0, Propulsion: 0, Construction: 6 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 400 },    description: 'Deep penetration scanner.'
  },
  {
    id: 'planet_snooper_500x',
    name: 'Snooper 500X',
    type: 'Planetary',
    tech: { Energy: 16, Kinetics: 0, Propulsion: 0, Construction: 7 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 500 },    description: 'Ultra-deep planetary scanner.'
  },
  {
    id: 'planet_snooper_620x',
    name: 'Snooper 620X',
    type: 'Planetary',
    tech: { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 9 },
    mass: 0,
    cost: { ironium: 10, boranium: 10, germanium: 70, resources: 100 },
    stats: { scan: 620 },    description: 'Maximum range planetary scanner.'
  }
];

export const PLANETARY_DEFENSE_COMPONENTS: Array<ComponentStats> = [
  {
    id: 'planet_sdi',
    name: 'SDI',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 15 },
    stats: { defense: 10 },    description: 'Strategic Defense Initiative.'
  },
  {
    id: 'planet_missile_battery',
    name: 'Missile Battery',
    type: 'Planetary',
    tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 15 },
    stats: { defense: 20 },    description: 'Surface-to-space missile system.'
  },
  {
    id: 'planet_laser_battery',
    name: 'Laser Battery',
    type: 'Planetary',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 15 },
    stats: { defense: 24 },    description: 'High-energy beam defense.'
  },
  {
    id: 'planet_shield',
    name: 'Planetary Shield',
    type: 'Planetary',
    tech: { Energy: 16, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 15 },
    stats: { defense: 30 },    description: 'Planetary energy barrier.'
  },
  {
    id: 'planet_neutron_shield',
    name: 'Neutron Shield',
    type: 'Planetary',
    tech: { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 15 },
    stats: { defense: 38 },    description: 'Ultimate planetary defense.'
  }
,
  {
    id: 'plan_laser_battery',
    name: 'Plan Laser Battery',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_missile_battery',
    name: 'Plan Missile Battery',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_neutron_shield',
    name: 'Plan Neutron Shield',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_planetary_shield',
    name: 'Plan Planetary Shield',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_scoper_150',
    name: 'Plan Scoper 150',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_scoper_220',
    name: 'Plan Scoper 220',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_scoper_280',
    name: 'Plan Scoper 280',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_sdi',
    name: 'Plan Sdi',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_snooper_320x',
    name: 'Plan Snooper 320x',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_snooper_400x',
    name: 'Plan Snooper 400x',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_snooper_500x',
    name: 'Plan Snooper 500x',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_snooper_620x',
    name: 'Plan Snooper 620x',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_viewer_50',
    name: 'Plan Viewer 50',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  },
  {
    id: 'plan_viewer_90',
    name: 'Plan Viewer 90',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 5, resources: 10 },
    stats: {},
    description: 'TODO: Component needs proper configuration.'
  }
];