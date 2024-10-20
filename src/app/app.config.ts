import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { ApiModule } from './core/api';
import { HttpClientModule } from '@angular/common/http';
import { environment } from './environments/environment';
import { provideAuth0 } from '@auth0/auth0-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(
      HttpClientModule,
      ApiModule.forRoot({
        rootUrl: environment.apiUrl,
      }),
    ),
    provideAuth0({
      domain: 'hochfrequenz.eu.auth0.com',
      clientId: 'di7tHFfTV4ZXMWXfY4DHhCcJvgJcor8k',
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    }),
  ],
};
