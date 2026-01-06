import { ComponentStats } from '../tech-atlas.types';

export const WEAPON_COMPONENTS: ComponentStats[] = [
  // ========================================================================
  // BEAM WEAPONS
  // ========================================================================
  {
    id: 'weap_laser',
    name: 'Laser',
    type: 'Weapon',
    tech: { Energy: 0 },
    mass: 1,
    cost: { ironium: 0, boranium: 6, germanium: 0, resources: 5 },
    stats: { power: 10, range: 1, initiative: 1 },
    img: 'weap-laser',
    description: 'Standard beam weapon.'
  },
  {
    id: 'weap_xray',
    name: 'X-Ray Laser',
    type: 'Weapon',
    tech: { Energy: 2 },
    mass: 1,
    cost: { ironium: 0, boranium: 6, germanium: 0, resources: 6 },
    stats: { power: 16, range: 1, initiative: 1 },
    img: 'weap-xray',
    description: 'Higher frequency, better penetration.'
  },
  {
    id: 'weap_minigun',
    name: 'Mini Gun',
    type: 'Weapon',
    tech: { Energy: 4, Kinetics: 1 },
    mass: 2,
    cost: { ironium: 2, boranium: 10, germanium: 0, resources: 10 },
    stats: { power: 16, range: 1, initiative: 10 },
    img: 'weap-minigun',
    description: 'Rapid fire gatling laser.'
  },
  {
    id: 'weap_yakimora',
    name: 'Yakimora Phaser',
    type: 'Weapon',
    tech: { Energy: 5 },
    mass: 1,
    cost: { ironium: 0, boranium: 8, germanium: 0, resources: 12 },
    stats: { power: 26, range: 1, initiative: 2 },
    img: 'weap-yakimora',
    description: 'Compact phaser.'
  },
  {
    id: 'weap_disruptor',
    name: 'Disruptor',
    type: 'Weapon',
    tech: { Energy: 8 },
    mass: 2,
    cost: { ironium: 0, boranium: 16, germanium: 0, resources: 20 },
    stats: { power: 35, range: 2, initiative: 4 },
    img: 'weap-disruptor',
    description: 'Destabilized ion bolt.'
  },
  {
    id: 'weap_phasor',
    name: 'Phasor',
    type: 'Weapon',
    tech: { Energy: 12 },
    mass: 2,
    cost: { ironium: 0, boranium: 20, germanium: 0, resources: 25 },
    stats: { power: 120, range: 3, initiative: 7 },
    img: 'weap-phasor',
    description: 'Long range sniper beam.'
  },
  {
    id: 'weap_gatling',
    name: 'Gatling Gun',
    type: 'Weapon',
    tech: { Energy: 14, Kinetics: 6 },
    mass: 4,
    cost: { ironium: 10, boranium: 30, germanium: 0, resources: 40 },
    stats: { power: 31, range: 2, initiative: 12 },
    img: 'weap-gatling',
    description: 'The gold standard for sweeping mines.'
  },
  {
    id: 'weap_bigmutha',
    name: 'Big Mutha Cannon',
    type: 'Weapon',
    tech: { Energy: 22 },
    mass: 6,
    cost: { ironium: 0, boranium: 80, germanium: 20, resources: 150 },
    stats: { power: 204, range: 2, initiative: 9 },
    img: 'weap-big-mutha',
    description: 'Massive rapid-fire energy cannon.'
  },
  {
    id: 'weap_bludgeon',
    name: 'Bludgeon',
    type: 'Weapon',
    tech: { Energy: 10, Construction: 6 },
    mass: 15,
    cost: { ironium: 40, boranium: 10, germanium: 0, resources: 30 },
    stats: { power: 231, range: 0, initiative: 0 },
    img: 'weap-bludgeon',
    description: 'Ramming weapon. Devastating at point blank.'
  },

// TODO THIS IS MISSING THESE WEAPONS
//  "weap-blackjack", "weap-pulsed-sapper", "weap-colloidal-phaser", "weap-mini-blaster", "weap-mark-iv-blaster", "weap-phased-sapper", "weap-heavy-blaster", "weap-gatling-neutrino", "weap-myopic-disrupter", "weap-mega-disrupter", "weap-streaming-pulverizer", "weap-anti-matter-pulverizer", "weap-syncro-sapper"






  // ========================================================================
  // TORPEDOES
  // ========================================================================
  {
    id: 'weap_alpha',
    name: 'Alpha Torp',
    type: 'Weapon',
    tech: { Kinetics: 1 },
    mass: 25,
    cost: { ironium: 9, boranium: 3, germanium: 3, resources: 5 },
    stats: { power: 5, accuracy: 35, range: 4, initiative: 0 },
    img: 'weap-torp-alpha',
    description: 'Basic guided missile.'
  },
  {
    id: 'weap_beta',
    name: 'Beta Torp',
    type: 'Weapon',
    tech: { Kinetics: 5, Propulsion: 1 },
    mass: 25,
    cost: { ironium: 18, boranium: 6, germanium: 4, resources: 6 },
    stats: { power: 12, accuracy: 45, range: 4, initiative: 1 },
    img: 'weap-torp-beta',
    description: 'Improved guidance system.'
  },
  {
    id: 'weap_delta',
    name: 'Delta Torp',
    type: 'Weapon',
    tech: { Kinetics: 10, Propulsion: 2 },
    mass: 25,
    cost: { ironium: 22, boranium: 8, germanium: 5, resources: 8 },
    stats: { power: 26, accuracy: 60, range: 4, initiative: 1 },
    img: 'weap-torp-delta',
    description: 'Enhanced propulsion and warhead.'
  },
  {
    id: 'weap_epsilon',
    name: 'Epsilon Torp',
    type: 'Weapon',
    tech: { Kinetics: 14, Propulsion: 3 },
    mass: 25,
    cost: { ironium: 30, boranium: 10, germanium: 6, resources: 10 },
    stats: { power: 48, accuracy: 65, range: 5, initiative: 2 },
    img: 'weap-torp-epsilon',
    description: 'Long-range tactical missile.'
  },
  {
    id: 'weap_rho',
    name: 'Rho Torp',
    type: 'Weapon',
    tech: { Kinetics: 18, Propulsion: 4 },
    mass: 25,
    cost: { ironium: 34, boranium: 12, germanium: 8, resources: 12 },
    stats: { power: 90, accuracy: 75, range: 5, initiative: 2 },
    img: 'weap-torp-rho',
    description: 'Standard fleet torpedo.'
  },
  {
    id: 'weap_upsilon',
    name: 'Upsilon Torp',
    type: 'Weapon',
    tech: { Kinetics: 22, Propulsion: 5 },
    mass: 25,
    cost: { ironium: 40, boranium: 14, germanium: 9, resources: 15 },
    stats: { power: 169, accuracy: 75, range: 5, initiative: 3 },
    img: 'weap-torp-upsilon',
    description: 'Heavy strike missile.'
  },
  {
    id: 'weap_omega',
    name: 'Omega Torp',
    type: 'Weapon',
    tech: { Kinetics: 26, Propulsion: 6 },
    mass: 25,
    cost: { ironium: 52, boranium: 18, germanium: 12, resources: 18 },
    stats: { power: 316, accuracy: 80, range: 5, initiative: 4 },
    img: 'weap-torp-omega',
    description: 'The ultimate ballistic weapon.'
  },
  {
    id: 'weap_anti',
    name: 'Anti-Matter Torp',
    type: 'Weapon',
    tech: { Kinetics: 11, Propulsion: 12, Energy: 21 },
    mass: 8,
    cost: { ironium: 3, boranium: 8, germanium: 1, resources: 50 },
    stats: { power: 60, accuracy: 85, range: 6, initiative: 0 },
    img: 'weap-torp-anti',
    description: 'Exotic matter warhead.'
  },
  {
    id: 'weap_jihad',
    name: 'Jihad Missile',
    type: 'Weapon',
    tech: { Kinetics: 12, Propulsion: 6 },
    mass: 35,
    cost: { ironium: 37, boranium: 13, germanium: 9, resources: 13 },
    stats: { power: 85, accuracy: 20, range: 5, initiative: 0 },
    img: 'weap-missile-jihad',
    description: 'Dumb-fire heavy missile.'
  },
  {
    id: 'weap_juggernaut',
    name: 'Juggernaut Missile',
    type: 'Weapon',
    tech: { Kinetics: 16, Propulsion: 8 },
    mass: 35,
    cost: { ironium: 48, boranium: 16, germanium: 11, resources: 16 },
    stats: { power: 150, accuracy: 20, range: 5, initiative: 1 },
    img: 'weap-missile-juggernaut',
    description: 'Massive unguided rocket.'
  },
  {
    id: 'weap_doomsday',
    name: 'Doomsday Missile',
    type: 'Weapon',
    tech: { Kinetics: 20, Propulsion: 10 },
    mass: 35,
    cost: { ironium: 60, boranium: 20, germanium: 13, resources: 20 },
    stats: { power: 280, accuracy: 25, range: 6, initiative: 2 },
    img: 'weap-missile-doomsday',
    description: 'Devastating firepower, poor accuracy.'
  },
  {
    id: 'weap_armageddon',
    name: 'Armageddon Missile',
    type: 'Weapon',
    tech: { Kinetics: 24, Propulsion: 10 },
    mass: 35,
    cost: { ironium: 67, boranium: 23, germanium: 16, resources: 24 },
    stats: { power: 525, accuracy: 30, range: 6, initiative: 3 },
    img: 'weap-missile-armageddon',
    description: 'Ultimate barrage weapon.'
  }
];
