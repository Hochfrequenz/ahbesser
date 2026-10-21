# AHB-Tabellen Web Application

## ℹ️ Overview

### Production

You can access the **prod** version of the application on [ahb-tabellen.hochfrequenz.de](https://ahb-tabellen.hochfrequenz.de).

### Stage

You can access the **stage** version of the application on [ahb-tabellen.stage.hochfrequenz.de](https://ahb-tabellen.stage.hochfrequenz.de).

This is our test environment where we deploy the latest changes to test them before deploying them to production.

### 🏛 Architecture

The AHB tables application follows a simple but effective architecture for processing and displaying Anwendungshandbücher (AHB) data:

1. **Data Source**: The process begins with XML files from edi@energy, which contain the official AHB specifications.
2. **Data Processing**: Our Python package `fundamend` processes these XML files, extracting and structuring the data into a SQLite database format.
3. **Web Application**: The AHB tables web application reads directly from the SQLite database to display the structured AHB information to users.

This architecture ensures data consistency and provides a reliable way to access and display AHB information.

```mermaid
flowchart TD
    A("edi@energy:
    XML files") -->|fundamend| B("SQLite Database")
    B -->|read| C("AHB-Tabellen
    web application")
```

### 📂 Project Structure

This is an API first application.
Whenever you want to change something in between frontend and backend, start by changing the [OpenAPI spec](openapi.yml) first and continue from there (`npm run ng-openapi-gen`).

```plaintext
.
├── src/
    ├── app/
        ├── core/
            └── api/              # API config files
        ├── environments/         # config files for dev/stage/prod
        ├── features/             # AHB and landingpage related views and components
        └── shared/               # global components (header, footer, logo, etc.)
    ├── assets/                   # logo, favicon, etc.
    ├── server/
        ├── controller/           # thin HTTP adapters: parse request → call service → serialize response
        ├── service/              # transport-agnostic business logic (shared by the REST API and the MCP server)
        ├── mcp/                  # Model Context Protocol server (Streamable HTTP) exposing the services as tools
        ├── infrastructure/       # API routing, database access, error handling
        └── repository/           # CRUD / query operations against the SQLite database
    ├── index.html                # entry point for the angular web application
    ├── main.ts                   # bootstraps the angular web application
    ├── server.ts                 # sets up backend server
    └── styles.scss               # imports Tailwind base styles, component styles and utility classes
└── ⚙️ <several config files>
```

## ⚙️ Setup

Make sure you have the latest version of [node.js](https://nodejs.org/en) installed (for instance via the [node version manager](https://github.com/nvm-sh/nvm) `nvm`).

Download and install [Angular CLI](https://v17.angular.io/cli) using the `npm` package manager (comes with node.js):

```bash
$ npm install -g @angular/cli
```

[**Windows**] Add node.js to your PATH environment variable:

- run `$ npm config get prefix` to retrieve the directory where npm will install global packages (e.g. `C:\Program Files\nodejs`)
- open "Edit the system environment variables" and navigate to "Environment Variables" -> "System Variables" -> "Path"
- edit "Path" and add the node.js directory path
- restart your PC and check if Angular CLI has been installed successfully by running `$ ng --version`

> [!NOTE]
> Be sure to run `$ npm ci` during the initial setup to install all required dependencies.

### Getting the database 🗄️

> [!IMPORTANT]
> The application needs the SQLite database to do anything useful. It is **not** part of this
> repository and **not** part of the container image — it is roughly 1.1 GB, and it is built from
> XML that Hochfrequenz pays for.

Download `ahb_<commithash>.db.7z` from the latest release of the private
[xml-migs-and-ahbs](https://github.com/Hochfrequenz/xml-migs-and-ahbs/releases) repository, unpack
it, and put it at `src/server/data/ahb.db`. That path is gitignored and is where both `npm run
start` and the local Docker setup expect it; set `AHB_DB_PATH` to keep it somewhere else.

The release also carries an encrypted `ahb_<commithash>.db.encrypted.7z`; the password is in the
Hochfrequenz 1Password vault
([link](https://start.1password.com/open/i?a=F35NURJ4PFGOPBA77PR66C5P4I&v=vjgfwz7dg5wg656rfpvadetrqy&i=grnjb4hn6ipcau4bqe43rkuwnq&h=hochfrequenz.1password.com)).
For local work the unencrypted archive is simpler. If you have access to neither repository nor
vault, ask a teammate.

### Starting the app via Docker 🐋

Create an `.env` file in the root directory and paste the contents of the `.example.env` file.

While having [Docker Desktop](https://www.docker.com/products/docker-desktop/) up and running,
start the container using

```bash
$ docker compose up -d --build
```

and navigate to `http://localhost:4000/`.

This builds and runs the same image that is deployed: the Angular bundle and the Express server
are compiled **into the image**, so the container starts in seconds and serves immediately. Your
local `src/server/data/ahb.db` is bind-mounted read-only at `/data/ahb.db`; the deployed stacks
get the same file from a published data image instead (see
[Update the database](#update-the-database)).

### Starting the app using Angular CLI

To start a dev server, run

```bash
$ ng serve
```

and navigate to `http://localhost:4200/`.
The application will automatically reload if you change any of the source files.

In order to start both the dev server as well as the server-side watch process to access the blob storage, run

```shell
$ npm run start
```

For further commands, refer to the scripts located in `package.json`.

## 🛠️ Build & Development

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### OpenAPI Specification Generation

Run `npm run ng-openapi-gen` to generate the OpenAPI specification and related TypeScript interfaces.
This command will update the API client code based on the OpenAPI specification.

## 🤖 MCP Server

The backend also exposes the same AHB features as a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server, so AI assistants can query the data as tools. It runs over **Streamable HTTP** on the same Express server, mounted at **`/mcp`**, and delegates to the same `src/server/service/` layer as the REST API.

### Available tools

All tools are read-only:

| Tool                             | Description                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `get_ahb`                        | Retrieve a single AHB (JSON) by format version + Prüfidentifikator                    |
| `search_ahb_lines`               | Full-text / filtered, paginated search; `Änderung*TR` matches a prefix and later text |
| `get_ahb_diff`                   | Line-level diff of one Prüfidentifikator between two format versions                  |
| `get_ahb_diff_summary`           | Per-Prüfidentifikator change counts between two format versions                       |
| `list_format_versions`           | List all EDIFACT format versions (e.g. `FV2410`)                                      |
| `list_formate`                   | List all EDIFACT formats (e.g. `UTILMD`, `MSCONS`)                                    |
| `list_directions`                | List distinct sender / empfaenger direction values                                    |
| `get_datenstand`                 | Latest publication date (Veröffentlichungsdatum) of the data set                      |
| `list_pruefis_by_format_version` | List all Prüfidentifikatoren in a format version                                      |

### Endpoints

- `POST /mcp` — MCP Streamable HTTP endpoint (stateless; use `POST`)
- `GET /.well-known/oauth-protected-resource/mcp` — OAuth Protected Resource Metadata ([RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728)), only when auth is enabled

### Authentication

The MCP endpoint is a **dual-issuer** OAuth resource server. It accepts `Bearer` access tokens from **Auth0** (OAuth 2.1) and/or **Microsoft Entra ID** — a token is accepted if it is valid for either configured provider. Each request is dispatched to the matching provider by its `iss` claim and then fully validated (signature via JWKS, `iss`, `aud`, `exp`). The RFC 9728 metadata advertises every configured authorization server (Auth0 first, for client back-compat).

Configure via environment variables (see `.example.env`). Configure either provider, both, or neither; setting exactly one variable of a provider throws (fail-closed):

```bash
# Auth0
MCP_AUTH0_ISSUER_BASE_URL=https://auth.hochfrequenz.de/
MCP_AUTH0_AUDIENCE=https://ahb-tabellen.hochfrequenz.de/mcp   # the Auth0 API identifier / canonical MCP URL

# Microsoft Entra ID (enables a Copilot 365 agent — see below)
MCP_ENTRA_TENANT_ID=<entra-tenant-guid>                       # → issuer https://login.microsoftonline.com/<tenant>/v2.0
MCP_ENTRA_AUDIENCE=<entra-mcp-app-client-id-guid>             # token `aud`: the resource app's client-id GUID (v2 tokens), NOT the api:// scope URI
# MCP_ENTRA_ISSUER=...                                        # optional; overrides the derived v2.0 issuer
# MCP_RESOURCE=...                                            # RFC 9728 resource (endpoint https URL); defaults to the first http(s) provider audience — REQUIRED for an Entra-only deployment
```

If no provider is set, the MCP endpoint runs **unauthenticated** (useful for local development). The REST API is stricter, see below.

### REST API authentication

`/api/*` requires a `Bearer` access token from Auth0 or Entra, validated against the same `MCP_*` configuration as `/mcp`. Public exceptions are `/api/health` (Oh Dear, has its own shared-secret check) and `/api/datenstand`; requests without a valid token get `401`. `/health`, `/version`, `/readiness`, `/config.js` and the static files stay public.

The SPA attaches the token automatically. It requests it using two runtime-config values (see `.example.env`): `APP_AUTH0_AUDIENCE` (= `MCP_AUTH0_AUDIENCE`) and `APP_ENTRA_API_SCOPE` (= `api://<MCP_ENTRA_AUDIENCE>/access_as_user`). If the value for the user's provider is unset, or the user is signed out, no token is sent and the API answers `401`.

Without a configured `MCP_*` provider the server **refuses to start**, unless `API_AUTH_DISABLED=true` is set (local development and the local compose stack only, never on a deployed stack). The deployment-side steps are tracked in [#1007](https://github.com/Hochfrequenz/ahb-tabellen/issues/1007).

### Connecting a client

The endpoint URL is `https://ahb-tabellen.hochfrequenz.de/mcp` (production) or `https://ahb-tabellen.stage.hochfrequenz.de/mcp` (stage). When auth is enabled the client will open a browser for the Auth0 login on first connect.

**Claude (Claude Code / Claude Desktop)** — add a remote MCP server:

```bash
claude mcp add --transport http ahb-tabellen https://ahb-tabellen.hochfrequenz.de/mcp
```

Or in the Claude Desktop / `claude.ai` connectors UI, add a custom connector with the same URL. (Equivalent `claude_desktop_config.json` / `.mcp.json` entry:)

```jsonc
{
  "mcpServers": {
    "ahb-tabellen": {
      "type": "http",
      "url": "https://ahb-tabellen.hochfrequenz.de/mcp",
    },
  },
}
```

**GitHub Copilot (VS Code)** — add to `.vscode/mcp.json` (or the user `mcp.json`):

```jsonc
{
  "servers": {
    "ahb-tabellen": {
      "type": "http",
      "url": "https://ahb-tabellen.hochfrequenz.de/mcp",
    },
  },
}
```

Then enable the server in the Copilot Chat **Agent mode** tool picker.

**opencode** — add to `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "ahb-tabellen": {
      "type": "remote",
      "url": "https://ahb-tabellen.hochfrequenz.de/mcp",
      "enabled": true,
    },
  },
}
```

**Microsoft Copilot 365 agent (Entra ID)** — connect the MCP server as a tool in Copilot Studio so employees can use it with their Microsoft sign-in. Requires the `MCP_ENTRA_*` vars above (the Entra app registrations are provisioned as code with Pulumi — see `infra/`).

1. Two Entra **app registrations** must exist: a **server** app that _Exposes an API_ (`api://…/access_as_user`, manifest `requestedAccessTokenVersion: 2`) and a **client** app that holds that delegated permission plus a client secret.
2. In Copilot Studio: **Tools → Add a tool → Model Context Protocol**; Server URL `https://ahb-tabellen.hochfrequenz.de/mcp` (Streamable HTTP — SSE is unsupported). Choose auth **OAuth 2.0 → Manual** (Entra does not support open Dynamic Client Registration). Enter the v2.0 authorization endpoint `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/authorize` and token endpoint `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token`, scope `api://<server-app-id>/access_as_user`, and the client app's ID + secret.
3. After the tool is created, copy Copilot's generated **callback URL** (`https://global.consent.azure-apim.net/redirect/…`) into the **client app → Authentication → Web → Redirect URIs**, then grant admin consent.
4. Ensure the agent uses **generative orchestration** and that the connector's **DLP** classification permits the target Power Platform environment.

The MCP server validates Entra tokens against `iss = https://login.microsoftonline.com/<tenant>/v2.0`, `aud = MCP_ENTRA_AUDIENCE`, and the token signature (JWKS at `https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys`).

For local development against a server started with `npm run server:start`, use `http://localhost:3000/mcp`.

## 🚀 Deployment

> [!IMPORTANT]
> **Tagging no longer deploys to Azure.** The `deploy-stage` and `deploy-production` jobs in
> `.github/workflows/deploy.yml` are disabled (`if: false`). Pushing a version tag builds and
> publishes the container image and creates the GitHub release, and stops there.
>
> They are off because the Azure App Service cannot run the current image: it carries no database,
> and App Service has no volume to seed one into and no `AHB_DB_PATH`. A deploy would push a
> container that fails its startup check and exits.
>
> The App Service itself is **left running its old image on purpose**, as the rollback target
> while the Compose stacks in [hf-apps-collection](https://github.com/Hochfrequenz/hf-apps-collection)
> take over. Deployment now happens there: bump the image tag and digest in the stack, and Dockhand
> rolls it out.
>
> Retiring Azure for good — deleting those jobs, `infra/` and the Pulumi stacks — is its own change,
> to be made once the Compose stack has served production traffic. Until then leave the Pulumi
> config, including `db_7z_archive_password`, in place.
>
> Note the `ahb-tabellen/stage - preview deployment` check on pull requests comes from Pulumi
> Cloud's GitHub app, not from this workflow, so disabling these jobs does not silence it. It
> currently fails on unrelated `azuread` credentials — see `infra/README.md`.

The sections below describe the Azure pipeline as it was built; the build and release half of it
still runs.

The application can be deployed to two environments: Stage and Production.
The deployment process is fully automated using a combination of GitHub Actions and Pulumi, and is triggered by pushing a git tag, which creates a GitHub release.

### Deployment Process Overview

1. **Build**: GitHub Actions builds a Docker image and pushes it to the GitHub Container Registry
2. **Release**: GitHub Actions creates a GitHub (pre-)release for the pushed tag
3. **Infrastructure**: Pulumi manages the Azure resources
4. **Deployment**: GitHub Actions uses Pulumi to deploy the container to Azure

### Stage Deployment

To deploy to the stage environment:

1. Set a new git tag in the format `v<major>.<minor>.<patch>-rc<rc>`, e.g. `v1.0.0-rc01`.
2. Pushing the tag automatically triggers the deployment pipeline and creates a new GitHub pre-release.
3. The application is deployed to [ahb-tabellen.stage.hochfrequenz.de](https://ahb-tabellen.stage.hochfrequenz.de).

### Production Deployment

To deploy to the production environment:

1. Set a new git tag in the format `v<major>.<minor>.<patch>`, e.g. `v1.0.0`.
2. Pushing the tag automatically triggers the deployment pipeline and creates a new GitHub release.
3. The application is deployed to [ahb-tabellen.hochfrequenz.de](https://ahb-tabellen.hochfrequenz.de)

## Update the database

### Overview

The `ahb.db` file is a SQLite database that contains AHB (Anwendungshandbuch) data for the energy industry.
This database serves as the primary data source for the AHB Tabellen application.

The database is created using the [fundamend](https://github.com/Hochfrequenz/xml-fundamend-python/) Python package, which processes XML files containing AHB specifications.

The [database generation script](https://github.com/Hochfrequenz/xml-migs-and-ahbs/blob/main/load_ahbs_into_sqlitedb.py) is located in a private repository that contains all the raw XML files from `bdew-mako.de`:
The source XML files must be paid for, so they are not publicly available, which is why the repository is private.

### Maintenance

To update the database with new AHB data:

The database used to be committed to this repository as an 84 MB encrypted archive, which grew
`.git` by that much on every update and shipped inside the application image. It is now published
as its own versioned image and seeded into a volume on the host, so the application image contains
no data at all.

**Nothing in this repository is involved.** The database is built, versioned and published by
[xml-migs-and-ahbs](https://github.com/Hochfrequenz/xml-migs-and-ahbs), which is where the source
XML lives; this application only names a version to consume.

1. Access the private [xml-migs-and-ahbs repository](https://github.com/Hochfrequenz/xml-migs-and-ahbs/)
2. If necessary, update the XML files by **manually** downloading them from the bdew-mako.de website because their API exists but is PITA. Commit the files to a feature branch and fix all the errors found by the CI before squashing to main.
3. [Create a new release](https://github.com/Hochfrequenz/xml-migs-and-ahbs/releases/new) in the xml-migs-and-ahbs repository
4. Wait. That release builds the database and then publishes it automatically as
   `ghcr.io/hochfrequenz/xml-migs-and-ahbs:<release tag>`. No manual step here.
5. That workflow's summary prints two lines to change in
   `stacks/ahb-tabellen-stage/compose.yaml` in
   [hf-apps-collection](https://github.com/Hochfrequenz/hf-apps-collection): the seed job's
   `image:` tag and digest, and `AHB_DB_VERSION` on the application service. **Both, always.**
   The image re-seeds the volume; `AHB_DB_VERSION` is what changes the application service's
   definition, which is what makes `docker compose up -d` recreate its container. Without it
   compose leaves a service whose definition is unchanged alone, and the running process keeps
   its open file descriptor on the replaced database — the deploy reports success while the app
   serves the previous dataset. Merge, and let Dockhand redeploy.
6. Verify on stage, then copy both lines into `stacks/ahb-tabellen/compose.yaml` to promote to
   production.

Nothing is committed to this repository and no release of this application is required: the
database and the code version independently.

### Security

The archive password (`SQLITE_AHB_DB_7Z_ARCHIVE_PASSWORD`, in the Hochfrequenz 1Password vault
and the GitHub organization-wide secrets) is not used anywhere in this repository any more. The
image is built upstream from the _unencrypted_ release artifact, so no password reaches a
container that runs this image, and none is needed to deploy it.

`infra/` is the exception, and deliberately so: the Pulumi program still declares
`db_7z_archive_password` and injects `DB_7Z_ARCHIVE_PASSWORD` into the Azure App Service. Leave
both in place. Removing the Pulumi secret breaks `pulumi up`, and the Azure deployment is retired
in its own change — see the note below.

The `xml-migs-and-ahbs` package on GHCR holds the database unencrypted and **must be private**, for the same
reason this application's image is: the underlying XML is paid for. The publishing workflow
asserts it on every run.

## 🔗 Links

- Generate machine-readable files from AHB documents with [KohlrAHBi](https://github.com/Hochfrequenz/kohlrahbi) 🥬.
- Official edi@energy AHB documents are provided by BDEW at [edi-energy.de](https://www.edi-energy.de/index.php?id=38).
- To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## 📝 Changelog

The changelog is generated using [git-cliff](https://github.com/orhun/git-cliff) and is automatically added to the GitHub release.

To generate the changelog locally, run

```bash
$ git cliff -o CHANGELOG.md --github-token <your-github-token>
```

The github token is required to avoid rate limiting.
