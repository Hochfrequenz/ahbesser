// this environment is used for local development and on the staging server
import { EnvironmentInterface } from './environment.interface';

export const environment: EnvironmentInterface = {
  // set to TRUE if you want the DEFAULT AUTHENTICATION BEHAVIOR of the production environment
  isProduction: false, // during local development (localhost 4000/4200), the user "local@development.com" is authenticated by default
  apiUrl: 'http://localhost:3000',
  bedingungsbaumBaseUrl: 'https://bedingungsbaum.stage.hochfrequenz.de',
  ebdBaseUrl: 'https://ebd.stage.hochfrequenz.de',
  auth0Domain: 'auth.hochfrequenz.de',
  auth0ClientId: 'Hku0EniRjy4B2krnx1sCwTIOzAiVta1B',
  baseUrl: 'http://localhost:4200',
};
