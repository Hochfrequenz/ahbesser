import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { ApiModule } from './core/api';
import { HttpClientModule } from '@angular/common/http';
import { environment } from './environments/environment';

console.log({ environment });

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(
      HttpClientModule,
      ApiModule.forRoot({
        rootUrl: environment.apiUrl,
      }),
    ),
  ],
};
