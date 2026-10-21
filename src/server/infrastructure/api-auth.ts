import type { RequestHandler } from 'express';
import { loadMcpAuthConfig, requireBearer } from '../mcp/auth';

/**
 * Paths (relative to the `/api` mount) that stay reachable without a token:
 * - `/health`: the Oh Dear monitoring endpoint. It has its own shared-secret check and Oh Dear
 *   cannot obtain an Auth0/Entra token.
 * - `/datenstand`: a non-sensitive publication date the footer shows on the unauthenticated
 *   landing page.
 * Exact matches only; anything else (including `/health/x`) goes through the guard.
 */
const PUBLIC_PATHS = new Set(['/health', '/datenstand']);

/**
 * Bearer-token guard for `/api`.
 *
 * Accepts the same Auth0 / Microsoft Entra access tokens as `/mcp` and is configured from the same
 * `MCP_*` variables (see `mcp/auth.ts`): the SPA requests tokens for those existing API
 * registrations, so no second set of audiences has to be provisioned. (The 401 responses therefore
 * carry the MCP `WWW-Authenticate` resource-metadata pointer; that is harmless for `/api`.)
 *
 * Fails closed: without a configured provider this throws at startup, unless the operator opted
 * out explicitly with `API_AUTH_DISABLED=true` (local development / the local docker-compose
 * stack). The opt-out deliberately does not depend on `ENVIRONMENT`, so a stack that forgets or
 * copies that variable cannot silently expose the API.
 *
 * @param validators injectable per-issuer validators, for tests (see `requireBearer`).
 */
export function requireApiAuth(
  env: NodeJS.ProcessEnv = process.env,
  validators?: Parameters<typeof requireBearer>[1]
): RequestHandler {
  const config = loadMcpAuthConfig(env);
  if (config) {
    const bearer = requireBearer(config, validators);
    return (req, res, next) => (PUBLIC_PATHS.has(req.path) ? next() : bearer(req, res, next));
  }
  if (env['API_AUTH_DISABLED'] === 'true') {
    console.warn(
      '[api] Auth is DISABLED (API_AUTH_DISABLED=true) — /api is publicly accessible. Never set ' +
        'this on a deployed stack.'
    );
    return (_req, _res, next) => next();
  }
  throw new Error(
    '/api must not be public: configure MCP_AUTH0_ISSUER_BASE_URL + MCP_AUTH0_AUDIENCE and/or ' +
      'MCP_ENTRA_TENANT_ID + MCP_ENTRA_AUDIENCE, or set API_AUTH_DISABLED=true for local use.'
  );
}
