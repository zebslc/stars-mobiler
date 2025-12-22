# =============================================================================
# Stars! Mobile Asset Builder v8 (Deterministic + Sync-safe)
# Usage: pwsh build-assets-v8.ps1
# Requires: ImageMagick (magick)
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -----------------------------
# CONFIG
# -----------------------------
$SpriteSize = 64
$outputImage = "tech-atlas.png"
$outputCSS   = "tech-atlas.css"
$tempDir     = "temp_sprites_v8"

# IMPORTANT: match the checked-in CSS background-image URL
# tech-atlas.css currently uses: /assets/imagemaps/tech-atlas.png
$cssBackgroundUrl = "/assets/imagemaps/tech-atlas.png"

# If true, missing source images produce a transparent placeholder
# so the atlas ordering and CSS class indices never shift.
$usePlaceholdersForMissingSources = $true

# -----------------------------
# RESET
# -----------------------------
$assets = @()
$spriteList = @()

# -----------------------------
# DEFINE ASSETS
# -----------------------------
# Format: Source Col Row (0-based, each sprite is 64x64)
# Col 0=X:0, Col 1=X:64, Col 2=X:128, etc.
# Row 0=Y:0, Row 1=Y:64, Row 2=Y:128, etc.

# --- ENGINES ---
$assets += @{ Name= "eng-quick-jump-5";              Source="techs02.png"; Col=0; Row=0 }
$assets += @{ Name= "eng-long-hump-6";               Source="techs02.png"; Col=1; Row=0 }
$assets += @{ Name= "eng-daddy-long-legs-7";         Source="techs02.png"; Col=3; Row=0 }
$assets += @{ Name= "eng-alpha-drive-8";             Source="techs02.png"; Col=4 Row=0 }
$assets += @{ Name="eng-sub-galactic-fuel-scoop";        Source="techs02.png"; Col=5; Row=0 }
$assets += @{ Name = "eng-trans-galactic-drive"; Source = "techs02.png"; Col = 5; Row = 0 }
$assets += @{ Name="eng-trans-galactic-fuel-scoop";      Source="techs02.png"; Col=6; Row=0 }
$assets += @{ Name="eng-radiating-hydro-ram-scoop";       Source="techs02.png"; Col=7; Row=0 }
$assets += @{ Name = "eng-settlers-delight"; Source = "techs02.png"; Col = 0; Row = 1 }
$assets += @{ Name = "eng-fuel-mizer"; Source = "techs02.png"; Col = 1; Row = 1}
$assets += @{ Name="eng-trans-galactic-super-scoop"; Source="techs02.png"; Col=2; Row=1 }
$assets += @{ Name="eng-trans-galactic-mizer-scoop"; Source="techs02.png"; Col=3; Row=1 }
$assets += @{ Name = "eng-interspace-10"; Source = "techs02.png"; Col = 4; Row = 1 }
$assets += @{ Name = "eng-trans-star-10"; Source = "techs04.png"; Col = 5; Row = 2 } # not 2
$assets += @{ Name = "eng-sub-galaxy-scoop"; Source = "techs06.png"; Col = 7; Row = 3 }

# --- STARGATES ---
$assets += @{ Name = "gate-std"; Source = "techs05.png"; Col = 0; Row = 2 }
$assets += @{ Name = "gate-weight"; Source = "techs05.png"; Col = 1; Row = 2 }
$assets += @{ Name = "gate-distance"; Source = "techs05.png"; Col = 4; Row = 2 }
$assets += @{ Name = "gate-any"; Source = "techs05.png"; Col = 6 Row = 2 }

# --- MASS DRIVERS ---
$assets += @{ Name = "driver-std"; Source = "techs05.png"; Col = 7; Row = 2 }
$assets += @{ Name = "driver-super"; Source = "techs05.png"; Col = 2; Row = 3 }
$assets += @{ Name = "driver-ultra"; Source = "techs05.png"; Col = 5; Row = 3 }

