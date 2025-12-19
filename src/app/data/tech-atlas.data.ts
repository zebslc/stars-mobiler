// ==========================================
// Stars! Modernized Tech Atlas (Master DB)
// ==========================================

export interface TechRequirement {
  Energy?: number;
  Kinetics?: number;
  Propulsion?: number;
  Construction?: number;
  Electronics?: number; // Kept for legacy mapping if needed
  Biotechnology?: number;
}

export interface Cost {
  iron: number;
  bor: number;
  germ: number;
  res: number;
}

export type SlotType = 
  | 'Engine' 
  | 'Scanner' 
  | 'Shield' 
  | 'Armor' 
  | 'Weapon' 
  | 'Bomb' 
  | 'Mining' 
  | 'Mechanical' 
  | 'Electrical' 
  | 'Computer' 
  | 'Cloak' 
  | 'Cargo'    // For fixed cargo slots
  | 'General'; // Wildcard

export interface HullLayoutPosition {
  slotIndex: number;
  x: number; // Percentage (0-100) relative to hull image
  y: number; // Percentage (0-100) relative to hull image
  width?: number; // Visual scaling (default 1)
  height?: number; // Visual scaling (default 1)
}

export interface HullSlot {
  index: number;
  types: SlotType[];     // What can be placed here?
  capacity?: number;     // e.g. "8" for missile banks. Default 1.
  required?: boolean;    // If true, hull cannot be built without this slot filled (e.g. Engine)
  fixedComponent?: string; // ID of a component that is PERMANENTLY locked here (e.g. "cargo_70")
  visualLabel?: string;  // Label for UI "Cargo Space"
}

export interface HullStats {
  id: string;
  name: string;
  role: string;
  techReq: TechRequirement;
  mass: number;
  cost: Cost;
  fuelCapacity: number; // Intrinsic fuel in mg
  initiative: number;
  armor: number;        // Base structural integrity (DP)
  
  // LOGIC
  slots: HullSlot[];     
  
  // VISUALS (The Paper Doll)
  layout: HullLayoutPosition[];      
  
  img: string; 
  description: string;
  special?: string;
  note?: string;
}

export interface ComponentStats {
  id: string;
  name: string;
  type: SlotType;
  tech: TechRequirement;
  mass: number;
  cost: Cost;
  // Standardized Stats
  stats: {
    power?: number;     // Beam/Torp Damage
    range?: number;     // Range
    accuracy?: number;  // %
    initiative?: number;
    shield?: number;    // DP
    armor?: number;     // DP
    warp?: number;      // Max Warp
    fuelEff?: number;   // Efficiency %
    kill?: number;      // Kill % for bombs
    struct?: number;    // Structure damage for bombs
    scan?: number;      // Range
    pen?: number;       // Cloak Penetration
    mining?: number;    // kT/Year
    fuelGen?: number;   // Ramscoop generation
    cap?: number;       // Cargo/Fuel Capacity
    jamming?: number;   // %
    cloak?: number;     // %
    terraform?: number; // +/- value
  };
  img: string;
  description: string;
}

export interface ComponentCategory {
  category: string;
  items: ComponentStats[];
}

// ==========================================
// THE DATABASE
// ==========================================

