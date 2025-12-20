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
    id: 'weap_disrupt',
    name: 'Disruptor',
    type: 'Weapon',
    tech: { Energy: 8 },
    mass: 2,
    cost: { iron: 0, bor: 16, germ: 0, res: 20 },
    stats: { power: 35, range: 2, initiative: 4 },
    img: 'weap-disrupt',
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
    stats: { power: 12, accuracy: 65, range: 4 },
    img: 'weap-torp-alpha',
    description: 'Basic guided missile.'
  },
  {
    id: 'weap_rho',
    name: 'Rho Torp',
    type: 'Weapon',
    tech: { Kinetics: 5 },
    mass: 25,
    cost: { iron: 15, bor: 5, germ: 5, res: 15 },
    stats: { power: 50, accuracy: 85, range: 5 },
    img: 'weap-torp-rho',
    description: 'Standard fleet torpedo.'
  },
  {
    id: 'weap_anti',
    name: 'Anti-Matter Torp',
    type: 'Weapon',
    tech: { Kinetics: 14, Energy: 4 },
    mass: 8,
    cost: { iron: 3, bor: 8, germ: 1, res: 50 },
    stats: { power: 150, accuracy: 90, range: 6 },
    img: 'weap-torp-anti',
    description: 'Heavy antimatter warhead.'
  },
  {
    id: 'weap_omega',
    name: 'Omega Torp',
    type: 'Weapon',
    tech: { Kinetics: 20, Energy: 10 },
    mass: 12,
    cost: { iron: 5, bor: 15, germ: 5, res: 100 },
    stats: { power: 300, accuracy: 95, range: 7 },
    img: 'weap-torp-omega',
    description: 'The ultimate ballistic weapon.'
  }
];
