import { Routes } from '@angular/router';

export const AHB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: async () =>
      (await import('./views/ahb-landing-page/ahb-landing-page.component'))
        .AhbLandingPageComponent,
  },
  {
    path: ':formatVersion/:pruefi',
    loadComponent: async () =>
      (await import('./views/ahb-page/ahb-page.component')).AhbPageComponent,
  },
];
