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
# Format: Source X Y (Positive integers from top-left)

# --- ENGINES ---
$assets += @{ Name="eng-settler";    Source="techs02.png"; X=0;   Y=64 }
$assets += @{ Name="eng-mizer";      Source="techs02.png"; X=64;  Y=64 }
$assets += @{ Name="eng-long-hump";  Source="techs02.png"; X=128; Y=64 }
$assets += @{ Name="eng-trans";      Source="techs02.png"; X=256; Y=0 }
$assets += @{ Name="eng-ram";        Source="techs02.png"; X=448; Y=0 }
$assets += @{ Name="eng-interspace"; Source="techs02.png"; X=384; Y=64 }

# --- STARGATES ---
$assets += @{ Name="gate-std";       Source="techs05.png"; X=0;   Y=0 }
$assets += @{ Name="gate-jump";      Source="techs05.png"; X=64;  Y=0 }
$assets += @{ Name="gate-any";       Source="techs05.png"; X=128; Y=0 }

# --- MASS DRIVERS ---
$assets += @{ Name="driver-std";     Source="techs05.png"; X=192; Y=0 }
$assets += @{ Name="driver-super";   Source="techs05.png"; X=256; Y=0 }
$assets += @{ Name="driver-ultra";   Source="techs05.png"; X=320; Y=0 }

# --- BEAM WEAPONS ---
$assets += @{ Name="weap-laser";     Source="techs02.png"; X=256; Y=192 }
$assets += @{ Name="weap-xray";      Source="techs02.png"; X=320; Y=192 }
$assets += @{ Name="weap-minigun";   Source="techs02.png"; X=384; Y=192 }
$assets += @{ Name="weap-yakimora";  Source="techs02.png"; X=448; Y=192 }
$assets += @{ Name="weap-disrupt";   Source="techs02.png"; X=192; Y=192 }
$assets += @{ Name="weap-phasor";    Source="techs02.png"; X=320; Y=128 }
$assets += @{ Name="weap-gatling";   Source="techs02.png"; X=128; Y=192 }
$assets += @{ Name="weap-big-mutha"; Source="techs02.png"; X=0;   Y=192 }
$assets += @{ Name="weap-bludgeon";  Source="techs06.png"; X=0;   Y=64 }

# --- TORPEDOES & MISSILES ---
$assets += @{ Name="weap-torp-alpha";        Source="techs01.png";  X=64;  Y=192 }
$assets += @{ Name="weap-torp-beta";         Source="techs01.png";  X=128; Y=192 }
$assets += @{ Name="weap-torp-delta";        Source="techs01.png";  X=192; Y=192 }
$assets += @{ Name="weap-torp-epsilon";      Source="techs01.png";  X=256; Y=192 }
$assets += @{ Name="weap-torp-rho";          Source="techs01.png";  X=320; Y=192 }
$assets += @{ Name="weap-torp-upsilon";      Source="techs01.png";  X=448; Y=192 }
$assets += @{ Name="weap-torp-omega";        Source="techs01.png";  X=384; Y=192 }
$assets += @{ Name="weap-torp-anti";         Source="techs04.png";  X=256; Y=64 }
$assets += @{ Name="weap-missile-jihad";     Source="techs07.png"; X=0;   Y=64 }
$assets += @{ Name="weap-missile-juggernaut"; Source="techs07.png"; X=64;  Y=64 }
$assets += @{ Name="weap-missile-doomsday";   Source="techs07.png"; X=128; Y=64 }
$assets += @{ Name="weap-missile-armageddon"; Source="techs07.png"; X=192; Y=64 }

# --- BOMBS ---
$assets += @{ Name="weap-bomb-lady";             Source="techs03.png"; X=192; Y=0 }
$assets += @{ Name="weap-bomb-black-cat";        Source="techs03.png"; X=0;   Y=64 }
$assets += @{ Name="weap-bomb-m70";              Source="techs03.png"; X=64;  Y=64 }
$assets += @{ Name="weap-bomb-m80";              Source="techs03.png"; X=128; Y=64 }
$assets += @{ Name="weap-bomb-cherry";           Source="techs03.png"; X=448; Y=0 }
$assets += @{ Name="weap-bomb-lbu17";            Source="techs03.png"; X=192; Y=64 }
$assets += @{ Name="weap-bomb-lbu32";            Source="techs03.png"; X=256; Y=64 }
$assets += @{ Name="weap-bomb-lbu74";            Source="techs03.png"; X=320; Y=64 }
$assets += @{ Name="weap-bomb-retro";            Source="techs03.png"; X=384; Y=64 }
$assets += @{ Name="weap-bomb-smart";            Source="techs04.png"; X=0;   Y=128 }
$assets += @{ Name="weap-bomb-neutron";          Source="techs03.png"; X=256; Y=0 }
$assets += @{ Name="weap-bomb-enriched-neutron"; Source="techs03.png"; X=448; Y=64 }
$assets += @{ Name="weap-bomb-peerless";         Source="techs03.png"; X=0;   Y=128 }
$assets += @{ Name="weap-bomb-annihilator";      Source="techs03.png"; X=320; Y=0 }

