# =============================================================================
# Stars! Mobile Asset Builder v5 (Complete Arsenal)
# Usage: pwsh build-assets-v5.ps1
# =============================================================================

# 1. RESET
$assets = $null
$spriteList = $null
$assets = @()
$spriteList = @()

# 2. DEFINE MASTER ASSET LIST
# We define them in the exact order we want them in the strip.

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

# --- BEAM WEAPONS (Standard, Gatling, Ramming) ---
$assets += @{ Name="weap-laser";       Source="techs02.png"; X=256; Y=192 } # Laser
$assets += @{ Name="weap-xray";        Source="techs02.png"; X=320; Y=192 } # X-Ray
$assets += @{ Name="weap-minigun";     Source="techs02.png"; X=256; Y=128 } # Mini Gun
$assets += @{ Name="weap-yakimora";    Source="techs02.png"; X=192; Y=128 } # Yakimora
$assets += @{ Name="weap-disrupt";     Source="techs02.png"; X=192; Y=192 } # Disruptor
$assets += @{ Name="weap-blackjack";   Source="techs02.png"; X=384; Y=64 }  # Blackjack
$assets += @{ Name="weap-phasor";      Source="techs02.png"; X=320; Y=128 } # Phasor (Note: Techs02 has one at 320,128)
$assets += @{ Name="weap-ph-bazooka";  Source="techs02.png"; X=320; Y=128 } # Phasor Bazooka (Proxy if needed)
$assets += @{ Name="weap-gatling";     Source="techs02.png"; X=128; Y=192 } # Gatling Gun
$assets += @{ Name="weap-bludgeon";    Source="techs02.png"; X=448; Y=64 }  # Bludgeon
$assets += @{ Name="weap-h-blaster";   Source="techs07.png"; X=64;  Y=0 }   # Heavy Blaster (Techs07)
$assets += @{ Name="weap-big-mutha";   Source="techs02.png"; X=448; Y=192 } # Big Mutha Cannon

# --- TORPEDOES ---
$assets += @{ Name="weap-torp-alpha";  Source="techs01.png"; X=64;  Y=192 } # Alpha
$assets += @{ Name="weap-torp-rho";    Source="techs01.png"; X=320; Y=192 } # Rho
$assets += @{ Name="weap-torp-anti";   Source="techs04.png"; X=256; Y=64 }  # Anti-Matter

# --- BOMBS ---
$assets += @{ Name="weap-bomb-smart";  Source="techs04.png"; X=0;   Y=128 } # Smart
$assets += @{ Name="weap-bomb-cherry"; Source="techs03.png"; X=448; Y=0 }   # Cherry

# --- HULLS ---
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

# --- EXECUTION ---
$outputImage = "mobile-tech-atlas.png"
$outputCSS = "tech-atlas.css"
$tempDir = "temp_sprites_v5"

Write-Host "--- Stars! Asset Builder v5 ---" -ForegroundColor Cyan
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
    
    $css = "/* Stars! Tech Atlas v5 */`n.tech-icon { width: 64px; height: 64px; background-image: url('mobile-tech-atlas.png'); display: inline-block; }`n"
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