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
];
