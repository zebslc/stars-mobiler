import type { Routes } from '@angular/router';
import { gameActiveGuard } from './core/guards/game-active.guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./screens/new-game/new-game.component').then((m) => m.NewGameComponent),
  },
  {
    path: 'map',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/galaxy-map/galaxy-map.component').then((m) => m.GalaxyMapComponent),
  },
  {
    path: 'stars',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/stars-overview/stars-overview.component').then(
        (m) => m.StarsOverviewComponent,
      ),
  },
  {
    path: 'fleets',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/fleets-overview/fleets-overview.component').then(
        (m) => m.FleetsOverviewComponent,
      ),
  },
  {
    path: 'research',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/research-overview/research-overview.component').then(
        (m) => m.ResearchOverviewComponent,
      ),
  },
  {
    path: 'ship-design',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/ship-design-overview/ship-design-overview.component').then(
        (m) => m.ShipDesignOverviewComponent,
      ),
  },
  {
    path: 'star/:id',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/star-detail/star-detail.component').then(
        (m) => m.StarDetailComponent,
      ),
  },
  {
    path: 'fleet/:id',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/fleet-detail/fleet-detail.component').then((m) => m.FleetDetailComponent),
  },
  {
    path: 'settings',
    canActivate: [gameActiveGuard],
    loadComponent: () =>
      import('./screens/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
