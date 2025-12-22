import { ComponentStats } from '../tech-atlas.types';

export const MINE_COMPONENTS: ComponentStats[] = [
  {
    id: 'mine_dispenser_40',
    name: 'Mine Dispenser 40',
    type: 'Mining',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 25,
    cost: { iron: 2, bor: 10, germ: 8, res: 45 },
    stats: { mines: 40 },
    img: 'mine-dispenser-40',
    description: 'Basic minefield deployment system.'
  },
  {
    id: 'mine_dispenser_50',
    name: 'Mine Dispenser 50',
    type: 'Mining',
    tech: { Energy: 2, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 4 },
    mass: 30,
    cost: { iron: 2, bor: 12, germ: 10, res: 55 },
    stats: { mines: 50 },
    img: 'mine-dispenser-50',
    description: 'Enhanced mine deployment rate.'
  },
  {
    id: 'mine_dispenser_80',
    name: 'Mine Dispenser 80',
    type: 'Mining',
    tech: { Energy: 3, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 7 },
    mass: 30,
    cost: { iron: 2, bor: 14, germ: 10, res: 65 },
    stats: { mines: 80 },
    img: 'mine-dispenser-80',
    description: 'High-capacity mine layer.'
  },
  {
    id: 'mine_dispenser_130',
    name: 'Mine Dispenser 130',
    type: 'Mining',
    tech: { Energy: 6, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 12 },
    mass: 30,
    cost: { iron: 2, bor: 18, germ: 10, res: 80 },
    stats: { mines: 130 },
    img: 'mine-dispenser-130',
    description: 'Maximum deployment rate system.'
  },
  {
    id: 'heavy_dispenser_50',
    name: 'Heavy Dispenser 50',
    type: 'Mining',
    tech: { Energy: 5, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 3 },
    mass: 10,
    cost: { iron: 2, bor: 20, germ: 5, res: 50 },
    stats: { mines: 50 },
    img: 'heavy-dispenser-50',
    description: 'Compact heavy mine layer.'
  },
  {
    id: 'heavy_dispenser_110',
    name: 'Heavy Dispenser 110',
    type: 'Mining',
    tech: { Energy: 9, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 5 },
    mass: 15,
    cost: { iron: 2, bor: 30, germ: 5, res: 70 },
    stats: { mines: 110 },
    img: 'heavy-dispenser-110',
    description: 'Advanced heavy mine system.'
  },
  {
    id: 'heavy_dispenser_200',
    name: 'Heavy Dispenser 200',
    type: 'Mining',
    tech: { Energy: 14, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 7 },
    mass: 20,
    cost: { iron: 2, bor: 45, germ: 5, res: 90 },
    stats: { mines: 200 },
    img: 'heavy-dispenser-200',
    description: 'Ultimate heavy mine deployment.'
  },
  {
    id: 'speed_trap_20',
    name: 'Speed Trap 20',
    type: 'Mining',
    tech: { Energy: 0, Weapons: 0, Propulsion: 2, Construction: 0, Electronics: 0, BioTech: 2 },
    mass: 100,
    cost: { iron: 30, bor: 0, germ: 12, res: 60 },
    stats: { mines: 20 },
    img: 'speed-trap-20',
    description: 'Warp interdiction mines.'
  },
  {
    id: 'speed_trap_30',
    name: 'Speed Trap 30',
    type: 'Mining',
    tech: { Energy: 0, Weapons: 0, Propulsion: 3, Construction: 0, Electronics: 0, BioTech: 6 },
    mass: 135,
    cost: { iron: 32, bor: 0, germ: 14, res: 72 },
    stats: { mines: 30 },
    img: 'speed-trap-30',
    description: 'Enhanced warp disruption field.'
  },
  {
    id: 'speed_trap_50',
    name: 'Speed Trap 50',
    type: 'Mining',
    tech: { Energy: 0, Weapons: 0, Propulsion: 5, Construction: 0, Electronics: 0, BioTech: 11 },
    mass: 140,
    cost: { iron: 40, bor: 0, germ: 15, res: 80 },
    stats: { mines: 50 },
    img: 'speed-trap-50',
    description: 'Maximum warp interference system.'
  }
];