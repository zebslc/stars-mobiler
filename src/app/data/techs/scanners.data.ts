// # Scanners
// | Name                 | Energy | Weapons | Propulsion | Construction | Electronics | Bio-Tech | Mass | Resources | Ironium | Boranium | Germanium | Range |
// |----------------------|--------|---------|------------|--------------|-------------|----------|------|-----------|---------|----------|-----------|-------|
// | Bat Scanner          | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | | 1 | 0 | 1 | 0 |
// | Rhino Scanner        | 0 | 0 | 0 | 0 | 1 | 0 | 5 | 3 | 3 | 0 | 2 | 50 |
// | Mole Scanner         | 0 | 0 | 0 | 0 | 4 | 0 | 2 | 9 | 2 | 0 | 2 | 100 |
// | DNA Scanner          | 0 | 0 | 3 | 0 | 0 | 6 | 2 | 5 | 1 | 1 | 1 | 125 |
// | Possum Scanner       | 0 | 0 | 0 | 0 | 5 | 0 | 3 | 18 | 3 | 0 | 3 | 150 |
// | Pick Pocket Scanner  | 4 | 0 | 0 | 0 | 4 | 4 | 15 | 35 | 8 | 10 | 6 | 80 |
// | Chameleon Scanner    | 3 | 0 | 0 | 0 | 6 | 0 | 6 | 25 | 4 | 6 | 4 | 160 |
// | Ferret Scanner       | 3 | 0 | 0 | 0 | 7 | 2 | 2 | 36 | 2 | 0 | 8 | 185 |
// | Dolphin Scanner      | 5 | 0 | 0 | 0 | 10 | 4 | 4 | 40 | 5 | 5 | 10 | 220 |
// | Gazelle Scanner      | 4 | 0 | 0 | 0 | 8 | 0 | 5 | 24 | 4 | 0 | 5 | 225 |
// | RNA Scanner          | 0 | 0 | 5 | 0 | 0 | 10 | 2 | 20 | 1 | 1 | 2 | 230 |
// | Cheetah Scanner      | 5 | 0 | 0 | 0 | 11 | 0 | 4 | 50 | 3 | 1 | 13 | 275 |
// | Elephant Scanner     | 6 | 0 | 0 | 0 | 16 | 7 | 6 | 70 | 8 | 5 | 14 | 300 |
// | Eagle Eye Scanner    | 6 | 0 | 0 | 0 | 14 | 0 | 3 | 64 | 3 | 2 | 21 | 335 |
// | Robber Baron Scanner | 10 | 0 | 0 | 0 | 15 | 10 | 20 | 90 | 10 | 10 | 10 | 220 |
// | Peerless Scanner     | 7 | 0 | 0 | 0 | 24 | 0 | 4 | 90 | 3 | 2 | 30 | 500 |

import { ComponentStats } from '../tech-atlas.types';

