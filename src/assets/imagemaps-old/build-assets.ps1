# =============================================================================
# Stars! Mobile Asset Builder v4 (Expanded Roster)
# Usage: pwsh build-assets-v4.ps1
# =============================================================================

# 1. RESET
$assets = $null
$spriteList = $null
$assets = @()
$spriteList = @()

# 2. DEFINE EXPANDED ASSET LIST
# Coordinates derived from original CSS files

# --- ENGINES ---
$assets += @{ Name="eng-settler"; Source="techs02.png"; X=0;   Y=64 }  # Settler's Delight
$assets += @{ Name="eng-mizer";   Source="techs02.png"; X=64;  Y=64 }  # Fuel Mizer
$assets += @{ Name="eng-trans";   Source="techs02.png"; X=256; Y=0 }   # Trans-Galactic
$assets += @{ Name="eng-ram";     Source="techs02.png"; X=448; Y=0 }   # Ramscoop

# --- SCANNERS ---
$assets += @{ Name="scan-viewer";  Source="techs01.png"; X=0;   Y=128 } # Viewer 50
$assets += @{ Name="scan-rhino";   Source="techs03.png"; X=0;   Y=128 } # Rhino
$assets += @{ Name="scan-mole";    Source="techs03.png"; X=64;  Y=128 } # Mole
$assets += @{ Name="scan-snooper"; Source="techs01.png"; X=256; Y=128 } # Snooper
$assets += @{ Name="scan-eagle";   Source="techs03.png"; X=192; Y=128 } # Eagle Eye

# --- SHIELDS ---
$assets += @{ Name="def-shield-mole";  Source="techs03.png"; X=128; Y=64 }  # Mole-Skin
$assets += @{ Name="def-shield-cow";   Source="techs03.png"; X=192; Y=64 }  # Cow-Hide
$assets += @{ Name="def-shield-wolf";  Source="techs03.png"; X=256; Y=64 }  # Wolverine
$assets += @{ Name="def-shield-phase"; Source="techs04.png"; X=448; Y=128 } # Phase Shield

# --- ARMOR ---
$assets += @{ Name="def-armor-tri";  Source="techs01.png"; X=0;   Y=0 } # Tritanium
$assets += @{ Name="def-armor-crob"; Source="techs01.png"; X=64;  Y=0 } # Crobmnium
$assets += @{ Name="def-armor-neu";  Source="techs01.png"; X=320; Y=0 } # Neutronium
$assets += @{ Name="def-armor-val";  Source="techs01.png"; X=128; Y=0 } # Valanium

# --- WEAPONS (Beams, Torps, Bombs) ---
$assets += @{ Name="weap-laser";       Source="techs02.png"; X=256; Y=192 } # Laser
$assets += @{ Name="weap-xray";        Source="techs02.png"; X=320; Y=192 } # X-Ray
$assets += @{ Name="weap-disrupt";     Source="techs02.png"; X=192; Y=192 } # Disruptor
$assets += @{ Name="weap-phasor";      Source="techs02.png"; X=192; Y=128 } # Phasor (Yakimora)
$assets += @{ Name="weap-torp-alpha";  Source="techs01.png"; X=64;  Y=192 } # Alpha Torp
$assets += @{ Name="weap-torp-rho";    Source="techs01.png"; X=320; Y=192 } # Rho Torp
$assets += @{ Name="weap-torp-anti";   Source="techs04.png"; X=256; Y=64 }  # Anti-Matter
$assets += @{ Name="weap-bomb-smart";  Source="techs04.png"; X=0;   Y=128 } # Smart Bomb
$assets += @{ Name="weap-bomb-cherry"; Source="techs03.png"; X=448; Y=0 }   # Cherry Bomb

# --- HULLS (Expanded List) ---
# Freighters
$assets += @{ Name="hull-freight-s"; Source="techhulls01.png"; X=0;   Y=0 }
$assets += @{ Name="hull-freight-m"; Source="techhulls01.png"; X=64;  Y=0 }
$assets += @{ Name="hull-freight-l"; Source="techhulls01.png"; X=128; Y=0 }

# Warships
$assets += @{ Name="hull-scout";     Source="techhulls01.png"; X=256; Y=0 }
$assets += @{ Name="hull-frigate";   Source="techhulls01.png"; X=320; Y=0 }
$assets += @{ Name="hull-destroyer"; Source="techhulls01.png"; X=384; Y=0 }
$assets += @{ Name="hull-cruiser";   Source="techhulls01.png"; X=448; Y=0 }
$assets += @{ Name="hull-battle-cruiser"; Source="techhulls02.png"; X=0;   Y=0 }
$assets += @{ Name="hull-battleship";     Source="techhulls02.png"; X=64;  Y=0 }
$assets += @{ Name="hull-dreadnought";    Source="techhulls02.png"; X=128; Y=0 }

# Special
$assets += @{ Name="hull-privateer"; Source="techhulls02.png"; X=192; Y=0 }
$assets += @{ Name="hull-rogue";     Source="techhulls02.png"; X=256; Y=0 }
$assets += @{ Name="hull-galleon";   Source="techhulls02.png"; X=320; Y=0 }
$assets += @{ Name="hull-colony";    Source="techhulls02.png"; X=448; Y=0 }

# Starbases
$assets += @{ Name="hull-sb-fort";    Source="starbases.png"; X=0;   Y=0 }
$assets += @{ Name="hull-sb-station"; Source="starbases.png"; X=128; Y=0 }

# --- CONFIG ---
$outputImage = "mobile-tech-atlas.png"
$outputCSS = "tech-atlas.css"
$tempDir = "temp_sprites_v4"

# 3. EXECUTION
Write-Host "--- Stars! Asset Builder v4 ---" -ForegroundColor Cyan
Write-Host "Target Assets: $($assets.Count)" -ForegroundColor Yellow

if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

$i = 0
foreach ($item in $assets) {
    $src = $item.Source
    $x = $item.X
    $y = $item.Y
    $name = $item.Name
    
    $idx = "{0:d2}" -f $i
    $outFile = "$tempDir/${idx}_${name}.png"
    
    if (-not (Test-Path $src)) {
        Write-Warning "[$idx] MISSING FILE: $src (Skipping)"
    } else {
        # Using -crop with +repage for safety
        magick $src -crop 64x64+$x+$y +repage $outFile
        if (Test-Path $outFile) { $spriteList += $outFile }
    }
    $i++
}

# 4. STITCH & CSS
Write-Host "Stitching $($spriteList.Count) sprites..." -ForegroundColor Cyan

if ($spriteList.Count -gt 0) {
    magick montage $spriteList -tile 1x -geometry +0+0 -background none $outputImage
    
    $cssContent = "/* Stars! Tech Atlas v4 (Expanded) */`n"
    $cssContent += ".tech-icon {`n  width: 64px;`n  height: 64px;`n  background-image: url('$outputImage');`n  background-repeat: no-repeat;`n  display: inline-block;`n}`n"

    $yOffset = 0
    foreach ($file in $spriteList) {
        $fileNameObj = Get-Item $file
        $cleanName = $fileNameObj.BaseName -replace '^\d{2}_',''
        $cssContent += ".$cleanName { background-position: 0px -${yOffset}px; }`n"
        $yOffset += 64
    }
    Set-Content -Path $outputCSS -Value $cssContent
    
    Write-Host "SUCCESS! Created $outputImage and $outputCSS" -ForegroundColor Green
} else {
    Write-Error "No sprites found."
}
Remove-Item $tempDir -Recurse -Force