import { HullTemplate } from '../tech-atlas.types';

export const FREIGHTER_HULLS: HullTemplate[] = [
  {
    Name: 'Small Freighter',
    Structure: ['E1,E1,C1,C1,SA1,SA1,SCEM1,SCEM1', 'E1,E1,C1,C1,SA1,SA1,SCEM1,SCEM1'],
    Slots: [
      { Code: 'E1', Allowed: ['Engine'], Max: 1, Required: true },
      { Code: 'C1', Allowed: ['Cargo'], Size: 70, Editable: false },
      { Code: 'SA1', Allowed: ['Shield', 'Armor'], Max: 1 },
      { Code: 'SCEM1', Allowed: ['Scanner', 'Elect', 'Mech'], Max: 1 },
    ],
    Cost: { Ironium: 12, Boranium: 0, Germanium: 17, Resources: 20 },
    Stats: { Mass: 25, 'Max Fuel': 130, Armor: 25, Cargo: 70, Initiative: 0 },
    techReq: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 0 },
    img: 'hull-freight-s',
  },
  {
    Name: 'Medium Freighter',
    Structure: ['E1,E1,C1,C1,C1,C1,SA1,SA1,SCEM1,SCEM1', 'E1,E1,C1,C1,C1,C1,SA1,SA1,SCEM1,SCEM1'],
    Slots: [
      { Code: 'E1', Allowed: ['Engine'], Max: 1, Required: true },
      { Code: 'C1', Allowed: ['Cargo'], Size: 210, Editable: false },
      { Code: 'SA1', Allowed: ['Shield', 'Armor'], Max: 1 },
      { Code: 'SCEM1', Allowed: ['Scanner', 'Elect', 'Mech'], Max: 1 },
    ],
    Cost: { Ironium: 20, Boranium: 0, Germanium: 19, Resources: 40 },
    Stats: { Mass: 60, 'Max Fuel': 450, Armor: 50, Cargo: 210, Initiative: 0 },
    techReq: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 3 },
    img: 'hull-freight-m',
  },
  {
    Name: 'Large Freighter',
    Structure: [
      '.,.,C1,C1,C1,C1,C1,SCEM1,SCEM1',
      'E1,E1,C1,C1,C1,C1,C1,SCEM1,SCEM1',
      'E1,E1,C1,C1,C1,C1,C1,SA1,SA1',
      '.,.,C1,C1,C1,C1,C1,SA1,SA1',
    ],
    Slots: [
      { Code: 'E1', Allowed: ['Engine'], Max: 2, Required: true },
      { Code: 'C1', Allowed: ['Cargo'], Size: 1200, Editable: false },
      { Code: 'SA1', Allowed: ['Shield', 'Armor'], Max: 2 },
      { Code: 'SCEM1', Allowed: ['Scanner', 'Elect', 'Mech'], Max: 2 },
    ],
    Cost: { Ironium: 35, Boranium: 0, Germanium: 21, Resources: 100 },
    Stats: { Mass: 125, 'Max Fuel': 2600, Armor: 150, Cargo: 1200, Initiative: 0 },
    techReq: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 6 },
    img: 'hull-freight-l',
  },
  {
    Name: 'Super Freighter',
    Structure: [
      '.,.,C1,C1,C1,C1,C1,C1,SCEM1,SCEM1',
      '.,.,C1,C1,C1,C1,C1,C1,SCEM1,SCEM1',
      'E1,E1,C1,C1,C1,C1,C1,C1,SA1,SA1',
      'E1,E1,C1,C1,C1,C1,C1,C1,SA1,SA1',
      '.,.,C1,C1,C1,C1,C1,C1,EL1,EL1',
      '.,.,C1,C1,C1,C1,C1,C1,EL1,EL1',
    ],
    Slots: [
      { Code: 'E1', Allowed: ['Engine'], Max: 3, Required: true },
      { Code: 'C1', Allowed: ['Cargo'], Size: 3000, Editable: false },
      { Code: 'SCEM1', Allowed: ['Scanner', 'Elect', 'Mech'], Max: 3 },
      { Code: 'SA1', Allowed: ['Shield', 'Armor'], Max: 5 },
      { Code: 'EL1', Allowed: ['Elect'], Max: 2 },
    ],
    Cost: { Ironium: 45, Boranium: 0, Germanium: 21, Resources: 125 },
    Stats: { Mass: 175, 'Max Fuel': 8000, Armor: 400, Cargo: 3000, Initiative: 0 },
    techReq: { Energy: 0, Kinetics: 0, Propulsion: 0, Construction: 9 },
    img: 'hull-freight-super',
  },
];
