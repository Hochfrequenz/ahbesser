# API Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Only requests carrying a valid Auth0 or Microsoft Entra access token can call `/api/*`; the Angular frontend attaches that token automatically. Unauthenticated API consumers break — this is intended.

**Architecture:** The backend guards `/api` with the existing `requireBearer` middleware from `src/server/mcp/auth.ts`, configured from the **same `MCP_*` environment variables** the `/mcp` endpoint already uses. Reusing the existing Auth0 API (`MCP_AUTH0_AUDIENCE`) and the existing Entra resource app (`MCP_ENTRA_AUDIENCE`, scope `access_as_user`) means no new backend variables and no new Auth0/Entra API registrations. The frontend gets two new optional runtime-config values (the audience / scope to request) and a functional HTTP interceptor that asks `AuthFacade` for a token from whichever provider the user is signed in with.

**Tech Stack:** Express 5, `express-oauth2-jwt-bearer`, Angular 22 (functional interceptors), `@auth0/auth0-angular`, `@azure/msal-browser`, Jest.

## Decisions (already made — do not revisit)

- "Any logged-in user" is allowed. No role/claim checks.
- Both login providers count (Auth0 **and** Entra), because the SPA supports both.
- **Fail closed, explicit opt-out:** if no `MCP_*` provider is configured, the server **refuses to start** unless `API_AUTH_DISABLED=true` is set, in which case `/api` is open and a warning is logged. The opt-out is set only in `docker-compose.yaml` and documented in `.example.env` (local `npm run server:start` needs it in `.env`). It deliberately does not depend on `ENVIRONMENT`, whose value in the real (hf-apps-collection) stacks this repo cannot see. If providers _are_ configured, auth is enforced regardless of the flag.
- **Public routes under `/api`** (exact paths, relative to the mount): `/health` — the Oh Dear monitoring endpoint, which has its own shared-secret check and cannot obtain a token — and `/datenstand` — a non-sensitive publication date that the footer shows on the unauthenticated landing page. Everything else under `/api` requires a token. `/version`, `/health`, `/readiness`, `/config.js` and static files at the root stay public; `/mcp` is unchanged.
- CORS config stays as is (it is a browser convenience, not protection). CORS preflight `OPTIONS` is answered by the `cors` middleware before the guard, so it needs no special handling.
- The dev stub (`AUTH_IS_DEVELOPMENT`) sends no token.
- If the audience/scope is not configured, or the user is signed out, the frontend sends no token (the API then answers 401 — loud, not silent).
- Token provider = the provider of `AuthFacade.user$` (same resolution as the UI shows). A failed Auth0 silent token fetch (`login_required`, `missing_refresh_token`) surfaces as an HTTP error; the user recovers by logging in again. Microsoft is different: `InteractionRequiredAuthError` triggers a single redirect to Microsoft sign-in.

## File Structure

| File                                                            | Responsibility                                       |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| Create `src/server/infrastructure/api-auth.ts`                  | `requireApiAuth()`: builds the `/api` guard from env |
| Create `src/server/infrastructure/api-auth.spec.ts`             | Unit tests (config decisions)                        |
| Create `src/server/infrastructure/api-auth.integration.spec.ts` | HTTP tests with signed tokens                        |
| Modify `src/server.ts`                                          | Mount the guard on `/api`                            |
| Modify `src/app/environments/environment.interface.ts`          | `auth0Audience?`, `entraApiScope?`                   |
| Modify `src/server/infrastructure/app-config.ts` (+ spec)       | `APP_AUTH0_AUDIENCE`, `APP_ENTRA_API_SCOPE`          |
| Modify `src/app/core/auth/auth.facade.ts` (+ spec)              | `getAccessToken()`                                   |
| Create `src/app/core/auth/api-auth.interceptor.ts` (+ spec)     | Attach `Authorization` header to API calls           |
| Modify `src/app/app.config.ts`                                  | Register interceptor, pass audience to Auth0         |
| Modify `docker-compose.yaml`                                    | `API_AUTH_DISABLED: 'true'` for the local stack      |
| Modify `README.md`, `.example.env`, `bruno/*`                   | Docs and request collection                          |