export const TECH_ATLAS: {
  techStreams: string[];
  hulls: HullStats[];
  components: ComponentCategory[];
} = {
  techStreams: ["Energy", "Kinetics", "Propulsion", "Construction"],

  hulls: [
    // --- FREIGHTERS ---
    { 
      id: "hull_small_freighter",
      name: "Small Freighter", 
      role: "Transport", 
      techReq: { Construction: 0 }, 
      mass: 25, 
      cost: { iron: 11, bor: 0, germ: 15, res: 18 }, 
      fuelCapacity: 130, 
      initiative: 1, 
      armor: 25,
      img: "hull-freight-s",
      description: "The workhorse of early expansion. Essential for early logistics.",
      slots: [
        // Slot 0: Engine (Required 1)
        { index: 0, types: ['Engine'] as SlotType[], required: true, capacity: 1 },
        // Slot 1: Fixed Cargo (70kT Max, cannot add to)
        { index: 1, types: ['Cargo'] as SlotType[], fixedComponent: 'fixed_cargo_70', visualLabel: '70kT Cargo', capacity: 0 },
        // Slot 2: Shield or Armor
        { index: 2, types: ['Shield', 'Armor'] as SlotType[], capacity: 1 },
        // Slot 3: Scanner, Electrical, Mechanical
        { index: 3, types: ['Scanner', 'Electrical', 'Mechanical'] as SlotType[], capacity: 1 }
      ],
      // Linear Layout: Engine (Back) -> Cargo -> Defense -> Utility (Front)
      layout: [
        { slotIndex: 0, x: 50, y: 85 }, // Engine at bottom/back
        { slotIndex: 1, x: 50, y: 60, width: 1.5, height: 1.5 }, // Large Cargo Bay
        { slotIndex: 2, x: 50, y: 35 }, // Defense
        { slotIndex: 3, x: 50, y: 15 }  // Electronics at nose
      ]
    },
    { 
      id: "hull_medium_freighter",
      name: "Medium Freighter", role: "Transport", techReq: { Construction: 3, Propulsion: 1 }, 
      mass: 60, cost: { iron: 20, bor: 0, germ: 19, res: 40 }, fuelCapacity: 450, initiative: 0, armor: 50,
      img: "hull-freight-m",
      description: "Standard bulk transport. Requires basic propulsion.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true, capacity: 1},
        { index: 1, types: ['Cargo'] as SlotType[], fixedComponent: 'fixed_cargo_200', visualLabel: '200kT Cargo', capacity: 0 },
        { index: 2, types: ['Shield', 'Armor'] as SlotType[] },
        { index: 3, types: ['Scanner', 'Electrical', 'Mechanical'] as SlotType[] }
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 85 },
        { slotIndex: 1, x: 50, y: 55, width: 2, height: 2 },
        { slotIndex: 2, x: 20, y: 55 }, 
        { slotIndex: 3, x: 80, y: 55 }
      ]
    },
    { 
      id: "hull_large_freighter",
      name: "Large Freighter", role: "Transport", techReq: { Construction: 6, Propulsion: 3 }, 
      mass: 120, cost: { iron: 80, bor: 0, germ: 20, res: 160 }, fuelCapacity: 35000, initiative: 0, armor: 150,
      img: "hull-freight-l",
      description: "Heavy logistical platform.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['Engine'] as SlotType[], required: true }, // Dual Engine?
        { index: 2, types: ['Cargo'] as SlotType[], fixedComponent: 'fixed_cargo_1200', visualLabel: '1200kT Cargo' },
        { index: 3, types: ['Shield', 'Armor', 'General'] as SlotType[] },
        { index: 4, types: ['General'] as SlotType[] },
        { index: 5, types: ['General'] as SlotType[] }
      ],
      layout: [
        { slotIndex: 0, x: 30, y: 85 }, { slotIndex: 1, x: 70, y: 85 },
        { slotIndex: 2, x: 50, y: 50, width: 2.5, height: 2 },
        { slotIndex: 3, x: 20, y: 20 }, { slotIndex: 4, x: 50, y: 15 }, { slotIndex: 5, x: 80, y: 20 }
      ]
    },

    // --- WARSHIPS ---
    { 
      id: "hull_scout",
      name: "Scout", role: "Recon", techReq: { Construction: 0 }, 
      mass: 8, cost: { iron: 4, bor: 2, germ: 4, res: 9 }, fuelCapacity: 50, initiative: 1, armor: 20,
      img: "hull-scout",
      description: "Fast, cheap, and expendable.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['General'] as SlotType[] },
        { index: 2, types: ['Scanner'] as SlotType[] } // General-ish
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 80 },
        { slotIndex: 2, x: 30, y: 40 }, { slotIndex: 1, x: 70, y: 40 }
      ]
    },
    { 
      id: "hull_frigate",
      name: "Frigate", role: "Skirmisher", techReq: { Construction: 1, Kinetics: 1 }, 
      mass: 14, cost: { iron: 14, bor: 4, germ: 4, res: 30 }, fuelCapacity: 1100, initiative: 4, armor: 25,
      img: "hull-frigate",
      description: "The smallest true warship.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['Weapon'] as SlotType[] },
        { index: 2, types: ['Weapon'] as SlotType[] },
        { index: 3, types: ['Shield'] as SlotType[] },
        { index: 4, types: ['Electrical', 'Mechanical'] as SlotType[] }
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 85 },
        { slotIndex: 3, x: 50, y: 50 },
        { slotIndex: 1, x: 20, y: 30 }, { slotIndex: 2, x: 80, y: 30 },
        { slotIndex: 4, x: 50, y: 15 }
      ]
    },
    { 
      id: "hull_destroyer",
      name: "Destroyer", role: "Support", techReq: { Construction: 4, Energy: 2 }, 
      mass: 35, cost: { iron: 35, bor: 10, germ: 10, res: 90 }, fuelCapacity: 3500, initiative: 3, armor: 75,
      img: "hull-destroyer",
      description: "Versatile support ship. T-shaped hull.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['Weapon'] as SlotType[] },
        { index: 2, types: ['Weapon'] as SlotType[] },
        { index: 3, types: ['Weapon'] as SlotType[] },
        { index: 4, types: ['Computer', 'Electrical'] as SlotType[] },
        { index: 5, types: ['Shield', 'Armor'] as SlotType[] }
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 85 }, 
        { slotIndex: 5, x: 50, y: 60 },
        { slotIndex: 4, x: 50, y: 35 },
        { slotIndex: 1, x: 15, y: 20 }, { slotIndex: 2, x: 50, y: 10 }, { slotIndex: 3, x: 85, y: 20 }
      ]
    },

    // --- COLONY & SPECIAL ---
    { 
      id: "hull_colony",
      name: "Colony Ship", role: "Colonizer", techReq: { Construction: 2 }, 
      mass: 40, cost: { iron: 30, bor: 7, germ: 3, res: 40 }, fuelCapacity: 2500, initiative: 0, armor: 20,
      note: "Must mount Colony Module",
      img: "hull-colony",
      description: "Equipped with life support for 25,000 colonists.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['Shield', 'Armor'] as SlotType[] },
        { index: 2, types: ['Mechanical'] as SlotType[], required: true } // For Colony Module
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 80 },
        { slotIndex: 2, x: 50, y: 50, width: 1.5, height: 1.5 }, // Large Module
        { slotIndex: 1, x: 50, y: 20 }
      ]
    },
    { 
      id: "hull_mini_bomber",
      name: "Mini Bomber", role: "Bomber", techReq: { Construction: 1, Kinetics: 2 }, 
      mass: 28, cost: { iron: 18, bor: 5, germ: 9, res: 32 }, fuelCapacity: 120, initiative: 1, armor: 30,
      img: "hull-mini-bomber",
      description: "Early planetary siege vessel.",
      slots: [
        { index: 0, types: ['Engine'] as SlotType[], required: true },
        { index: 1, types: ['Bomb'] as SlotType[] },
        { index: 2, types: ['Bomb'] as SlotType[] }
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 80 },
        { slotIndex: 1, x: 30, y: 30 }, { slotIndex: 2, x: 70, y: 30 }
      ]
    },

    // --- STARBASES ---
    { 
      id: "hull_orbital_fort",
      name: "Orbital Fort", role: "Starbase", techReq: { Construction: 2 }, 
      mass: 0, cost: { iron: 11, bor: 0, germ: 15, res: 35 }, fuelCapacity: 0, initiative: 15, armor: 100,
      img: "hull-sb-fort",
      description: "Basic orbital defense platform.",
      slots: [
        { index: 0, types: ['Weapon'] as SlotType[], capacity: 12 },
        { index: 1, types: ['Weapon'] as SlotType[], capacity: 12 },
        { index: 2, types: ['Shield', 'Armor'] as SlotType[], capacity: 12 },
        { index: 3, types: ['Shield', 'Armor'] as SlotType[], capacity: 12   },
        { index: 4, types: ['Electrical'] as SlotType[], capacity: 1 }
      ],
      layout: [
        { slotIndex: 0, x: 50, y: 15 }, { slotIndex: 1, x: 50, y: 85 },
        { slotIndex: 2, x: 15, y: 35 }, { slotIndex: 3, x: 85, y: 35 },
        { slotIndex: 4, x: 15, y: 65 }
      ]
    }
  ],

  components: [
    {
      category: "Cargo",
      items: [
        { id: "fixed_cargo_70", name: "Cargo Bay (70kT)", type: "Cargo" as SlotType, tech: { Construction: 0 }, mass: 0, cost: { iron: 0, bor: 0, germ: 0, res: 0 }, stats: { cap: 70 }, img: "icon-cargo-small", description: "Standard cargo hold." },
        { id: "fixed_cargo_200", name: "Cargo Bay (200kT)", type: "Cargo" as SlotType, tech: { Construction: 0 }, mass: 0, cost: { iron: 0, bor: 0, germ: 0, res: 0 }, stats: { cap: 200 }, img: "icon-cargo-med", description: "Standard cargo hold." },
        { id: "fixed_cargo_1200", name: "Cargo Bay (1200kT)", type: "Cargo" as SlotType, tech: { Construction: 0 }, mass: 0, cost: { iron: 0, bor: 0, germ: 0, res: 0 }, stats: { cap: 1200 }, img: "icon-cargo-large", description: "Massive cargo hold." }
      ]
    },
    {
      category: "Engines",
      items: [
        { id: "eng_settler", name: "Settler's Drive", type: "Engine" as SlotType, tech: { Propulsion: 0 }, mass: 2, cost: { iron: 1, bor: 2, germ: 1, res: 10 }, stats: { warp: 6, fuelEff: 100 }, img: "eng-settler", description: "Standard issue fission drive." },
        { id: "eng_mizer", name: "Fuel Mizer", type: "Engine" as SlotType, tech: { Propulsion: 3 }, mass: 6, cost: { iron: 8, bor: 3, germ: 0, res: 11 }, stats: { warp: 8, fuelEff: 85 }, img: "eng-mizer", description: "Recycles exhaust plasma for superior range." },
        { id: "eng_trans", name: "Trans-Galactic", type: "Engine" as SlotType, tech: { Propulsion: 9 }, mass: 25, cost: { iron: 20, bor: 20, germ: 9, res: 50 }, stats: { warp: 9, fuelEff: 120 }, img: "eng-trans", description: "Military drive. Consumes fuel voraciously." },
        { id: "eng_ram", name: "Ramscoop", type: "Engine" as SlotType, tech: { Propulsion: 16, Energy: 2 }, mass: 10, cost: { iron: 3, bor: 2, germ: 9, res: 8 }, stats: { warp: 9, fuelGen: 50 }, img: "eng-ram", description: "Harvests interstellar hydrogen. Infinite range." }
      ]
    },
    {
      category: "Scanners",
      items: [
        { id: "scan_viewer50", name: "Viewer 50", type: "Scanner" as SlotType, tech: { Energy: 0 }, mass: 1, cost: { iron: 0, bor: 0, germ: 1, res: 1 }, stats: { scan: 50, pen: 0 }, img: "scan-viewer", description: "Basic optical sensor." },
        { id: "scan_rhino", name: "Rhino Scanner", type: "Scanner" as SlotType, tech: { Energy: 2 }, mass: 5, cost: { iron: 3, bor: 0, germ: 2, res: 3 }, stats: { scan: 100, pen: 0 }, img: "scan-rhino", description: "Heavy duty sensor array." },
        { id: "scan_mole", name: "Mole Scanner", type: "Scanner" as SlotType, tech: { Energy: 4 }, mass: 2, cost: { iron: 2, bor: 0, germ: 2, res: 9 }, stats: { scan: 120, pen: 0 }, img: "scan-mole", description: "Deep space sensor." },
        { id: "scan_possum", name: "Possum Scanner", type: "Scanner" as SlotType, tech: { Energy: 4 }, mass: 4, cost: { iron: 0, bor: 0, germ: 8, res: 8 }, stats: { scan: 150, pen: 0 }, img: "scan-mole", description: "Advanced stealth detection." },
        { id: "scan_dna", name: "DNA Scanner", type: "Scanner" as SlotType, tech: { Energy: 5 }, mass: 3, cost: { iron: 0, bor: 0, germ: 5, res: 5 }, stats: { scan: 125, pen: 50 }, img: "scan-viewer", description: "Detects life signs." },
        { id: "scan_snooper", name: "Snooper 320", type: "Scanner" as SlotType, tech: { Energy: 6 }, mass: 3, cost: { iron: 0, bor: 0, germ: 10, res: 8 }, stats: { scan: 320, pen: 160 }, img: "scan-snooper", description: "Tachyon scanner. Penetrates cloaks." },
        { id: "scan_peerless", name: "Peerless Scanner", type: "Scanner" as SlotType, tech: { Energy: 15 }, mass: 5, cost: { iron: 0, bor: 0, germ: 24, res: 32 }, stats: { scan: 340, pen: 340 }, img: "scan-eagle", description: "The ultimate surveillance tech." }
      ]
    },
    {
      category: "Computers",
      items: [
        { id: "elec_comp_bat", name: "Battle Computer", type: "Computer" as SlotType, tech: { Energy: 1 }, mass: 1, cost: { iron: 0, bor: 0, germ: 15, res: 6 }, stats: { initiative: 1, accuracy: 20 }, img: "elec-comp-bat", description: "Tactical analysis system." }
      ]
    },
    {
      category: "Electrical",
      items: [
        { id: "elec_jammer10", name: "Jammer 10", type: "Electrical" as SlotType, tech: { Energy: 2 }, mass: 1, cost: { iron: 0, bor: 0, germ: 2, res: 6 }, stats: { jamming: 10 }, img: "elec-jammer-10", description: "Reduces incoming torpedo accuracy." }
      ]
    },
    {
      category: "Cloaking",
      items: [
        { id: "elec_cloak", name: "Stealth Cloak", type: "Cloak" as SlotType, tech: { Energy: 2 }, mass: 2, cost: { iron: 2, bor: 0, germ: 2, res: 5 }, stats: { cloak: 70 }, img: "elec-cloak-stealth", description: "Bends light around the hull." }
      ]
    },
    {
      category: "Mechanical",
      items: [
        { id: "mech_fuel_tank", name: "Fuel Tank", type: "Mechanical" as SlotType, tech: { Construction: 0 }, mass: 3, cost: { iron: 6, bor: 0, germ: 0, res: 4 }, stats: { cap: 250 }, img: "mech-fuel-tank", description: "Standard storage tank for Deuterium fuel." },
        { id: "mech_colony", name: "Colony Module", type: "Mechanical" as SlotType, tech: { Construction: 0 }, mass: 32, cost: { iron: 12, bor: 10, germ: 10, res: 10 }, stats: { terraform: 0 }, img: "mech-colony-mod", description: "Cryogenic suspension pods for colonists." },
        { id: "mech_maneuver", name: "Maneuvering Jet", type: "Mechanical" as SlotType, tech: { Propulsion: 3, Energy: 2 }, mass: 5, cost: { iron: 5, bor: 0, germ: 5, res: 10 }, stats: { initiative: 1 }, img: "mech-maneuver-jet", description: "Thrusters that aid in combat evasion." }
      ]
    },
    {
      category: "Weapons",
      items: [
        { id: "weap_laser", name: "Laser", type: "Weapon" as SlotType, tech: { Energy: 0 }, mass: 1, cost: { iron: 0, bor: 6, germ: 0, res: 5 }, stats: { power: 10, range: 1, initiative: 1 }, img: "weap-laser", description: "Standard beam weapon." },
        { id: "weap_phasor", name: "Phasor", type: "Weapon" as SlotType, tech: { Energy: 7 }, mass: 2, cost: { iron: 0, bor: 14, germ: 0, res: 18 }, stats: { power: 120, range: 3, initiative: 7 }, img: "weap-phasor", description: "Long range sniper beam." },
        { id: "weap_alpha", name: "Alpha Torp", type: "Weapon" as SlotType, tech: { Kinetics: 2 }, mass: 25, cost: { iron: 9, bor: 3, germ: 3, res: 5 }, stats: { power: 12, accuracy: 65, range: 4, initiative: 0 }, img: "weap-torp-alpha", description: "Basic guided missile." }
      ]
    },
    {
      category: "Bombs",
      items: [
        { id: "bomb_lady", name: "Lady Finger", type: "Bomb" as SlotType, tech: { Kinetics: 1 }, mass: 40, cost: { iron: 1, bor: 20, germ: 0, res: 5 }, stats: { kill: 0.6, struct: 2 }, img: "weap-bomb-lady", description: "Basic orbital bomb. Low damage." }
      ]
    },
    {
      category: "Shields",
      items: [
        { id: "def_mole_skin", name: "Mole-Skin", type: "Shield" as SlotType, tech: { Energy: 0 }, mass: 1, cost: { iron: 1, bor: 0, germ: 1, res: 4 }, stats: { shield: 25 }, img: "def-shield-mole", description: "Basic energy barrier." }
      ]
    },
    {
      category: "Armor",
      items: [
        { id: "def_tri", name: "Tritanium", type: "Armor" as SlotType, tech: { Construction: 0 }, mass: 60, cost: { iron: 5, bor: 0, germ: 0, res: 10 }, stats: { armor: 50 }, img: "def-armor-tri", description: "Standard composite plating." }
      ]
    }
  ]
};