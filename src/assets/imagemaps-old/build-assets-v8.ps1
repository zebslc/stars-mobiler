# =============================================================================
# Stars! Mobile Asset Builder v13 (Complete V9 List)
# Usage: Run inside 'src/assets/imagemaps-old'
# Output: ../imagemaps/tech-atlas.png
#         ../../app/shared/tech-atlas.css
# =============================================================================

# 1. CONFIGURATION
$tempDir = "temp_sprites_v13"
$outputImage = "../imagemaps/tech-atlas.png"
$outputCSS = "../../app/shared/tech-atlas.css"

# Ensure output directories exist
$imgDir = [System.IO.Path]::GetDirectoryName($outputImage)
$cssDir = [System.IO.Path]::GetDirectoryName($outputCSS)
if (-not (Test-Path $imgDir)) { New-Item -ItemType Directory -Path $imgDir | Out-Null }
if (-not (Test-Path $cssDir)) { New-Item -ItemType Directory -Path $cssDir | Out-Null }

# 2. DEFINE ASSETS 
# We use an array to preserve exact order for the CSS strip
$assets = @()

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
$assets += @{ Name="weap-torp-alpha";        Source="techs01.png"; X=64;  Y=192 }
$assets += @{ Name="weap-torp-beta";         Source="techs01.png"; X=128; Y=192 }
$assets += @{ Name="weap-torp-delta";        Source="techs01.png"; X=192; Y=192 }
$assets += @{ Name="weap-torp-epsilon";      Source="techs01.png"; X=256; Y=192 }
$assets += @{ Name="weap-torp-rho";          Source="techs01.png"; X=320; Y=192 }
$assets += @{ Name="weap-torp-upsilon";      Source="techs01.png"; X=448; Y=192 }
$assets += @{ Name="weap-torp-omega";        Source="techs01.png"; X=384; Y=192 }
$assets += @{ Name="weap-torp-anti";         Source="techs04.png"; X=256; Y=64 }
$assets += @{ Name="weap-missile-jihad";     Source="techs01.png"; X=0;   Y=256 }
$assets += @{ Name="weap-missile-juggernaut";Source="techs01.png"; X=64;  Y=256 }
$assets += @{ Name="weap-missile-doomsday";  Source="techs01.png"; X=128; Y=256 }
$assets += @{ Name="weap-missile-armageddon";Source="techs01.png"; X=192; Y=256 }

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
$assets += @{ Name="def-shield-langston"; Source="techs04.png"; X=384; Y=128 } # Fixed source

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
$assets += @{ Name="icon-cargo-small"; Source="techs08.png"; X=0;   Y=0 }
$assets += @{ Name="icon-cargo-med";   Source="techs08.png"; X=64;  Y=0 }
$assets += @{ Name="icon-cargo-large"; Source="techs08.png"; X=128; Y=0 }

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
$assets += @{ Name="hull-sb-fort";             Source="starbases.png"; X=0;   Y=0 }
$assets += @{ Name="hull-sb-space-dock";       Source="starbases.png"; X=64;  Y=0 }
$assets += @{ Name="hull-sb-space-station";    Source="starbases.png"; X=128; Y=0 }
$assets += @{ Name="hull-sb-ultra-station";    Source="starbases.png"; X=192; Y=0 }
$assets += @{ Name="hull-sb-death-star";       Source="starbases.png"; X=256; Y=0 }

# 3. EXECUTION
Write-Host "--- Stars! Asset Builder v13 ---" -ForegroundColor Cyan
Write-Host "Total Assets: $($assets.Count)" -ForegroundColor Yellow

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$spritePaths = @()
$i = 0

foreach ($item in $assets) {
    $src = $item.Source
    $name = $item.Name
    $idx = "{0:d3}" -f $i
    $outFile = "$tempDir/${idx}_${name}.png"
    
    if (-not (Test-Path $src)) {
        Write-Warning "MISSING: $src"
    } else {
        # FORCE CLEAN CROP + REPAGE
        magick $src -crop 64x64+$($item.X)+$($item.Y) +repage $outFile
        if (Test-Path $outFile) { $spritePaths += $outFile }
    }
    $i++
}

if ($spritePaths.Count -gt 0) {
    Write-Host "Stitching $($spritePaths.Count) sprites..."
    
    # FORCE VERTICAL STACK WITH NO ALPHA BLENDING
    magick -background none $spritePaths -compose Copy -append $outputImage
    
    # Generate CSS
    $cssContent = "/* Stars! Tech Atlas v13 */`n"
    $cssContent += ".tech-icon {`n  width: 64px;`n  height: 64px;`n  background-image: url('/assets/imagemaps/tech-atlas.png');`n  background-repeat: no-repeat;`n  display: inline-block;`n  image-rendering: pixelated;`n}`n"

    $yOffset = 0
    foreach ($path in $spritePaths) {
        $n = (Get-Item $path).BaseName -replace '^\d{3}_',''
        $cssContent += ".$n { background-position: 0px -${yOffset}px; }`n"
        $yOffset += 64
    }
    
    Set-Content -Path $outputCSS -Value $cssContent
    Write-Host "Done! Saved to $outputImage" -ForegroundColor Green
}

Remove-Item $tempDir -Recurse -Force