`infra/` (legacy Pulumi, scheduled for deletion) is **not** touched; the admin work lives in the linked issue.

Working directory for all commands: the repo root of this worktree. **Step 0: run `npm ci`** (the worktree has no `node_modules`). Run backend tests with `npx jest src/server/infrastructure/<file>`; the whole suite with `npm test`.

---

### Task 1: Backend guard

**Files:**

- Create: `src/server/infrastructure/api-auth.ts`
- Test: `src/server/infrastructure/api-auth.spec.ts`, `src/server/infrastructure/api-auth.integration.spec.ts`

- [ ] **Step 1: Write the failing unit test**

`src/server/infrastructure/api-auth.spec.ts`:

```ts
/**
 * @jest-environment node
 */
import type { NextFunction, Request, Response } from 'express';
import { requireApiAuth } from './api-auth';

const AUTH0 = {
  MCP_AUTH0_ISSUER_BASE_URL: 'https://issuer.example.com/',
  MCP_AUTH0_AUDIENCE: 'https://host/mcp',
};

function run(guard: ReturnType<typeof requireApiAuth>, path = '/ahb/FV2510/55001') {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
  const next = jest.fn() as unknown as NextFunction;
  guard({ headers: {}, path } as Request, res, next);
  return { res, next };
}

describe('requireApiAuth', () => {
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('lets requests through, with a warning, when explicitly disabled and no provider is set', () => {
    const { next } = run(requireApiAuth({ API_AUTH_DISABLED: 'true' }));
    expect(next).toHaveBeenCalledWith();
    expect(console.warn).toHaveBeenCalled();
  });

  it.each([
    {},
    { ENVIRONMENT: 'docker' },
    { ENVIRONMENT: 'production' },
    { API_AUTH_DISABLED: 'false' },
    { API_AUTH_DISABLED: '1' },
  ])('refuses to start without a provider and without the explicit opt-out: %j', env => {
    expect(() => requireApiAuth(env)).toThrow(/API_AUTH_DISABLED/);
  });

  it('enforces auth as soon as a provider is configured, even if the opt-out is set', () => {
    const { res, next } = run(requireApiAuth({ ...AUTH0, API_AUTH_DISABLED: 'true' }));
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it.each(['/health', '/datenstand'])('keeps %s public when auth is enforced', path => {
    const { next } = run(requireApiAuth(AUTH0), path);
    expect(next).toHaveBeenCalledWith();
  });

  it.each(['/health/x', '/datenstand/', '/formate', '/'])('does not make %s public', path => {
    const { res, next } = run(requireApiAuth(AUTH0), path);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('propagates a partially configured provider as a startup error', () => {
    expect(() => requireApiAuth({ MCP_AUTH0_AUDIENCE: 'https://host/mcp' })).toThrow(
      /partially configured/
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest src/server/infrastructure/api-auth.spec.ts`
Expected: FAIL — `Cannot find module './api-auth'`.

- [ ] **Step 3: Write the implementation**

`src/server/infrastructure/api-auth.ts`:

```ts
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
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `npx jest src/server/infrastructure/api-auth.spec.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Write the HTTP integration test**

Model it on `src/server/mcp/auth.integration.spec.ts` (read it first; reuse its HS256 signing approach, its `listen(0)` / `close` setup and its fetch usage). Create `src/server/infrastructure/api-auth.integration.spec.ts` with the `@jest-environment node` docblock. Build the app as:

```ts
const env = { MCP_AUTH0_ISSUER_BASE_URL: ISSUER, MCP_AUTH0_AUDIENCE: AUDIENCE };
const validators = new Map([
  [ISSUER, auth({ issuer: ISSUER, audience: AUDIENCE, secret: SECRET, tokenSigningAlg: 'HS256' })],
]);
const app = express();
app.get('/version', (_req, res) => res.send('ok')); // public, registered like in server.ts
app.use('/api', requireApiAuth(env, validators), (_req, res) => res.json({ ok: true }));
```

