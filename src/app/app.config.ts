import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Title } from '@angular/platform-browser';

import { routes } from './app.routes';
import { ApiModule } from './core/api';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { environment } from './environments/environment';
import { provideAuth0 } from '@auth0/auth0-angular';
import { apiAuthInterceptor } from './core/auth/api-auth.interceptor';
import { AuthFacade } from './core/auth/auth.facade';
import { computeAuthIsDevelopment } from './core/auth/msal.tokens';

// Stub the Auth0 SDK only when the shared dev-stub decision is active, so the `?realauth=1`
// escape hatch flips BOTH the facade and the Auth0 SDK together (never one mocked, one real).
function isDevelopmentEnvironment(): boolean {
  return computeAuthIsDevelopment();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    Title,
    provideHttpClient(withInterceptors([apiAuthInterceptor])),
    importProvidersFrom(
      ApiModule.forRoot({
        rootUrl: environment.apiUrl,
      })
    ),
    provideAuth0({
      domain: environment.auth0Domain,
      clientId: environment.auth0ClientId,
      useRefreshTokens: true,
      authorizationParams: {
        redirect_uri: window.location.origin,
        ...(environment.auth0Audience ? { audience: environment.auth0Audience } : {}),
      },
      ...(isDevelopmentEnvironment() && {
        skipRedirectCallback: true,
        _overrideIsAuthenticated: true,
        isAuthenticated: () => Promise.resolve(true),
        getUser: () =>
          Promise.resolve({
            email: 'local@development.com',
            name: 'Local Development User',
            sub: 'local-development',
          }),
        handleRedirectCallback: () => Promise.resolve({ appState: {} }),
        loginWithRedirect: () => Promise.resolve(),
        logout: () => Promise.resolve(),
      }),
    }),
    // Initialize MSAL and process any pending Microsoft redirect before the app renders.
    // No-op under the development stub. Non-fatal: Entra is the optional second provider, so a
    // failure here (e.g. Entra not configured yet) must degrade to Auth0-only rather than block
    // app bootstrap and take down Auth0 sign-in too.
    provideAppInitializer(() => {
      const facade = inject(AuthFacade);
      return facade.initializeMsal().catch((error: unknown) => {
        console.error('[auth] MSAL initialization failed; continuing with Auth0 only.', error);
      });
    }),
  ],
};
