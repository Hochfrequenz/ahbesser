import type { EnvironmentInterface } from '../../app/environments/environment.interface';

/** Path the browser requests; `index.html` loads it before the application bundle. */
export const CONFIG_SCRIPT_PATH = '/config.js';

/**
 * The part of the frontend environment a deployment may override.
 *
 * `isProduction` is deliberately not overridable: it gates the automatic dummy-user login, so a
 * stray line in a stack's `.env` must not be able to switch it off. It stays compiled into the
 * bundle. Keep this type in sync with `src/app/environments/runtime-config.ts`.
 */
export type RuntimeConfig = Partial<Omit<EnvironmentInterface, 'isProduction'>>;

/**
 * Environment variable names, in the `APP_*` convention the sibling apps on the
 * hf-apps-collection platform already use.
 */
export const ENV_VARS = {
  apiUrl: 'APP_API_URL',
  baseUrl: 'APP_BASE_URL',
  bedingungsbaumBaseUrl: 'APP_BEDINGUNGSBAUM_BASE_URL',
  ebdBaseUrl: 'APP_EBD_BASE_URL',
  fristenkalenderBaseUrl: 'APP_FRISTENKALENDER_BASE_URL',
  auth0Domain: 'APP_AUTH0_DOMAIN',
  auth0ClientId: 'APP_AUTH0_CLIENT_ID',
  auth0Audience: 'APP_AUTH0_AUDIENCE',
  entraClientId: 'APP_ENTRA_CLIENT_ID',
  entraAuthority: 'APP_ENTRA_AUTHORITY',
  entraScopes: 'APP_ENTRA_SCOPES',
  entraApiScope: 'APP_ENTRA_API_SCOPE',
  warmupUrl: 'APP_WARMUP_URL',
  allowSearchIndexing: 'APP_ALLOW_SEARCH_INDEXING',
  enablePruefiComparison: 'APP_ENABLE_PRUEFI_COMPARISON',
} as const satisfies Record<keyof RuntimeConfig, string>;

function setIfPresent<K extends keyof RuntimeConfig>(
  config: RuntimeConfig,
  key: K,
  value: RuntimeConfig[K] | undefined
): void {
  if (value !== undefined) config[key] = value;
}

/** An unset variable and an empty one both mean "keep the value compiled into the bundle". */
function readString(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name];
  return value === undefined || value === '' ? undefined : value;
}

/**
 * Parsed strictly rather than by truthiness. `APP_ALLOW_SEARCH_INDEXING=yes` silently meaning
 * `false` is the kind of misconfiguration that is only noticed months later, so it fails the
 * request instead.
 */
function readBoolean(env: NodeJS.ProcessEnv, name: string): boolean | undefined {
  const value = readString(env, name);
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be "true" or "false", got "${value}"`);
}

/** Comma-separated, e.g. `APP_ENTRA_SCOPES=openid,profile,email`. */
function readList(env: NodeJS.ProcessEnv, name: string): string[] | undefined {
  const value = readString(env, name);
  if (value === undefined) return undefined;
  const entries = value
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
  // A value that is only separators (`,` or `, ,`) means the same as unset. Returning the empty
  // array instead would override the compiled scopes with none, and MSAL would sign in without
  // asking for any.
  return entries.length > 0 ? entries : undefined;
}

/**
 * Collect the runtime configuration this deployment overrides.
 *
 * Only variables that are actually set appear in the result, so everything else falls back to the
 * values compiled into the bundle. That is what allows one image to serve stage and production
 * (ADR-0008 in Hochfrequenz/hf-apps-collection) while a developer running `ng serve` needs no
 * configuration at all.
 */
export function buildRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const config: RuntimeConfig = {};

  setIfPresent(config, 'apiUrl', readString(env, ENV_VARS.apiUrl));
  setIfPresent(config, 'baseUrl', readString(env, ENV_VARS.baseUrl));
  setIfPresent(config, 'bedingungsbaumBaseUrl', readString(env, ENV_VARS.bedingungsbaumBaseUrl));
  setIfPresent(config, 'ebdBaseUrl', readString(env, ENV_VARS.ebdBaseUrl));
  setIfPresent(config, 'fristenkalenderBaseUrl', readString(env, ENV_VARS.fristenkalenderBaseUrl));
  setIfPresent(config, 'auth0Domain', readString(env, ENV_VARS.auth0Domain));
  setIfPresent(config, 'auth0ClientId', readString(env, ENV_VARS.auth0ClientId));
  setIfPresent(config, 'entraClientId', readString(env, ENV_VARS.entraClientId));
  setIfPresent(config, 'entraAuthority', readString(env, ENV_VARS.entraAuthority));
  setIfPresent(config, 'entraScopes', readList(env, ENV_VARS.entraScopes));
  setIfPresent(config, 'auth0Audience', readString(env, ENV_VARS.auth0Audience));
  setIfPresent(config, 'entraApiScope', readString(env, ENV_VARS.entraApiScope));
  setIfPresent(config, 'warmupUrl', readString(env, ENV_VARS.warmupUrl));
  setIfPresent(config, 'allowSearchIndexing', readBoolean(env, ENV_VARS.allowSearchIndexing));
  setIfPresent(config, 'enablePruefiComparison', readBoolean(env, ENV_VARS.enablePruefiComparison));

  return config;
}

/**
 * Render the configuration as the script served at `/config.js`.
 *
 * `<` is escaped even though this is served as a standalone script rather than inlined into
 * HTML: it costs nothing and keeps the output safe if it is ever embedded in a `<script>` block.
 */
export function renderConfigScript(config: RuntimeConfig): string {
  const json = JSON.stringify(config).replace(/</g, '\\u003c');
  return `window.__APP_CONFIG__ = ${json};\n`;
}