Cases (one `it` each, asserting the HTTP status):

1. `GET /api/x` without `Authorization` → 401
2. valid token (right `iss`, `aud`, `exp` in the future) → 200
3. wrong `aud` → 401
4. expired (`exp` in the past) → 401
5. signed with a different secret → 401
6. unknown `iss` → 401
7. `GET /version` without a token → 200 (routes outside `/api` stay public)
8. `GET /api/health` and `GET /api/datenstand` without a token → 200
9. `GET /api/HEALTH` without a token → 401 (case variants are not public; fails closed)

- [ ] **Step 6: Run it**

Run: `npx jest src/server/infrastructure/api-auth.integration.spec.ts`
Expected: PASS, 9 tests.

- [ ] **Step 7: Commit**

```bash
git add src/server/infrastructure/api-auth.ts src/server/infrastructure/api-auth.spec.ts src/server/infrastructure/api-auth.integration.spec.ts
git commit -m "feat: add bearer-token guard for /api"
```

---

### Task 2: Mount the guard

**Files:**

- Modify: `src/server.ts` (the `server.use('/api', router);` line and the imports)
- Modify: `docker-compose.yaml`

- [ ] **Step 1: Edit `src/server.ts`**

Add the import next to the other `./server/infrastructure/*` imports:

```ts
import { requireApiAuth } from './server/infrastructure/api-auth';
```

Replace `server.use('/api', router);` with:

```ts
// Every /api route requires a valid Auth0 / Entra access token, except the few public paths
// listed in api-auth.ts. The root probe routes above (/version, /health, /readiness) are
// registered before this and stay open.
server.use('/api', requireApiAuth(), router);
```

- [ ] **Step 2: Opt the local compose stack out**

In `docker-compose.yaml`, in the `server` service `environment:` block next to `ENVIRONMENT: docker`, add:

```yaml
# The local stack has no Auth0/Entra configuration (and the SPA runs on its dev stub there).
API_AUTH_DISABLED: 'true'
```

- [ ] **Step 3: Verify it compiles and the suite is green**

Run: `npm run server:build && npm test`
Expected: tsc exits 0; all suites pass.

- [ ] **Step 4: Smoke-test the fail-closed behaviour**

Make sure no `MCP_*` or `API_AUTH_DISABLED` is set in your shell **or in a `.env` file** (the server loads `.env` via dotenv; move it aside if needed). Run: `node dist/server/server.js` (PowerShell: same command).
Expected: the process throws the "/api must not be public" error immediately. Then run with `API_AUTH_DISABLED=true` (PowerShell: `$env:API_AUTH_DISABLED='true'; node dist/server/server.js`) and confirm the "[api] Auth is DISABLED" warning is logged. (The server may afterwards exit because no database is present — that is unrelated.)

- [ ] **Step 5: Commit**

```bash
git add src/server.ts docker-compose.yaml
git commit -m "feat: require authentication on /api"
```

---

### Task 3: Runtime config for audience and scope

**Files:**

- Modify: `src/app/environments/environment.interface.ts`
- Modify: `src/server/infrastructure/app-config.ts`
- Test: `src/server/infrastructure/app-config.spec.ts`

- [ ] **Step 1: Extend the interface**

In `EnvironmentInterface`, directly after `auth0ClientId: string;` add:

```ts
  /** Auth0 API identifier to request access tokens for (= the backend's `MCP_AUTH0_AUDIENCE`). */
  auth0Audience?: string;
```

and after `entraScopes: string[];` add:

```ts
  /** Entra scope to request API access tokens for, e.g. `api://<mcp-app-client-id>/access_as_user`. */
  entraApiScope?: string;
