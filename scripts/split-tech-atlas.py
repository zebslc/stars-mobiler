#!/usr/bin/env python3
"""
Stars! Tech Atlas Splitter
Splits the tech-atlas.png sprite sheet into individual PNG files
matching the names in the technology database.
Uses ImageMagick for image processing.
"""

import os
import sys
import subprocess
from pathlib import Path

# Configuration
SPRITE_SIZE = 64
INPUT_IMAGE = "src/assets/imagemaps/tech-atlas.png"
OUTPUT_DIR = "src/assets/tech-icons"
CSS_FILE = "src/app/shared/components/tech-atlas.css"

# Asset definitions matching build-assets-v8.ps1
# Format: Name -> Position in vertical sprite (0-based index)
ASSETS = [
    # ENGINES
    "eng-quick-jump-5",
    "eng-long-hump-6",
    "eng-daddy-long-legs-7",
    "eng-alpha-drive-8",
    "eng-sub-galactic-fuel-scoop",
    "eng-trans-galactic-drive",
    "eng-trans-galactic-fuel-scoop",
    "eng-radiating-hydro-ram-scoop",
    "eng-settlers-delight",
    "eng-fuel-mizer",
    "eng-trans-galactic-super-scoop",
    "eng-trans-galactic-mizer-scoop",
    "eng-interspace-10",
    "eng-trans-star-10",
    "eng-sub-galaxy-scoop",
    # STARGATES
    "gate-std",
    "gate-weight",
    "gate-distance",
    "gate-any",
    # MASS DRIVERS
    "driver-std",
    "driver-super",
    "driver-ultra",
    # BEAM WEAPONS
    "weap-laser",
    "weap-xray",
    "weap-minigun",
    "weap-yakimora",
    "weap-disruptor",
    "weap-phazer-bazooka",
    "weap-gatling",
    "weap-big-mutha",
    "weap-bludgeon",
    "weap-blackjack",
    "weap-pulsed-sapper",
    "weap-colloidal-phaser",
    "weap-mini-blaster",
    "weap-mark-iv-blaster",
    "weap-phased-sapper",
    "weap-heavy-blaster",
    "weap-gatling-neutrino",
    "weap-myopic-disrupter",
    "weap-mega-disrupter",
    "weap-streaming-pulverizer",
    "weap-anti-matter-pulverizer",
    "weap-syncro-sapper",
    # TORPEDOES & MISSILES
    "weap-torp-alpha",
    "weap-torp-beta",
    "weap-torp-delta",
    "weap-torp-epsilon",
    "weap-torp-rho",
    "weap-torp-upsilon",
    "weap-torp-omega",
    "weap-torp-anti",
    "weap-missile-jihad",
    "weap-missile-juggernaut",
    "weap-missile-doomsday",
    "weap-missile-armageddon",
    # BOMBS
    "weap-bomb-lady",
    "weap-bomb-black-cat",
    "weap-bomb-m70",
    "weap-bomb-m80",
    "weap-bomb-cherry",
    "weap-bomb-lbu17",
    "weap-bomb-lbu32",
    "weap-bomb-lbu74",
    "weap-bomb-retro",
    "weap-bomb-smart",
    "weap-bomb-neutron",
    "weap-bomb-enriched-neutron",
    "weap-bomb-peerless",
    "weap-bomb-annihilator",
    # SHIELDS
    "def-shield-mole",
    "def-shield-cow",
    "def-shield-wolf",
    "def-shield-croby",
    "def-shield-shadow",
    "def-shield-bear",
    "def-shield-gorilla",
    "def-shield-elephant",
    "def-shield-phase",
    "def-shield-langston",
    # ARMOR
    "def-armor-tri",
    "def-armor-crob",
    "def-armor-neu",
    "def-armor-val",
    # COMPUTERS
    "elec-comp-bat",
    "elec-comp-cyber",
    "elec-comp-nexus",
    # ELECTRICAL
    "elec-jammer-10",
    "elec-jammer-20",
    "elec-jammer-50",
    "elec-cloak-stealth",
    "elec-cloak-super",
    "elec-capacitor",
    # MECHANICAL
    "mech-fuel-tank",
    "mech-super-tank",
    "mech-colony-mod",
    "mech-maneuver-jet",
    "mech-overthruster",
    "mech-robo-miner",
    "mech-auto-miner",
    # SCANNERS
    "scan-viewer",
    "scan-rhino",
    "scan-mole",
    "scan-possum",
    "scan-snooper",
    "scan-eagle",
    "scan-peerless",
    # CARGO
    "icon-cargo-small",
    "icon-cargo-med",
    "icon-cargo-large",
    # ORBITAL
    "orb-dock",
    "orb-sensor",
    "orb-shield",
    # HULLS
    "hull-freight-s",
    "hull-freight-m",
    "hull-freight-l",
    "hull-freight-super",
    "hull-scout",
    "hull-frigate",
    "hull-destroyer",
    "hull-cruiser",
    "hull-battle-cruiser",
    "hull-battleship",
    "hull-dreadnought",
    "hull-privateer",
    "hull-rogue",
    "hull-galleon",
    "hull-nubian",
    "hull-meta-morph",
    "hull-mini-colony",
    "hull-colony",
    "hull-mini-bomber",
    "hull-b17",
    "hull-stealth-bomber",
    "hull-b52",
    "hull-midget-miner",
    "hull-mini-miner",
    "hull-miner",
    "hull-maxi-miner",
    "hull-ultra-miner",
    "hull-fuel-transport",
    "hull-super-fuel-export",
    "hull-mini-mine-layer",
    "hull-super-mine-layer",
    "hull-orbital-fort",
    "hull-space-dock",
    "hull-space-station",
    "hull-ultra-station",
    "hull-death-star",
]


