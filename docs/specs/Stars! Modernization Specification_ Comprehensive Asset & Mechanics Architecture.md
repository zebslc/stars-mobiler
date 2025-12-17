# **Stars\! Modernization Specification: Comprehensive Asset & Mechanics Architecture**

## **1\. Executive Summary and Architectural Vision**

The purpose of this report is to provide an exhaustive technical and mechanical specification for the reconstruction of the seminal 1995 strategy game "Stars\!" for modern mobile platforms, utilizing Microsoft Azure cloud infrastructure and a SQL backend. "Stars\!" is distinguished in the 4X (Explore, Expand, Exploit, Exterminate) genre by its unparalleled mathematical depth and "spreadsheet-first" interface. To successfully adapt this title for a modern audience—specifically on mobile devices where screen real estate is at a premium—requires a fundamental reimagining of the user interface (UI) while preserving the complex, deterministic logic that defines the simulation \[Man\_95\].

This modernization project operates under the core philosophy that the backend simulation must remain faithful to the original algorithms, while the frontend client serves as a simplified, high-fidelity viewport into that simulation \`\`.

## ---

**2\. Infrastructure Specification: Azure and SQL Architecture**

The transition from a monolithic Windows 3.1 executable to a cloud-native architecture necessitates a shift from local state management to a distributed, transactional model.

### **2.1 The Data Layer: SQL Schema Design**

The Universe schema serves as the root of the hierarchy. Each game instance is a row in the Games table. The Planets table is the most transaction-heavy entity.

| Column Name | Data Type | Description |
| :---- | :---- | :---- |
| PlanetID | BIGINT | Primary Key, synthetic. |
| GameID | INT | Foreign Key to Games table. |
| X\_Coord | INT | Cartesian X coordinate (0-2000). |
| Y\_Coord | INT | Cartesian Y coordinate (0-2000). |
| OwnerID | INT | Foreign Key to Players. NULL if unowned. |
| Base\_Grav | DECIMAL(5,2) | Intrinsic Gravity (0.12 to 8.00). |
| Base\_Temp | INT | Intrinsic Temperature (-200 to \+200). |
| Base\_Rad | INT | Intrinsic Radiation (0 to 100). |
| Mines | INT | Count of mineral extraction facilities. |
| Factories | INT | Count of industrial production facilities. |
| Population | BIGINT | Current colonist count (1 \= 100 people). |
| Iron\_Conc | TINYINT | Mineral concentration % (0-120). |
| Boranium\_Conc | TINYINT | Mineral concentration % (0-120). |
| Germanium\_Conc | TINYINT | Mineral concentration % (0-120). |

**Implication:** The Concentration columns are critical. Unlike other strategy games where resources are static, "Stars\!" uses a depletion model. As minerals are mined, the Concentration value in the database must be decremented based on the extraction volume, asymptotically approaching a floor value. This requires a specific stored procedure, Update\_Planet\_Resources, to run during the turn generation phase \[Goz\_FAQ\].

### **2.2 The Compute Layer: Serverless Turn Generation**

The "Host" process is a batch job. Azure Durable Functions are recommended for this orchestration. The Host\_Turn\_Process executes the "Order of Operations" strictly:

1. **Gate Deployment:** Ships ordered to deploy stargates do so immediately.  
2. **Packet Movement:** Mass driver packets (kinetic transport) move along their vectors.  
3. **Fleet Movement:** Ships update coordinates; collision detection against minefields.  
4. **Combat Resolution:** If hostile entities share coordinates, the battle engine resolves the conflict.  
5. **Planetary Production:** Surviving colonies produce units and research.  
6. **Environment Updates:** Terraforming calculations are applied; population growth occurs.

## ---

**3\. The Biological Imperative: Race Design and Habitability**

The "Stars\!" race design system dictates the economic velocity and logistical constraints of the player.

### **3.1 The Primary Racial Traits (PRT)**

The PRT serves as the archetype for the race.

* **Hyper-Expansion (HE):** Growth coefficient x2.0. Research efficiency capped at 50%.  
* **Super-Stealth (SS):** Intrinsic reduction in hull visibility. Ability to steal cargo without war declaration.  
* **War Monger (WM):** Access to Dreadnoughts at Construction 15\. Intrinsic accuracy bonus.  
* **Packet Physics (PP):** Mass drivers act as weapons (no decay).  
* **Artificial Reality (AR):** Population consumes Energy instead of resources.  
* **Interstellar Traveler (IT):** Starts with advanced drive tech; ships can carry stargates.

### **3.2 The Mathematics of Habitability**

The core of "Stars\!" is the "Habitable Range." Planets are defined by three axes: Gravity (G), Temperature (T), and Radiation (R).  
The habitability match (HabVal) is calculated using the geometric mean of the deviations on all three axes:  
$Hab\_{Axis} \= 100 \- \\frac{|Planet\_{Val} \- Ideal\_{Val}|}{Tolerance} \\times 100$  
$Hab\_{Total} \= \\sqrt{\\frac{Hab\_{G} \\times Hab\_{T} \\times Hab\_{R}}{100}} \\times 100$  
**Strategic Insight:** If any single axis falls below 0% (outside tolerance), the planet is uninhabitable (Red). If the total is positive, it is habitable (Green/Yellow).

## ---

**4\. Planetary Economics and Infrastructure**

### **4.1 Planet Types & Mineral Generation**

In "Stars\!", planets are not categorized by biome (e.g., "Desert", "Ice") but by their mathematical stats. However, for the mobile UI, we can map these stats to visual archetypes:

| Visual Archetype | Gravity | Temperature | Radiation | Database Range |
| :---- | :---- | :---- | :---- | :---- |
| **Rock/Barren** | High (\>1.5g) | Variable | Low | Common |
| **Gas Giant** | Very High (\>4.0g) | Cold | High | Rare |
| **Ice World** | Variable | Very Cold (\<-100C) | Variable | Common |
| **Inferno** | Variable | Very Hot (\>100C) | Variable | Common |
| **Radioactive** | Variable | Variable | Very High (\>85) | Uncommon |

**Resource Concentrations:** When the universe is generated, each planet is assigned mineral concentrations (0% to 120%) based on the "Universe Density" setting.

* **High Iron:** Essential for Hull/Armor heavy strategies.  
* **High Germanium:** Essential for Factory/Industry scaling.  
* **High Boranium:** Essential for Beam Weapon/Shield strategies.

### **4.2 Production Queues**

The mobile UI should implement a "Role Based" governor to manage the thousands of planets:

* **Shipyard:** Prioritizes Starbase upgrades and Hull construction.  
* **Mining Outpost:** Prioritizes Mines until Mines \== Max\_Mines.  
* **Research Hub:** Prioritizes Factories and allocates 100% of PP to Research.

## ---

**5\. Comprehensive Hull Database Specification**

The following table consolidates the standard "Stars\!" hull specifications with the user-provided "Visual Slot Layout" templates. The "Slots" column uses standard notation (E=Engine, W=Weapon, S=Shield, G=General, C=Computer/Elec).

*Note on Visual Layout:* The templates provided (e.g., 00 \#\#) are stored in the Ship\_Design\_Templates table as JSON grids to render the "Ship Internals" view in the mobile client.

| Hull Class | Mass | Fuel | Cost (Y/B) | Tech Req | Slots (Std) | Visual Grid (RxC) | Role |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Small Freighter** | 15kt | 2500mg | 30 Y | Con 0 | 1E, 1S, 2G (Cargo) | 00\#\#2211 | Early Transport |
| **Medium Freighter** | 45kt | 9000mg | 80 Y | Con 3 | 1E, 1S, 2G (Cargo) | 00\#\#\#\#2211 | Bulk Transport |
| **Large Freighter** | 120kt | 35000mg | 160 Y | Con 6 | 1E, 2S, 3G (Cargo) | 00\#\#\#\#11 | Heavy Logistics |
| **Super Freighter** | 240kt | 150000mg | 300 Y | Con 11 | 2E, 2S, 3G (Cargo) | 00\#\#\#\#22 | Empire Supply |
| **Scout** | 8kt | 500mg | 10 Y | Con 0 | 1E, 1G, 1C | 002211 | Recon / Chaff |
| **Frigate** | 14kt | 1100mg | 30 Y | Con 0 | 1E, 2W, 1G, 1S | 00332211 | Early Skirmish |
| **Destroyer** | 35kt | 3500mg | 90 Y | Con 4 | 1E, 3W, 1G, 1C | 004433... | Mine Layer / Support |
| **Cruiser** | 140kt | 15000mg | 220 Y | Con 8 | 2E, 4W, 1G, 2S | 00116655... | Main Battle Line |
| **Battle Cruiser** | 260kt | 35000mg | 380 Y | Con 11 | 2E, 6W, 2G, 2S | 00226655... | Heavy Striker |
| **Battleship** | 500kt | 75000mg | 550 Y | Con 16 | 3E, 8W, 3G, 4S | 0099882211 | Capital Siege |
| **Dreadnought** | 1000kt | 200000mg | 900 Y | Con 20 | 4E, 12W, 4G, 5S | 005599aacc | Fleet Anchor |
| **Privateer** | 35kt | 2000mg | 60 Y | PRT Only | 1E, 2W, 1G, 1C | 00\#\#\#\#11 | Cargo Theft (Silent) |
| **Rogue** | 40kt | 3000mg | 90 Y | PRT Only | 1E, 2W, 1G, 1C | 774466... | Stealth Bomber |
| **Galleon** | 120kt | 25000mg | 320 Y | PRT Only | 2E, 4G (Cargo) | 1133... | Armed Transport |
| **Mini-Colony** | 20kt | 1000mg | 20 Y | Con 0 | 1E, 1G (Colony) | 00\#\#11 | Seed Ship |
| **Colony Ship** | 40kt | 2500mg | 40 Y | Con 2 | 1E, 1S, 1G (Colony) | 00\#\#11 | Standard Colonizer |
| **Bombers (B17/52)** | Var | Var | Var | Var | High Payload Slots | 00112233 | Planet Killer |
| **Miners (Mini/Ult)** | Var | Var | Var | Var | Mining Robot Slots | 00223311 | Remote Mining |
| **Fuel Xport** | Var | Var | Var | Var | Fuel Tank Slots | 0011 | Tanker |
| **Mine Layers** | Var | Var | Var | Var | Dispenser Slots | 0011 | Area Denial |
| **Space Station** | Fixed | N/A | Var | Con 3 | Dock/Defense | 9900\#\#aabb | Orbital Hub |
| **Death Star** | Fixed | N/A | High | Con 26 | Massive W/S | 7700ee... | Ultimate Defense |

Database Logic:  
The Ship\_Hulls table must store the Bitmask for slot permissions. For example, a "General" slot allows Cargo, Scanners, or Armor, but not Weapons. The ASCII templates provided by the client serve as the UI mapping layer—when a player taps "Slot \#", the backend SlotID is referenced to return the valid components list.

## ---

**6\. Weapon & Component Database**

### **6.1 Weapon Classes**

Weapons are the primary consumers of the "Boranium" resource. The database divides them into three categories.

#### **Beam Weapons (Dissipation Logic)**

Beams lose damage over distance.

* *Formula:* $Dmg \= Base \\times (1 \- (Range \\times DropOff))$.  
* *Shields:* Beams hit shields first.

| Weapon Name | Tech | Dmg | Range | Init | Cost | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Laser** | Weap 1 | 10 | 0 | 1 | 2B | Starter weapon. |
| **Disruptor** | Weap 10 | 35 | 2 | 4 | 12B | Standard mid-game beam. |
| **Heavy Blaster** | Weap 16 | 225 | 1 | 8 | 38B | High damage, short range. |
| **Phasor** | Weap 16 | 120 | 3 | 7 | 45B | Long range sniper. |
| **Big Mutha Cannon** | Weap 26 | 500 | 3 | 10 | 250B | Capital ship killer. |
| **Gatling Gun** | Weap 6 | 4 | 0 | 12 | 15B | "Shield Stripper" (4 shots). |

#### **Torpedoes (Flat Damage Logic)**

Torpedoes deal constant damage but can miss. They have a travel speed (usually 1-2 turns, but in standard Stars\! combat is instant, accuracy is the variable).

* *Formula:* Hit\_Chance \= Base\_Acc \+ (Comp\_Level\_Diff).

| Weapon Name | Tech | Dmg | Acc | Cost | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Alpha Torp** | Weap 5 | 12 | 65% | 5B | Early kiting weapon. |
| **Rho Torp** | Weap 11 | 50 | 85% | 15B | Reliable workhorse. |
| **Anti-Matter** | Weap 18 | 150 | 90% | 45B | Heavy torpedo. |
| **Armageddon** | Weap 26 | 300 | 95% | 120B | Base siege weapon. |

#### **Bombs (Planetary Interaction)**

Bombs are used in the "Bombardment Phase" to reduce population/structures.

* **Smart Bombs:** Kill pop, save factories (for capture).  
* **Cherry Bomb:** High structure damage.  
* **Enriched Neutron Bomb:** Max kill radius.

### **6.2 Tech Tree & Miniaturization**

As described in the user's requirements, components must "Miniaturize" (reduce mass/cost) as Tech Level increases \`\`.

* **SQL Logic:** Get\_Component\_Stats(PlayerID, ComponentID)  
  * Effective\_Mass \= Base\_Mass \* (1 \- (Player\_Tech\_Level \- Req\_Level) \* 0.04)  
  * *Cap:* Mass cannot drop below 20% of base.

## ---

**7\. Logistics and The Math of Movement**

### **7.1 Fuel and Engines**

The Fuel\_Usage formula is exponential, creating a soft cap on speed.

* **Formula:** $Fuel \= (HullMass \\times Distance) \\times (SpeedFactor)^N$.  
* **Engines:**  
  * *Settler's Delight:* Cheap, Fuel Efficient, Warp 6 Max.  
  * *Trans-Galactic Drive:* Expensive, Warp 10 capable.  
  * *Radiating Hydro-Ram:* Built-in Ramscoop (generates fuel).

### **7.2 Mass Driver Physics**

Mass drivers launch mineral packets.

* **Packet Physics:** Packets travel at a set Warp speed.  
* **Damage:** If the target planet lacks a Mass Driver to "catch" the packet, it impacts.  
  * $Damage \= Mass \\times Warp^2$.  
  * *Strategic Use:* "Rock throwing" is a valid end-game tactic to wipe out enemy populations.

## ---

**8\. Mobile User Interface Strategy**

Based on 4X mobile UI research \`\`, the interface must handle high data density without clutter.

### **8.1 The "Dashboard" Paradigm**

Instead of a crowded map, the default view is a "SitRep Dashboard".

* **Action Cards:** "3 Fleets Idle", "Research Complete", "Combat at Planet X".  
* **One-Thumb Design:** Critical actions (Next Turn, Build) located in the bottom 30% of the screen \`\`.

### **8.2 Ship Design UI (Paper Doll)**

The user's ASCII templates will be visualized as a schematic.

* **Interaction:** Tapping a slot opens a drawer with valid components.  
* **Delta-Stats:** Selecting a component immediately shows \+15 Dmg / \+50 Cost in green/red text.

### **8.3 Combat Replay**

Since combat is server-side, the client receives a JSON Combat\_Log. The client acts as a "Replay Viewer," rendering the battle with sprites and particle effects based on the deterministic log.

## ---

**9\. Artificial Intelligence: The "AutoHost" Logic**

The AI must operate without cheating \`\`.

1. **Colonization Agent:** Scores planets by (Habitability \* Minerals) / Distance.  
2. **Design Agent:** Analyses enemy combat logs. If losing to Missiles, increases Beam\_Defense and Jamming on new designs.  
3. **Economy Agent:** Maintains the "Golden Ratio" of Factories to Mines. If Iron\_Stockpile \> 5000, builds Ship Hulls. If Iron \< 100, builds Mines.

## **10\. Conclusion**

This specification provides the database schema, mathematical formulas, and asset rosters required to rebuild "Stars\!". By adhering to the exact hull slots and weapon physics while modernizing the UI for mobile workflows, the project can capture the depth of the 1995 classic.

### **Citations**

* **\[Man\_95\]**: *Stars\! User Manual*, Jeff Johnson & Jeff McBride.  
* **\[Goz\_FAQ\]**: *Gozzig's Stars\! FAQ*, v2.1.  
* \*\*\*\*: Market Price Formula & Production Math.  
* \*\*\*\*: *Craig Stars* Open Source Clone Reference.  
* \*\*\*\*: Mobile 4X UI Design Patterns.