```

Both are optional: unset means "send no token" (dev stub, or not yet configured). Do not add them to `environment.ts` / `environment.prod.ts`.

- [ ] **Step 2: Write the failing test**

Read `app-config.spec.ts` and follow its style. Add a case that sets `APP_AUTH0_AUDIENCE=https://host/mcp` and `APP_ENTRA_API_SCOPE=api://abc/access_as_user` and expects `buildRuntimeConfig` to return `{ auth0Audience: 'https://host/mcp', entraApiScope: 'api://abc/access_as_user' }`; and that an empty value leaves the key out.

- [ ] **Step 3: Run it to verify it fails**

Run: `npx jest src/server/infrastructure/app-config.spec.ts`
Expected: FAIL (TypeScript error: `ENV_VARS` does not satisfy `Record<keyof RuntimeConfig, string>`, or the keys are missing).

- [ ] **Step 4: Implement**

In `ENV_VARS` add `auth0Audience: 'APP_AUTH0_AUDIENCE',` after `auth0ClientId`, and `entraApiScope: 'APP_ENTRA_API_SCOPE',` after `entraScopes`. In `buildRuntimeConfig` add:

```ts
setIfPresent(config, 'auth0Audience', readString(env, ENV_VARS.auth0Audience));
setIfPresent(config, 'entraApiScope', readString(env, ENV_VARS.entraApiScope));
```

(`src/app/environments/runtime-config.ts` derives its type from the interface — no change needed.)

- [ ] **Step 5: Run tests**

Run: `npx jest src/server/infrastructure/app-config.spec.ts src/app/environments`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/environments/environment.interface.ts src/server/infrastructure/app-config.ts src/server/infrastructure/app-config.spec.ts
git commit -m "feat: add APP_AUTH0_AUDIENCE and APP_ENTRA_API_SCOPE runtime config"
```

---

### Task 4: `AuthFacade.getAccessToken()`

**Files:**

- Modify: `src/app/core/auth/auth.facade.ts`
- Test: `src/app/core/auth/auth.facade.spec.ts`

- [ ] **Step 1: Write the failing tests**

In `auth.facade.spec.ts`, extend `MockAuth0` with `getAccessTokenSilently: jest.Mock` (default `jest.fn().mockReturnValue(of('auth0-token'))` in `makeAuth0`) and `MockMsal` with `acquireTokenSilent` (default resolves `{ accessToken: 'msal-token' }`) and `acquireTokenRedirect` (default resolves `undefined`). Then add a `describe('getAccessToken', …)` block. `environment` is a plain mutable object: set `environment.auth0Audience` / `environment.entraApiScope` in `beforeEach` and delete them in `afterEach`. For a Microsoft session, give `makeMsal` `getAllAccounts: [account]` and `await facade.initializeMsal()`; for an Auth0 session give `makeAuth0({ user$: of({ sub: 'a', email: 'a@b.c' }) })`. Cases:

1. development stub → emits `null`, calls neither SDK.
2. Auth0 user, audience configured → emits `'auth0-token'`; `getAccessTokenSilently` called with `{ authorizationParams: { audience: 'https://host/mcp' } }`.
3. Auth0 user, audience **not** configured → `null`, `getAccessTokenSilently` not called.
4. Microsoft user, scope configured → `'msal-token'`; `acquireTokenSilent` called with `{ scopes: [scope], account }`.
5. Microsoft user, scope not configured → `null`.
6. Anonymous (no Auth0 user, no MSAL account) → `null`, neither SDK called.
7. Microsoft session, **stale** `localStorage['ahb.activeAuthProvider'] = 'auth0'` (Auth0 `user$` emits `null`) → still the MSAL token.
8. Both signed in, hint `'auth0'` → the Auth0 token (same tie-break as `resolveUser`).
9. Microsoft user, `acquireTokenSilent` rejects with `new InteractionRequiredAuthError('interaction_required')` (import from `@azure/msal-browser`; `jest.spyOn(window.history, …)` is not needed) while `window.location` is `/some/page?x=1` → `acquireTokenRedirect` called with `{ scopes: [scope], account }`, `sessionStorage[POST_LOGIN_TARGET_KEY] === '/some/page?x=1'`, and the observable neither emits nor errors (assert with `Promise.race` against a short timeout).
10. Two **concurrent** `getAccessToken()` subscriptions under case 9's failure → `acquireTokenRedirect` called exactly once.
11. If `acquireTokenRedirect` itself rejects, the observable errors with that error, and a later call retries the redirect (the cached attempt was cleared).
12. Microsoft user, `acquireTokenSilent` rejects with a generic `Error` → the observable errors with it; no redirect.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/app/core/auth/auth.facade.spec.ts`
Expected: FAIL — `facade.getAccessToken is not a function`.

