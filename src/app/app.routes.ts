import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landingpage/views/landing-page/landing-page.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: async () =>
      (
        await import(
          './features/landingpage/views/landing-page/landing-page.component'
        )
      ).LandingPageComponent,
  },
];
