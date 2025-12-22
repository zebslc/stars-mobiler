import { ComponentStats } from '../tech-atlas.types';

export const STARBASE_HULLS: ComponentStats[] = [
  {
    id: 'hull_orbital_fort',
    name: 'Orbital Fort',
    type: 'Starbase',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 0,
    cost: { iron: 24, bor: 0, germ: 34, res: 80 },
    stats: { 
      armor: 100,
      initiative: 10,
      dockCapacity: 0
    },
    img: 'hull-orbital-fort',
    description: 'Basic orbital defense platform.'
  },
  {
    id: 'hull_space_dock',
    name: 'Space Dock',
    type: 'Starbase',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 4, Electronics: 0, BioTech: 0 },
    mass: 0,
    cost: { iron: 40, bor: 10, germ: 50, res: 200 },
    stats: { 
      armor: 250,
      initiative: 12,
      dockCapacity: 200
    },
    img: 'hull-space-dock',
    description: 'Repair and construction facility.'
  },
  {
    id: 'hull_space_station',
    name: 'Space Station',
    type: 'Starbase',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 0, Electronics: 0, BioTech: 0 },
    mass: 0,
    cost: { iron: 240, bor: 160, germ: 500, res: 1200 },
    stats: { 
      armor: 500,
      initiative: 14,
      dockCapacity: -1
    },
    img: 'hull-space-station',
    description: 'Massive orbital complex with unlimited docking.'
  },
  {
    id: 'hull_ultra_station',
    name: 'Ultra Station',
    type: 'Starbase',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 12, Electronics: 0, BioTech: 0 },
    mass: 0,
    cost: { iron: 240, bor: 160, germ: 600, res: 1200 },
    stats: { 
      armor: 1000,
      initiative: 16,
      dockCapacity: -1
    },
    img: 'hull-ultra-station',
    description: 'Advanced orbital fortress.'
  },
  {
    id: 'hull_death_star',
    name: 'Death Star',
    type: 'Starbase',
    tech: { Energy: 0, Weapons: 0, Propulsion: 0, Construction: 17, Electronics: 0, BioTech: 0 },
    mass: 0,
    cost: { iron: 240, bor: 160, germ: 700, res: 1500 },
    stats: { 
      armor: 1500,
      initiative: 18,
      dockCapacity: -1
    },
    img: 'hull-death-star',
    description: 'Ultimate battle station.'
  }
];