- [ ] **Step 3: Implement**

In `auth.facade.ts` add `defer` to the rxjs import and `switchMap, take` to the `rxjs/operators` import, and `import { AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';`.

Extract the account lookup that `resolveUser` already performs into a private helper and use it in both places:

```ts
  /** The live Microsoft account, if any — never read before `initializeMsal()` has run. */
  private msalAccount(): AccountInfo | null {
    return this.msalAuthenticated$.value
      ? (this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0] ?? null)
      : null;
  }
```

In `resolveUser`, replace the inline `const account = msalAuthed ? (...) : null;` with `const account = msalAuthed ? this.msalAccount() : null;` (behaviour identical; existing tests must stay green).

Add a field `private reauthRedirect?: Promise<never>;` next to `initialization`, and the methods below (place `getAccessToken` after `logout()`):

```ts
  /**
   * Access token for the backend API, from the provider of the current user — exactly the one
   * `user$` reports, so the tie-break and the "anonymous" case cannot drift from what the UI shows.
   * `user$` only emits once Auth0 has finished loading, which also keeps us from asking Auth0 for a
   * token while it is still processing its redirect callback.
   *
   * Emits `null` — meaning "send no token" — under the dev stub, when signed out, or when the
   * audience/scope for the user's provider is not configured; the API then answers 401, which is
   * loud rather than silent.
   *
   * Failure handling differs by provider: Microsoft `interaction_required` triggers one redirect to
   * sign in again; an Auth0 failure (`login_required`, `missing_refresh_token`) errors the request
   * and the user recovers by logging in again.
   */
  getAccessToken(): Observable<string | null> {
    if (this.isDevelopment) {
      return of(null);
    }
    return this.user$.pipe(
      take(1),
      switchMap((user): Observable<string | null> => {
        if (user?.provider === 'microsoft') {
          const account = this.msalAccount();
          const scope = environment.entraApiScope;
          return account && scope ? defer(() => this.acquireMsalToken(account, scope)) : of(null);
        }
        if (user?.provider === 'auth0') {
          const audience = environment.auth0Audience;
          return audience
            ? this.auth0.getAccessTokenSilently({ authorizationParams: { audience } })
            : of(null);
        }
        return of(null);
      })
    );
  }

  private async acquireMsalToken(account: AccountInfo, scope: string): Promise<string> {
    try {
      return (await this.msal.acquireTokenSilent({ scopes: [scope], account })).accessToken;
    } catch (error) {
      if (!(error instanceof InteractionRequiredAuthError)) {
        throw error;
      }
      // A page load fires several API calls at once; they must share ONE redirect, or MSAL rejects
      // the later ones with `interaction_in_progress` and those surface as spurious HTTP errors.
      this.reauthRedirect ??= this.redirectToMicrosoft(account, scope);
      return this.reauthRedirect;
    }
  }

  /**
   * The silent path cannot renew the session (e.g. refresh token expired): send the user through
   * Microsoft sign-in again, returning them to where they were. The page navigates away, so on
   * success the returned promise never settles — resolving or rejecting would fire a spurious API
   * request / error right before the redirect.
   */
  private redirectToMicrosoft(account: AccountInfo, scope: string): Promise<never> {
    const target = safeInternalTarget(window.location.pathname + window.location.search);
    if (target !== '/') {
      safeStorageSet(sessionStorage, POST_LOGIN_TARGET_KEY, target);
    }
    return this.msal.acquireTokenRedirect({ scopes: [scope], account }).then(
      () => new Promise<never>(() => undefined),
      (error: unknown) => {
        this.reauthRedirect = undefined; // allow a later attempt to retry
        throw error;
      }
    );
  }
```

