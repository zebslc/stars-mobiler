# =============================================================================
# Stars! Mobile Asset Builder v7 (Complete + Bombers/Miners)
# Usage: pwsh build-assets-v7.ps1
# =============================================================================

# 1. RESET
$assets = $null
$spriteList = $null
$assets = @()
$spriteList = @()

# 2. DEFINE ASSETS
# Format: Source X Y (Positive integers from top-left)

# --- ENGINES ---
$assets += @{ Name="eng-settler"; Source="techs02.png"; X=0; Y=64 }
$assets += @{ Name="eng-mizer";   Source="techs02.png"; X=64; Y=64 }
$assets += @{ Name="eng-trans";   Source="techs02.png"; X=256; Y=0 }
$assets += @{ Name="eng-ram";     Source="techs02.png"; X=448; Y=0 }

# --- MECHANICAL / UTILITY ---
$assets += @{ Name="mech-fuel-tank";    Source="techs04.png"; X=0; Y=64 }
$assets += @{ Name="mech-super-tank";   Source="techs04.png"; X=64; Y=64 }
$assets += @{ Name="mech-maneuver-jet"; Source="techs04.png"; X=384; Y=0 }
$assets += @{ Name="mech-overthruster"; Source="techs04.png"; X=448; Y=0 }
$assets += @{ Name="mech-colony-mod";   Source="techs04.png"; X=128; Y=64 }
$assets += @{ Name="mech-robo-miner";   Source="techs05.png"; X=256; Y=64 }

# --- ELECTRICAL ---
$assets += @{ Name="elec-comp-bat";      Source="techs06.png"; X=320; Y=0 } # Battle Comp (Techs06)
$assets += @{ Name="elec-comp-nexus";    Source="techs06.png"; X=448; Y=0 }
$assets += @{ Name="elec-jammer-10";     Source="techs04.png"; X=0; Y=192 }
$assets += @{ Name="elec-jammer-20";     Source="techs04.png"; X=64; Y=192 }
$assets += @{ Name="elec-cloak-stealth"; Source="techs04.png"; X=192; Y=0 }
$assets += @{ Name="elec-capacitor";     Source="techs04.png"; X=448; Y=192 }

# --- SCANNERS ---
$assets += @{ Name="scan-viewer";  Source="techs01.png"; X=0; Y=128 }
$assets += @{ Name="scan-rhino";   Source="techs03.png"; X=0; Y=128 }
$assets += @{ Name="scan-mole";    Source="techs03.png"; X=64; Y=128 }
$assets += @{ Name="scan-snooper"; Source="techs01.png"; X=256; Y=128 }
$assets += @{ Name="scan-eagle";   Source="techs03.png"; X=192; Y=128 }

# --- SHIELDS ---
$assets += @{ Name="def-shield-mole";  Source="techs03.png"; X=128; Y=64 }
$assets += @{ Name="def-shield-cow";   Source="techs03.png"; X=192; Y=64 }
$assets += @{ Name="def-shield-wolf";  Source="techs03.png"; X=256; Y=64 }
$assets += @{ Name="def-shield-phase"; Source="techs04.png"; X=448; Y=128 }

# --- ARMOR ---
$assets += @{ Name="def-armor-tri";  Source="techs01.png"; X=0; Y=0 }
$assets += @{ Name="def-armor-crob"; Source="techs01.png"; X=64; Y=0 }
$assets += @{ Name="def-armor-neu";  Source="techs01.png"; X=320; Y=0 }
$assets += @{ Name="def-armor-val";  Source="techs01.png"; X=128; Y=0 }

# --- WEAPONS ---
$assets += @{ Name="weap-laser";       Source="techs02.png"; X=256; Y=192 }
$assets += @{ Name="weap-xray";        Source="techs02.png"; X=320; Y=192 }
$assets += @{ Name="weap-gatling";     Source="techs02.png"; X=128; Y=192 }
$assets += @{ Name="weap-phasor";      Source="techs02.png"; X=320; Y=128 }
$assets += @{ Name="weap-disrupt";     Source="techs02.png"; X=192; Y=192 }
$assets += @{ Name="weap-torp-alpha";  Source="techs01.png"; X=64; Y=192 }
$assets += @{ Name="weap-torp-rho";    Source="techs01.png"; X=320; Y=192 }
$assets += @{ Name="weap-torp-anti";   Source="techs04.png"; X=256; Y=64 }
$assets += @{ Name="weap-bomb-lady";   Source="techs03.png"; X=192; Y=0 }
$assets += @{ Name="weap-bomb-lbu";    Source="techs03.png"; X=0; Y=0 }
$assets += @{ Name="weap-bomb-smart";  Source="techs04.png"; X=0; Y=128 }
$assets += @{ Name="weap-bomb-cherry"; Source="techs03.png"; X=448; Y=0 }