# --- BEAM WEAPONS ---
$assets += @{ Name = "weap-laser"; Source = "techs02.png"; Col = 4; Row = 3 }
$assets += @{ Name = "weap-xray"; Source = "techs02.png"; Col = 5; Row = 3 }
$assets += @{ Name = "weap-minigun"; Source = "techs02.png"; Col = 4; Row = 2 }
$assets += @{ Name = "weap-yakimora"; Source = "techs02.png"; Col = 3; Row = 2 }
$assets += @{ Name = "weap-disruptor"; Source = "techs02.png"; Col = 3; Row = 3 }
$assets += @{ Name = "weap-phazer-bazooka"; Source = "techs02.png"; Col = 5; Row = 2 }
$assets += @{ Name = "weap-gatling"; Source = "techs02.png"; Col = 2; Row = 3 }
$assets += @{ Name = "weap-big-mutha"; Source = "techs02.png"; Col = 7; Row = 3 }
$assets += @{ Name = "weap-bludgeon"; Source = "techs02.png"; Col = 7; Row = 1 }
$assets += @{ Name = "weap-blackjack"; Source = "techs02.png"; Col = 6; Row = 1 }
$assets += @{ Name = "weap-pulsed-sapper"; Source = "techs02.png"; Col = 1; Row = 2 }
$assets += @{ Name = "weap-colloidal-phaser"; Source = "techs07.png"; Col = 0; Row = 0 }
$assets += @{ Name = "weap-mini-blaster"; Source = "techs02.png"; Col = 0; Row = 3 }
$assets += @{ Name = "weap-mark-iv-blaster"; Source = "techs02.png"; Col = 1; Row = 3 }
$assets += @{ Name = "weap-phased-sapper"; Source = "techs02.png"; Col = 2; Row = 2 }
$assets += @{ Name = "weap-heavy-blaster"; Source = "techs07.png"; Col = 1; Row = 0 }
$assets += @{ Name = "weap-gatling-neutrino"; Source = "techs02.png"; Col = 6; Row = 3 }
$assets += @{ Name = "weap-myopic-disrupter"; Source = "techs07.png"; Col = 2; Row = 0 }
$assets += @{ Name = "weap-mega-disrupter"; Source = "techs07.png"; Col = 3; Row = 0 }
$assets += @{ Name = "weap-streaming-pulverizer"; Source = "techs02.png"; Col = 6; Row = 2 }
$assets += @{ Name = "weap-anti-matter-pulverizer"; Source = "techs02.png"; Col = 7; Row = 2 }
$assets += @{ Name = "weap-syncro-sapper"; Source = "techs02.png"; Col = 0; Row = 3 }






# --- TORPEDOES & MISSILES ---
$assets += @{ Name = "weap-torp-alpha"; Source = "techs01.png"; Col = 1; Row = 3 }
$assets += @{ Name = "weap-torp-beta"; Source = "techs01.png"; Col = 2; Row = 3 }
$assets += @{ Name = "weap-torp-delta"; Source = "techs01.png"; Col = 3; Row = 3 }
$assets += @{ Name = "weap-torp-epsilon"; Source = "techs01.png"; Col = 4; Row = 3 }
$assets += @{ Name = "weap-torp-rho"; Source = "techs01.png"; Col = 5; Row = 3 }
$assets += @{ Name = "weap-torp-upsilon"; Source = "techs01.png"; Col = 7; Row = 3 }
$assets += @{ Name = "weap-torp-omega"; Source = "techs01.png"; Col = 6; Row = 3 }
$assets += @{ Name = "weap-torp-anti"; Source = "techs04.png"; Col = 4; Row = 1 }
$assets += @{ Name = "weap-missile-jihad"; Source = "techs07.png"; Col = 0; Row = 1 }
$assets += @{ Name = "weap-missile-juggernaut"; Source = "techs07.png"; Col = 1; Row = 1 }
$assets += @{ Name = "weap-missile-doomsday"; Source = "techs07.png"; Col = 2; Row = 1 }
$assets += @{ Name = "weap-missile-armageddon"; Source = "techs07.png"; Col = 3; Row = 1 }

