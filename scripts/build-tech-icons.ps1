# =============================================================================
# Stars! Mobile Tech Icon Builder - Individual Images
# Usage: pwsh scripts/build-tech-icons.ps1
# Requires: ImageMagick (magick)
# Output: Individual 64x64 PNG files in src/assets/tech-icons/
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -----------------------------
# CONFIG
# -----------------------------
$SpriteSize = 64
$outputDir = "src/assets/tech-icons"
$outputCSS = "src/app/shared/components/tech-atlas.css"

# IMPORTANT: match the checked-in CSS background-image URL
$cssBackgroundUrlPrefix = "/assets/tech-icons"

# -----------------------------
# RESET
# -----------------------------
$assets = @()

# -----------------------------
# DEFINE ASSETS
# -----------------------------
# Format: Source Col Row (0-based, each sprite is 64x64)
# Col 0=X:0, Col 1=X:64, Col 2=X:128, etc.
# Row 0=Y:0, Row 1=Y:64, Row 2=Y:128, etc.

# --- ENGINES ---
$assets += @{ Name= "eng-quick-jump-5";              Source="src/assets/imagemaps-old/techs02.png"; Col=0; Row=0; }
$assets += @{ Name= "eng-long-hump-6";               Source="src/assets/imagemaps-old/techs02.png"; Col=1; Row=0; }
$assets += @{ Name= "eng-daddy-long-legs-7";         Source="src/assets/imagemaps-old/techs02.png"; Col=3; Row=0; }
$assets += @{ Name= "eng-alpha-drive-8";             Source="src/assets/imagemaps-old/techs02.png"; Col=4; Row=0; }
$assets += @{ Name="eng-sub-galactic-fuel-scoop";        Source="src/assets/imagemaps-old/techs02.png"; Col=5; Row=0; }
$assets += @{ Name = "eng-trans-galactic-drive"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 5; Row = 0; }
$assets += @{ Name="eng-trans-galactic-fuel-scoop";      Source="src/assets/imagemaps-old/techs02.png"; Col=6; Row=0; }
$assets += @{ Name="eng-radiating-hydro-ram-scoop";       Source="src/assets/imagemaps-old/techs02.png"; Col=7; Row=0; }
$assets += @{ Name = "eng-settlers-delight"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 0; Row = 1 ;}
$assets += @{ Name = "eng-fuel-mizer"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 1; Row = 1}
$assets += @{ Name="eng-trans-galactic-super-scoop"; Source="src/assets/imagemaps-old/techs02.png"; Col=2; Row=1 }
$assets += @{ Name="eng-trans-galactic-mizer-scoop"; Source="src/assets/imagemaps-old/techs02.png"; Col=3; Row=1 }
$assets += @{ Name = "eng-interspace-10"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 4; Row = 1 }
$assets += @{ Name = "eng-trans-star-10"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 5; Row = 2 }
$assets += @{ Name = "eng-sub-galaxy-scoop"; Source = "src/assets/imagemaps-old/techs06.png"; Col = 7; Row = 3 }

# --- STARGATES ---
$assets += @{ Name = "gate-std"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 0; Row = 2; }
$assets += @{ Name = "gate-weight"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 1; Row = 2 ;}
$assets += @{ Name = "gate-distance"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 4; Row = 2; }
$assets += @{ Name = "gate-any"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 6; Row = 2 ;}

# --- MASS DRIVERS ---
$assets += @{ Name = "driver-std"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 7; Row = 2 }
$assets += @{ Name = "driver-super"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 2; Row = 3 }
$assets += @{ Name = "driver-ultra"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 5; Row = 3 }