# --- HULLS ---
$assets += @{ Name="hull-freight-s"; Source="techhulls01.png"; X=0; Y=0 }
$assets += @{ Name="hull-freight-m"; Source="techhulls01.png"; X=64; Y=0 }
$assets += @{ Name="hull-freight-l"; Source="techhulls01.png"; X=128; Y=0 }
$assets += @{ Name="hull-freight-super"; Source="techhulls01.png"; X=192; Y=0 }
$assets += @{ Name="hull-scout";     Source="techhulls01.png"; X=256; Y=0 }
$assets += @{ Name="hull-frigate";   Source="techhulls01.png"; X=320; Y=0 }
$assets += @{ Name="hull-destroyer"; Source="techhulls01.png"; X=384; Y=0 }
$assets += @{ Name="hull-cruiser";   Source="techhulls01.png"; X=448; Y=0 }
$assets += @{ Name="hull-battle-cruiser"; Source="techhulls02.png"; X=0; Y=0 }
$assets += @{ Name="hull-battleship";     Source="techhulls02.png"; X=64; Y=0 }
$assets += @{ Name="hull-dreadnought";    Source="techhulls02.png"; X=128; Y=0 }
$assets += @{ Name="hull-privateer"; Source="techhulls02.png"; X=192; Y=0 }
$assets += @{ Name="hull-rogue";     Source="techhulls02.png"; X=256; Y=0 }
$assets += @{ Name="hull-galleon";   Source="techhulls02.png"; X=320; Y=0 }
$assets += @{ Name="hull-colony";    Source="techhulls02.png"; X=448; Y=0 }

# New Hulls
$assets += @{ Name="hull-mini-bomber";    Source="techhulls03.png"; X=0; Y=0 }
$assets += @{ Name="hull-b17";            Source="techhulls03.png"; X=64; Y=0 }
$assets += @{ Name="hull-stealth-bomber"; Source="techhulls03.png"; X=128; Y=0 }
$assets += @{ Name="hull-b52";            Source="techhulls03.png"; X=192; Y=0 }
$assets += @{ Name="hull-midget-miner";   Source="techhulls03.png"; X=256; Y=0 }
$assets += @{ Name="hull-mini-miner";     Source="techhulls03.png"; X=320; Y=0 }
$assets += @{ Name="hull-ultra-miner";    Source="techhulls04.png"; X=0; Y=0 }
$assets += @{ Name="hull-fuel-transport"; Source="techhulls04.png"; X=64; Y=0 }

# --- EXECUTION ---
$outputImage = "tech-atlas.png"
$outputCSS = "tech-atlas.css"
$tempDir = "temp_sprites_v7"

Write-Host "--- Stars! Asset Builder v7 ---" -ForegroundColor Cyan
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$i = 0
foreach ($item in $assets) {
    $src = $item.Source
    $name = $item.Name
    $idx = "{0:d2}" -f $i
    $outFile = "$tempDir/${idx}_${name}.png"
    
    if (Test-Path $src) {
        magick $src -crop 64x64+$($item.X)+$($item.Y) +repage $outFile
        if (Test-Path $outFile) { $spriteList += $outFile }
    } else {
        Write-Warning "Missing: $src"
    }
    $i++
}

if ($spriteList.Count -gt 0) {
    Write-Host "Stitching $($spriteList.Count) sprites..."
    magick montage $spriteList -tile 1x -geometry +0+0 -background none $outputImage
    
    $css = "/* Stars! Tech Atlas v7 */`n.tech-icon { width: 64px; height: 64px; background-image: url('assets/mobile-tech-atlas.png'); background-repeat: no-repeat; display: inline-block; image-rendering: pixelated; }`n"
    $y = 0
    foreach ($file in $spriteList) {
        $n = (Get-Item $file).BaseName -replace '^\d{2}_',''
        $css += ".$n { background-position: 0px -${y}px; }`n"
        $y += 64
    }
    Set-Content $outputCSS $css
    Write-Host "Done! Created $outputImage and $outputCSS" -ForegroundColor Green
}
Remove-Item $tempDir -Recurse -Force