export const SCANNER_COMPONENTS: ComponentStats[] = [
  {
    id: 'scan_bat_scanner',
    name: 'Bat Scanner',
    type: 'Scanner',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 2,
    cost: { ironium: 1, boranium: 0, germanium: 1, resources: 1 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 0, pen: 0 },
    description:
      'Enemy fleets cannot be detected by this scanner unless they are at the same location as the scanner. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_rhino',
    name: 'Rhino Scanner',
    type: 'Scanner',
    tech: { Energy: 1, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 3, boranium: 0, germanium: 0, resources: 5 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 50, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 50 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_mole',
    name: 'Mole Scanner',
    type: 'Scanner',
    tech: { Energy: 4, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 2,
    cost: { ironium: 2, boranium: 0, germanium: 2, resources: 410 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 100, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 100 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_dna_scanner',
    name: 'Dna Scanner',
    type: 'Scanner',
    tech: { Energy: 3, Kinetics: 0, Propulsion: 6, Construction: 0 },
    mass: 2,
    cost: { ironium: 1, boranium: 1, germanium: 1, resources: 1730 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 125, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 125 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_possum',
    name: 'Possum Scanner',
    type: 'Scanner',
    tech: { Energy: 5, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 3,
    cost: { ironium: 3, boranium: 0, germanium: 3, resources: 960 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 150, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 125 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_pick_pocket_scanner',
    name: 'Pick Pocket Scanner',
    type: 'Scanner',
    tech: { Energy: 4, Kinetics: 4, Propulsion: 4, Construction: 0 },
    mass: 15,
    cost: { ironium: 8, boranium: 10, germanium: 6, resources: 1500 },
    stats: { planetScanDistance: -1, enemyFleetScanDistance: 80, pen: 0, cargoSteal: true },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 80 light years away. This scanner is capable of penetrating the defences of enemy fleets allowing you to steal the cargo.',
    primaryRacialTraitRequired: 'Super Stealth',
  },
  {
    id: 'scan_chameleon_scanner',
    name: 'Chameleon Scanner',
    type: 'Scanner',
    tech: { Energy: 6, Kinetics: 0, Propulsion: 0, Construction: 3 },
    mass: 5,
    cost: { ironium: 4, boranium: 6, germanium: 4, resources: 2200 },
    stats: { planetScanDistance: 45, enemyFleetScanDistance: 160, pen: 0, cloak: 20 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 160 light years away. This scanner is can determine a planets basic stats from a distance of 45 light years. It also decreases the range at which enemy ships can see the ship by 20%.',
    primaryRacialTraitRequired: 'Super Stealth',
  },
  {
    id: 'scan_ferret_scanner',
    name: 'Ferret Scanner',
    type: 'Scanner',
    tech: { Energy: 3, Kinetics: 7, Propulsion: 2, Construction: 0 },
    mass: 2,
    cost: { ironium: 2, boranium: 0, germanium: 8, resources: 2850 },
    stats: { planetScanDistance: 50, enemyFleetScanDistance: 185, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 160 light years away. This scanner is can determine a planets basic stats from a distance of 45 light years. It also decreases the range at which enemy ships can see the ship by 20%.',
    lesserRacialTraitUnavailable: 'No Advanced Sensors',
  },
  {
    id: 'scan_dolphin_scanner',
    name: 'Dolphin Scanner',
    type: 'Scanner',
    tech: { Energy: 10, Kinetics: 0, Propulsion: 5, Construction: 4 },
    mass: 10,
    cost: { ironium: 5, boranium: 5, germanium: 10, resources: 12740 },
    stats: { planetScanDistance: 100, enemyFleetScanDistance: 220, pen: 100 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 220 light years away. This scanner is can determine a planets basic stats from a distance of 100 light years. The scanner will also spot enemy fleets attempting to hide behind planets within that range',
    lesserRacialTraitUnavailable: 'No Advanced Sensors',
  },
  {
    id: 'scan_gazelle_scanner',
    name: 'Gazelle Scanner',
    type: 'Scanner',
    tech: { Energy: 8, Kinetics: 0, Propulsion: 0, Construction: 4 },
    mass: 5,
    cost: { ironium: 4, boranium: 0, germanium: 5, resources: 4990 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 225, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 225 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_rna_scanner',
    name: 'Rna Scanner',
    type: 'Scanner',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 5, Construction: 10 },
    mass: 2,
    cost: { ironium: 1, boranium: 1, germanium: 2, resources: 12240 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 230, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 230 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_cheetah_scanner',
    name: 'Cheetah Scanner',
    type: 'Scanner',
    tech: { Energy: 11, Kinetics: 0, Propulsion: 0, Construction: 5 },
    mass: 4,
    cost: { ironium: 3, boranium: 1, germanium: 13, resources: 18630 },
    stats: { planetScanDistance: 0, scan: 275, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 275 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_elephant_scanner',
    name: 'Elephant Scanner',
    type: 'Scanner',
    tech: { Energy: 16, Kinetics: 6, Propulsion: 0, Construction: 7 },
    mass: 6,
    cost: { ironium: 8, boranium: 5, germanium: 14, resources: 116000 },
    stats: { planetScanDistance: 200, enemyFleetScanDistance: 300, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 300 light years away. This scanner is capable of determining a planets environment and composition from a distance of up to 200 light years. The scanner will also spot enemy fleets attempting to hide behind planets within range.',
    lesserRacialTraitUnavailable: 'No Advanced Sensors',
  },
  {
    id: 'scan_eagle_eye_scanner',
    name: 'Eagle Eye Scanner',
    type: 'Scanner',
    tech: { Energy: 14, Kinetics: 0, Propulsion: 6, Construction: 0 },
    mass: 3,
    cost: { ironium: 3, boranium: 2, germanium: 21, resources: 62200 },
    stats: { planetScanDistance: 0, scan: 335, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 335 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
  {
    id: 'scan_robber_baron_scanner',
    name: 'Robber Baron Scanner',
    type: 'Scanner',
    tech: { Energy: 15, Kinetics: 0, Propulsion: 10, Construction: 10 },
    mass: 20,
    cost: { ironium: 10, boranium: 10, germanium: 10, resources: 99999 },
    stats: { planetScanDistance: 120, enemyFleetScanDistance: 220, pen: 0, cargoSteal: true },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 220 light years away. This scanner can determine a planets stats from a distance of 120 light years. This scanner is capable of penetrating the defences of enemy fleets allowing you to steal the cargo.',
    primaryRacialTraitRequired: 'Super Stealth',
  },
  {
    id: 'scan_peerless',
    name: 'Peerless Scanner',
    type: 'Scanner',
    tech: { Energy: 24, Kinetics: 0, Propulsion: 0, Construction: 7 },
    mass: 4,
    cost: { ironium: 3, boranium: 2, germanium: 30, resources: 524000 },
    stats: { planetScanDistance: 0, enemyFleetScanDistance: 500, pen: 0 },
    description:
      'Enemy fleets not orbiting a planet can be detected up to 335 light years away. This scanner is capable of determining a planets environment and composition whilst in orbit of the planet.',
  },
];