# --- BEAM WEAPONS ---
$assets += @{ Name = "weap-laser"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 4; Row = 3 }
$assets += @{ Name = "weap-xray"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 5; Row = 3 }
$assets += @{ Name = "weap-minigun"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 4; Row = 2 }
$assets += @{ Name = "weap-yakimora"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 3; Row = 2 }
$assets += @{ Name = "weap-disruptor"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 3; Row = 3 }
$assets += @{ Name = "weap-phazer-bazooka"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 5; Row = 2 }
$assets += @{ Name = "weap-gatling"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 2; Row = 3 }
$assets += @{ Name = "weap-big-mutha"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 7; Row = 3 }
$assets += @{ Name = "weap-bludgeon"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 7; Row = 1 }
$assets += @{ Name = "weap-blackjack"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 6; Row = 1 }
$assets += @{ Name = "weap-pulsed-sapper"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 1; Row = 2 }
$assets += @{ Name = "weap-colloidal-phaser"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 0; Row = 0 }
$assets += @{ Name = "weap-mini-blaster"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 0; Row = 3 }
$assets += @{ Name = "weap-mark-iv-blaster"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 1; Row = 3 }
$assets += @{ Name = "weap-phased-sapper"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 2; Row = 2 }
$assets += @{ Name = "weap-heavy-blaster"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 1; Row = 0 }
$assets += @{ Name = "weap-gatling-neutrino"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 6; Row = 3 }
$assets += @{ Name = "weap-myopic-disrupter"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 2; Row = 0 }
$assets += @{ Name = "weap-mega-disrupter"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 3; Row = 0 }
$assets += @{ Name = "weap-streaming-pulverizer"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 6; Row = 2 }
$assets += @{ Name = "weap-anti-matter-pulverizer"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 7; Row = 2 }
$assets += @{ Name = "weap-syncro-sapper"; Source = "src/assets/imagemaps-old/techs02.png"; Col = 0; Row = 3 }

# --- TORPEDOES & MISSILES ---
$assets += @{ Name = "weap-torp-alpha"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 1; Row = 3 }
$assets += @{ Name = "weap-torp-beta"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 2; Row = 3 }
$assets += @{ Name = "weap-torp-delta"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 3; Row = 3 }
$assets += @{ Name = "weap-torp-epsilon"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 4; Row = 3 }
$assets += @{ Name = "weap-torp-rho"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 5; Row = 3 }
$assets += @{ Name = "weap-torp-upsilon"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 7; Row = 3 }
$assets += @{ Name = "weap-torp-omega"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 6; Row = 3 }
$assets += @{ Name = "weap-torp-anti"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 4; Row = 1 }
$assets += @{ Name = "weap-missile-jihad"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 0; Row = 1 }
$assets += @{ Name = "weap-missile-juggernaut"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 1; Row = 1 }
$assets += @{ Name = "weap-missile-doomsday"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 2; Row = 1 }
$assets += @{ Name = "weap-missile-armageddon"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 3; Row = 1 }

# --- BOMBS ---
$assets += @{ Name = "weap-bomb-lady"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 3; Row = 0 }
$assets += @{ Name = "weap-bomb-black-cat"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 0; Row = 0 }
$assets += @{ Name = "weap-bomb-m70"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 1; Row = 0 }
$assets += @{ Name = "weap-bomb-m80"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 2; Row = 0 }
$assets += @{ Name = "weap-bomb-cherry"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 7; Row = 0 }
$assets += @{ Name = "weap-bomb-lbu17"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 3; Row = 0 }
$assets += @{ Name = "weap-bomb-lbu32"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 4; Row = 0 }
$assets += @{ Name = "weap-bomb-lbu74"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 5; Row = 2 }
$assets += @{ Name = "weap-bomb-retro"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 6; Row = 2 }
$assets += @{ Name = "weap-bomb-smart"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 0; Row = 2 }
$assets += @{ Name = "weap-bomb-neutron"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 4; Row = 2 }
$assets += @{ Name = "weap-bomb-enriched-neutron"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 7; Row = 2 }
$assets += @{ Name = "weap-bomb-peerless"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 0; Row = 2 }
$assets += @{ Name = "weap-bomb-annihilator"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 5; Row = 0 }
# TODO These bombs are wrong on tech3, 4 and 6

