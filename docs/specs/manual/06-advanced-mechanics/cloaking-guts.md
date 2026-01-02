# The Guts of Cloaking

> Cloak calculations for empty ships and fleets, tachyon detector effects, and cloaking appendix.

## Related Sections

- [Scanning & Cloaking](../04-gameplay/scanning-cloaking.md)

---

## CLOAKING WHEN THE SHIP IS EMPTY

To determine the total number of cloaking units for an unladen ship, read the

Cloaking Device Cloak Units/kT Transport Cloak* Depleted Neutronium Armor* 50 Chameleon Scanner* For example, an empty ship with a Stealth Cloak has 70 cloak units/kT, or 35% cloaking. By itself, the ship is visible to enemy scanners at only 35% of their

When a cloaked ship has cargo, we need to recalculate the number of cloak units/kT available. Let’s say this ship is a small freighter with a Quick Jump 5 engine, Tritanium Armor, and a Stealth Cloak. Empty, it weighs 91kT, with 70 cloak units/kT, and is cloaked at 35%. If you completely fill this particular


freighter with cargo, it weighs 161kT. To calculate the new cloaking 1. Calculate the total number of cloaking units for the ship: Max_cloak_units/kT x Ship_mass_empty. Example: 70 units/kT x 91kT = 6370 total cloak units Example: 6370 / 161 kT = ~40 units/kT

### Use the following chart to learn how much coverage a given number of

cloaking units provides.

At 40 cloak units/kT, the loaded freighter in our example is now only 20% cloaked. The following table provides exact numbers at certain points on the

100 units/kT 50% cloaked

300 units/kT 75% cloaked

600 units/kT 87.5% cloaked

1000 units/kT 93.75% cloaked


## CLOAKING FOR A FLEET WITH MORE THAN ONE SHIP

In a fleet with more than one ship, uncloaked ships are counted as cargo when calculating units/kT. Let’s place our empty freighter in a fleet with an affect cloaking for empty scout that has a Quick Jump 5 engine, Laser, and a Bat Scanner, which Super Stealth trait. weighs 15kT when empty. The entire fleet weighs 106kT, so traveling together, this fleet would be 6370 / 106 = ~60 units/kT, approximately 30% cloaked.

## THE EFFECT OF MULTIPLE TACHYON DETECTORS

When a hull has more than one Tachyon Detector in its design, the

95% ^ (SQRT(#_of_detectors) = Reduction in other player’s cloaking

## THE APPENDIX OF CLOAKING

Here’s pseudo code you can use to determine cloaking percentage from

end if


25 THE GUTS OF MASS DRIVERS