Check `safeInternalTarget`'s signature in `safe-target.ts` and adapt the call if it differs.

- [ ] **Step 4: Run tests**

Run: `npx jest src/app/core/auth`
Expected: PASS, including all pre-existing facade tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.facade.ts src/app/core/auth/auth.facade.spec.ts
git commit -m "feat: add AuthFacade.getAccessToken for Auth0 and Entra"
```

---

### Task 5: Interceptor and wiring

**Files:**

- Create: `src/app/core/auth/api-auth.interceptor.ts`
- Test: `src/app/core/auth/api-auth.interceptor.spec.ts`
- Modify: `src/app/app.config.ts`

- [ ] **Step 1: Verify what the generated client requests**

The generated client builds `rootUrl + path` (`src/app/core/api/request-builder.ts`, around line 337) with paths like `/api/ahb/...`. Open one function under `src/app/core/api/fn/` and `openapi.yml` to confirm. The interceptor's prefix check depends on this; if the path shape differs, adapt the prefix and note it in the commit message.

- [ ] **Step 2: Write the failing test**

`api-auth.interceptor.spec.ts` — use `TestBed` with `provideHttpClient(withInterceptors([apiAuthInterceptor]))`, `provideHttpClientTesting()` and `{ provide: AuthFacade, useValue: { getAccessToken: jest.fn() } }`. Set `environment.apiUrl = 'https://app.example'` for the test (restore afterwards). Cases:

1. `GET https://app.example/api/ahb/FV2510/55001` with token `abc` → request has header `Authorization: Bearer abc`.
2. Same request when `getAccessToken` emits `null` → no `Authorization` header.
3. `GET https://other.example/api/x` (foreign host) → no header and `getAccessToken` not called (the token must never leak to third parties).
4. `GET https://app.example/version` (non-API path) → no header, `getAccessToken` not called.
5. `getAccessToken` errors → the HTTP call errors with that error and nothing is sent.
6. With `environment.apiUrl = 'https://app.example/'` (trailing slash), case 1 still gets the header.

- [ ] **Step 3: Run to verify it fails**

Run: `npx jest src/app/core/auth/api-auth.interceptor.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

`api-auth.interceptor.ts`:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthFacade } from './auth.facade';

/**
 * Attach the user's access token to calls to our own backend API — and only those, so the token
 * is never sent to third-party hosts (ahbicht, bedingungsbaum, …).
 */
export const apiAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Trailing slashes on APP_API_URL must not defeat the match (the generated client concatenates
  // `rootUrl + path` verbatim).
  const apiPrefix = `${environment.apiUrl.replace(/\/+$/, '')}/api/`;
  if (!req.url.startsWith(apiPrefix)) {
    return next(req);
  }
  return inject(AuthFacade)
    .getAccessToken()
    .pipe(
      switchMap(token =>
        next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)
      )
    );
};
```

- [ ] **Step 5: Wire it up in `app.config.ts`**

- Replace `import { HttpClientModule } from '@angular/common/http';` with `import { provideHttpClient, withInterceptors } from '@angular/common/http';` and add `import { apiAuthInterceptor } from './core/auth/api-auth.interceptor';`.
- Remove `HttpClientModule` from `importProvidersFrom(...)` (keep `ApiModule.forRoot(...)`) and add `provideHttpClient(withInterceptors([apiAuthInterceptor])),` to the providers array, before the `importProvidersFrom` entry.
- In `provideAuth0({ authorizationParams: { redirect_uri: window.location.origin, ...(environment.auth0Audience ? { audience: environment.auth0Audience } : {}) } })`, so Auth0 issues an access token for the API audience at login and with refresh tokens. (Use the ternary form; spreading `string && {…}` can fail to type-check.)

- [ ] **Step 6: Verify**