# --- SHIELDS ---
$assets += @{ Name = "def-shield-mole"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 2; Row = 1 }
$assets += @{ Name = "def-shield-cow"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 3; Row = 1 }
$assets += @{ Name = "def-shield-wolf"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 4; Row = 1 }
$assets += @{ Name = "def-shield-croby"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 0; Row = 1 }
$assets += @{ Name = "def-shield-shadow"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 1; Row = 1 }
$assets += @{ Name = "def-shield-bear"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 2; Row = 1 }
$assets += @{ Name = "def-shield-gorilla"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 3; Row = 1 }
$assets += @{ Name = "def-shield-elephant"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 4; Row = 1 }
$assets += @{ Name = "def-shield-phase"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 7; Row = 1 }

# --- ARMOR ---
$assets += @{ Name = "def-armor-tri"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 0; Row = 0 }
$assets += @{ Name = "def-armor-crob"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 1; Row = 0 }
$assets += @{ Name = "def-armor-neu"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 5; Row = 0 }
$assets += @{ Name = "def-armor-val"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 2; Row = 0 }
# TODO THE OTHER ARMOR FROM Tech01

# --- COMPUTERS ---
$assets += @{ Name = "elec-comp-bat"; Source = "src/assets/imagemaps-old/techs06.png"; Col = 5; Row = 0 }
$assets += @{ Name = "elec-comp-cyber"; Source = "src/assets/imagemaps-old/techs06.png"; Col = 6; Row = 0 }
$assets += @{ Name = "elec-comp-nexus"; Source = "src/assets/imagemaps-old/techs06.png"; Col = 7; Row = 0 }

# --- ELECTRICAL ---
$assets += @{ Name = "elec-jammer-10"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 0; Row = 3 }
$assets += @{ Name = "elec-jammer-20"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 1; Row = 3 }
$assets += @{ Name = "elec-jammer-50"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 2; Row = 3 }
$assets += @{ Name = "elec-cloak-stealth"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 3; Row = 0 }
$assets += @{ Name = "elec-cloak-super"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 4; Row = 0 }
$assets += @{ Name = "elec-capacitor"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 7; Row = 3 }

# --- MECHANICAL ---
$assets += @{ Name = "mech-fuel-tank"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 0; Row = 1 }
$assets += @{ Name = "mech-super-tank"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 1; Row = 1 }
$assets += @{ Name = "mech-colony-mod"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 2; Row = 1 }
$assets += @{ Name = "mech-maneuver-jet"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 6; Row = 0 }
$assets += @{ Name = "mech-overthruster"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 7; Row = 0 }
$assets += @{ Name = "mech-robo-miner"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 4; Row = 1 }
$assets += @{ Name = "mech-auto-miner"; Source = "src/assets/imagemaps-old/techs05.png"; Col = 5; Row = 1 }

# --- SCANNERS ---
$assets += @{ Name = "scan-viewer"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 0; Row = 2 }
$assets += @{ Name = "scan-rhino"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 0; Row = 2 }
$assets += @{ Name = "scan-mole"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 1; Row = 2 }
$assets += @{ Name = "scan-possum"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 2; Row = 2 }
$assets += @{ Name = "scan-snooper"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 4; Row = 2 }
$assets += @{ Name = "scan-eagle"; Source = "src/assets/imagemaps-old/techs03.png"; Col = 3; Row = 2 }
$assets += @{ Name = "scan-peerless"; Source = "src/assets/imagemaps-old/techs01.png"; Col = 6; Row = 2 }

# --- CARGO ---
$assets += @{ Name = "icon-cargo-small"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 0; Row = 0 }
$assets += @{ Name = "icon-cargo-med"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 1; Row = 0 }
$assets += @{ Name = "icon-cargo-large"; Source = "src/assets/imagemaps-old/techs04.png"; Col = 2; Row = 0 }

# --- ORBITAL ---
$assets += @{ Name = "orb-dock"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 0; Row = 0 }
$assets += @{ Name = "orb-sensor"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 1; Row = 0 }
$assets += @{ Name = "orb-shield"; Source = "src/assets/imagemaps-old/techs07.png"; Col = 2; Row = 0 }
# TODO These are all wrong