# --- BOMBS ---
$assets += @{ Name = "weap-bomb-lady"; Source = "techs03.png"; Col = 3; Row = 0 }
$assets += @{ Name = "weap-bomb-black-cat"; Source = "techs03.png"; Col = 0; Row = 1 }
$assets += @{ Name = "weap-bomb-m70"; Source = "techs03.png"; Col = 1; Row = 1 }
$assets += @{ Name = "weap-bomb-m80"; Source = "techs03.png"; Col = 2; Row = 1 }
$assets += @{ Name = "weap-bomb-cherry"; Source = "techs03.png"; Col = 7; Row = 0 }
$assets += @{ Name = "weap-bomb-lbu17"; Source = "techs03.png"; Col = 3; Row = 1 }
$assets += @{ Name = "weap-bomb-lbu32"; Source = "techs03.png"; Col = 4; Row = 1 }
$assets += @{ Name = "weap-bomb-lbu74"; Source = "techs03.png"; Col = 5; Row = 1 }
$assets += @{ Name = "weap-bomb-retro"; Source = "techs03.png"; Col = 6; Row = 1 }
$assets += @{ Name = "weap-bomb-smart"; Source = "techs04.png"; Col = 0; Row = 2 }
$assets += @{ Name = "weap-bomb-neutron"; Source = "techs03.png"; Col = 4; Row = 0 }
$assets += @{ Name = "weap-bomb-enriched-neutron"; Source = "techs03.png"; Col = 7; Row = 1 }
$assets += @{ Name = "weap-bomb-peerless"; Source = "techs03.png"; Col = 0; Row = 2 }
$assets += @{ Name = "weap-bomb-annihilator"; Source = "techs03.png"; Col = 5; Row = 0 }

# --- MISSING BOMBS (these all exist in the data files, just need coordinates) ---
# Based on bombs.data.ts, no additional bombs needed - all 14 bombs are already defined above

# --- SHIELDS ---
$assets += @{ Name = "def-shield-mole"; Source = "techs03.png"; Col = 2; Row = 1 }
$assets += @{ Name = "def-shield-cow"; Source = "techs03.png"; Col = 3; Row = 1 }
$assets += @{ Name = "def-shield-wolf"; Source = "techs03.png"; Col = 4; Row = 1 }
$assets += @{ Name = "def-shield-croby"; Source = "techs03.png"; Col = 0; Row = 3 }
$assets += @{ Name = "def-shield-shadow"; Source = "techs03.png"; Col = 1; Row = 3 }
$assets += @{ Name = "def-shield-bear"; Source = "techs03.png"; Col = 2; Row = 3 }
$assets += @{ Name = "def-shield-gorilla"; Source = "techs03.png"; Col = 3; Row = 3 }
$assets += @{ Name = "def-shield-elephant"; Source = "techs03.png"; Col = 4; Row = 3 }
$assets += @{ Name = "def-shield-phase"; Source = "techs04.png"; Col = 7; Row = 2 }
$assets += @{ Name = "def-shield-langston"; Source = "techs04.png"; Col = 6; Row = 2 }

# --- ARMOR ---
$assets += @{ Name = "def-armor-tri"; Source = "techs01.png"; Col = 0; Row = 0 }
$assets += @{ Name = "def-armor-crob"; Source = "techs01.png"; Col = 1; Row = 0 }
$assets += @{ Name = "def-armor-neu"; Source = "techs01.png"; Col = 5; Row = 0 }
$assets += @{ Name = "def-armor-val"; Source = "techs01.png"; Col = 2; Row = 0 }

# --- MISSING ARMOR (need coordinates) ---
# $assets += @{ Name="def-armor-carbonic";              Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-strobnium";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-organic";               Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-kelarium";              Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-fielded-kelarium";      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-depleted-neutronium";   Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="def-armor-valanium";              Source="techs??.png"; Col=?; Row=? }

# --- COMPUTERS ---
$assets += @{ Name = "elec-comp-bat"; Source = "techs06.png"; Col = 5; Row = 0 }
$assets += @{ Name = "elec-comp-cyber"; Source = "techs06.png"; Col = 6; Row = 0 }
$assets += @{ Name = "elec-comp-nexus"; Source = "techs06.png"; Col = 7; Row = 0 }

# --- ELECTRICAL ---
$assets += @{ Name = "elec-jammer-10"; Source = "techs04.png"; Col = 0; Row = 3 }
$assets += @{ Name = "elec-jammer-20"; Source = "techs04.png"; Col = 1; Row = 3 }
$assets += @{ Name = "elec-jammer-50"; Source = "techs04.png"; Col = 2; Row = 3 }
$assets += @{ Name = "elec-cloak-stealth"; Source = "techs04.png"; Col = 3; Row = 0 }
$assets += @{ Name = "elec-cloak-super"; Source = "techs04.png"; Col = 4; Row = 0 }
$assets += @{ Name = "elec-capacitor"; Source = "techs04.png"; Col = 7; Row = 3 }

