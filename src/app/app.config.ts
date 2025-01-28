import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { ApiModule } from './core/api';
import { HttpClientModule } from '@angular/common/http';
import { environment } from './environments/environment';
import { provideAuth0 } from '@auth0/auth0-angular';

function isDevelopmentEnvironment(): boolean {
  return !environment.isProduction || window.location.hostname === 'localhost';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    importProvidersFrom(
      HttpClientModule,
      ApiModule.forRoot({
        rootUrl: environment.apiUrl,
      })
    ),
    provideAuth0({
      domain: environment.auth0Domain,
      clientId: environment.auth0ClientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
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
  ],
};
