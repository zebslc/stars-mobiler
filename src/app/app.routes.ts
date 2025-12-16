import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./screens/new-game/new-game.component').then((m) => m.NewGameComponent),
  },
  {
    path: 'map',
    loadComponent: () =>
      import('./screens/galaxy-map/galaxy-map.component').then((m) => m.GalaxyMapComponent),
  },
  {
    path: 'planets',
    loadComponent: () =>
      import('./screens/planets-overview/planets-overview.component').then((m) => m.PlanetsOverviewComponent),
  },
  {
    path: 'fleets',
    loadComponent: () =>
      import('./screens/fleets-overview/fleets-overview.component').then((m) => m.FleetsOverviewComponent),
  },
  {
    path: 'research',
    loadComponent: () =>
      import('./screens/research-overview/research-overview.component').then((m) => m.ResearchOverviewComponent),
  },
  {
    path: 'ship-design',
    loadComponent: () =>
      import('./screens/ship-design-overview/ship-design-overview.component').then((m) => m.ShipDesignOverviewComponent),
  },
  {
    path: 'planet/:id',
    loadComponent: () =>
      import('./screens/planet-detail/planet-detail.component').then(
        (m) => m.PlanetDetailComponent,
      ),
  },
  {
    path: 'fleet/:id',
    loadComponent: () =>
      import('./screens/fleet-detail/fleet-detail.component').then((m) => m.FleetDetailComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./screens/settings/settings.component').then((m) => m.SettingsComponent),
  },
];