# --- HULLS ---
$assets += @{ Name = "hull-freight-s"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-freight-m"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-freight-l"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-freight-super"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-scout"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-frigate"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-destroyer"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-cruiser"; Source = "src/assets/imagemaps-old/techhulls01.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-battle-cruiser"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-battleship"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-dreadnought"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-privateer"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-rogue"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-galleon"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-nubian"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-meta-morph"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-mini-colony"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 6; Row = 0 }
$assets += @{ Name = "hull-colony"; Source = "src/assets/imagemaps-old/techhulls02.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-mini-bomber"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-b17"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-stealth-bomber"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-b52"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-midget-miner"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-mini-miner"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-miner"; Source = "src/assets/imagemaps-old/techhulls03.png"; Col = 7; Row = 0 }
$assets += @{ Name = "hull-maxi-miner"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-ultra-miner"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-fuel-transport"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-super-fuel-export"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-mini-mine-layer"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 4; Row = 0 }
$assets += @{ Name = "hull-super-mine-layer"; Source = "src/assets/imagemaps-old/techhulls04.png"; Col = 5; Row = 0 }
$assets += @{ Name = "hull-orbital-fort"; Source = "src/assets/imagemaps-old/starbases.png"; Col = 0; Row = 0 }
$assets += @{ Name = "hull-space-dock"; Source = "src/assets/imagemaps-old/starbases.png"; Col = 1; Row = 0 }
$assets += @{ Name = "hull-space-station"; Source = "src/assets/imagemaps-old/starbases.png"; Col = 2; Row = 0 }
$assets += @{ Name = "hull-ultra-station"; Source = "src/assets/imagemaps-old/starbases.png"; Col = 3; Row = 0 }
$assets += @{ Name = "hull-death-star"; Source = "src/assets/imagemaps-old/starbases.png"; Col = 4; Row = 0 }

# -----------------------------
# EXECUTION
# -----------------------------
Write-Host "--- Stars! Tech Icon Builder (Individual Images) ---" -ForegroundColor Cyan

# Create output directory
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Write-Host "Extracting $($assets.Count) tech icons..." -ForegroundColor Yellow

$i = 0
foreach ($item in $assets) {
    $src = $item.Source
    $name = $item.Name
    $outFile = Join-Path $outputDir "$name.png"

    # Convert Col/Row to X/Y coordinates
    $xPos = $item.Col * $SpriteSize
    $yPos = $item.Row * $SpriteSize

    if (Test-Path $src) {
        magick $src -crop "${SpriteSize}x${SpriteSize}+${xPos}+${yPos}" +repage $outFile | Out-Null
        if (-not (Test-Path $outFile)) {
            Write-Warning "Failed to extract '$name' from '$src' at Col=$($item.Col),Row=$($item.Row)"
        }
        else {
            $i++
            if ($i % 10 -eq 0) {
                Write-Host "  Extracted $i/$($assets.Count)..." -ForegroundColor Gray
            }
        }
    }
    else {
        Write-Warning "Missing source image: $src (for $name)"
    }
}

Write-Host "✓ Extracted $i tech icons to $outputDir" -ForegroundColor Green

# Generate CSS
Write-Host "Generating CSS..." -ForegroundColor Yellow

$css = "/* Stars! Tech Atlas - Individual Images */`n"
$css += ".tech-icon {`n"
$css += "  width: ${SpriteSize}px;`n"
$css += "  height: ${SpriteSize}px;`n"
$css += "  background-repeat: no-repeat;`n"
$css += "  background-size: contain;`n"
$css += "  display: inline-block;`n"
$css += "  image-rendering: pixelated;`n"
$css += "}`n`n"

foreach ($item in $assets) {
    $name = $item.Name
    $css += ".$name {`n"
    $css += "  background-image: url('$cssBackgroundUrlPrefix/$name.png');`n"
    $css += "}`n`n"
}

Set-Content -Path $outputCSS -Value $css -Encoding UTF8

Write-Host "✓ Generated $outputCSS" -ForegroundColor Green
Write-Host "Done!" -ForegroundColor Cyan
