export interface TechRequirement {
  Energy?: number;
  Kinetics?: number;
  Propulsion?: number;
  Construction?: number;
}

export interface Cost {
  iron?: number;
  bor?: number;
  germ?: number;
  res: number;
}

export interface HullStats {
  name: string;
  role: string;
  techReq: TechRequirement;
  mass: number;
  cost: Cost;
  fuelCapacity?: number;
  slots: string[];
  img: string;
  description: string;
  special?: string;
  note?: string;
}

export interface ComponentStats {
  name: string;
  type?: string;
  tech: TechRequirement;
  mass: number;
  cost: Cost;
  stats: Record<string, number | string>;
  img: string;
  description: string;
}

export interface ComponentCategory {
  category: string;
  items: ComponentStats[];
}

export const TECH_ATLAS = {
  techStreams: ["Energy", "Kinetics", "Propulsion", "Construction"],

  hulls: [
    { 
      name: "Small Freighter", role: "Transport", techReq: { Construction: 0 }, 
      mass: 15, cost: { iron: 12, germ: 17, res: 20 }, fuelCapacity: 1500,
      slots: ["Engine", "Shield", "General", "General"], 
      img: "hull-freight-s",
      description: "The workhorse of any young empire. Essential for early expansion and mineral logistics."
    },
    { 
      name: "Medium Freighter", role: "Transport", techReq: { Construction: 3 }, 
      mass: 45, cost: { iron: 20, germ: 19, res: 40 }, fuelCapacity: 6000,
      slots: ["Engine", "Shield", "General", "General", "General"], 
      img: "hull-freight-m",
      description: "Significant upgrade over the small freighter, offering triple the cargo capacity."
    },
    { 
      name: "Large Freighter", role: "Transport", techReq: { Construction: 6 }, 
      mass: 120, cost: { iron: 35, germ: 21, res: 100 }, fuelCapacity: 30000,
      slots: ["Engine", "Shield", "General", "General", "General", "General"], 
      img: "hull-freight-l",
      description: "A massive logistical platform capable of moving entire colonial populations."
    },
    { 
      name: "Scout", role: "Recon", techReq: { Construction: 0 }, 
      mass: 8, cost: { iron: 4, bor: 2, germ: 4, res: 10 }, fuelCapacity: 500,
      slots: ["Engine", "Computer", "General"], 
      img: "hull-scout",
      description: "Fast, cheap, and expendable. Designed solely for exploration and surveillance."
    },
    { 
      name: "Frigate", role: "Skirmisher", techReq: { Construction: 1 }, 
      mass: 14, cost: { iron: 4, bor: 2, germ: 4, res: 12 }, fuelCapacity: 1100,
      slots: ["Engine", "Weapon", "Weapon", "Shield", "General"], 
      img: "hull-frigate",
      description: "The smallest true warship. A wolfpack of Frigates can easily overwhelm unarmed transports."
    },
    { 
      name: "Destroyer", role: "Support", techReq: { Construction: 4 }, 
      mass: 35, cost: { iron: 15, bor: 3, germ: 5, res: 35 }, fuelCapacity: 3500,
      slots: ["Engine", "Weapon", "Weapon", "Weapon", "Computer", "General"], 
      img: "hull-destroyer",
      description: "A versatile support ship often used for mine-laying or torpedo bombardment."
    },
    { 
      name: "Cruiser", role: "Warship", techReq: { Construction: 7 }, 
      mass: 140, cost: { iron: 40, bor: 5, germ: 8, res: 85 }, fuelCapacity: 15000,
      slots: ["Engine", "Engine", "Weapon", "Weapon", "Weapon", "Weapon", "Shield", "General", "General"], 
      img: "hull-cruiser",
      description: "The backbone of the battle fleet. Its broadside firepower is sufficient to threaten starbases."
    },
    { 
      name: "Battle Cruiser", role: "Heavy Striker", techReq: { Construction: 9 }, 
      mass: 260, cost: { iron: 55, bor: 8, germ: 12, res: 120 }, fuelCapacity: 35000,
      slots: ["Engine", "Engine", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Shield", "Shield", "General"], 
      img: "hull-battle-cruiser",
      description: "Designed for heavy assault. It sacrifices utility slots for raw weapon capacity."
    },
    { 
      name: "Battleship", role: "Capital", techReq: { Construction: 11 }, 
      mass: 500, cost: { iron: 120, bor: 25, germ: 20, res: 225 }, fuelCapacity: 75000,
      slots: ["Engine", "Engine", "Engine", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Shield", "Shield", "Shield", "General", "General"], 
      img: "hull-battleship",
      description: "A mobile fortress. With three engines, it can drive massive shields and heavy armor."
    },
    { 
      name: "Dreadnought", role: "Titan", techReq: { Construction: 13 }, 
      mass: 1000, cost: { iron: 140, bor: 30, germ: 25, res: 275 }, fuelCapacity: 200000,
      slots: ["Engine", "Engine", "Engine", "Engine", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Weapon", "Shield", "Shield", "Shield", "General", "General", "General"], 
      img: "hull-dreadnought",
      description: "The ultimate expression of naval power. Only the wealthiest empires can afford to field these titans."
    },
    { 
      name: "Privateer", role: "Stealth Theft", techReq: { Construction: 4, Propulsion: 2 }, 
      mass: 35, cost: { iron: 50, bor: 3, germ: 3, res: 50 }, fuelCapacity: 2000,
      special: "Steals Cargo", slots: ["Engine", "Weapon", "Weapon", "Computer", "General"], 
      img: "hull-privateer",
      description: "Equipped with cargo teleporters to steal minerals without declaring war."
    },
    { 
      name: "Rogue", role: "Stealth Bomber", techReq: { Construction: 7, Propulsion: 5 }, 
      mass: 40, cost: { iron: 80, bor: 5, germ: 5, res: 60 }, fuelCapacity: 3000,
      special: "Cloaked", slots: ["Engine", "Weapon", "Weapon", "Shield", "General"], 
      img: "hull-rogue",
      description: "Built with a hull geometry that diffuses scanner waves. Perfect for surprise strikes."
    },
    { 
      name: "Galleon", role: "Armed Transport", techReq: { Construction: 8 }, 
      mass: 120, cost: { iron: 70, bor: 5, germ: 5, res: 105 }, fuelCapacity: 25000,
      slots: ["Engine", "Engine", "Shield", "Shield", "General", "General", "General"], 
      img: "hull-galleon",
      description: "A militarized freighter designed to run blockades that would destroy civilian ships."
    },
    { 
      name: "Colony Ship", role: "Colonizer", techReq: { Construction: 2 }, 
      mass: 40, cost: { iron: 10, germ: 15, res: 20 }, fuelCapacity: 2500,
      slots: ["Engine", "Shield", "General"], note: "Must mount Colony Module",
      img: "hull-colony",
      description: "Equipped with life support for 25,000 colonists. Required to establish new settlements."
    },
    { 
      name: "Orbital Fort", role: "Starbase", techReq: { Construction: 2 }, 
      mass: 0, cost: { iron: 12, germ: 17, res: 40 }, 
      slots: ["Weapon", "Weapon", "Shield", "Shield", "General", "General"], 
      img: "hull-sb-fort",
      description: "Basic orbital defense platform. Essential for protecting key worlds."
    },
    { 
      name: "Space Station", role: "Starbase", techReq: { Construction: 10 }, 
      mass: 0, cost: { iron: 120, bor: 80, germ: 250, res: 600 }, 
      slots: ["Weapon", "Weapon", "Weapon", "Weapon", "Shield", "Shield", "Shield", "General", "General", "General", "General"], 
      img: "hull-sb-station",
      description: "A massive orbital city serving as a fleet anchorage and defensive bastion."
    }
  ],

  components: [
    { 
      category: "Engine", 
      items: [
        { name: "Settler's Drive", tech: { Propulsion: 0 }, mass: 2, cost: { iron: 1, germ: 1, res: 2 }, stats: { "Max Warp": 6, "Efficiency": "100%" }, img: "eng-settler", description: "Standard issue fission drive. Reliable but limited to low warp." },
        { name: "Fuel Mizer", tech: { Propulsion: 2 }, mass: 6, cost: { iron: 8, res: 11 }, stats: { "Max Warp": 8, "Efficiency": "120%" }, img: "eng-mizer", description: "Recycles exhaust plasma for superior range. Ideal for scouts." },
        { name: "Trans-Galactic", tech: { Propulsion: 6 }, mass: 25, cost: { iron: 20, bor: 20, germ: 9, res: 50 }, stats: { "Max Warp": 9, "Efficiency": "80%" }, img: "eng-trans", description: "A high-performance military drive consuming fuel voraciously." },
        { name: "Ramscoop", tech: { Propulsion: 12 }, mass: 10, cost: { iron: 3, bor: 2, germ: 9, res: 8 }, stats: { "Max Warp": 9, "Efficiency": "100%", "Special": "Fuel Gen" }, img: "eng-ram", description: "Harvests interstellar hydrogen. Operates indefinitely without refueling." }
      ]
    },
    { 
      category: "Scanner", 
      items: [
        { name: "Viewer 50", tech: { Energy: 0 }, mass: 1, cost: { iron: 10, bor: 10, germ: 70, res: 100 }, stats: { "Range": "50 ly", "Cloak Pen": "0 ly" }, img: "scan-viewer", description: "Basic optical sensor array. Useful for navigation but easily fooled." },
        { name: "Rhino Scanner", tech: { Energy: 1 }, mass: 5, cost: { iron: 3, germ: 2, res: 3 }, stats: { "Range": "80 ly", "Cloak Pen": "0 ly" }, img: "scan-rhino", description: "Upgraded sensor suite with thermal imaging." },
        { name: "Mole Scanner", tech: { Energy: 4 }, mass: 2, cost: { iron: 2, germ: 2, res: 9 }, stats: { "Range": "120 ly", "Cloak Pen": "0 ly" }, img: "scan-mole", description: "Deep-space sensor designed to detect gravitational anomalies." },
        { name: "Snooper 320", tech: { Energy: 6 }, mass: 3, cost: { iron: 10, bor: 10, germ: 70, res: 100 }, stats: { "Range": "320 ly", "Cloak Pen": "160 ly" }, img: "scan-snooper", description: "Military-grade tachyon scanner capable of penetrating basic cloaks." },
        { name: "Eagle Eye", tech: { Energy: 8 }, mass: 3, cost: { iron: 3, bor: 2, germ: 21, res: 64 }, stats: { "Range": "450 ly", "Cloak Pen": "225 ly" }, img: "scan-eagle", description: "The ultimate surveillance tech. Detects cloaks from sectors away." }
      ]
    },
    { 
      category: "Shield", 
      items: [
        { name: "Mole-Skin", tech: { Energy: 0 }, mass: 1, cost: { iron: 1, germ: 1, res: 4 }, stats: { "Shield DP": 25, "Mass": 1 }, img: "def-shield-mole", description: "A rudimentary energy barrier stopping micrometeoroids." },
        { name: "Cow-Hide", tech: { Energy: 3 }, mass: 1, cost: { iron: 2, germ: 2, res: 5 }, stats: { "Shield DP": 40, "Mass": 1 }, img: "def-shield-cow", description: "Improved shielding using magnetic containment." },
        { name: "Wolverine", tech: { Energy: 5 }, mass: 1, cost: { iron: 3, germ: 3, res: 6 }, stats: { "Shield DP": 60, "Mass": 1 }, img: "def-shield-wolf", description: "Regenerative shield system with a high refresh rate." },
        { name: "Phase Shield", tech: { Energy: 10 }, mass: 1, cost: { iron: 12, germ: 15, res: 20 }, stats: { "Shield DP": 500, "Mass": 1 }, img: "def-shield-phase", description: "Shifts the ship slightly out of phase. Incoming fire passes through." }
      ]
    },
    { 
      category: "Armor", 
      items: [
        { name: "Tritanium", tech: { Construction: 0 }, mass: 60, cost: { iron: 5, res: 10 }, stats: { "Armor DP": 50 }, img: "def-armor-tri", description: "Standard composite hull plating." },
        { name: "Crobmnium", tech: { Construction: 5 }, mass: 56, cost: { iron: 6, res: 13 }, stats: { "Armor DP": 75 }, img: "def-armor-crob", description: "Dense alloy treated with crystalline lattice structures." },
        { name: "Neutronium", tech: { Construction: 10 }, mass: 45, cost: { iron: 11, bor: 2, germ: 1, res: 30 }, stats: { "Armor DP": 275 }, img: "def-armor-neu", description: "Forged from collapsed matter. Extremely heavy but impervious." },
        { name: "Valanium", tech: { Construction: 14 }, mass: 40, cost: { iron: 15, res: 50 }, stats: { "Armor DP": 500 }, img: "def-armor-val", description: "The theoretical limit of material science." }
      ]
    },
    { 
      category: "Weapon", 
      items: [
        { name: "Laser", type: "Beam", tech: { Energy: 0 }, mass: 1, cost: { bor: 6, res: 5 }, stats: { "Pwr": 10, "Rng": 1, "Sweep": 10 }, img: "weap-laser", description: "Focused light amplification. Effective at point-blank range." },
        { name: "X-Ray Laser", type: "Beam", tech: { Energy: 2 }, mass: 1, cost: { bor: 6, res: 6 }, stats: { "Pwr": 16, "Rng": 1, "Sweep": 16 }, img: "weap-xray", description: "High-frequency laser with better shield penetration." },
        { name: "Mini Gun", type: "Beam", tech: { Energy: 3 }, mass: 3, cost: { bor: 6, res: 6 }, stats: { "Pwr": 16, "Rng": 2, "Sweep": 64, "Spec": "Gatling" }, img: "weap-minigun", description: "Rotary laser. Excellent for sweeping minefields and stripping shields." },
        { name: "Yakimora", type: "Beam", tech: { Energy: 4 }, mass: 1, cost: { bor: 8, res: 7 }, stats: { "Pwr": 26, "Rng": 1, "Sweep": 26 }, img: "weap-yakimora", description: "A compact phaser design used on smaller hulls." },
        { name: "Disruptor", type: "Beam", tech: { Energy: 5 }, mass: 2, cost: { bor: 16, res: 20 }, stats: { "Pwr": 35, "Rng": 2, "Sweep": 70 }, img: "weap-disrupt", description: "Fires a bolt of destabilized ions. Causes massive structural damage." },
        { name: "Blackjack", type: "Beam", tech: { Energy: 6 }, mass: 10, cost: { bor: 16, res: 7 }, stats: { "Pwr": 90, "Rng": 0, "Sweep": 0, "Spec": "Ram" }, img: "weap-blackjack", description: "Kinetic-assist ram. Devastating at zero range, useless against mines." },
        { name: "Phasor", type: "Beam", tech: { Energy: 7 }, mass: 2, cost: { bor: 14, res: 18 }, stats: { "Pwr": 120, "Rng": 3, "Sweep": 360 }, img: "weap-phasor", description: "Phased energy rectification. Maintains damage at long ranges." },
        { name: "Phaser Bazooka", type: "Beam", tech: { Energy: 8 }, mass: 2, cost: { bor: 8, res: 11 }, stats: { "Pwr": 26, "Rng": 2, "Sweep": 52 }, img: "weap-ph-bazooka", description: "Heavy mount phaser with extended emitters." },
        { name: "Gatling Gun", type: "Beam", tech: { Energy: 9 }, mass: 3, cost: { bor: 20, res: 13 }, stats: { "Pwr": 31, "Rng": 2, "Sweep": 124, "Spec": "Gatling" }, img: "weap-gatling", description: "Rapid-fire plasma caster. The gold standard for mine sweeping." },
        { name: "Bludgeon", type: "Beam", tech: { Energy: 11 }, mass: 10, cost: { bor: 22, res: 9 }, stats: { "Pwr": 231, "Rng": 0, "Sweep": 0, "Spec": "Ram" }, img: "weap-bludgeon", description: "Massive blunt-force energy ram. Crushes enemy hulls on contact." },
        { name: "Heavy Blaster", type: "Beam", tech: { Energy: 13 }, mass: 2, cost: { bor: 20, res: 25 }, stats: { "Pwr": 66, "Rng": 3, "Sweep": 198 }, img: "weap-h-blaster", description: "High-yield blaster variant used on capital ships." },
        { name: "Big Mutha Cannon", type: "Beam", tech: { Energy: 20 }, mass: 3, cost: { bor: 36, res: 23 }, stats: { "Pwr": 204, "Rng": 2, "Sweep": 816, "Spec": "Gatling" }, img: "weap-big-mutha", description: "The ultimate mine sweeper. Fires hundreds of gigawatt pulses per second." },
        { name: "Alpha Torp", type: "Torp", tech: { Kinetics: 1 }, mass: 25, cost: { iron: 9, bor: 3, germ: 3, res: 5 }, stats: { "Dmg": 12, "Acc": "65%", "Rng": 4 }, img: "weap-torp-alpha", description: "Early guided missile. Useful for kiting enemies." },
        { name: "Rho Torp", type: "Torp", tech: { Kinetics: 5 }, mass: 25, cost: { iron: 34, bor: 12, germ: 8, res: 12 }, stats: { "Dmg": 50, "Acc": "85%", "Rng": 5 }, img: "weap-torp-rho", description: "Standard fleet torpedo for the mid-game." },
        { name: "Anti-Matter Torp", type: "Torp", tech: { Kinetics: 8 }, mass: 8, cost: { iron: 3, bor: 8, germ: 1, res: 50 }, stats: { "Dmg": 150, "Acc": "90%", "Rng": 6 }, img: "weap-torp-anti", description: "Delivers a containment pod of anti-matter. Total annihilation." },
        { name: "Smart Bomb", type: "Bomb", tech: { Kinetics: 3 }, mass: 50, cost: { iron: 1, bor: 22, res: 27 }, stats: { "Kill": "1.3%", "Min": 300 }, img: "weap-bomb-smart", description: "Targets population centers while leaving factories intact." },
        { name: "Cherry Bomb", type: "Bomb", tech: { Kinetics: 6 }, mass: 52, cost: { iron: 1, bor: 25, res: 11 }, stats: { "Kill": "2.5%", "Struct": "High" }, img: "weap-bomb-cherry", description: "High-yield tactical nuke. Causes massive collateral damage." }
      ]
    }
  ]
};