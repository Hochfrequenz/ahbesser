# Auth0 as code (Pulumi)

Manages the Auth0 tenant `auth.hochfrequenz.de` declaratively so that **no one
has to click in the Auth0 dashboard** and every change is reviewed via PR.

Tracked in [#903](https://github.com/Hochfrequenz/ahb-tabellen/issues/903).

- **Provider:** [`@pulumi/auth0`](https://www.pulumi.com/registry/packages/auth0/)
- **Stack:** `shared` (single stack — the tenant is shared across prod/stage/dev,
  unlike the Azure `../` project which uses per-env `stage`/`prod` stacks)
- **Backend:** Pulumi Cloud (same as the Azure project)

## Scope (phase 1)

- SPA clients: prod + shared stage/dev
- MCP API resource servers: prod + stage audiences

Out of scope for now: tenant settings, connections, Actions/Rules, roles & RBAC.

## One-time setup

1. **Create two Management M2M apps** in Auth0 (least privilege — both preview
   and deploy execute this project's code with the Management API in scope):

   - `Pulumi Auth0 (read-only)` — used by the PR **preview**. Grant only read
     scopes: `read:clients`, `read:resource_servers`, `read:client_grants`.
   - `Pulumi Auth0 (deploy)` — used by `pulumi up` on `main`. Grant the write
     scopes it actually needs: `read:clients`, `update:clients`, `create:clients`,
     `read:resource_servers`, `update:resource_servers`, `create:resource_servers`,
     `read:client_grants`, `update:client_grants`. Trim to what is needed.

   (A single app also works for local use; the split matters for CI, where a PR
   could otherwise run with write credentials.)

2. **Configure credentials** (local):

   ```bash
   cd infra/auth0
   npm ci
   pulumi stack select shared   # or: pulumi stack init shared
   pulumi config set auth0:domain auth.hochfrequenz.de
   pulumi config set auth0:clientId <M2M_CLIENT_ID>
   pulumi config set --secret auth0:clientSecret <M2M_CLIENT_SECRET>
   ```

3. **Wire up CI** (`deploy-auth0.yml`). All jobs also need the existing
   `PULUMI_ACCESS_TOKEN`.

   - **Repo secrets** (used by the preview job): `AUTH0_DOMAIN`,
     `AUTH0_PREVIEW_CLIENT_ID`, `AUTH0_PREVIEW_CLIENT_SECRET` (the read-only app).
   - **Protected `auth0` GitHub Environment** (used by the deploy job): add
     `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` (the deploy app) and configure
     **required reviewers** so a human approves before the tenant is changed.
     `AUTH0_DOMAIN` is read from repo secrets.

## Importing the existing (live) resources

These resources already serve live logins — **import, never recreate**.

1. Find the resource IDs in the Auth0 dashboard (client IDs; for resource
   servers the API id is `<resource-server-id>`, not the audience URL).
2. Import each into the `shared` stack, e.g.:

   ```bash
   pulumi import auth0:index/client:Client ahb-tabellen-prod-spa      VSkXGqlTD7Rf5Q4n9a0h00rInEyL2ZQj
   pulumi import auth0:index/client:Client ahb-tabellen-stage-dev-spa Hku0EniRjy4B2krnx1sCwTIOzAiVta1B
   pulumi import auth0:index/resourceServer:ResourceServer ahb-tabellen-mcp-prod  <resource-server-id>
   pulumi import auth0:index/resourceServer:ResourceServer ahb-tabellen-mcp-stage <resource-server-id>
   ```

3. Reconcile `index.ts` with the imported state until:

   ```bash
   pulumi preview
   ```

   shows **no changes** (in particular **zero replacements/deletions**). This is
   the hard gate — do not merge until the preview is clean.

## Day-to-day

- Change `index.ts`, open a PR. CI posts a `pulumi preview` as a PR comment.
- On merge to `main`, CI runs `pulumi up`.
- Never edit managed resources in the Auth0 dashboard — change the code instead.
