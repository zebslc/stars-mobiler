import { ComponentStats } from '../tech-atlas.types';

export const SCANNER_COMPONENTS: ComponentStats[] = [
  {
    id: 'scan_viewer50',
    name: 'Viewer 50',
    type: 'Scanner',
    tech: { Energy: 0 },
    mass: 1,
    cost: { iron: 0, bor: 0, germ: 1, res: 1 },
    stats: { scan: 50, pen: 0 },
    img: 'scan-viewer',
    description: 'Basic optical sensor.'
  },
  {
    id: 'scan_rhino',
    name: 'Rhino Scanner',
    type: 'Scanner',
    tech: { Energy: 2 },
    mass: 5,
    cost: { iron: 3, bor: 0, germ: 2, res: 3 },
    stats: { scan: 90, pen: 0 },
    img: 'scan-rhino',
    description: 'Heavy duty sensor array.'
  },
  {
    id: 'scan_mole',
    name: 'Mole Scanner',
    type: 'Scanner',
    tech: { Energy: 4 },
    mass: 2,
    cost: { iron: 2, bor: 0, germ: 2, res: 9 },
    stats: { scan: 120, pen: 0 },
    img: 'scan-mole',
    description: 'Deep space sensor.'
  },
  {
    id: 'scan_possum',
    name: 'Possum Scanner',
    type: 'Scanner',
    tech: { Energy: 5 },
    mass: 4,
    cost: { iron: 0, bor: 0, germ: 8, res: 8 },
    stats: { scan: 150, pen: 0 },
    img: 'scan-possum',
    description: 'Advanced stealth detection.'
  },
  {
    id: 'scan_snooper',
    name: 'Snooper 320',
    type: 'Scanner',
    tech: { Energy: 6 },
    mass: 3,
    cost: { iron: 0, bor: 0, germ: 10, res: 8 },
    stats: { scan: 320, pen: 160 },
    img: 'scan-snooper',
    description: 'Tachyon scanner. Penetrates cloaks.'
  },
  {
    id: 'scan_eagle',
    name: 'Eagle Eye',
    type: 'Scanner',
    tech: { Energy: 8 },
    mass: 3,
    cost: { iron: 0, bor: 2, germ: 21, res: 64 },
    stats: { scan: 450, pen: 225 },
    img: 'scan-eagle',
    description: 'Long-range surveillance.'
  },
  {
    id: 'scan_peerless',
    name: 'Peerless Scanner',
    type: 'Scanner',
    tech: { Energy: 15 },
    mass: 5,
    cost: { iron: 0, bor: 0, germ: 24, res: 32 },
    stats: { scan: 500, pen: 500 },
    img: 'scan-peerless',
    description: 'The ultimate surveillance tech.'
  }
];
