# Technology Strand Consolidation: 6 to 4 Fields

## Overview
This document details the consolidation of Stars! technology strands from the original 6 fields to a streamlined 4 fields for the mobile version.

## Mapping: Original 6 Fields → New 4 Fields

### Original 6 Tech Fields:
1. **Energy** - Energy physics, shields, beams
2. **Weapons** - Kinetic weapons, missiles, torpedoes
3. **Propulsion** - Engines, fuel systems, movement
4. **Construction** - Hulls, armor, structural components
5. **Electronics** - Computers, scanners, cloaking, jamming
6. **BioTech** - Biological systems, terraforming, life support

### New 4 Tech Fields:
1. **Energy** - Energy physics, shields, scanners, cloaking, beam weapons
2. **Kinetics** - Kinetic weapons, missiles, torpedoes, bombs
3. **Propulsion** - Engines, fuel systems, movement, maneuvering
4. **Construction** - Hulls, armor, mechanical structures, starbases

## Field Consolidation Rules:

### Energy (Enhanced Scope)
- **Original Energy** → **Energy** (1:1 mapping)
- **Electronics** → **Energy** (absorbed into Energy)
  - Scanners, cloaking, jamming systems
  - Computer systems and capacitors
  - Electronic warfare components

### Kinetics (New Field)
- **Weapons** → **Kinetics** (renamed)
- **BioTech** → **Kinetics** (partially absorbed)
  - Bio-weapons and terraforming bombs
  - Weapon-related biotech components

### Propulsion (Unchanged)
- **Propulsion** → **Propulsion** (1:1 mapping)

### Construction (Enhanced Scope)  
- **Original Construction** → **Construction** (1:1 mapping)
- **BioTech** → **Construction** (partially absorbed)
  - Life support systems for hulls
  - Organic armor and structural components
  - Non-weapon terraforming equipment

## Component Migration Status

### ✅ Successfully Updated (New 4-Field System):
- `mass-drivers.data.ts` ✅
- `weapons.data.ts` ✅ (beam weapons use Energy field)
- `engines.data.ts` ✅ (converted from 6-field)
- `electronics.data.ts` ✅ (Electronics merged into Energy)  
- `planetary.data.ts` ✅ (Electronics→Energy, BioTech→Construction)
- `defenses.data.ts` ✅ (Electronics→Energy, BioTech→Construction)
- `scanners.data.ts` ✅ (Electronics→Energy)
- `terraforming.data.ts` ✅ (BioTech→Construction/Kinetics)
- `orbitals.data.ts` ✅ (field mapping applied)
- `stargates.data.ts` ✅ (Electronics→Energy)
- `mechanical.data.ts` ✅ (field mapping applied)
- `cargo.data.ts` ✅ (field mapping applied) 
- `bombs.data.ts` ✅ (Weapons→Kinetics, BioTech→Kinetics)
- `mines.data.ts` ✅ (Weapons→Kinetics)

### 🔧 Type System Updates:
- `tech-atlas.types.ts` ✅ (TechRequirement interface updated)
- `tech-tree.data.ts` ✅ (already using 4-field system)

**ALL MIGRATIONS COMPLETE** - System successfully consolidated from 6 to 4 tech strands.

## Side Effects

### Many Techs at Level Zero
As noted, many technologies will be set to level zero in unused fields:
- **Weapons** field components → **Kinetics** (Weapons = 0)
- **Electronics** field components → **Energy** (Electronics = 0)
- **BioTech** field components → **Construction/Kinetics** (BioTech = 0)

### Benefits of 4-Field System:
1. **Simplified Research** - Fewer tech trees to manage
2. **Clearer Categories** - More intuitive groupings
3. **Mobile-Friendly** - Less screen complexity
4. **Balanced Progression** - More even distribution of tech unlocks

## Implementation Notes

1. **Type System**: `TechRequirement` interface updated to only include 4 fields
2. **Tech Tree**: Already uses 4-field system with proper categories
3. **Components**: Individual component data needs systematic migration
4. **Validation**: All components should have exactly 4 tech requirement fields

## Restoration Instructions

To restore the original 6-field system in the future:
1. Revert `TechRequirement` interface to include all 6 fields
2. Update `TECH_FIELDS` in `tech-tree.data.ts` to include Electronics and BioTech
3. Migrate component tech requirements back using reverse mapping rules above
4. Re-balance tech levels based on original Stars! specifications

---
*Generated: December 27, 2025*  
*Status: ✅ IMPLEMENTATION COMPLETE - All tech data successfully consolidated to 4-field system*