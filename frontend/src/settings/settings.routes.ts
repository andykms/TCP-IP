import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'interface',
    pathMatch: 'full',
  },
  {
    path: 'interface',
    loadComponent: () =>
      import('./interface/interface.component').then((m) => m.InterfaceComponent),
  },
];
