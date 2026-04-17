import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/tcp-client',
    pathMatch: 'full',
  },
  {
    path: 'tcp-client',
    loadComponent: () =>
      import('../tcp-client/tcp-client.component').then((m) => m.TcpClientComponent),
  },
];
