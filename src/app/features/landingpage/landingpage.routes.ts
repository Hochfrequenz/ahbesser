import { Routes } from '@angular/router';

export const LANDINGPAGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: async () =>
      (await import('./views/landing-page/landing-page.component'))
        .LandingPageComponent,
  },
];
