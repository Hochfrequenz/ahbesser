import { Routes } from '@angular/router';
import { InputSearchEnhancedComponent } from './shared/components/input-search-enhanced/input-search-enhanced.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'ahb',
    loadChildren: async () =>
      (await import('./features/ahbs/ahb.routes')).AHB_ROUTES,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    loadChildren: async () =>
      (await import('./features/landingpage/landingpage.routes'))
        .LANDINGPAGE_ROUTES,
  },
  {
    path: 'search',
    component: InputSearchEnhancedComponent,
    canActivate: [AuthGuard],
  },
];