# --- MISSING ELECTRONICS (need coordinates) ---
# $assets += @{ Name="elec-jammer-30";                Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-flux-capacitor";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-energy-dampener";          Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-tachyon-detector";         Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-antimatter-generator";     Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-transport-cloak";          Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-stealth-cloak";            Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-super-stealth-cloak";      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-ultra-stealth-cloak";      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-battle-computer";          Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-battle-super-computer";    Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-battle-nexus";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="elec-energy-capacitor";         Source="techs??.png"; Col=?; Row=? }

# --- MECHANICAL ---
$assets += @{ Name = "mech-fuel-tank"; Source = "techs04.png"; Col = 0; Row = 1 }
$assets += @{ Name = "mech-super-tank"; Source = "techs04.png"; Col = 1; Row = 1 }
$assets += @{ Name = "mech-colony-mod"; Source = "techs04.png"; Col = 2; Row = 1 }
$assets += @{ Name = "mech-maneuver-jet"; Source = "techs04.png"; Col = 6; Row = 0 }
$assets += @{ Name = "mech-overthruster"; Source = "techs04.png"; Col = 7; Row = 0 }
$assets += @{ Name = "mech-robo-miner"; Source = "techs05.png"; Col = 4; Row = 1 }
$assets += @{ Name = "mech-auto-miner"; Source = "techs05.png"; Col = 5; Row = 1 }

# --- SCANNERS ---
$assets += @{ Name = "scan-viewer"; Source = "techs01.png"; Col = 0; Row = 2 }
$assets += @{ Name = "scan-rhino"; Source = "techs03.png"; Col = 0; Row = 2 }
$assets += @{ Name = "scan-mole"; Source = "techs03.png"; Col = 1; Row = 2 }
$assets += @{ Name = "scan-possum"; Source = "techs03.png"; Col = 2; Row = 2 }
$assets += @{ Name = "scan-snooper"; Source = "techs01.png"; Col = 4; Row = 2 }
$assets += @{ Name = "scan-eagle"; Source = "techs03.png"; Col = 3; Row = 2 }
$assets += @{ Name = "scan-peerless"; Source = "techs01.png"; Col = 6; Row = 2 }

# --- MISSING SCANNERS (need coordinates) ---
# $assets += @{ Name="scan-bat";                      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-dna";                      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-pick-pocket";              Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-chameleon";                Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-ferret";                   Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-dolphin";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-gazelle";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-rna";                      Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-cheetah";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-elephant";                 Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-eagle-eye";                Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="scan-robber-baron";             Source="techs??.png"; Col=?; Row=? }

# --- CARGO ---
$assets += @{ Name = "icon-cargo-small"; Source = "techs04.png"; Col = 0; Row = 0 }
$assets += @{ Name = "icon-cargo-med"; Source = "techs04.png"; Col = 1; Row = 0 }
$assets += @{ Name = "icon-cargo-large"; Source = "techs04.png"; Col = 2; Row = 0 }

# --- ORBITAL ---
$assets += @{ Name = "orb-dock"; Source = "techs07.png"; Col = 0; Row = 0 }
$assets += @{ Name = "orb-sensor"; Source = "techs07.png"; Col = 1; Row = 0 }
$assets += @{ Name = "orb-shield"; Source = "techs07.png"; Col = 2; Row = 0 }

# --- MISSING CATEGORIES (need coordinates and source images) ---
# --- MINES ---
# $assets += @{ Name="mine-dispenser-40";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="mine-dispenser-50";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="mine-dispenser-80";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="mine-dispenser-130";            Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="heavy-dispenser-50";            Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="heavy-dispenser-110";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="heavy-dispenser-200";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="speed-trap-20";                 Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="speed-trap-30";                 Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="speed-trap-50";                 Source="techs??.png"; Col=?; Row=? }
#
# --- TERRAFORMING ---
# $assets += @{ Name="terraform-3";                   Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-5";                   Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-7";                   Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-10";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-15";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-20";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-25";                  Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="terraform-30";                  Source="techs??.png"; Col=?; Row=? }
#
# --- PLANETARY DEFENSES ---
# $assets += @{ Name="planet-viewer-50";              Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-viewer-90";              Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-scoper-150";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-scoper-220";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-scoper-280";             Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-snooper-320x";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-snooper-400x";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-snooper-500x";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-snooper-620x";           Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-sdi";                    Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-missile-battery";        Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-laser-battery";          Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-shield";                 Source="techs??.png"; Col=?; Row=? }
# $assets += @{ Name="planet-neutron-shield";         Source="techs??.png"; Col=?; Row=? }

