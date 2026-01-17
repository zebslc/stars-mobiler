# Racial Trait Filtering Fix Verification

## Issue
The system was not correctly filtering items by their primary and lesser racial traits. For instance, Terrans (who have "Jack of All Trades" as their primary racial trait) could see the Mini-Colony Ship even though that hull requires "Hyper Expansion" as a primary racial trait.

## Root Cause
The `getAvailableHulls()` method in `ShipComponentEligibilityService` was only filtering hulls by tech level (Construction level), but was NOT checking for racial trait requirements. This was inconsistent with how components were being filtered.

## Fix Applied

### Files Modified:
1. **`src/app/services/ship-design/ship-component-eligibility.service.ts`**
   - Updated `getAvailableHulls()` to accept `species` parameter (optional, defaults to null)
   - Added filtering logic to check hull racial trait requirements
   - Added `meetsHullTraitRequirements()` private method to check hull trait requirements

2. **`src/app/services/ship-design/ship-design-availability.service.ts`**
   - Updated `getAvailableHulls()` to pass species from state to the eligibility service

3. **`src/app/services/ship-design/ship-design-template.service.ts`**
   - Updated `getAvailableHulls()` and `getAvailableTemplates()` to accept species parameter
   - Added helper methods for trait checking (consistency with eligibility service)

4. **`src/app/models/service-interfaces.model.ts`**
   - Updated `IShipDesignTemplateService` interface to reflect new method signature

## Filtering Logic

The hull trait filtering follows the same AND/OR logic as component filtering:

1. **Primary Racial Trait Required** (`primaryRacialTraitRequired`): 
   - Player must have ALL traits listed (AND logic)
   - Example: Mini-Colony Ship requires `['Hyper Expansion']`

2. **Primary Racial Trait Unavailable** (`primaryRacialTraitUnavailable`):
   - Player cannot have ANY of the traits listed (OR logic)
   - Having any forbidden trait blocks the hull

3. **Lesser Racial Trait Required** (`lesserRacialTraitRequired`):
   - Player must have ALL traits listed (AND logic)

4. **Lesser Racial Trait Unavailable** (`lesserRacialTraitUnavailable`):
   - Player cannot have ANY of the traits listed (OR logic)

## Test Cases

### Before Fix:
- **Terrans** (Primary: Jack of All Trades) could see:
  - ✗ Mini-Colony Ship (requires Hyper Expansion) - **INCORRECTLY VISIBLE**
  - ✗ Meta-Morph (requires Hyper Expansion) - **INCORRECTLY VISIBLE**

### After Fix:
- **Terrans** (Primary: Jack of All Trades) can see:
  - ✓ Colony Ship (no trait requirements)
  - ✓ Standard hulls (no trait requirements)
  - ✗ Mini-Colony Ship (requires Hyper Expansion) - **CORRECTLY HIDDEN**
  - ✗ Meta-Morph (requires Hyper Expansion) - **CORRECTLY HIDDEN**

## Hulls with Racial Trait Requirements

From the codebase, these hulls have trait requirements:

### Primary Racial Trait Required:
- **Mini-Colony Ship**: Requires `['Hyper Expansion']`
- **Meta-Morph**: Requires `['Hyper Expansion']`
- **Rogue**: Requires `['Super Stealth']`
- **Battle Cruiser**: Requires `['War Monger']`
- **Dreadnought**: Requires `['War Monger']`
- **Shadow Armor hull**: Requires `['Super Stealth']`
- **Mini-Bomber**: Requires `['Super Stealth']`
- **Cloaked Transport**: Requires `['Inner Strength']`
- **Orbital Adjuster**: Requires `['Alternate Reality']`

### Lesser Racial Trait Required:
- **Starbases with Improved Starbases**: Requires `['Improved Starbases']`
- **Mining hulls with Advanced Remote Mining**: Requires `['Advanced Remote Mining']`

## Testing
To verify the fix:
1. Create a new ship design as Terrans
2. Open hull selection
3. Verify that Mini-Colony Ship and Meta-Morph are NOT shown in available hulls
4. Switch to a species with Hyper Expansion (if available in game)
5. Verify that Mini-Colony Ship and Meta-Morph ARE shown
