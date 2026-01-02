# STARS! Manual Documentation

This directory contains the complete STARS! Player's Manual, organized into AI-friendly, topic-based sections.

## Quick Start

**Start here**: [index.md](./index.md) - Main table of contents with links to all sections

## What's Here

The original STARS! manual (`Stars.md`, 9174 lines, 373.5KB) has been broken down into **34 focused markdown files** organized across **7 thematic directories**:

### Directory Structure

```
manual/
├── index.md                    # Main navigation and table of contents
├── Stars.md                    # Original complete manual (preserved)
│
├── 01-introduction/            # Game overview and setup (2 files)
│   ├── welcome.md
│   └── setup.md
│
├── 02-getting-started/         # Tutorials and game setup (4 files)
│   ├── tutorial.md
│   ├── single-player.md
│   ├── multi-player.md
│   └── general-tips.md
│
├── 03-ui/                      # User interface guide (1 file)
│   └── screen-layout.md
│
├── 04-gameplay/                # Core game mechanics (14 files)
│   ├── planets.md
│   ├── production.md
│   ├── research.md
│   ├── ship-design.md
│   ├── fleet-management.md
│   ├── navigation.md
│   ├── colonization.md
│   ├── mining.md
│   ├── transport.md
│   ├── combat.md
│   ├── patrolling.md
│   ├── scanning-cloaking.md
│   ├── reports.md
│   └── diplomacy.md
│
├── 05-race-creation/           # Race design and variants (3 files)
│   ├── custom-races.md
│   ├── predefined-races.md
│   └── alternate-reality.md
│
├── 06-advanced-mechanics/      # Deep technical details (4 files)
│   ├── combat-guts.md
│   ├── cloaking-guts.md
│   ├── mass-drivers-guts.md
│   └── minefields-guts.md
│
└── 07-reference/               # Quick lookup tables (5 files)
    ├── keyboard-shortcuts.md
    ├── technology-tables.md
    ├── files.md
    ├── faq.md
    └── glossary.md
```

## File Size Distribution

All files are optimized for AI consumption with manageable sizes:

- **Smallest**: 17 lines (tutorial.md)
- **Largest**: 1,056 lines (planets.md)
- **Average**: ~270 lines per file
- **Most files**: 100-700 lines

## Features

Each documentation file includes:

1. **Clear Title** - Descriptive heading
2. **Summary** - Quick description of contents
3. **Related Sections** - Cross-references to relevant topics (where applicable)
4. **Content** - Focused, topic-specific information from the original manual

## Usage for AI Agents

### Finding Information

1. Start with [index.md](./index.md) to locate the topic
2. Navigate to the specific section file
3. Each file is self-contained with minimal dependencies
4. Use cross-references to explore related topics

### Implementation Reference

- **UI Features**: See `03-ui/screen-layout.md`
- **Game Mechanics**: See files in `04-gameplay/`
- **Technical Formulas**: See files in `06-advanced-mechanics/`
- **Data Tables**: See files in `07-reference/`
- **Terminology**: See `07-reference/glossary.md`

### Best Practices

- Reference specific sections rather than the entire manual
- Follow cross-references for comprehensive understanding
- Check glossary for unfamiliar game-specific terms
- Use technology tables for precise stat references

## Original Source

The original manual is preserved as `Stars.md` in this directory. The chunked files were extracted programmatically to maintain content fidelity while improving organization.

## Credits

**STARS! Design and Programming**: Jeff McBride, Jeff Johnson
**Documentation**: Kurt Kremer, Brett Kremer
**Manual Organization**: Created for the Stars Mobile project (2026)

© 1996 Entertainment International (UK) Ltd. All Rights Reserved.
