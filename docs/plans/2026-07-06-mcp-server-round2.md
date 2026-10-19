> **Note (2026-10-08):** historical plan. Client registration no longer uses DCR; the tenant uses Client ID Metadata Documents, see the README section "Connecting a client".

# MCP Server over HTTP with Auth0 (Round 2)

## Goal

Expose the existing backend features as a **remote MCP server over Streamable HTTP**,
mounted on the same Express app, reusing the transport-agnostic service layer built in
Round 1 (`src/server/service/`). Protect the MCP endpoint with **Auth0** using standard
OAuth 2.1 — the MCP server acts as an OAuth 2.1 **resource server**.

Round 1 (service-layer decoupling) is merged in PR #835 / v1.9.0-rc01. This document is
Round 2.

## Decisions locked in

- **Transport: Streamable HTTP** on the existing Express app (not stdio). Confirmed by
  the user and required anyway — MCP's OAuth authorization only applies to HTTP
  transports (stdio uses env credentials).
- **Auth scope: protect the MCP endpoint only.** The REST API stays unauthenticated for
  now so the webapp keeps working unchanged. (See "Why REST stays open" below.)
- **Standards-based, no wheel-reinvention.** Use Auth0 as the authorization server, its
  official Express resource-server middleware for token validation, and the tenant's
  existing DCR + metadata endpoints.

## Confirmed facts (verified against the live tenant + spec)

### Auth0 tenant `auth.hochfrequenz.de` already provides everything we need

Probed `https://auth.hochfrequenz.de/.well-known/openid-configuration` and
`/.well-known/oauth-authorization-server` (RFC 8414 — both served):

| Capability                                  | Value                                                             | Why it matters                                                |
| ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| `issuer`                                    | `https://auth.hochfrequenz.de/`                                   | token `iss` to validate                                       |
| `jwks_uri`                                  | `https://auth.hochfrequenz.de/.well-known/jwks.json`              | RS256 signature validation                                    |
| `registration_endpoint`                     | `https://auth.hochfrequenz.de/oidc/register`                      | **DCR (RFC 7591) is enabled** — MCP clients can self-register |
| `code_challenge_methods_supported`          | `[S256]`                                                          | PKCE supported (required by MCP)                              |
| `token_endpoint_auth_methods_supported`     | includes `none`                                                   | public clients (PKCE) supported                               |
| `grant_types_supported`                     | incl. `authorization_code`, `refresh_token`, `client_credentials` | interactive + M2M callers                                     |
| `authorization_endpoint` / `token_endpoint` | `/authorize` / `/oauth/token`                                     | standard Auth0                                                |

So the authorization-server side is done — we do not configure discovery, PKCE, or DCR
ourselves; Auth0 already exposes them.

### MCP authorization spec (2025-06-18) — what WE must implement on the resource server

From the MCP spec (`modelcontextprotocol.io/specification/2025-06-18/basic/authorization`):

1. The MCP server **MUST** implement **RFC 9728 Protected Resource Metadata**. Because the
   resource is mounted at a path (`/mcp`), RFC 9728 §3.1 uses **path insertion**: the
   metadata lives at `https://<host>/.well-known/oauth-protected-resource/mcp` (well-known
   segment inserted between host and path), **not** at the root
   `/.well-known/oauth-protected-resource`. Clients that probe PRM proactively request the
   path-suffixed URL — serve that (or both). Body:
   `{ "resource": "<canonical MCP URI>", "authorization_servers": ["https://auth.hochfrequenz.de/"] }`.
   Auth0 does **not** serve this for us — it belongs on the resource server. The MCP TS SDK's
   `mcpAuthMetadataRouter` handles this pathing for us (see "Use the SDK helpers" below).
2. On unauthenticated/invalid requests the server **MUST** return **401** with a
   `WWW-Authenticate` header pointing at the resource-metadata URL (RFC 9728 §5.1).
3. The server **MUST validate the access token audience** — accept only tokens issued
   specifically for this MCP server (RFC 8707 / RFC 9068). **MUST NOT** pass the client's
   token through to any downstream API.
4. Error contract: 401 (missing/invalid token), 403 (insufficient scope), 400
   (malformed). Tokens go in `Authorization: Bearer <jwt>` on **every** HTTP request;
   never in the query string.

The client side (PKCE, `resource` indicator, DCR, browser flow) is handled by the MCP
client (Claude etc.) + Auth0 — not our code.