Run: `npm test && npx ng build`
Expected: all suites pass; build succeeds. `ApiModule` still finds `HttpClient` (it throws at construction otherwise — if any test or the build complains, that is the cause).

- [ ] **Step 7: Commit**

```bash
git add src/app/core/auth/api-auth.interceptor.ts src/app/core/auth/api-auth.interceptor.spec.ts src/app/app.config.ts
git commit -m "feat: send access token with API requests"
```

---

### Task 6: Docs and Bruno

**Files:**

- Modify: `README.md`, `.example.env`, `bruno/*`

- [ ] **Step 1: README**

In the "🤖 MCP Server → Authentication" section, change the "while the REST API stays open" wording, and add a short section "REST API authentication" stating: `/api/*` requires a `Bearer` access token from Auth0 or Entra, validated against the same `MCP_*` configuration (public exceptions: `/api/health` for Oh Dear, `/api/datenstand`); the SPA requests tokens via `APP_AUTH0_AUDIENCE` (= `MCP_AUTH0_AUDIENCE`) and `APP_ENTRA_API_SCOPE` (= `api://<MCP_ENTRA_AUDIENCE>/access_as_user`); without a configured provider the server refuses to start unless `API_AUTH_DISABLED=true` (local development and the local compose stack only — never on a deployed stack).

- [ ] **Step 2: `.example.env`**

Add commented examples for `APP_AUTH0_AUDIENCE` and `APP_ENTRA_API_SCOPE` next to the other `APP_*` entries, add `API_AUTH_DISABLED=true` with a comment that this is what local `npm run server:start` needs when no `MCP_*` provider is configured, and adjust the MCP comment to say the same `MCP_*` variables also protect `/api` (so "neither = unauthenticated" no longer applies without the flag).

- [ ] **Step 3: Bruno**

Public requests (`health.bru`, `version.bru`) stay `auth: none`. For the `/api` requests (`Get AHB`, `Get All Pruefis From Formatversion`, `Get FormatVersions`, `Get Formats`, `Search`): create `bruno/collection.bru` containing

```
auth {
  mode: bearer
}

auth:bearer {
  token: {{token}}
}
```

switch those five requests from `auth: none` to `auth: inherit`, and add `token` under `vars:secret` in the two remote environments (stage, prod). Check `bruno/bruno.json` and an existing request first, and match the Bruno file syntax actually used there.

- [ ] **Step 4: Verify and commit**

Run: `npx prettier --check README.md docs/plans` (fix with `--write` where flagged) then `npm test`.

```bash
git add README.md .example.env bruno
git commit -m "docs: document /api authentication"
```

---

### Task 7: Final verification

- [ ] `npm run format:check` — clean.
- [ ] `npm run lint` and `npm run server:lint` — clean.
- [ ] `npm test` — all green.
- [ ] `npx ng build` and `npm run server:build` — succeed.
- [ ] Manual check, only if a local database is available (the server exits at startup without one — see README); otherwise the integration tests are the evidence. Start with `MCP_AUTH0_ISSUER_BASE_URL=https://issuer.example/ MCP_AUTH0_AUDIENCE=https://host/mcp` set and verify: `curl -i localhost:3000/api/formate` → 401; unauthenticated `POST /api/search/query` → 401; `/version`, `/readiness`, `/config.js` → 200; `/api/datenstand` → 200; `/api/health` with the `oh-dear-health-check-secret` header → not 401 from the bearer guard.

## Rollout (not part of the code change)

Merging this without the configuration below makes the server refuse to start (no `MCP_*` provider) or makes every API call from the SPA fail with 401. The admin steps are tracked in the linked GitHub issue and must be done **before** the new image is deployed. In short, per stack in hf-apps-collection: keep `MCP_*` set and do **not** set `API_AUTH_DISABLED`; set `APP_AUTH0_AUDIENCE` and (where Entra is enabled) `APP_ENTRA_API_SCOPE`; in Auth0 allow the SPA application to request the MCP API and enable "Allow Offline Access" on it; in Entra pre-authorize the SPA app for the `access_as_user` scope (or grant admin consent).
