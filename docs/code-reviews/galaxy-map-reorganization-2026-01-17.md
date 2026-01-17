# Galaxy Map Services Reorganization

## Overview
The galaxy-map services folder has been reorganized from a flat structure into a domain-driven architecture with logical subfolders.

## New Structure

```
src/app/screens/galaxy-map/services/
├── fleet/                           # Fleet-related services
│   ├── galaxy-fleet-filter.service.ts
│   ├── galaxy-fleet-filter.service.spec.ts
│   ├── galaxy-fleet-position.service.ts
│   ├── galaxy-fleet-position.service.spec.ts
│   ├── galaxy-fleet-station.service.ts
│   ├── galaxy-fleet-station.service.spec.ts
│   ├── galaxy-fleet.service.ts
│   └── index.ts
├── navigation/                      # Navigation and interaction services
│   ├── galaxy-coordinate.service.ts
│   ├── galaxy-interaction.service.ts
│   ├── galaxy-map-interaction.service.ts
│   ├── galaxy-navigation.service.ts
│   ├── galaxy-waypoint-interaction.service.ts
│   └── index.ts
├── state/                           # State management services
│   ├── galaxy-map-state.service.ts
│   ├── galaxy-selection.service.ts
│   └── index.ts
├── ui/                              # UI and menu services
│   ├── galaxy-context-menu.service.ts
│   ├── galaxy-map-menu.service.ts
│   └── index.ts
├── visualization/                   # Visualization and visibility services
│   ├── galaxy-visibility.service.ts
│   ├── galaxy-visibility.service.spec.ts
│   └── index.ts
└── waypoints/                       # Waypoint-related services
    ├── galaxy-waypoint-order.service.ts
    ├── galaxy-waypoint-order.service.spec.ts
    ├── galaxy-waypoint-state.service.ts
    ├── galaxy-waypoint-state.service.spec.ts
    ├── galaxy-waypoint-visual.service.ts
    ├── galaxy-waypoint-visual.service.spec.ts
    ├── galaxy-waypoint.models.ts
    ├── galaxy-waypoint.service.ts
    └── galaxy-waypoint.service.spec.ts
```

## Domain Breakdown

### Fleet Domain (`fleet/`)
**Purpose:** Services related to fleet management, filtering, positioning, and station operations.

- `galaxy-fleet-filter.service.ts` - Filters fleets based on various criteria
- `galaxy-fleet-position.service.ts` - Manages fleet positioning on the galaxy map
- `galaxy-fleet-station.service.ts` - Handles fleet station operations

### Navigation Domain (`navigation/`)
**Purpose:** Services handling map navigation, coordinates, and user interactions.

- `galaxy-coordinate.service.ts` - Coordinate system transformations
- `galaxy-navigation.service.ts` - Map navigation operations (centering, zooming)
- `galaxy-interaction.service.ts` - User interaction handling
- `galaxy-map-interaction.service.ts` - Map-specific interactions
- `galaxy-waypoint-interaction.service.ts` - Waypoint interaction handling

### State Domain (`state/`)
**Purpose:** State management for the galaxy map.

- `galaxy-map-state.service.ts` - Overall galaxy map state
- `galaxy-selection.service.ts` - Selection state management

### UI Domain (`ui/`)
**Purpose:** User interface elements like menus and context menus.

- `galaxy-context-menu.service.ts` - Context menu operations
- `galaxy-map-menu.service.ts` - Galaxy map menu management

### Visualization Domain (`visualization/`)
**Purpose:** Services related to rendering and visibility.

- `galaxy-visibility.service.ts` - Visibility calculations and fog of war

### Waypoints Domain (`waypoints/`)
**Purpose:** Waypoint-related functionality.

- `galaxy-waypoint.service.ts` - Main waypoint orchestration
- `galaxy-waypoint-state.service.ts` - Waypoint state management
- `galaxy-waypoint-visual.service.ts` - Waypoint visualization
- `galaxy-waypoint-order.service.ts` - Waypoint order operations
- `galaxy-waypoint.models.ts` - Waypoint type definitions

## Changes Made

1. **Created domain subfolders** - Organized services into logical domain groups
2. **Moved 20+ service files** - Relocated all services to appropriate subfolders
3. **Updated all import paths** - Fixed ~15+ import references across:
   - galaxy-map.component.ts
   - Waypoint services (4 files)
   - Visualization services (2 files)
   - UI services (1 file)
   - Navigation services (4 files)
4. **Created index.ts files** - Added barrel exports for each domain folder
5. **Removed duplicates** - Cleaned up duplicate service files

## Benefits

1. **Improved Maintainability** - Related services are grouped together
2. **Clear Separation of Concerns** - Each domain has a specific responsibility
3. **Easier Navigation** - Developers can quickly find relevant services
4. **Scalability** - New services can be easily added to appropriate domains
5. **Better Code Organization** - Follows domain-driven design principles

## Migration Notes

- All services maintain their original functionality
- Import paths have been updated throughout the codebase
- Index files allow for cleaner imports: `from './services/fleet'` instead of long relative paths
- No breaking changes to service APIs or interfaces