def check_imagemagick():
    """Check if ImageMagick is installed."""
    try:
        result = subprocess.run(['magick', '--version'],
                              capture_output=True,
                              text=True,
                              timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def split_sprite_sheet():
    """Split the vertical sprite sheet into individual PNG files using ImageMagick."""

    # Check if ImageMagick is installed
    if not check_imagemagick():
        print("Error: ImageMagick not found.")
        print("Please install ImageMagick: brew install imagemagick")
        return False

    # Check if input image exists
    if not os.path.exists(INPUT_IMAGE):
        print(f"Error: Input image not found: {INPUT_IMAGE}")
        print("Please ensure the tech-atlas.png file exists.")
        return False

    # Create output directory
    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"Loading sprite sheet: {INPUT_IMAGE}")
    print(f"Extracting {len(ASSETS)} individual images...")

    # Extract each sprite using ImageMagick
    extracted_count = 0
    for index, asset_name in enumerate(ASSETS):
        # Calculate position (vertical strip, so X=0, Y varies)
        y_pos = index * SPRITE_SIZE

        try:
            # Output file path
            output_file = output_path / f"{asset_name}.png"

            # Use ImageMagick to crop the sprite
            # Format: magick input.png -crop WIDTHxHEIGHT+X+Y +repage output.png
            cmd = [
                'magick',
                INPUT_IMAGE,
                '-crop',
                f'{SPRITE_SIZE}x{SPRITE_SIZE}+0+{y_pos}',
                '+repage',
                str(output_file)
            ]

            result = subprocess.run(cmd,
                                  capture_output=True,
                                  text=True,
                                  timeout=10)

            if result.returncode == 0:
                extracted_count += 1
                if (index + 1) % 10 == 0:
                    print(f"  Extracted {index + 1}/{len(ASSETS)}...")
            else:
                print(f"Error extracting {asset_name}: {result.stderr}")

        except Exception as e:
            print(f"Error extracting {asset_name}: {e}")

    print(f"✓ Successfully extracted {extracted_count} images to {OUTPUT_DIR}/")
    return True


def generate_css():
    """Generate updated CSS for individual image files."""

    css_content = """/* Stars! Tech Atlas - Individual Images */
.tech-icon {
  width: 64px;
  height: 64px;
  background-repeat: no-repeat;
  background-size: contain;
  display: inline-block;
  image-rendering: pixelated;
}

"""

    for asset_name in ASSETS:
        css_content += f".{asset_name} {{\n"
        css_content += f"  background-image: url('/assets/tech-icons/{asset_name}.png');\n"
        css_content += f"}}\n\n"

    # Write CSS file
    print(f"\nGenerating CSS: {CSS_FILE}")
    try:
        with open(CSS_FILE, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print(f"✓ CSS file generated successfully")
        return True
    except Exception as e:
        print(f"Error writing CSS: {e}")
        return False


def main():
    """Main execution."""
    print("=" * 60)
    print("Stars! Tech Atlas Splitter")
    print("=" * 60)
    print()

    # Split sprite sheet
    if not split_sprite_sheet():
        sys.exit(1)

    # Generate CSS
    if not generate_css():
        sys.exit(1)

    print()
    print("=" * 60)
    print("✓ Complete! Tech atlas split into individual images.")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Review the generated images in", OUTPUT_DIR)
    print("2. Test the updated CSS in your application")
    print("3. Delete old sprite sheet if no longer needed")


if __name__ == "__main__":
    main()