## Why REST stays open (context)

The Angular app configures `provideAuth0({ domain, clientId })` with **no `audience` and
no `httpInterceptor`** (`src/app/app.config.ts`), and gates routes via
`guards/auth.guard.ts`. It therefore **never sends a Bearer token to the REST API** — the
API is currently unauthenticated and Auth0 only gates loading the SPA. Turning on token
validation for the shared API would break the webapp until the Angular client is
reconfigured to request an API-audience token and attach it. That coordinated change is
deferred; Round 2 protects only `/mcp`.

## Architecture

```
src/server.ts
  ├─ GET /.well-known/oauth-protected-resource   → RFC 9728 metadata (public)
  ├─ /mcp   → [auth middleware] → StreamableHTTPServerTransport → McpServer
  ├─ /api/* → REST router (unchanged, unauthenticated)
  └─ static Angular (unchanged)

src/server/mcp/
  server.ts        # builds McpServer, registers tools, wires Streamable HTTP transport
  auth.ts          # Auth0 JWT validation middleware + 401 WWW-Authenticate + PRM handler
  tools/*.ts       # one thin adapter per tool → calls the Round-1 services
```

- **Reuses the initialized `AppDataSource`** (TypeORM) from the existing process — no
  second DB init, no second decrypt. This is the main reason to co-host on Express.
- **Tools are thin adapters over `src/server/service/*`** — zero business-logic
  duplication. Validation/format resolution already live in the services.

### Express co-hosting hazards (MUST get right — each silently breaks the flow)

These are mechanical gotchas from mounting on the current `src/server.ts`; none are
optional:

1. **Route ordering vs. the static catch-alls.** `server.ts:59-62` ends with
   `server.get('*.*', express.static(...))` then `server.get('*', → index.html)`. The
   pattern `*.*` matches `/.well-known/oauth-protected-resource` (it contains a dot), and
   the final `*` returns `index.html` (HTTP 200) for anything unmatched. So **the `/mcp`
   route(s) and the `.well-known` metadata route MUST be registered before line 59** —
   otherwise discovery and the SSE `GET /mcp` stream return the Angular index page.
2. **Global `express.json()` (`server.ts:13`) consumes the body.**
   `StreamableHTTPServerTransport.handleRequest(req, res)` reads the raw POST stream; with
   a global JSON parser already applied the request hangs. Fix: call
   `transport.handleRequest(req, res, req.body)` (pass the already-parsed body), or scope
   `express.json()` to exclude `/mcp`. Prefer passing `req.body`.
3. **DB init race (pre-existing).** `AppDataSource.initialize()` is fire-and-forget
   (`server.ts:32-38`, not awaited before `listen`). REST already has this; MCP inherits
   it. Consider awaiting init (or gating first tool call) so early MCP calls don't hit an
   uninitialized DB.

## Auth implementation (standards, minimal custom code)

1. **Create an Auth0 API (resource server)** in the tenant with an **Identifier
   (audience)** set to the **canonical MCP server URI** (e.g.
   `https://ahb-tabellen.hochfrequenz.de/mcp`, and the stage equivalent). Setting the
   audience equal to the canonical URI makes the MCP client's RFC 8707 `resource`
   parameter line up with Auth0's `audience` (see risk below). Define read scopes if we
   want per-tool authorization later (e.g. `ahb:read`).
