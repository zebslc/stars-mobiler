import { ComponentStats } from '../tech-atlas.types';

export const MINE_COMPONENTS: ComponentStats[] = [
  {
    id: 'mine_dispenser_40',
    name: 'Mine Dispenser 40',
    type: 'Mine',
    tech: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    mass: 25,
    cost: { ironium: 2, boranium: 10, germanium: 8, resources: 45 },
    stats: { mines: 40 },
    img: 'mine-dispenser-40',
    description: 'Basic minefield deployment system.'
  },
  {
    id: 'mine_dispenser_50',
    name: 'Mine Dispenser 50',
    type: 'Mine',
    tech: { Energy: 2, Kinetics: 4, Propulsion: 0, Construction: 0 },
    mass: 30,
    cost: { ironium: 2, boranium: 12, germanium: 10, resources: 55 },
    stats: { mines: 50 },
    img: 'mine-dispenser-50',
    description: 'Enhanced mine deployment rate.'
  },
  {
    id: 'mine_dispenser_80',
    name: 'Mine Dispenser 80',
    type: 'Mine',
    tech: { Energy: 3, Kinetics: 7, Propulsion: 0, Construction: 0 },
    mass: 30,
    cost: { ironium: 2, boranium: 14, germanium: 10, resources: 65 },
    stats: { mines: 80 },
    img: 'mine-dispenser-80',
    description: 'High-capacity mine layer.'
  },
  {
    id: 'mine_dispenser_130',
    name: 'Mine Dispenser 130',
    type: 'Mine',
    tech: { Energy: 6, Kinetics: 12, Propulsion: 0, Construction: 0 },
    mass: 30,
    cost: { ironium: 2, boranium: 18, germanium: 10, resources: 80 },
    stats: { mines: 130 },
    img: 'mine-dispenser-130',
    description: 'Maximum deployment rate system.'
  },
  {
    id: 'heavy_dispenser_50',
    name: 'Heavy Dispenser 50',
    type: 'Mine',
    tech: { Energy: 5, Kinetics: 3, Propulsion: 0, Construction: 0 },
    mass: 10,
    cost: { ironium: 2, boranium: 20, germanium: 5, resources: 50 },
    stats: { mines: 50 },
    img: 'heavy-dispenser-50',
    description: 'Compact heavy mine layer.'
  },
  {
    id: 'heavy_dispenser_110',
    name: 'Heavy Dispenser 110',
    type: 'Mine',
    tech: { Energy: 9, Kinetics: 5, Propulsion: 0, Construction: 0 },
    mass: 15,
    cost: { ironium: 2, boranium: 30, germanium: 5, resources: 70 },
    stats: { mines: 110 },
    img: 'heavy-dispenser-110',
    description: 'Advanced heavy mine system.'
  },
  {
    id: 'heavy_dispenser_200',
    name: 'Heavy Dispenser 200',
    type: 'Mine',
    tech: { Energy: 14, Kinetics: 7, Propulsion: 0, Construction: 0 },
    mass: 20,
    cost: { ironium: 2, boranium: 45, germanium: 5, resources: 90 },
    stats: { mines: 200 },
    img: 'heavy-dispenser-200',
    description: 'Ultimate heavy mine deployment.'
  },
  {
    id: 'speed_trap_20',
    name: 'Speed Trap 20',
    type: 'Mine',
    tech: { Energy: 0, Kinetics: 2, Propulsion: 2, Construction: 0 },
    mass: 100,
    cost: { ironium: 30, boranium: 0, germanium: 12, resources: 60 },
    stats: { mines: 20 },
    img: 'speed-trap-20',
    description: 'Warp interdiction mines.'
  },
  {
    id: 'speed_trap_30',
    name: 'Speed Trap 30',
    type: 'Mine',
    tech: { Energy: 0, Kinetics: 6, Propulsion: 3, Construction: 0 },
    mass: 135,
    cost: { ironium: 32, boranium: 0, germanium: 14, resources: 72 },
    stats: { mines: 30 },
    img: 'speed-trap-30',
    description: 'Enhanced warp disruption field.'
  },
  {
    id: 'speed_trap_50',
    name: 'Speed Trap 50',
    type: 'Mine',
    tech: { Energy: 0, Kinetics: 11, Propulsion: 5, Construction: 0 },
    mass: 140,
    cost: { ironium: 40, boranium: 0, germanium: 15, resources: 80 },
    stats: { mines: 50 },
    img: 'speed-trap-50',
    description: 'Maximum warp interference system.'
  }
];