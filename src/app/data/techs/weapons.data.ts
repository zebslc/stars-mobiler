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
    cost: { iron: 0, bor: 6, germ: 0, res: 5 },
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
    cost: { iron: 0, bor: 6, germ: 0, res: 6 },
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
    cost: { iron: 2, bor: 10, germ: 0, res: 10 },
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
    cost: { iron: 0, bor: 8, germ: 0, res: 12 },
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
    cost: { iron: 0, bor: 16, germ: 0, res: 20 },
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
    cost: { iron: 0, bor: 20, germ: 0, res: 25 },
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
    cost: { iron: 10, bor: 30, germ: 0, res: 40 },
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
    cost: { iron: 0, bor: 80, germ: 20, res: 150 },
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
    cost: { iron: 40, bor: 10, germ: 0, res: 30 },
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
    cost: { iron: 9, bor: 3, germ: 3, res: 5 },
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
    cost: { iron: 18, bor: 6, germ: 4, res: 6 },
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
    cost: { iron: 22, bor: 8, germ: 5, res: 8 },
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
    cost: { iron: 30, bor: 10, germ: 6, res: 10 },
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
    cost: { iron: 34, bor: 12, germ: 8, res: 12 },
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
    cost: { iron: 40, bor: 14, germ: 9, res: 15 },
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
    cost: { iron: 52, bor: 18, germ: 12, res: 18 },
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
    cost: { iron: 3, bor: 8, germ: 1, res: 50 },
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
    cost: { iron: 37, bor: 13, germ: 9, res: 13 },
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
    cost: { iron: 48, bor: 16, germ: 11, res: 16 },
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
    cost: { iron: 60, bor: 20, germ: 13, res: 20 },
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
    cost: { iron: 67, bor: 23, germ: 16, res: 24 },
    stats: { power: 525, accuracy: 30, range: 6, initiative: 3 },
    img: 'weap-missile-armageddon',
    description: 'Ultimate barrage weapon.'
  }
];