2. **Token validation middleware:** Auth0's official
   [`express-oauth2-jwt-bearer`](https://github.com/auth0/node-oauth2-jwt-bearer)
   configured with `issuerBaseURL: 'https://auth.hochfrequenz.de/'` and
   `audience: '<API identifier>'`. It fetches JWKS, validates signature (RS256), `iss`,
   `aud`, and `exp`. Applied only to the `/mcp` route.
3. **Protected Resource Metadata + 401 handling — use the SDK helpers, don't hand-roll.**
   The MCP TypeScript SDK ships `mcpAuthMetadataRouter` (serves the path-inserted PRM
   correctly, per §3.1 above) and `requireBearerAuth` (emits the RFC 9728
   `WWW-Authenticate` 401 with the `resource_metadata` pointer). Adopt these instead of
   writing the metadata route and 401 header by hand — they get the pathing and header
   format right for free. `requireBearerAuth` takes a token verifier; back it with the
   Auth0 JWKS validation (via `express-oauth2-jwt-bearer` or a small `jose`-based
   verifier) so signature/`iss`/`aud`/`exp` are checked.

That is the entire server-side auth surface: token verifier + SDK auth router/middleware.
Everything else (login UI, consent, PKCE, refresh, DCR) is Auth0's.

### Audience/resource must be per-environment

One Auth0 API **per environment** (stage + prod), because the canonical URI differs:
`https://ahb-tabellen.stage.hochfrequenz.de/mcp` vs
`https://ahb-tabellen.hochfrequenz.de/mcp` (from `environment.stage.ts` /
`environment.prod.ts`). The `audience` passed to token validation and the `resource`
value in PRM must both be env-driven config, not a constant.

### CORS (only matters for in-browser MCP clients)

Claude's remote MCP connector calls **server-side**, so CORS is irrelevant for it. If we
target in-browser MCP clients, `server.ts:14-26` needs `exposedHeaders` including
`WWW-Authenticate` (so the client can read the PRM pointer on a 401) and `Mcp-Session-Id`
(if stateful), and the `.well-known` route must be CORS-reachable. Decide which clients we
support before adding this.

## Tool surface (read-only; 1:1 with the service layer)

| MCP tool                         | Service method                               | Notes                                                            |
| -------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| `get_ahb`                        | `AhbService.getAhb`                          | **JSON only** over MCP; xlsx/csv are downloads, not tool results |
| `search_ahb_lines`               | `AhbService.searchAhbLines`                  | rich filter schema — invest in good zod descriptions             |
| `get_ahb_diff`                   | `AhbDiffService.getDiff`                     |                                                                  |
| `get_ahb_diff_summary`           | `AhbDiffService.getSummary`                  |                                                                  |
| `list_format_versions`           | `MetadataService.listFormatVersions`         |                                                                  |
| `list_formate`                   | `MetadataService.listFormate`                |                                                                  |
| `list_directions`                | `MetadataService.listDirections`             |                                                                  |
| `get_datenstand`                 | `MetadataService.getDatenstand`              |                                                                  |
| `list_pruefis_by_format_version` | `MetadataService.listPruefisByFormatVersion` |                                                                  |

- All tools are **read-only** → annotate `readOnlyHint: true`.
- Inputs described with zod schemas; pruefi = 5 digits, format version = `FV\d{4}`.
- **Error semantics — two distinct channels:**
  - Service-layer `ValidationError` / `NotFoundError` (bad pruefi, unknown format version,
    etc.) → return an MCP **tool result with `isError: true`** and a readable message, so
    the model can see and react to it. These are _not_ transport errors.
  - Only **auth** failures are transport-level: 401 (missing/invalid token) / 403
    (insufficient scope), handled by the auth middleware before the tool runs.
  - The Round-1 `AppError` prototype fix (`errors.ts:14`, `new.target.prototype`) makes
    `instanceof ValidationError` reliable, so the tool wrapper can branch on error type.
- **`get_ahb` has no downstream API** — it queries local TypeORM/sqlite — so the MCP spec's
  "MUST NOT pass the client token downstream" is trivially satisfied; no token forwarding
  to build.

## Packages

- `@modelcontextprotocol/sdk` — `McpServer` + `StreamableHTTPServerTransport`, **plus its
  auth helpers `requireBearerAuth` + `mcpAuthMetadataRouter`** (correct PRM pathing and 401
  headers — don't hand-roll these).
- `express-oauth2-jwt-bearer` (or a small `jose` verifier) — Auth0 JWKS token validation,
  wired as the verifier behind `requireBearerAuth`.
- `zod` — tool input schemas (SDK peer).
- Express is `^4.21.2` (`package.json`) — compatible with the SDK's Streamable HTTP
  transport; the Express 4-vs-5 distinction is not a blocker here.

## Risks / things to verify before/at implementation

1. **RFC 8707 `resource` vs Auth0 `audience` (the one real wrinkle — spike this first).**
   MCP clients send `resource=<canonical URI>`; Auth0 historically keys token issuance on
   `audience`. Setting the Auth0 API Identifier = canonical MCP URI so the two align is the
   standard, Auth0-recommended mitigation and is sound. **Concrete failure mode to test
   for:** if the tenant does _not_ honor the `resource` parameter, Auth0 may issue an
   opaque userinfo token (no proper `aud`) instead of an RS256 JWT for the API — which then
   fails `express-oauth2-jwt-bearer` audience validation. Verify end-to-end with a real MCP
   client (Claude) against stage before calling it done. This is the highest-uncertainty
   item; spike it in step 1.
2. **DCR registration policy.** DCR is enabled (open `/oidc/register`). Confirm with the
   Auth0 admins whether open dynamic registration is acceptable, or whether registration
   should be gated (initial access token / promoted connections). Confused-deputy
   guidance in the MCP spec applies.
3. **Session/transport mode.** Streamable HTTP supports stateful (session id) and
   stateless modes. Decide based on whether we need server→client streaming; stateless is
   simpler for a read-only query server behind a load balancer.
4. **CORS + infra.** `/mcp` and the metadata endpoint must be reachable through whatever
   terminates TLS (Pulumi/Octopus deployment); add `/mcp` to CORS if browser-based MCP
   clients are expected. Confirm no proxy strips `Authorization`.
5. **Health/version excluded.** `/health`, `/version`, `/readiness` stay public and
   non-MCP.
6. **Operational hygiene.** (a) Rate-limit the authenticated but potentially expensive
   `search_ahb_lines` tool. (b) Never log the `Authorization` header / token (scrub in any
   request logging). (c) Prefer **stateless** Streamable HTTP unless we need server→client
   streaming — simpler behind a load balancer for a read-only query server; if stateful,
   `Mcp-Session-Id` handling + sticky sessions become a concern.

## Step-by-step

1. **Spike (unauthenticated):** stand up `McpServer` + Streamable HTTP at `/mcp` reusing
   `AppDataSource`; register 1–2 tools (`list_format_versions`, `get_ahb`) over the
   existing services. Register the `/mcp` route **before** the `server.ts:59-62`
   catch-alls, and pass `req.body` into `transport.handleRequest` (see co-hosting
   hazards). Validate transport with a real MCP client locally.
   **Then spike the Auth0 `resource`/`audience` behavior early** (risk #1) — it's the
   highest-uncertainty piece and shapes the auth step.
2. **Tools:** implement the remaining 7 tool adapters + zod schemas + error mapping.
3. **Auth0 API:** create the resource server (audience = canonical MCP URI) in the
   tenant; define scopes if used.
4. **Auth middleware:** add `express-oauth2-jwt-bearer` on `/mcp`, the
   `/.well-known/oauth-protected-resource` endpoint, and the 401 `WWW-Authenticate`
   response.
5. **End-to-end:** connect Claude (or another MCP client) to the stage URL; verify the
   full discovery → DCR → PKCE → token → tool-call flow, and that audience validation
   rejects wrong-audience tokens. Resolve the RFC 8707/audience wrinkle here.
6. **Docs + deploy config** (CORS, env, Pulumi).

## Verification evidence (stage, v1.9.0-rc02)

The unauthenticated transport + all 9 tools were verified live on stage via two
independent paths (evidence recorded in the issues):

- **Raw HTTP / JSON-RPC** — [#837](https://github.com/Hochfrequenz/ahb-tabellen/issues/837):
  `initialize`, `tools/list` (exactly 9 tools, all `readOnlyHint`), every tool, and the
  validation error path (`isError`, no 500) all pass. `search_ahb_lines` reports 287,865
  lines total; `get_datenstand` → 29.06.2026.
- **Native MCP client path** ([StreamableHTTPClientTransport] via Claude Code) —
  [#838](https://github.com/Hochfrequenz/ahb-tabellen/issues/838): all 9 tools work
  natively, including a real chained diff analysis (Prüfi 55001, FV2604→FV2610). Confirms
  Streamable HTTP survives the Azure App Service proxy — the main deployment risk.

This closes the "verify transport on stage" item. Still pending (Phase B): the Auth0
`resource`→`audience` flow, which needs an authenticated client run (see risk #1).

**Follow-up surfaced during #838:** `get_ahb` (~55 KB) and `get_ahb_diff` (~119 KB)
exceed a single tool-response token budget, so clients offload the payload to a file.
Functionally correct, but a future improvement could offer a paginated/summarized mode
for these two tools; for broad questions `search_ahb_lines` is already the efficient path.

## Out of scope (later)

- Protecting the REST API with Auth0 + reconfiguring the Angular client to send tokens.
- Fixing CSV export.
- Per-tool scope-based authorization (start with "authenticated = allowed").
- Paginated/summarized output mode for `get_ahb` / `get_ahb_diff` (see follow-up above).