# --- SHIELDS ---
$assets += @{ Name="def-shield-mole";     Source="techs03.png"; X=128; Y=64 }
$assets += @{ Name="def-shield-cow";      Source="techs03.png"; X=192; Y=64 }
$assets += @{ Name="def-shield-wolf";     Source="techs03.png"; X=256; Y=64 }
$assets += @{ Name="def-shield-croby";    Source="techs03.png"; X=0;   Y=192 }
$assets += @{ Name="def-shield-shadow";   Source="techs03.png"; X=64;  Y=192 }
$assets += @{ Name="def-shield-bear";     Source="techs03.png"; X=128; Y=192 }
$assets += @{ Name="def-shield-gorilla";  Source="techs03.png"; X=192; Y=192 }
$assets += @{ Name="def-shield-elephant"; Source="techs03.png"; X=256; Y=192 }
$assets += @{ Name="def-shield-phase";    Source="techs04.png"; X=448; Y=128 }
$assets += @{ Name="def-shield-langston"; Source="techs04.png"; X=384; Y=128 }

# --- ARMOR ---
$assets += @{ Name="def-armor-tri";  Source="techs01.png"; X=0;   Y=0 }
$assets += @{ Name="def-armor-crob"; Source="techs01.png"; X=64;  Y=0 }
$assets += @{ Name="def-armor-neu";  Source="techs01.png"; X=320; Y=0 }
$assets += @{ Name="def-armor-val";  Source="techs01.png"; X=128; Y=0 }

# --- COMPUTERS ---
$assets += @{ Name="elec-comp-bat";   Source="techs06.png"; X=320; Y=0 }
$assets += @{ Name="elec-comp-cyber"; Source="techs06.png"; X=384; Y=0 }
$assets += @{ Name="elec-comp-nexus"; Source="techs06.png"; X=448; Y=0 }

# --- ELECTRICAL ---
$assets += @{ Name="elec-jammer-10";     Source="techs04.png"; X=0;   Y=192 }
$assets += @{ Name="elec-jammer-20";     Source="techs04.png"; X=64;  Y=192 }
$assets += @{ Name="elec-jammer-50";     Source="techs04.png"; X=128; Y=192 }
$assets += @{ Name="elec-cloak-stealth"; Source="techs04.png"; X=192; Y=0 }
$assets += @{ Name="elec-cloak-super";   Source="techs04.png"; X=256; Y=0 }
$assets += @{ Name="elec-capacitor";     Source="techs04.png"; X=448; Y=192 }

# --- MECHANICAL ---
$assets += @{ Name="mech-fuel-tank";    Source="techs04.png"; X=0;   Y=64 }
$assets += @{ Name="mech-super-tank";   Source="techs04.png"; X=64;  Y=64 }
$assets += @{ Name="mech-colony-mod";   Source="techs04.png"; X=128; Y=64 }
$assets += @{ Name="mech-maneuver-jet"; Source="techs04.png"; X=384; Y=0 }
$assets += @{ Name="mech-overthruster"; Source="techs04.png"; X=448; Y=0 }
$assets += @{ Name="mech-robo-miner";   Source="techs05.png"; X=256; Y=64 }
$assets += @{ Name="mech-auto-miner";   Source="techs05.png"; X=320; Y=64 }

# --- SCANNERS ---
$assets += @{ Name="scan-viewer";   Source="techs01.png"; X=0;   Y=128 }
$assets += @{ Name="scan-rhino";    Source="techs03.png"; X=0;   Y=128 }
$assets += @{ Name="scan-mole";     Source="techs03.png"; X=64;  Y=128 }
$assets += @{ Name="scan-possum";   Source="techs03.png"; X=128; Y=128 }
$assets += @{ Name="scan-snooper";  Source="techs01.png"; X=256; Y=128 }
$assets += @{ Name="scan-eagle";    Source="techs03.png"; X=192; Y=128 }
$assets += @{ Name="scan-peerless"; Source="techs01.png"; X=384; Y=128 }

# --- CARGO ---
$assets += @{ Name="icon-cargo-small"; Source="techs04.png"; X=0;   Y=0 }
$assets += @{ Name="icon-cargo-med";   Source="techs04.png"; X=64;  Y=0 }
$assets += @{ Name="icon-cargo-large"; Source="techs04.png"; X=128; Y=0 }

