import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./screens/new-game/new-game.component').then(m => m.NewGameComponent)
  },
  {
    path: 'map',
    loadComponent: () => import('./screens/galaxy-map/galaxy-map.component').then(m => m.GalaxyMapComponent)
  }
];
