import { EnvironmentInterface } from './environment.interface';

export const environment: EnvironmentInterface = {
  isProduction: true, // DO NOT CHANGE - disables automatic dummy user login in production environment
  apiUrl: 'http://localhost:4000',
  bedingungsbaumBaseUrl: 'https://bedingungsbaum.stage.hochfrequenz.de',
  ebdBaseUrl: 'https://ebd.stage.hochfrequenz.de',
  auth0Domain: 'auth.hochfrequenz.de',
  auth0ClientId: 'Hku0EniRjy4B2krnx1sCwTIOzAiVta1B',
};