# --- ORBITAL ---
$assets += @{ Name="orb-dock";   Source="techs07.png"; X=0;   Y=0 }
$assets += @{ Name="orb-sensor"; Source="techs07.png"; X=64;  Y=0 }
$assets += @{ Name="orb-shield"; Source="techs07.png"; X=128; Y=0 }

# --- HULLS ---
$assets += @{ Name="hull-freight-s";       Source="techhulls01.png"; X=0;   Y=0 }
$assets += @{ Name="hull-freight-m";       Source="techhulls01.png"; X=64;  Y=0 }
$assets += @{ Name="hull-freight-l";       Source="techhulls01.png"; X=128; Y=0 }
$assets += @{ Name="hull-freight-super";   Source="techhulls01.png"; X=192; Y=0 }
$assets += @{ Name="hull-scout";           Source="techhulls01.png"; X=256; Y=0 }
$assets += @{ Name="hull-frigate";         Source="techhulls01.png"; X=320; Y=0 }
$assets += @{ Name="hull-destroyer";       Source="techhulls01.png"; X=384; Y=0 }
$assets += @{ Name="hull-cruiser";         Source="techhulls01.png"; X=448; Y=0 }
$assets += @{ Name="hull-battle-cruiser";  Source="techhulls02.png"; X=0;   Y=0 }
$assets += @{ Name="hull-battleship";      Source="techhulls02.png"; X=64;  Y=0 }
$assets += @{ Name="hull-dreadnought";     Source="techhulls02.png"; X=128; Y=0 }
$assets += @{ Name="hull-privateer";       Source="techhulls02.png"; X=192; Y=0 }
$assets += @{ Name="hull-rogue";           Source="techhulls02.png"; X=256; Y=0 }
$assets += @{ Name="hull-galleon";         Source="techhulls02.png"; X=320; Y=0 }
$assets += @{ Name="hull-nubian";          Source="techhulls02.png"; X=384; Y=0 }
$assets += @{ Name="hull-meta-morph";      Source="techhulls02.png"; X=448; Y=0 }
$assets += @{ Name="hull-mini-colony";     Source="techhulls03.png"; X=384; Y=0 }
$assets += @{ Name="hull-colony";          Source="techhulls02.png"; X=448; Y=0 }
$assets += @{ Name="hull-mini-bomber";     Source="techhulls03.png"; X=0;   Y=0 }
$assets += @{ Name="hull-b17";             Source="techhulls03.png"; X=64;  Y=0 }
$assets += @{ Name="hull-stealth-bomber";  Source="techhulls03.png"; X=128; Y=0 }
$assets += @{ Name="hull-b52";             Source="techhulls03.png"; X=192; Y=0 }
$assets += @{ Name="hull-midget-miner";    Source="techhulls03.png"; X=256; Y=0 }
$assets += @{ Name="hull-mini-miner";      Source="techhulls03.png"; X=320; Y=0 }
$assets += @{ Name="hull-miner";           Source="techhulls03.png"; X=448; Y=0 }
$assets += @{ Name="hull-maxi-miner";      Source="techhulls04.png"; X=64;  Y=0 }
$assets += @{ Name="hull-ultra-miner";     Source="techhulls04.png"; X=0;   Y=0 }
$assets += @{ Name="hull-fuel-transport";      Source="techhulls04.png"; X=128; Y=0 }
$assets += @{ Name="hull-super-fuel-export";   Source="techhulls04.png"; X=192; Y=0 }
$assets += @{ Name="hull-mini-mine-layer";     Source="techhulls04.png"; X=256; Y=0 }
$assets += @{ Name="hull-super-mine-layer";    Source="techhulls04.png"; X=320; Y=0 }
$assets += @{ Name="hull-sb-fort";             Source="starbases.png";   X=0;   Y=0 }
$assets += @{ Name="hull-sb-space-dock";       Source="starbases.png";   X=64;  Y=0 }
$assets += @{ Name="hull-sb-space-station";    Source="starbases.png";   X=128; Y=0 }
$assets += @{ Name="hull-sb-ultra-station";    Source="starbases.png";   X=192; Y=0 }
$assets += @{ Name="hull-sb-death-star";       Source="starbases.png";   X=256; Y=0 }

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
    $src  = $item.Source
    $name = $item.Name
    $idx  = "{0:d3}" -f $i  # allow > 99 assets without regex issues
    $outFile = Join-Path $tempDir ("{0}_{1}.png" -f $idx, $name)

    if (Test-Path $src) {
        magick $src -crop "${SpriteSize}x${SpriteSize}+$($item.X)+$($item.Y)" +repage $outFile | Out-Null
        if (-not (Test-Path $outFile)) {
            throw "Failed to crop sprite '$name' from '$src' at $($item.X),$($item.Y)"
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