# --- HULLS ---
$assets += @{ Name = "hull-freight-s"; Source = "techhulls01.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-freight-m"; Source = "techhulls01.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-freight-l"; Source = "techhulls01.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-freight-super"; Source = "techhulls01.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-scout"; Source = "techhulls01.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-frigate"; Source = "techhulls01.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-destroyer"; Source = "techhulls01.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-cruiser"; Source = "techhulls01.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-battle-cruiser"; Source = "techhulls02.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-battleship"; Source = "techhulls02.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-dreadnought"; Source = "techhulls02.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-privateer"; Source = "techhulls02.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-rogue"; Source = "techhulls02.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-galleon"; Source = "techhulls02.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-nubian"; Source = "techhulls02.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-meta-morph"; Source = "techhulls02.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-mini-colony"; Source = "techhulls03.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-colony"; Source = "techhulls02.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-mini-bomber"; Source = "techhulls03.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-b17"; Source = "techhulls03.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-stealth-bomber"; Source = "techhulls03.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-b52"; Source = "techhulls03.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-midget-miner"; Source = "techhulls03.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-mini-miner"; Source = "techhulls03.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-miner"; Source = "techhulls03.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-maxi-miner"; Source = "techhulls04.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-ultra-miner"; Source = "techhulls04.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-fuel-transport"; Source = "techhulls04.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-super-fuel-export"; Source = "techhulls04.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-mini-mine-layer"; Source = "techhulls04.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-super-mine-layer"; Source = "techhulls04.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-orbital-fort"; Source = "starbases.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-space-dock"; Source = "starbases.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-space-station"; Source = "starbases.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-ultra-station"; Source = "starbases.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-death-star"; Source = "starbases.png"; Col = 4; Row = 0 }

# -----------------------------
# EXECUTION
# -----------------------------
Write-Host "--- Stars! Asset Builder v8 (Deterministic) ---" -ForegroundColor Cyan

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

function New-BlankSprite([string]$Path) {
    magick -size "${SpriteSize}x${SpriteSize}" xc:none $Path | Out-Null
}

$i = 0
foreach ($item in $assets) {
    $src = $item.Source
    $name = $item.Name
    $idx = "{0:d3}" -f $i  # allow > 99 assets without regex issues
    $outFile = Join-Path $tempDir ("{0}_{1}.png" -f $idx, $name)

    # Convert Col/Row to X/Y coordinates
    $xPos = $item.Col * $SpriteSize
    $yPos = $item.Row * $SpriteSize

    if (Test-Path $src) {
        magick $src -crop "${SpriteSize}x${SpriteSize}+${xPos}+${yPos}" +repage $outFile | Out-Null
        if (-not (Test-Path $outFile)) {
            throw "Failed to crop sprite '$name' from '$src' at Col=$($item.Col),Row=$($item.Row) (X=${xPos},Y=${yPos})"
        }
    }
    else {
        $msg = "Missing source image: $src (for $name)"
        if ($usePlaceholdersForMissingSources) {
            Write-Warning "$msg -> using placeholder so ordering stays stable"
            New-BlankSprite -Path $outFile
        } else {
            Write-Warning "$msg -> skipping (this will shift CSS positions)"
            $i++
            continue
        }
    }

    $spriteList += $outFile
    $i++
}

if ($spriteList.Count -eq 0) {
    throw "No sprites generated. Check source images and ImageMagick installation."
}

Write-Host "Stitching $($spriteList.Count) sprites..." -ForegroundColor Yellow
magick montage $spriteList -tile 1x -geometry +0+0 -background none $outputImage | Out-Null

# Generate CSS
$css = "/* Stars! Tech Atlas v8 */`n"
$css += ".tech-icon { width: ${SpriteSize}px; height: ${SpriteSize}px; background-image: url('$cssBackgroundUrl'); background-repeat: no-repeat; display: inline-block; image-rendering: pixelated; }`n"

$y = 0
foreach ($file in $spriteList) {
    $base = (Get-Item $file).BaseName
    $name = $base -replace '^\d{3}_',''  # must match the 3-digit idx above
    $css += ".$name { background-position: 0px -${y}px; }`n"
    $y += $SpriteSize
}

Set-Content -Path $outputCSS -Value $css -Encoding UTF8

# Cleanup
Remove-Item $tempDir -Recurse -Force

Write-Host "Done! Created $outputImage and $outputCSS" -ForegroundColor Green
