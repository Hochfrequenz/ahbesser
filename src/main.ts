import { bootstrapApplication } from '@angular/platform-browser';
import { provideAuth0 } from '@auth0/auth0-angular';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    provideAuth0({
      domain: process.env['AUTH0_DOMAIN'] || '',
      clientId: process.env['AUTH0_CLIENT_ID'] || '',
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    }),
  ],
}).catch((err) => console.error(err));
