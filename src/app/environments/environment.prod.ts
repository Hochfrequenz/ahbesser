import { EnvironmentInterface } from './environment.interface';

export const environment: EnvironmentInterface = {
  isProduction: true, // DO NOT CHANGE - disables automatic dummy user login in production environment
  apiUrl: 'https://ahb-tabellen.hochfrequenz.de',
  bedingungsbaumBaseUrl: 'https://bedingungsbaum.hochfrequenz.de',
  ebdBaseUrl: 'https://ebd.hochfrequenz.de',
  fristenkalenderBaseUrl: 'https://fristenkalender.hochfrequenz.de',
  auth0Domain: 'auth.hochfrequenz.de',
  auth0ClientId: 'VSkXGqlTD7Rf5Q4n9a0h00rInEyL2ZQj',
  baseUrl: 'https://ahb-tabellen.hochfrequenz.de',
};
