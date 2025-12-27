import { ComponentStats } from '../tech-atlas.types';

export const PLANETARY_SCANNER_COMPONENTS: ComponentStats[] = [
  {
    id: 'planet_viewer_50',
    name: 'Viewer 50',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 50 },
    img: 'planet-viewer-50',
    description: 'Basic planetary scanner.'
  },
  {
    id: 'planet_viewer_90',
    name: 'Viewer 90',
    type: 'Planetary',
    tech: { Energy: 1, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 90 },
    img: 'planet-viewer-90',
    description: 'Improved planetary scanner.'
  },
  {
    id: 'planet_scoper_150',
    name: 'Scoper 150',
    type: 'Planetary',
    tech: { Energy: 3, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 150 },
    img: 'planet-scoper-150',
    description: 'Long-range planetary scanner.'
  },
  {
    id: 'planet_scoper_220',
    name: 'Scoper 220',
    type: 'Planetary',
    tech: { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 220 },
    img: 'planet-scoper-220',
    description: 'Advanced planetary scanner.'
  },
  {
    id: 'planet_scoper_280',
    name: 'Scoper 280',
    type: 'Planetary',
    tech: { Energy: 8, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 280 },
    img: 'planet-scoper-280',
    description: 'High-resolution planetary scanner.'
  },
  {
    id: 'planet_snooper_320x',
    name: 'Snooper 320X',
    type: 'Planetary',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 3 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 320 },
    img: 'planet-snooper-320x',
    description: 'Enhanced penetration scanner.'
  },
  {
    id: 'planet_snooper_400x',
    name: 'Snooper 400X',
    type: 'Planetary',
    tech: { Energy: 13, Kinetics: 0, Propulsion: 0, Construction: 6 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 400 },
    img: 'planet-snooper-400x',
    description: 'Deep penetration scanner.'
  },
  {
    id: 'planet_snooper_500x',
    name: 'Snooper 500X',
    type: 'Planetary',
    tech: { Energy: 16, Kinetics: 0, Propulsion: 0, Construction: 7 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 500 },
    img: 'planet-snooper-500x',
    description: 'Ultra-deep planetary scanner.'
  },
  {
    id: 'planet_snooper_620x',
    name: 'Snooper 620X',
    type: 'Planetary',
    tech: { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 9 },
    mass: 0,
    cost: { iron: 10, bor: 10, germ: 70, res: 100 },
    stats: { scan: 620 },
    img: 'planet-snooper-620x',
    description: 'Maximum range planetary scanner.'
  }
];

export const PLANETARY_DEFENSE_COMPONENTS: ComponentStats[] = [
  {
    id: 'planet_sdi',
    name: 'SDI',
    type: 'Planetary',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 5, bor: 5, germ: 5, res: 15 },
    stats: { defense: 10 },
    img: 'planet-sdi',
    description: 'Strategic Defense Initiative.'
  },
  {
    id: 'planet_missile_battery',
    name: 'Missile Battery',
    type: 'Planetary',
    tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 5, bor: 5, germ: 5, res: 15 },
    stats: { defense: 20 },
    img: 'planet-missile-battery',
    description: 'Surface-to-space missile system.'
  },
  {
    id: 'planet_laser_battery',
    name: 'Laser Battery',
    type: 'Planetary',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 5, bor: 5, germ: 5, res: 15 },
    stats: { defense: 24 },
    img: 'planet-laser-battery',
    description: 'High-energy beam defense.'
  },
  {
    id: 'planet_shield',
    name: 'Planetary Shield',
    type: 'Planetary',
    tech: { Energy: 16, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 5, bor: 5, germ: 5, res: 15 },
    stats: { defense: 30 },
    img: 'planet-shield',
    description: 'Planetary energy barrier.'
  },
  {
    id: 'planet_neutron_shield',
    name: 'Neutron Shield',
    type: 'Planetary',
    tech: { Energy: 23, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 0,
    cost: { iron: 5, bor: 5, germ: 5, res: 15 },
    stats: { defense: 38 },
    img: 'planet-neutron-shield',
    description: 'Ultimate planetary defense.'
  }
];