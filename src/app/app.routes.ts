import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ahb',
    loadChildren: async () =>
      (await import('./features/ahbs/ahb.routes')).AHB_ROUTES,
  },
  {
    path: '',
    loadChildren: async () =>
      (await import('./features/landingpage/landingpage.routes'))
        .LANDINGPAGE_ROUTES,
  },
];
